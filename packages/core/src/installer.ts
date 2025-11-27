import path from 'node:path';
import fs from 'fs-extra';
import { execa } from 'execa';
import {
  ZeroEvalConfig,
  InstallOptions,
} from './types.js';
import {
  createConfig,
  saveConfig,
  generateBackendEnvContent,
  generateFrontendEnvContent,
  getDefaultInstallPath,
  deleteConfig,
} from './config.js';
import {
  checkPostgresInstalled,
  checkPostgresRunning,
  createDatabase,
  databaseExists,
  getPostgresInstallInstructions,
  testDatabaseConnection,
} from './postgres.js';
import { findAvailablePorts } from './ports.js';

// GitHub repository for cloning (fallback)
const REPO_URL = 'https://github.com/ghiffarin/zero-evaluation-app.git';

export interface InstallProgress {
  step: string;
  message: string;
  progress: number; // 0-100
}

export type ProgressCallback = (progress: InstallProgress) => void;

export interface RequirementsCheck {
  nodeVersion: string;
  nodeOk: boolean;
  postgresInstalled: boolean;
  postgresRunning: boolean;
  postgresVersion?: string;
  gitAvailable: boolean;
  errors: string[];
  instructions?: string;
}

/**
 * Check Node.js version
 */
async function checkNodeVersion(): Promise<{ version: string; ok: boolean }> {
  try {
    const { stdout } = await execa('node', ['--version'], { stdio: 'pipe' });
    const version = stdout.trim().replace('v', '');
    const major = parseInt(version.split('.')[0], 10);
    return { version, ok: major >= 18 };
  } catch {
    return { version: 'unknown', ok: false };
  }
}

/**
 * Check system requirements for local PostgreSQL installation
 */
export async function checkRequirements(): Promise<RequirementsCheck> {
  const errors: string[] = [];

  // Check Node.js
  const nodeCheck = await checkNodeVersion();
  if (!nodeCheck.ok) {
    errors.push(`Node.js 18 or higher is required. Current version: ${nodeCheck.version}`);
  }

  // Check PostgreSQL
  const pgInfo = await checkPostgresInstalled();

  let instructions: string | undefined;
  if (!pgInfo.installed) {
    instructions = getPostgresInstallInstructions();
    errors.push('PostgreSQL is not installed.');
  } else if (!pgInfo.running) {
    errors.push('PostgreSQL is installed but not running. Please start the PostgreSQL service.');
  }

  // Check Git (optional)
  let gitAvailable = false;
  try {
    await execa('git', ['--version'], { stdio: 'pipe' });
    gitAvailable = true;
  } catch {
    // Git is optional - we can copy from local source
  }

  return {
    nodeVersion: nodeCheck.version,
    nodeOk: nodeCheck.ok,
    postgresInstalled: pgInfo.installed,
    postgresRunning: pgInfo.running,
    postgresVersion: pgInfo.version,
    gitAvailable,
    errors,
    instructions,
  };
}

/**
 * Find the project source directory
 * This looks for the source relative to the packages folder
 */
