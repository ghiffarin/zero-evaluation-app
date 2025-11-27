import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import os from 'node:os';
import path from 'node:path';
import {
  checkRequirements,
  install,
  isInstalled,
  loadConfig,
  getDefaultInstallPath,
  getPostgresInstallInstructions,
  type InstallProgress,
  type RequirementsCheck,
} from '@zero-eval/core';

const BANNER = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ███████╗███████╗██████╗  ██████╗                          ║
║    ╚══███╔╝██╔════╝██╔══██╗██╔═══██╗                         ║
║      ███╔╝ █████╗  ██████╔╝██║   ██║                         ║
║     ███╔╝  ██╔══╝  ██╔══██╗██║   ██║                         ║
║    ███████╗███████╗██║  ██║╚██████╔╝                         ║
║    ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝                          ║
║                                                              ║
║    ███████╗██╗   ██╗ █████╗ ██╗                              ║
║    ██╔════╝██║   ██║██╔══██╗██║                              ║
║    █████╗  ██║   ██║███████║██║                              ║
║    ██╔══╝  ╚██╗ ██╔╝██╔══██║██║                              ║
║    ███████╗ ╚████╔╝ ██║  ██║███████╗                         ║
║    ╚══════╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝                         ║
║                                                              ║
║    Personal Development Tracking Platform                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

interface InstallAnswers {
  installPath: string;
  useAutoConfig: boolean;
}

async function promptForConfig(): Promise<InstallAnswers> {
  console.log(chalk.cyan('\n📋 Configuration\n'));

  const answers = await inquirer.prompt<InstallAnswers>([
    {
      type: 'input',
      name: 'installPath',
      message: 'Where should Zero Evaluation be installed?',
      default: getDefaultInstallPath(),
      validate: (input: string) => {
        if (!input.trim()) return 'Please enter a valid path';
        return true;
      },
      filter: (input: string) => {
        // Expand ~ to home directory
        if (input.startsWith('~')) {
          return path.join(os.homedir(), input.slice(1));
        }
        return path.resolve(input);
      },
    },
    {
      type: 'confirm',
      name: 'useAutoConfig',
      message: 'Use automatic port configuration? (recommended)',
      default: true,
    },
  ]);

  return answers;
}

async function waitForPostgresInstall(): Promise<boolean> {
  const instructions = getPostgresInstallInstructions();
  console.log(chalk.yellow(instructions));

  const { ready } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ready',
      message: 'Have you installed PostgreSQL and started the service?',
      default: false,
    },
  ]);

  return ready;
}

async function checkAndWaitForPostgres(requirements: RequirementsCheck): Promise<boolean> {
  // If PostgreSQL is already running, we're good
  if (requirements.postgresInstalled && requirements.postgresRunning) {
    return true;
  }

  // If not installed, show installation instructions
  if (!requirements.postgresInstalled) {
    console.log(chalk.yellow('\n⚠️  PostgreSQL is not installed on your system.'));

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const ready = await waitForPostgresInstall();

      if (!ready) {
        console.log(chalk.dim('\nInstallation cancelled.'));
        return false;
      }

      // Re-check requirements
      const newRequirements = await checkRequirements();

      if (newRequirements.postgresInstalled && newRequirements.postgresRunning) {
        console.log(chalk.green('\n✓ PostgreSQL is now installed and running!'));
        return true;
      }

      if (newRequirements.postgresInstalled && !newRequirements.postgresRunning) {
        console.log(chalk.yellow('\n⚠️  PostgreSQL is installed but not running.'));
        console.log(chalk.dim('Please start the PostgreSQL service and try again.\n'));
      } else {
        console.log(chalk.yellow('\n⚠️  PostgreSQL is still not detected.'));
        console.log(chalk.dim('Make sure to add PostgreSQL to your PATH.\n'));
      }

      attempts++;
    }

    console.log(chalk.red('\n❌ Unable to detect PostgreSQL after multiple attempts.'));
    console.log(chalk.dim('Please ensure PostgreSQL is properly installed and in your PATH.'));
    return false;
  }

  // Installed but not running
  if (!requirements.postgresRunning) {
    console.log(chalk.yellow('\n⚠️  PostgreSQL is installed but not running.'));
    console.log(chalk.dim('Please start the PostgreSQL service.\n'));

    const { ready } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'ready',
        message: 'Have you started the PostgreSQL service?',
        default: false,
      },
    ]);

    if (!ready) {
      console.log(chalk.dim('\nInstallation cancelled.'));
      return false;
    }

    const newRequirements = await checkRequirements();
    if (newRequirements.postgresRunning) {
      console.log(chalk.green('\n✓ PostgreSQL is now running!'));
      return true;
    }

    console.log(chalk.red('\n❌ PostgreSQL is still not running.'));
    return false;
  }

  return true;
}

