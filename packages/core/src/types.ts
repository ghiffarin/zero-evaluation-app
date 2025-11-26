export interface ZeroEvalConfig {
  installPath: string;
  frontendPort: number;
  backendPort: number;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  jwtSecret: string;
  nodeEnv: 'development' | 'production';
}

export interface ContainerStatus {
  name: string;
  status: 'running' | 'stopped' | 'not_found' | 'unhealthy';
  health?: string;
  ports?: string[];
}

export interface ServiceHealth {
  database: ContainerStatus;
  backend: ContainerStatus;
  frontend: ContainerStatus;
  overall: 'healthy' | 'degraded' | 'down';
}

export interface InstallOptions {
  installPath?: string;
  frontendPort?: number;
  backendPort?: number;
  dbPort?: number;
  skipDocker?: boolean;
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
  dbUser: 'pdos_user',
  dbName: 'pdos_db',
  nodeEnv: 'production',
};

export const CONTAINER_NAMES = {
  database: 'zeroeval-database',
  backend: 'zeroeval-backend',
  frontend: 'zeroeval-frontend',
} as const;

export const DOCKER_COMPOSE_PROJECT = 'zeroeval';
