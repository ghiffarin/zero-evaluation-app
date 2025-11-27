// Types
export * from './types.js';

// Configuration
export {
  generateJwtSecret,
  generatePassword,
  getDefaultInstallPath,
  createConfig,
  saveConfig,
  loadConfig,
  isInstalled,
  getConfigDir,
  getInstallPath,
  generateBackendEnvContent,
  generateFrontendEnvContent,
  deleteConfig,
} from './config.js';

// PostgreSQL utilities
export {
  getPlatform,
  getPostgresInstallInstructions,
  checkPostgresInstalled,
  checkPostgresRunning,
  databaseExists,
  createDatabase,
  dropDatabase,
  getDefaultDatabaseUrl,
  getDatabaseUrl,
  testDatabaseConnection,
  type PostgresInfo,
} from './postgres.js';

// Port utilities
export {
  isPortAvailable,
  findAvailablePort,
  findAvailablePorts,
  checkPortsAvailable,
} from './ports.js';

// Installation
export {
  checkRequirements,
  install,
  uninstall,
  type InstallProgress,
  type ProgressCallback,
  type RequirementsCheck,
} from './installer.js';