async function checkExistingInstallation(): Promise<boolean> {
  if (await isInstalled()) {
    const config = await loadConfig();
    console.log(chalk.yellow('\n⚠️  Zero Evaluation is already installed!'));
    console.log(chalk.dim(`   Location: ${config?.installPath}`));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Reinstall (keeps existing data)', value: 'reinstall' },
          { name: 'Cancel', value: 'cancel' },
        ],
      },
    ]);

    if (action === 'cancel') {
      console.log(chalk.dim('\nInstallation cancelled.'));
      console.log(chalk.dim('To manage your installation, use: npx zero-eval <command>'));
      return false;
    }
  }
  return true;
}

async function main(): Promise<void> {
  console.log(chalk.blue(BANNER));
  console.log(chalk.dim('  Version 1.0.0\n'));

  // Check existing installation
  if (!(await checkExistingInstallation())) {
    process.exit(0);
  }

  // Check system requirements
  console.log(chalk.cyan('🔍 Checking system requirements...\n'));

  const requirements = await checkRequirements();

  const checkMark = chalk.green('✓');
  const crossMark = chalk.red('✗');
  const warningMark = chalk.yellow('⚠');

  // Node.js check
  console.log(`  ${requirements.nodeOk ? checkMark : crossMark} Node.js ${requirements.nodeVersion} ${requirements.nodeOk ? '' : '(v18+ required)'}`);

  // PostgreSQL check
  if (requirements.postgresInstalled && requirements.postgresRunning) {
    console.log(`  ${checkMark} PostgreSQL ${requirements.postgresVersion || ''}`);
  } else if (requirements.postgresInstalled) {
    console.log(`  ${warningMark} PostgreSQL (not running)`);
  } else {
    console.log(`  ${crossMark} PostgreSQL`);
  }

  // Git check (optional)
  console.log(`  ${requirements.gitAvailable ? checkMark : warningMark} Git ${requirements.gitAvailable ? '' : '(optional)'}`);

  // Check Node.js version first
  if (!requirements.nodeOk) {
    console.log(chalk.red('\n❌ Node.js 18 or higher is required.'));
    console.log(chalk.dim(`   Current version: ${requirements.nodeVersion}`));
    console.log(chalk.dim('   Please update Node.js and try again.'));
    process.exit(1);
  }

  // Handle PostgreSQL installation/startup
  const postgresReady = await checkAndWaitForPostgres(requirements);
  if (!postgresReady) {
    process.exit(1);
  }

  console.log(chalk.green('\n✓ All requirements met!\n'));

  // Get configuration
  const answers = await promptForConfig();

  // Show what will happen
  console.log(chalk.cyan('\n📦 Installation Plan\n'));
  console.log(`  Location:     ${chalk.white(answers.installPath)}`);
  console.log(`  Database:     ${chalk.white('PostgreSQL (local)')}`);
  console.log(`  Ports:        ${chalk.white(answers.useAutoConfig ? 'Auto-detect available ports' : 'Use defaults (3000, 3001)')}`);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Proceed with installation?',
      default: true,
    },
  ]);

  if (!confirm) {
    console.log(chalk.dim('\nInstallation cancelled.'));
    process.exit(0);
  }

  // Run installation
  console.log('');
  const spinner = ora('Starting installation...').start();

  try {
    const config = await install(
      {
        installPath: answers.installPath,
        // Let the installer auto-detect available ports
        frontendPort: answers.useAutoConfig ? undefined : 3000,
        backendPort: answers.useAutoConfig ? undefined : 3001,
      },
      (progress: InstallProgress) => {
        spinner.text = progress.message;
      }
    );

    spinner.succeed('Installation complete!');

    // Success message
    console.log(chalk.green('\n✨ Zero Evaluation has been installed successfully!\n'));

    console.log(chalk.white('📱 Your application is ready:'));
    console.log(chalk.blue(`   Frontend:  http://localhost:${config.frontendPort}`));
    console.log(chalk.blue(`   Backend:   http://localhost:${config.backendPort}`));
    console.log(chalk.dim(`   Database:  ${config.dbName}\n`));

    console.log(chalk.white('🚀 To start your application:'));
    console.log(chalk.cyan(`   cd ${config.installPath}`));
    console.log(chalk.cyan('   npm run dev\n'));

    console.log(chalk.white('🔧 Available commands:'));
    console.log(chalk.dim('   npm run dev           Start both frontend and backend'));
    console.log(chalk.dim('   npm run dev:frontend  Start frontend only'));
    console.log(chalk.dim('   npm run dev:backend   Start backend only\n'));

    console.log(chalk.dim('Configuration saved to: ~/.zero-eval/config.json'));
    console.log(chalk.dim(`Installation directory: ${config.installPath}\n`));

  } catch (error) {
    spinner.fail('Installation failed');
    console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    console.log(chalk.dim('\nPlease check the error above and try again.'));
    console.log(chalk.dim('If the problem persists, please open an issue at:'));
    console.log(chalk.blue('https://github.com/ghiffarin/zero-evaluation-app/issues\n'));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});
