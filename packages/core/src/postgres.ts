import { execa } from 'execa';
import os from 'os';

export interface PostgresInfo {
  installed: boolean;
  running: boolean;
  version?: string;
  error?: string;
}

/**
 * Get the current OS platform
 */
export function getPlatform(): 'macos' | 'linux' | 'windows' | 'unknown' {
  const platform = os.platform();
  if (platform === 'darwin') return 'macos';
  if (platform === 'linux') return 'linux';
  if (platform === 'win32') return 'windows';
  return 'unknown';
}

/**
 * Get PostgreSQL installation instructions for the current OS
 */
export function getPostgresInstallInstructions(): string {
  const platform = getPlatform();

  switch (platform) {
    case 'macos':
      return `
PostgreSQL is not installed. Please install it using Homebrew:

  1. Install Homebrew (if not installed):
     /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  2. Install PostgreSQL:
     brew install postgresql@16

  3. Start PostgreSQL service:
     brew services start postgresql@16

  4. Add to PATH (add to ~/.zshrc or ~/.bash_profile):
     export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

After installation, press Enter to continue...`;

    case 'linux':
      return `
PostgreSQL is not installed. Please install it:

  For Ubuntu/Debian:
     sudo apt update
     sudo apt install postgresql postgresql-contrib
     sudo systemctl start postgresql
     sudo systemctl enable postgresql

  For Fedora/RHEL:
     sudo dnf install postgresql-server postgresql-contrib
     sudo postgresql-setup --initdb
     sudo systemctl start postgresql
     sudo systemctl enable postgresql

After installation, press Enter to continue...`;

    case 'windows':
      return `
PostgreSQL is not installed. Please install it:

  1. Download the installer from:
     https://www.postgresql.org/download/windows/

  2. Run the installer and follow the setup wizard

  3. Make sure to add PostgreSQL to your PATH during installation

After installation, press Enter to continue...`;

    default:
      return `
PostgreSQL is not installed. Please install PostgreSQL for your operating system.
Visit: https://www.postgresql.org/download/

After installation, press Enter to continue...`;
  }
}

/**
 * Check if PostgreSQL is installed and get version
 */
export async function checkPostgresInstalled(): Promise<PostgresInfo> {
  try {
    // Try psql first
    const { stdout } = await execa('psql', ['--version'], { stdio: 'pipe' });
    const versionMatch = stdout.match(/(\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : undefined;

    // Check if we can connect (server is running)
    const running = await checkPostgresRunning();

    return {
      installed: true,
      running,
      version,
    };
  } catch (error) {
    // Try createdb as fallback
    try {
      await execa('createdb', ['--version'], { stdio: 'pipe' });
      const running = await checkPostgresRunning();
      return {
        installed: true,
        running,
      };
    } catch {
      return {
        installed: false,
        running: false,
        error: 'PostgreSQL commands (psql, createdb) not found in PATH',
      };
    }
  }
}

/**
 * Check if PostgreSQL server is running
 */
export async function checkPostgresRunning(): Promise<boolean> {
  try {
    // Try to connect to default database
    await execa('psql', ['-c', 'SELECT 1', 'postgres'], {
      stdio: 'pipe',
      timeout: 5000,
    });
    return true;
  } catch {
    // Try without specifying database (some systems use user's name)
    try {
      await execa('psql', ['-c', 'SELECT 1'], {
        stdio: 'pipe',
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Check if a database exists
 */
export async function databaseExists(dbName: string): Promise<boolean> {
  try {
    const { stdout } = await execa(
      'psql',
      ['-tAc', `SELECT 1 FROM pg_database WHERE datname='${dbName}'`, 'postgres'],
      { stdio: 'pipe' }
    );
    return stdout.trim() === '1';
  } catch {
    // Try without specifying postgres database
    try {
      const { stdout } = await execa(
        'psql',
        ['-tAc', `SELECT 1 FROM pg_database WHERE datname='${dbName}'`],
        { stdio: 'pipe' }
      );
      return stdout.trim() === '1';
    } catch {
      return false;
    }
  }
}

/**
 * Create a database
 */
export async function createDatabase(dbName: string): Promise<{ success: boolean; error?: string }> {
  try {
    await execa('createdb', [dbName], { stdio: 'pipe' });
    return { success: true };
  } catch (error: any) {
    // Check if database already exists
    if (error.stderr?.includes('already exists')) {
      return { success: true }; // Consider this success
    }
    return {
      success: false,
      error: error.stderr || error.message || 'Failed to create database',
    };
  }
}

/**
 * Drop a database (use with caution!)
 */
export async function dropDatabase(dbName: string): Promise<{ success: boolean; error?: string }> {
  try {
    await execa('dropdb', ['--if-exists', dbName], { stdio: 'pipe' });
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.stderr || error.message || 'Failed to drop database',
    };
  }
}

/**
 * Get the default DATABASE_URL for local PostgreSQL
 * Uses the current OS user (default for PostgreSQL on mac/linux)
 */
export function getDefaultDatabaseUrl(dbName: string, port = 5432): string {
  const username = os.userInfo().username;
  // Local PostgreSQL typically uses peer/trust authentication, so no password needed
  return `postgresql://${username}@localhost:${port}/${dbName}`;
}

/**
 * Get DATABASE_URL with explicit credentials
 */
export function getDatabaseUrl(
  dbName: string,
  username: string,
  password: string,
  host = 'localhost',
  port = 5432
): string {
  return `postgresql://${username}:${password}@${host}:${port}/${dbName}`;
}

/**
 * Test a database connection
 */
export async function testDatabaseConnection(databaseUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    await execa('psql', [databaseUrl, '-c', 'SELECT 1'], {
      stdio: 'pipe',
      timeout: 10000,
    });
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.stderr || error.message || 'Failed to connect to database',
    };
  }
}