function findSourceDirectory(): string | null {
  try {
    const currentDir = __dirname;
    const packagesDir = path.resolve(currentDir, '..', '..');
    const rootDir = path.resolve(packagesDir, '..');

    // Check if this is the project root
    if (fs.existsSync(path.join(rootDir, 'backend')) &&
        fs.existsSync(path.join(rootDir, 'frontend'))) {
      return rootDir;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Copy project files to the install path
 */
async function copyProjectFiles(installPath: string, onProgress?: ProgressCallback): Promise<void> {
  onProgress?.({
    step: 'copy',
    message: 'Copying project files...',
    progress: 20,
  });

  const sourceDir = findSourceDirectory();

  if (sourceDir) {
    // Copy from local source
    const filesToCopy = ['backend', 'frontend', 'package.json'];

    await fs.ensureDir(installPath);

    for (const file of filesToCopy) {
      const srcPath = path.join(sourceDir, file);
      const destPath = path.join(installPath, file);

      if (await fs.pathExists(srcPath)) {
        await fs.copy(srcPath, destPath, {
          filter: (src) => {
            // Skip node_modules, .next, dist, etc.
            const basename = path.basename(src);
            return !['node_modules', '.next', 'dist', '.git'].includes(basename);
          }
        });
      }
    }
    return;
  }

  // Fallback: Clone from GitHub
  onProgress?.({
    step: 'clone',
    message: 'Cloning repository from GitHub...',
    progress: 20,
  });

  if (await fs.pathExists(installPath)) {
    const files = await fs.readdir(installPath);
    if (files.length > 0) {
      try {
        await execa('git', ['pull'], { cwd: installPath, stdio: 'pipe' });
        return;
      } catch {
        throw new Error(`Directory ${installPath} already exists. Please choose a different location or remove the existing directory.`);
      }
    }
  }

  await fs.ensureDir(path.dirname(installPath));
  await execa('git', ['clone', REPO_URL, installPath], { stdio: 'pipe' });
}

/**
 * Install npm dependencies
 */
async function installDependencies(installPath: string, onProgress?: ProgressCallback): Promise<void> {
  onProgress?.({
    step: 'dependencies',
    message: 'Installing backend dependencies...',
    progress: 40,
  });

  // Install backend dependencies
  await execa('npm', ['install'], {
    cwd: path.join(installPath, 'backend'),
    stdio: 'pipe',
  });

  onProgress?.({
    step: 'dependencies',
    message: 'Installing frontend dependencies...',
    progress: 55,
  });

  // Install frontend dependencies
  await execa('npm', ['install'], {
    cwd: path.join(installPath, 'frontend'),
    stdio: 'pipe',
  });
}

/**
 * Run Prisma migrations
 */
async function runMigrations(installPath: string, databaseUrl: string, onProgress?: ProgressCallback): Promise<void> {
  onProgress?.({
    step: 'migrations',
    message: 'Generating Prisma client...',
    progress: 70,
  });

  const backendPath = path.join(installPath, 'backend');

  // Generate Prisma client
  await execa('npx', ['prisma', 'generate'], {
    cwd: backendPath,
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  onProgress?.({
    step: 'migrations',
    message: 'Running database migrations...',
    progress: 80,
  });

  // Run migrations
  await execa('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: backendPath,
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
}

/**
 * Create root package.json with dev script
 */
async function createRootPackageJson(installPath: string, config: ZeroEvalConfig): Promise<void> {
  const packageJson = {
    name: 'zero-evaluation',
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'concurrently "npm run dev:backend" "npm run dev:frontend"',
      'dev:backend': `cd backend && PORT=${config.backendPort} npm run dev`,
      'dev:frontend': `cd frontend && npm run dev -- -p ${config.frontendPort}`,
      start: 'npm run dev',
      'install:all': 'npm install --prefix backend && npm install --prefix frontend',
    },
    devDependencies: {
      concurrently: '^8.2.0',
    },
  };

  await fs.writeJson(path.join(installPath, 'package.json'), packageJson, { spaces: 2 });

  // Install concurrently
  await execa('npm', ['install'], {
    cwd: installPath,
    stdio: 'pipe',
  });
}

/**
 * Install Zero Evaluation (Local PostgreSQL mode)
 */
export async function install(
  options: InstallOptions = {},
  onProgress?: ProgressCallback
): Promise<ZeroEvalConfig> {
  const installPath = options.installPath || getDefaultInstallPath();

  // Find available ports
  onProgress?.({
    step: 'ports',
    message: 'Finding available ports...',
    progress: 5,
  });

  const ports = await findAvailablePorts(
    options.frontendPort || 3000,
    options.backendPort || 3001
  );

  // Create configuration
  onProgress?.({
    step: 'config',
    message: 'Generating configuration...',
    progress: 10,
  });

  const config = createConfig({
    installPath,
    frontendPort: ports.frontend,
    backendPort: ports.backend,
    dbPort: options.dbPort,
    databaseUrl: options.databaseUrl,
  });

  // Create database if it doesn't exist
  onProgress?.({
    step: 'database',
    message: 'Setting up database...',
    progress: 15,
  });

  const dbExists = await databaseExists(config.dbName);
  if (!dbExists) {
    const result = await createDatabase(config.dbName);
    if (!result.success) {
      throw new Error(`Failed to create database: ${result.error}`);
    }
  }

  // Test database connection
  const connectionTest = await testDatabaseConnection(config.databaseUrl);
  if (!connectionTest.success) {
    throw new Error(`Cannot connect to database: ${connectionTest.error}`);
  }

  // Copy project files
  await copyProjectFiles(installPath, onProgress);

  // Create .env files
  onProgress?.({
    step: 'env',
    message: 'Creating environment files...',
    progress: 35,
  });

  // Backend .env
  const backendEnv = generateBackendEnvContent(config);
  await fs.writeFile(path.join(installPath, 'backend', '.env'), backendEnv);

  // Frontend .env.local
  const frontendEnv = generateFrontendEnvContent(config);
  await fs.writeFile(path.join(installPath, 'frontend', '.env.local'), frontendEnv);

  // Install dependencies
  await installDependencies(installPath, onProgress);

  // Run migrations
  await runMigrations(installPath, config.databaseUrl, onProgress);

  // Create root package.json with dev script
  onProgress?.({
    step: 'setup',
    message: 'Setting up project...',
    progress: 90,
  });

  await createRootPackageJson(installPath, config);

  // Save configuration
  onProgress?.({
    step: 'save',
    message: 'Saving configuration...',
    progress: 95,
  });

  await saveConfig(config);

  onProgress?.({
    step: 'complete',
    message: 'Installation complete!',
    progress: 100,
  });

  return config;
}

/**
 * Uninstall Zero Evaluation
 */
export async function uninstall(removeData: boolean = false): Promise<void> {
  const { loadConfig } = await import('./config.js');

  const config = await loadConfig();
  if (!config) {
    throw new Error('Zero Evaluation is not installed.');
  }

  // Remove config file
  await deleteConfig();

  // Optionally remove installation directory
  if (removeData) {
    await fs.remove(config.installPath);
  }
}

// Re-export for convenience
export { checkPostgresInstalled, checkPostgresRunning, getPostgresInstallInstructions } from './postgres.js';
export { findAvailablePorts, isPortAvailable } from './ports.js';
