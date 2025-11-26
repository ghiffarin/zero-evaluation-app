import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import open from 'open';
import path from 'node:path';
import os from 'node:os';
import {
  loadConfig,
  isInstalled,
  getServiceHealth,
  startServices,
  stopServices,
  restartServices,
  getLogs,
  createBackup,
  restoreBackup,
  resetData,
  isDockerAvailable,
} from '@zero-eval/core';

const program = new Command();

// Helper to check installation
async function requireInstallation(): Promise<boolean> {
  if (!(await isInstalled())) {
    console.log(chalk.yellow('\n⚠️  Zero Evaluation is not installed.'));
    console.log(chalk.dim('   Run: npx create-zero-eval'));
    return false;
  }
  return true;
}

// Helper to check Docker
async function requireDocker(): Promise<boolean> {
  if (!(await isDockerAvailable())) {
    console.log(chalk.red('\n❌ Docker is not running.'));
    console.log(chalk.dim('   Please start Docker Desktop and try again.'));
    return false;
  }
  return true;
}

program
  .name('zero-eval')
  .description('Manage your Zero Evaluation installation')
  .version('1.0.0');

// Start command
program
  .command('start')
  .description('Start all Zero Evaluation services')
  .action(async () => {
    if (!(await requireInstallation()) || !(await requireDocker())) return;

    const spinner = ora('Starting services...').start();
    try {
      await startServices();
      spinner.succeed('Services started successfully!');

      const config = await loadConfig();
      console.log(chalk.green(`\n✨ Zero Evaluation is running at:`));
      console.log(chalk.blue(`   http://localhost:${config?.frontendPort || 3000}\n`));
    } catch (error) {
      spinner.fail('Failed to start services');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

// Stop command
program
  .command('stop')
  .description('Stop all Zero Evaluation services')
  .action(async () => {
    if (!(await requireInstallation()) || !(await requireDocker())) return;

    const spinner = ora('Stopping services...').start();
    try {
      await stopServices();
      spinner.succeed('Services stopped successfully!');
      console.log(chalk.dim('\nYour data is preserved. Run "zero-eval start" to start again.'));
    } catch (error) {
      spinner.fail('Failed to stop services');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

// Restart command
program
  .command('restart')
  .description('Restart all Zero Evaluation services')
  .action(async () => {
    if (!(await requireInstallation()) || !(await requireDocker())) return;

    const spinner = ora('Restarting services...').start();
    try {
      await restartServices();
      spinner.succeed('Services restarted successfully!');

      const config = await loadConfig();
      console.log(chalk.green(`\n✨ Zero Evaluation is running at:`));
      console.log(chalk.blue(`   http://localhost:${config?.frontendPort || 3000}\n`));
    } catch (error) {
      spinner.fail('Failed to restart services');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

// Status command
program
  .command('status')
  .description('Check the status of Zero Evaluation services')
  .action(async () => {
    if (!(await requireInstallation())) return;

    const config = await loadConfig();
    const dockerAvailable = await isDockerAvailable();

    console.log(chalk.cyan('\n📊 Zero Evaluation Status\n'));
    console.log(`Installation: ${chalk.white(config?.installPath || 'Unknown')}`);
    console.log(`Docker:       ${dockerAvailable ? chalk.green('Running') : chalk.red('Not running')}`);

    if (!dockerAvailable) {
      console.log(chalk.yellow('\n⚠️  Start Docker to see service status.'));
      return;
    }

    const health = await getServiceHealth();

    console.log('');
    const statusIcon = (status: string) => {
      switch (status) {
        case 'running': return chalk.green('●');
        case 'stopped': return chalk.yellow('●');
        default: return chalk.red('●');
      }
    };

    console.log(`${statusIcon(health.database.status)} Database:    ${health.database.status}`);
    console.log(`${statusIcon(health.backend.status)} Backend:     ${health.backend.status}`);
    console.log(`${statusIcon(health.frontend.status)} Frontend:    ${health.frontend.status}`);
    console.log('');
    console.log(`Overall:      ${health.overall === 'healthy' ? chalk.green('Healthy') : health.overall === 'degraded' ? chalk.yellow('Degraded') : chalk.red('Down')}`);

    if (health.overall === 'healthy') {
      console.log(chalk.green(`\n✨ App available at: http://localhost:${config?.frontendPort || 3000}`));
    } else if (health.overall === 'down') {
      console.log(chalk.dim('\nRun "zero-eval start" to start services.'));
    }
  });

// Logs command
program
  .command('logs')
  .description('View service logs')
  .argument('[service]', 'Service to view logs for (database, backend, frontend)')
  .option('-n, --tail <lines>', 'Number of lines to show', '50')
  .option('-f, --follow', 'Follow log output')
  .action(async (service?: string, options?: { tail: string; follow?: boolean }) => {
    if (!(await requireInstallation()) || !(await requireDocker())) return;

    try {
      const logs = await getLogs(
        service as 'database' | 'backend' | 'frontend' | undefined,
        { tail: parseInt(options?.tail || '50'), follow: options?.follow }
      );
      console.log(logs);
    } catch (error) {
      console.error(chalk.red(error instanceof Error ? error.message : 'Failed to get logs'));
    }
  });

// Backup command
program
  .command('backup')
  .description('Create a database backup')
  .option('-o, --output <path>', 'Output directory', path.join(os.homedir(), 'zero-eval-backups'))
  .action(async (options: { output: string }) => {
    if (!(await requireInstallation()) || !(await requireDocker())) return;

    const spinner = ora('Creating backup...').start();
    try {
      const backupPath = await createBackup(options.output);
      spinner.succeed('Backup created successfully!');
      console.log(chalk.green(`\n📦 Backup saved to: ${backupPath}`));
    } catch (error) {
      spinner.fail('Failed to create backup');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

// Restore command
program
  .command('restore <file>')
  .description('Restore from a database backup')
  .action(async (file: string) => {
    if (!(await requireInstallation()) || !(await requireDocker())) return;

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.yellow('This will overwrite your current database. Are you sure?'),
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.dim('Restore cancelled.'));
      return;
    }

    const spinner = ora('Restoring backup...').start();
    try {
      await restoreBackup(file);
      spinner.succeed('Backup restored successfully!');
      console.log(chalk.dim('\nYou may need to restart services: zero-eval restart'));
    } catch (error) {
      spinner.fail('Failed to restore backup');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

// Reset command
program
  .command('reset')
  .description('Reset Zero Evaluation (removes all data)')
  .action(async () => {
    if (!(await requireInstallation()) || !(await requireDocker())) return;

    console.log(chalk.red('\n⚠️  WARNING: This will permanently delete all your data!'));

    const { confirm } = await inquirer.prompt([
      {
        type: 'input',
        name: 'confirm',
        message: 'Type "DELETE" to confirm:',
      },
    ]);

    if (confirm !== 'DELETE') {
      console.log(chalk.dim('Reset cancelled.'));
      return;
    }

    const spinner = ora('Resetting...').start();
    try {
      await resetData();
      spinner.succeed('Reset complete!');
      console.log(chalk.dim('\nAll data has been deleted. Run "zero-eval start" to start fresh.'));
    } catch (error) {
      spinner.fail('Failed to reset');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

// Open command
program
  .command('open')
  .description('Open Zero Evaluation in your browser')
  .action(async () => {
    const config = await loadConfig();
    const url = `http://localhost:${config?.frontendPort || 3000}`;

    console.log(chalk.cyan(`Opening ${url}...`));
    await open(url);
  });

// Config command
program
  .command('config')
  .description('Show current configuration')
  .action(async () => {
    const config = await loadConfig();

    if (!config) {
      console.log(chalk.yellow('\n⚠️  No configuration found.'));
      console.log(chalk.dim('   Run: npx create-zero-eval'));
      return;
    }

    console.log(chalk.cyan('\n⚙️  Configuration\n'));
    console.log(`Installation Path:  ${chalk.white(config.installPath)}`);
    console.log(`Frontend Port:      ${chalk.white(config.frontendPort)}`);
    console.log(`Backend Port:       ${chalk.white(config.backendPort)}`);
    console.log(`Database Port:      ${chalk.white(config.dbPort)}`);
    console.log(`Database User:      ${chalk.white(config.dbUser)}`);
    console.log(`Database Name:      ${chalk.white(config.dbName)}`);
    console.log(`Environment:        ${chalk.white(config.nodeEnv)}`);
    console.log(chalk.dim(`\nConfig file: ~/.zero-eval/config.json`));
  });

program.parse();
