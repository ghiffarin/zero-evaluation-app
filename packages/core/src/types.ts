export interface ZeroEvalConfig {
  installPath: string;
  frontendPort: number;
  backendPort: number;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  databaseUrl: string;
  jwtSecret: string;
  nodeEnv: 'development' | 'production';
}

export interface InstallOptions {
  installPath?: string;
  frontendPort?: number;
  backendPort?: number;
  dbPort?: number;
  databaseUrl?: string;
  verbose?: boolean;
}

export interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  createdAt: Date;
}

export const DEFAULT_CONFIG: Partial<ZeroEvalConfig> = {
  frontendPort: 3000,
  backendPort: 3001,
  dbPort: 5432,
  dbName: 'zero_eval',
  nodeEnv: 'development',
};
