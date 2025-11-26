import { execa, type ExecaError } from 'execa';
import path from 'node:path';
import { ContainerStatus, ServiceHealth, CONTAINER_NAMES, DOCKER_COMPOSE_PROJECT } from './types.js';
import { loadConfig } from './config.js';

/**
 * Check if Docker is installed and running
 */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    await execa('docker', ['info'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Docker Compose is available
 */
export async function isDockerComposeAvailable(): Promise<boolean> {
  try {
    // Try new docker compose command first
    await execa('docker', ['compose', 'version'], { stdio: 'pipe' });
    return true;
  } catch {
    try {
      // Fall back to legacy docker-compose
      await execa('docker-compose', ['version'], { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Get the docker compose command to use
 */
async function getComposeCommand(): Promise<string[]> {
  try {
    await execa('docker', ['compose', 'version'], { stdio: 'pipe' });
    return ['docker', 'compose'];
  } catch {
    return ['docker-compose'];
  }
}

/**
 * Run a docker compose command
 */
async function runCompose(
  args: string[],
  installPath: string,
  options: { stdio?: 'pipe' | 'inherit' } = {}
): Promise<{ stdout: string; stderr: string }> {
  const composeCmd = await getComposeCommand();
  const [cmd, ...baseArgs] = composeCmd;

  const fullArgs = [
    ...baseArgs,
    '-f', path.join(installPath, 'docker-compose.yml'),
    '-p', DOCKER_COMPOSE_PROJECT,
    ...args,
  ];

  const result = await execa(cmd, fullArgs, {
    cwd: installPath,
    stdio: options.stdio || 'pipe',
    env: {
      ...process.env,
      COMPOSE_PROJECT_NAME: DOCKER_COMPOSE_PROJECT,
    },
  });

  return { stdout: result.stdout, stderr: result.stderr };
}

/**
 * Get status of a specific container
 */
async function getContainerStatus(containerName: string): Promise<ContainerStatus> {
  try {
    const { stdout } = await execa('docker', [
      'inspect',
      '--format',
      '{{.State.Status}}|{{.State.Health.Status}}|{{range .NetworkSettings.Ports}}{{.}}{{end}}',
      `${DOCKER_COMPOSE_PROJECT}-${containerName}-1`,
    ], { stdio: 'pipe' });

    const [status, health, ports] = stdout.trim().split('|');

    return {
      name: containerName,
      status: status === 'running' ? 'running' : 'stopped',
      health: health || undefined,
      ports: ports ? [ports] : undefined,
    };
  } catch {
    return {
      name: containerName,
      status: 'not_found',
    };
  }
}

/**
 * Get health status of all services
 */
export async function getServiceHealth(): Promise<ServiceHealth> {
  const [database, backend, frontend] = await Promise.all([
    getContainerStatus(CONTAINER_NAMES.database),
    getContainerStatus(CONTAINER_NAMES.backend),
    getContainerStatus(CONTAINER_NAMES.frontend),
  ]);

  const allRunning = [database, backend, frontend].every(s => s.status === 'running');
  const anyRunning = [database, backend, frontend].some(s => s.status === 'running');

  return {
    database,
    backend,
    frontend,
    overall: allRunning ? 'healthy' : anyRunning ? 'degraded' : 'down',
  };
}

/**
 * Start all services
 */
export async function startServices(installPath?: string): Promise<void> {
  const config = await loadConfig();
  const targetPath = installPath || config?.installPath;

  if (!targetPath) {
    throw new Error('Installation path not found. Please run "npx create-zero-eval" first.');
  }

  await runCompose(['up', '-d', '--build'], targetPath);
}

/**
 * Stop all services
 */
export async function stopServices(installPath?: string): Promise<void> {
  const config = await loadConfig();
  const targetPath = installPath || config?.installPath;

  if (!targetPath) {
    throw new Error('Installation path not found.');
  }

  await runCompose(['down'], targetPath);
}

/**
 * Restart all services
 */
export async function restartServices(installPath?: string): Promise<void> {
  const config = await loadConfig();
  const targetPath = installPath || config?.installPath;

  if (!targetPath) {
    throw new Error('Installation path not found.');
  }

  await runCompose(['restart'], targetPath);
}

/**
 * Get logs from a service
 */
export async function getLogs(
  service?: 'database' | 'backend' | 'frontend',
  options: { tail?: number; follow?: boolean } = {}
): Promise<string> {
  const config = await loadConfig();
  if (!config?.installPath) {
    throw new Error('Installation path not found.');
  }

  const args = ['logs'];
  if (options.tail) {
    args.push('--tail', String(options.tail));
  }
  if (options.follow) {
    args.push('-f');
  }
  if (service) {
    args.push(service);
  }

  const { stdout } = await runCompose(args, config.installPath);
  return stdout;
}

/**
 * Pull latest images
 */
export async function pullImages(installPath?: string): Promise<void> {
  const config = await loadConfig();
  const targetPath = installPath || config?.installPath;

  if (!targetPath) {
    throw new Error('Installation path not found.');
  }

  await runCompose(['pull'], targetPath);
}

/**
 * Run database migrations
 */
export async function runMigrations(installPath?: string): Promise<void> {
  const config = await loadConfig();
  const targetPath = installPath || config?.installPath;

  if (!targetPath) {
    throw new Error('Installation path not found.');
  }

  await execa('docker', [
    'exec',
    `${DOCKER_COMPOSE_PROJECT}-backend-1`,
    'npx',
    'prisma',
    'migrate',
    'deploy',
  ], { stdio: 'inherit' });
}

/**
 * Reset all data (dangerous!)
 */
export async function resetData(installPath?: string): Promise<void> {
  const config = await loadConfig();
  const targetPath = installPath || config?.installPath;

  if (!targetPath) {
    throw new Error('Installation path not found.');
  }

  await runCompose(['down', '-v'], targetPath);
}

/**
 * Create a database backup
 */
export async function createBackup(outputPath: string, installPath?: string): Promise<string> {
  const config = await loadConfig();
  const targetPath = installPath || config?.installPath;

  if (!targetPath || !config) {
    throw new Error('Installation path not found.');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `zero-eval-backup-${timestamp}.sql.gz`;
  const fullPath = path.join(outputPath, filename);

  await execa('sh', ['-c', `docker exec ${DOCKER_COMPOSE_PROJECT}-database-1 pg_dump -U ${config.dbUser} ${config.dbName} | gzip > "${fullPath}"`]);

  return fullPath;
}

/**
 * Restore from a backup
 */
export async function restoreBackup(backupPath: string, installPath?: string): Promise<void> {
  const config = await loadConfig();
  const targetPath = installPath || config?.installPath;

  if (!targetPath || !config) {
    throw new Error('Installation path not found.');
  }

  if (backupPath.endsWith('.gz')) {
    await execa('sh', ['-c', `gunzip -c "${backupPath}" | docker exec -i ${DOCKER_COMPOSE_PROJECT}-database-1 psql -U ${config.dbUser} ${config.dbName}`]);
  } else {
    await execa('sh', ['-c', `docker exec -i ${DOCKER_COMPOSE_PROJECT}-database-1 psql -U ${config.dbUser} ${config.dbName} < "${backupPath}"`]);
  }
}
