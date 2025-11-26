# Zero Evaluation - SDK & Installer Planning

## Current State

The platform already has:
- Docker-based deployment with docker-compose
- Shell scripts for setup, start, stop, backup, restore
- PostgreSQL database with 11 interconnected modules
- JWT authentication
- Full-stack TypeScript (Next.js + Express)

## Problem Statement

Current installation requires:
1. Manually cloning the repository
2. Running shell scripts in the docker folder
3. Technical knowledge of Docker, environment variables
4. No cross-platform GUI installer

## Goals

Create a seamless installation experience for non-technical users across platforms.

---

## Option A: CLI Installer (npm-based SDK)

### Concept
A global npm package that handles installation with a simple command:

```bash
npx create-zero-eval
# or
npm install -g zero-eval && zero-eval install
```

### Features
- Interactive prompts for configuration
- Auto-detects Docker availability
- Generates secure JWT secrets
- Sets up environment files
- Manages containers lifecycle
- Cross-platform (macOS, Windows, Linux)

### Structure
```
packages/
├── create-zero-eval/           # npx installer
│   ├── bin/
│   │   └── create-zero-eval.js
│   ├── src/
│   │   ├── installer.ts        # Main installer logic
│   │   ├── docker-manager.ts   # Docker operations
│   │   ├── config-generator.ts # .env generation
│   │   └── prompts.ts          # Interactive prompts
│   └── package.json
│
└── zero-eval-cli/              # Runtime CLI
    ├── bin/
    │   └── zero-eval.js
    ├── src/
    │   ├── commands/
    │   │   ├── start.ts
    │   │   ├── stop.ts
    │   │   ├── status.ts
    │   │   ├── backup.ts
    │   │   ├── restore.ts
    │   │   ├── update.ts
    │   │   └── logs.ts
    │   └── index.ts
    └── package.json
```

### CLI Commands
```bash
zero-eval start          # Start all services
zero-eval stop           # Stop services (preserve data)
zero-eval status         # Check container health
zero-eval logs [service] # View logs
zero-eval backup         # Create database backup
zero-eval restore <file> # Restore from backup
zero-eval update         # Pull latest images, migrate
zero-eval reset          # Factory reset (destructive)
zero-eval config         # Show/edit configuration
zero-eval open           # Open app in browser
```

### Pros
- Familiar to developers (npm ecosystem)
- Easy to distribute and update
- Cross-platform out of the box
- Can bundle with existing Docker setup

### Cons
- Requires Node.js installed
- CLI-only, no GUI

---

## Option B: Desktop Installer (Electron-based)

### Concept
A native desktop application that provides GUI for installation and management.

### Features
- One-click installer (.dmg for macOS, .exe for Windows, .AppImage for Linux)
- Visual setup wizard
- System tray integration
- Auto-start on boot option
- Built-in Docker management
- Real-time logs viewer
- Backup scheduling

### Structure
```
packages/
└── zero-eval-desktop/
    ├── src/
    │   ├── main/               # Electron main process
    │   │   ├── docker.ts       # Docker API integration
    │   │   ├── installer.ts    # Installation logic
    │   │   ├── tray.ts         # System tray
    │   │   └── main.ts
    │   ├── renderer/           # React UI
    │   │   ├── pages/
    │   │   │   ├── Setup.tsx
    │   │   │   ├── Dashboard.tsx
    │   │   │   ├── Settings.tsx
    │   │   │   └── Logs.tsx
    │   │   └── App.tsx
    │   └── preload/
    │       └── index.ts
    ├── electron-builder.yml    # Build config
    └── package.json
```

### Screens
1. **Welcome** - Introduction, Docker check
2. **Configuration** - Port selection, data directory
3. **Installation** - Progress bar, downloading images
4. **Complete** - Launch app, create shortcut
5. **Dashboard** - Container status, quick actions
6. **Settings** - Ports, auto-start, backup schedule

### Pros
- Best UX for non-technical users
- Visual feedback during installation
- System tray for quick access
- Can bundle Docker Desktop check/install prompt

### Cons
- Large bundle size (~150MB+)
- More complex to maintain
- Separate builds for each platform

---

## Option C: Hybrid Approach (Recommended)

### Concept
Build both CLI and minimal GUI, sharing core logic:

