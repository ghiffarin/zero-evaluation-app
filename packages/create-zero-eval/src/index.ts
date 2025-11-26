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
  type InstallProgress,
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
  frontendPort: number;
  backendPort: number;
  dbPort: number;
  startNow: boolean;
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
      type: 'number',
      name: 'frontendPort',
      message: 'Frontend port:',
      default: 3000,
      validate: (input: number) => {
        if (input < 1024 || input > 65535) {
          return 'Please enter a port between 1024 and 65535';
        }
        return true;
      },
    },
    {
      type: 'number',
      name: 'backendPort',
      message: 'Backend API port:',
      default: 3001,
      validate: (input: number) => {
        if (input < 1024 || input > 65535) {
          return 'Please enter a port between 1024 and 65535';
        }
        return true;
      },
    },
    {
      type: 'number',
      name: 'dbPort',
      message: 'Database port:',
      default: 5432,
      validate: (input: number) => {
        if (input < 1024 || input > 65535) {
          return 'Please enter a port between 1024 and 65535';
        }
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'startNow',
      message: 'Start services after installation?',
      default: true,
    },
  ]);

  return answers;
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

  console.log(`  ${requirements.dockerAvailable ? checkMark : crossMark} Docker`);
  console.log(`  ${requirements.composeAvailable ? checkMark : crossMark} Docker Compose`);
  console.log(`  ${requirements.gitAvailable ? checkMark : crossMark} Git`);

  if (requirements.errors.length > 0) {
    console.log(chalk.red('\n❌ Missing requirements:\n'));
    requirements.errors.forEach((error) => {
      console.log(chalk.red(`   • ${error}`));
    });
    console.log(chalk.dim('\nPlease install the missing requirements and try again.'));
    process.exit(1);
  }

  console.log(chalk.green('\n✓ All requirements met!\n'));

  // Get configuration
  const answers = await promptForConfig();

  // Confirm installation
  console.log(chalk.cyan('\n📦 Installation Summary\n'));
  console.log(`  Location:       ${chalk.white(answers.installPath)}`);
  console.log(`  Frontend:       ${chalk.white(`http://localhost:${answers.frontendPort}`)}`);
  console.log(`  Backend API:    ${chalk.white(`http://localhost:${answers.backendPort}`)}`);
  console.log(`  Database:       ${chalk.white(`localhost:${answers.dbPort}`)}`);

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
        frontendPort: answers.frontendPort,
        backendPort: answers.backendPort,
        dbPort: answers.dbPort,
        skipDocker: !answers.startNow,
      },
      (progress: InstallProgress) => {
        spinner.text = progress.message;
      }
    );

    spinner.succeed('Installation complete!');

    // Success message
    console.log(chalk.green('\n✨ Zero Evaluation has been installed successfully!\n'));

    if (answers.startNow) {
      console.log(chalk.cyan('🚀 Your application is starting up...\n'));
      console.log('   Please wait a moment for all services to initialize.');
      console.log('   First-time startup may take 2-3 minutes to build.\n');
    }

    console.log(chalk.white('📱 Access your app at:'));
    console.log(chalk.blue(`   http://localhost:${config.frontendPort}\n`));

    console.log(chalk.white('🔧 Manage your installation:'));
    console.log(chalk.dim('   npx zero-eval start     Start all services'));
    console.log(chalk.dim('   npx zero-eval stop      Stop all services'));
    console.log(chalk.dim('   npx zero-eval status    Check service health'));
    console.log(chalk.dim('   npx zero-eval logs      View logs'));
    console.log(chalk.dim('   npx zero-eval backup    Create a backup'));
    console.log(chalk.dim('   npx zero-eval --help    See all commands\n'));

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
