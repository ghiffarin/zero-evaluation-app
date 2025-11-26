import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';
import { ZeroEvalConfig, DEFAULT_CONFIG } from './types.js';

const CONFIG_DIR = path.join(os.homedir(), '.zero-eval');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Generate a secure random string for JWT secret
 */
export function generateJwtSecret(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Generate a secure random password
 */
export function generatePassword(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Get the default installation path
 */
export function getDefaultInstallPath(): string {
  return path.join(os.homedir(), 'zero-evaluation');
}

/**
 * Create a full configuration with defaults
 */
export function createConfig(options: Partial<ZeroEvalConfig> = {}): ZeroEvalConfig {
  return {
    installPath: options.installPath || getDefaultInstallPath(),
    frontendPort: options.frontendPort || DEFAULT_CONFIG.frontendPort!,
    backendPort: options.backendPort || DEFAULT_CONFIG.backendPort!,
    dbPort: options.dbPort || DEFAULT_CONFIG.dbPort!,
    dbUser: options.dbUser || DEFAULT_CONFIG.dbUser!,
    dbPassword: options.dbPassword || generatePassword(),
    dbName: options.dbName || DEFAULT_CONFIG.dbName!,
    jwtSecret: options.jwtSecret || generateJwtSecret(),
    nodeEnv: options.nodeEnv || DEFAULT_CONFIG.nodeEnv!,
  };
}

/**
 * Save configuration to disk
 */
export async function saveConfig(config: ZeroEvalConfig): Promise<void> {
  await fs.ensureDir(CONFIG_DIR);
  await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
}

/**
 * Load configuration from disk
 */
export async function loadConfig(): Promise<ZeroEvalConfig | null> {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      return await fs.readJson(CONFIG_FILE);
    }
  } catch {
    // Config doesn't exist or is corrupted
  }
  return null;
}

/**
 * Check if Zero Evaluation is already installed
 */
export async function isInstalled(): Promise<boolean> {
  const config = await loadConfig();
  if (!config) return false;
  return await fs.pathExists(path.join(config.installPath, 'docker-compose.yml'));
}

/**
 * Get the config directory path
 */
export function getConfigDir(): string {
  return CONFIG_DIR;
}

/**
 * Get the installation directory from config
 */
export async function getInstallPath(): Promise<string | null> {
  const config = await loadConfig();
  return config?.installPath || null;
}

/**
 * Generate .env file content
 */
export function generateEnvContent(config: ZeroEvalConfig): string {
  return `# Zero Evaluation Configuration
# Generated on ${new Date().toISOString()}

# Database Configuration
DB_USER=${config.dbUser}
DB_PASSWORD=${config.dbPassword}
DB_NAME=${config.dbName}
DB_PORT=${config.dbPort}
DATABASE_URL=postgresql://${config.dbUser}:${config.dbPassword}@database:5432/${config.dbName}

# Authentication
JWT_SECRET=${config.jwtSecret}
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=${config.nodeEnv}
BACKEND_PORT=${config.backendPort}
FRONTEND_PORT=${config.frontendPort}
FRONTEND_URL=http://localhost:${config.frontendPort}

# API URL for frontend (used at build time)
NEXT_PUBLIC_API_URL=http://localhost:${config.backendPort}/api
`;
}
