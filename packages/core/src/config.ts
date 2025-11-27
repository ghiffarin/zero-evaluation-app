import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';
import { ZeroEvalConfig, DEFAULT_CONFIG } from './types.js';
import { getDefaultDatabaseUrl } from './postgres.js';

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
  const dbName = options.dbName || DEFAULT_CONFIG.dbName!;
  const dbPort = options.dbPort || DEFAULT_CONFIG.dbPort!;
  const dbUser = options.dbUser || os.userInfo().username;

  return {
    installPath: options.installPath || getDefaultInstallPath(),
    frontendPort: options.frontendPort || DEFAULT_CONFIG.frontendPort!,
    backendPort: options.backendPort || DEFAULT_CONFIG.backendPort!,
    dbPort,
    dbUser,
    dbPassword: options.dbPassword || '', // Empty for local PostgreSQL (peer auth)
    dbName,
    databaseUrl: options.databaseUrl || getDefaultDatabaseUrl(dbName, dbPort),
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
  // Set restrictive permissions on config file
  try {
    await fs.chmod(CONFIG_FILE, 0o600);
  } catch {
    // Ignore permission errors on Windows
  }
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
  // Check for package.json in install path (works for both local and docker setups)
  return await fs.pathExists(path.join(config.installPath, 'backend', 'package.json'));
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
 * Generate backend .env file content
 */
export function generateBackendEnvContent(config: ZeroEvalConfig): string {
  return `# Zero Evaluation Backend Configuration
# Generated on ${new Date().toISOString()}

# Database
DATABASE_URL=${config.databaseUrl}

# Authentication
JWT_SECRET=${config.jwtSecret}
JWT_EXPIRES_IN=7d

# Server
PORT=${config.backendPort}
NODE_ENV=${config.nodeEnv}
FRONTEND_URL=http://localhost:${config.frontendPort}
`;
}

/**
 * Generate frontend .env.local file content
 */
export function generateFrontendEnvContent(config: ZeroEvalConfig): string {
  return `# Zero Evaluation Frontend Configuration
# Generated on ${new Date().toISOString()}

# Backend API URL (used in development, production uses proxy)
NEXT_PUBLIC_API_URL=http://localhost:${config.backendPort}/api

# Backend port for proxy configuration
BACKEND_PORT=${config.backendPort}
`;
}

/**
 * Delete the configuration
 */
export async function deleteConfig(): Promise<void> {
  try {
    await fs.remove(CONFIG_FILE);
  } catch {
    // Ignore errors
  }
}
