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
  generateEnvContent,
  getDefaultInstallPath,
} from './config.js';
import { isDockerAvailable, isDockerComposeAvailable, startServices } from './docker.js';

// GitHub repository for cloning (fallback)
const REPO_URL = 'https://github.com/ghiffarin/zero-evaluation-app.git';

export interface InstallProgress {
  step: string;
  message: string;
  progress: number; // 0-100
}

export type ProgressCallback = (progress: InstallProgress) => void;

/**
 * Check system requirements
 */
export async function checkRequirements(): Promise<{
  dockerAvailable: boolean;
  composeAvailable: boolean;
  gitAvailable: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  const dockerAvailable = await isDockerAvailable();
  if (!dockerAvailable) {
    errors.push('Docker is not installed or not running. Please install Docker Desktop from https://docker.com');
  }

  const composeAvailable = await isDockerComposeAvailable();
  if (!composeAvailable && dockerAvailable) {
    errors.push('Docker Compose is not available. Please update Docker Desktop to the latest version.');
  }

  // Git is optional now - we can copy from local source
  let gitAvailable = false;
  try {
    await execa('git', ['--version'], { stdio: 'pipe' });
    gitAvailable = true;
  } catch {
    // Git is not required if we have local source
  }

  return { dockerAvailable, composeAvailable, gitAvailable, errors };
}

/**
 * Find the project source directory
 * This looks for the source relative to the packages folder
 */
function findSourceDirectory(): string | null {
  // Try to find source relative to this file's location
  // packages/core/dist/installer.js -> core -> packages -> root
  try {
    const currentDir = __dirname;
    const packagesDir = path.resolve(currentDir, '..', '..');
    const rootDir = path.resolve(packagesDir, '..');

    // Check if this is the project root
    if (fs.existsSync(path.join(rootDir, 'backend')) &&
        fs.existsSync(path.join(rootDir, 'frontend')) &&
        fs.existsSync(path.join(rootDir, 'docker-compose.yml'))) {
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
    const filesToCopy = ['backend', 'frontend', 'docker-compose.yml', '.env.example'];

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
 * Create docker-compose.yml with the right configuration
 */
async function createDockerComposeFile(installPath: string, config: ZeroEvalConfig): Promise<void> {
  const composeContent = `version: '3.8'

services:
  database:
    image: postgres:16-alpine
    container_name: zeroeval-database
    restart: unless-stopped
    environment:
      POSTGRES_USER: \${DB_USER}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_DB: \${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "\${DB_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER} -d \${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: zeroeval-backend
    restart: unless-stopped
    depends_on:
      database:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://\${DB_USER}:\${DB_PASSWORD}@database:5432/\${DB_NAME}
      JWT_SECRET: \${JWT_SECRET}
      JWT_EXPIRES_IN: \${JWT_EXPIRES_IN:-7d}
      NODE_ENV: \${NODE_ENV:-production}
      PORT: 3001
      FRONTEND_URL: \${FRONTEND_URL:-http://localhost:3000}
    ports:
      - "\${BACKEND_PORT:-3001}:3001"
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3001/api"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: \${NEXT_PUBLIC_API_URL:-http://localhost:3001/api}
    container_name: zeroeval-frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "\${FRONTEND_PORT:-3000}:3000"
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
`;

  await fs.writeFile(path.join(installPath, 'docker-compose.yml'), composeContent);
}

/**
 * Create Dockerfile for backend
 */
async function createBackendDockerfile(installPath: string): Promise<void> {
  const dockerfile = `FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build
RUN npm run build || echo "No build step"

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy from base
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/package*.json ./

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
`;

  await fs.writeFile(path.join(installPath, 'backend', 'Dockerfile'), dockerfile);
}

/**
 * Create Dockerfile for frontend
 */
async function createFrontendDockerfile(installPath: string): Promise<void> {
  const dockerfile = `FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build argument for API URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL}

# Build
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
`;

  await fs.writeFile(path.join(installPath, 'frontend', 'Dockerfile'), dockerfile);
}

/**
 * Install Zero Evaluation
 */
export async function install(
  options: InstallOptions = {},
  onProgress?: ProgressCallback
): Promise<ZeroEvalConfig> {
  const installPath = options.installPath || getDefaultInstallPath();

  // Check requirements
  onProgress?.({
    step: 'check',
    message: 'Checking system requirements...',
    progress: 5,
  });

  if (!options.skipDocker) {
    const requirements = await checkRequirements();
    if (requirements.errors.length > 0) {
      throw new Error(requirements.errors.join('\n'));
    }
  }

  // Create configuration
  onProgress?.({
    step: 'config',
    message: 'Generating configuration...',
    progress: 10,
  });

  const config = createConfig({
    installPath,
    frontendPort: options.frontendPort,
    backendPort: options.backendPort,
    dbPort: options.dbPort,
  });

  // Copy project files
  await copyProjectFiles(installPath, onProgress);

  // Update docker-compose and Dockerfiles if they don't exist
  onProgress?.({
    step: 'docker',
    message: 'Configuring Docker...',
    progress: 40,
  });

  // Only create these files if they don't already exist from the copy
  if (!(await fs.pathExists(path.join(installPath, 'docker-compose.yml')))) {
    await createDockerComposeFile(installPath, config);
  }
  if (!(await fs.pathExists(path.join(installPath, 'backend', 'Dockerfile')))) {
    await createBackendDockerfile(installPath);
  }
  if (!(await fs.pathExists(path.join(installPath, 'frontend', 'Dockerfile')))) {
    await createFrontendDockerfile(installPath);
  }

  // Create .env file
  onProgress?.({
    step: 'env',
    message: 'Creating environment file...',
    progress: 50,
  });

  const envContent = generateEnvContent(config);
  await fs.writeFile(path.join(installPath, '.env'), envContent);

  // Save configuration
  onProgress?.({
    step: 'save',
    message: 'Saving configuration...',
    progress: 60,
  });

  await saveConfig(config);

  // Start services if docker is available
  if (!options.skipDocker) {
    onProgress?.({
      step: 'start',
      message: 'Building and starting services (this may take a few minutes)...',
      progress: 70,
    });

    await startServices(installPath);
  }

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
  const { stopServices, resetData } = await import('./docker.js');

  const config = await loadConfig();
  if (!config) {
    throw new Error('Zero Evaluation is not installed.');
  }

  // Stop and optionally remove data
  if (removeData) {
    await resetData(config.installPath);
  } else {
    await stopServices(config.installPath);
  }

  // Remove config file
  const configDir = path.join(require('os').homedir(), '.zero-eval');
  await fs.remove(configDir);

  // Optionally remove installation directory
  if (removeData) {
    await fs.remove(config.installPath);
  }
}