```
packages/
├── @zero-eval/core/            # Shared business logic
│   ├── src/
│   │   ├── docker.ts           # Docker operations
│   │   ├── config.ts           # Configuration management
│   │   ├── installer.ts        # Installation logic
│   │   ├── backup.ts           # Backup/restore
│   │   └── health.ts           # Health checks
│   └── package.json
│
├── create-zero-eval/           # npx installer (uses core)
│   └── ...
│
├── zero-eval-cli/              # CLI tool (uses core)
│   └── ...
│
└── zero-eval-app/              # Electron app (uses core)
    └── ...
```

### Phase 1: CLI Foundation
1. Create `@zero-eval/core` with shared logic
2. Build `create-zero-eval` for npx installation
3. Build `zero-eval-cli` for management

### Phase 2: Desktop App
1. Create Electron wrapper using core
2. Build installers for each platform
3. Add system tray integration

---

## Technical Details

### Docker Management (via dockerode)

```typescript
// @zero-eval/core/src/docker.ts
import Docker from 'dockerode';

export class DockerManager {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  async isDockerRunning(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }

  async startServices(projectPath: string): Promise<void> {
    // Use docker-compose programmatically
  }

  async getContainerStatus(): Promise<ContainerStatus[]> {
    // Return status of pdos-frontend, pdos-backend, pdos-database
  }

  async streamLogs(container: string): AsyncGenerator<string> {
    // Stream container logs
  }
}
```

### Configuration Generator

```typescript
// @zero-eval/core/src/config.ts
import crypto from 'crypto';

export function generateConfig(options: ConfigOptions): EnvConfig {
  return {
    JWT_SECRET: crypto.randomBytes(64).toString('hex'),
    DB_PASSWORD: crypto.randomBytes(16).toString('hex'),
    DB_USER: options.dbUser || 'pdos_user',
    DB_NAME: options.dbName || 'pdos_db',
    DB_PORT: options.dbPort || 5432,
    BACKEND_PORT: options.backendPort || 3001,
    FRONTEND_PORT: options.frontendPort || 3000,
    NODE_ENV: 'production',
  };
}
```

### Interactive Installer (using inquirer)

```typescript
// create-zero-eval/src/prompts.ts
import inquirer from 'inquirer';

export async function promptInstallConfig(): Promise<InstallConfig> {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'installPath',
      message: 'Where should Zero Evaluation be installed?',
      default: '~/zero-evaluation',
    },
    {
      type: 'number',
      name: 'frontendPort',
      message: 'Frontend port:',
      default: 3000,
    },
    {
      type: 'number',
      name: 'backendPort',
      message: 'Backend API port:',
      default: 3001,
    },
    {
      type: 'confirm',
      name: 'autoStart',
      message: 'Start services after installation?',
      default: true,
    },
  ]);
}
```

---

## Distribution Strategy

### CLI Distribution
- Publish to npm registry
- `npx create-zero-eval` works immediately
- Auto-updates via npm

### Desktop Distribution
- GitHub Releases with platform-specific assets
- Auto-update via electron-updater
- Optional: Homebrew tap (macOS), winget (Windows)

### Docker Images
- Publish to Docker Hub: `zeroeval/frontend`, `zeroeval/backend`
- Enables `docker pull` instead of local build
- Faster installation, smaller download

---

## Implementation Priority

### MVP (2-3 days)
1. Create `@zero-eval/core` package
2. Build `create-zero-eval` CLI installer
3. Test on macOS, Windows, Linux

### V1.0 (1 week)
4. Build `zero-eval-cli` management tool
5. Publish to npm
6. Documentation and README

### V2.0 (2 weeks)
7. Electron desktop app
8. System tray integration
9. Platform-specific installers
10. Auto-update mechanism

---

## Questions to Decide

1. **Package naming**: `zero-eval`, `zeroeval`, `pdos`?
2. **Monorepo structure**: Turborepo, Nx, or simple npm workspaces?
3. **Docker Hub namespace**: Create organization account?
4. **Desktop app priority**: Is GUI installer needed for target users?
5. **Distribution**: npm only, or also Homebrew/winget?

---

## Recommended Starting Point

Start with **Option C Phase 1** (CLI-first):

```bash
# User experience:
npx create-zero-eval

# Interactive prompts...
# ✓ Docker detected
# ✓ Configuration generated
# ✓ Downloading images...
# ✓ Starting services...
#
# Zero Evaluation is ready!
# Open http://localhost:3000 to get started.
#
# Manage with: npx zero-eval <command>
```

This provides immediate value with minimal development effort, while laying the foundation for a desktop app later.
