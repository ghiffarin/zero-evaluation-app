# Zero Evaluation

A personal development tracking platform for daily self-evaluation, goal setting, and progress monitoring.

## Quick Start

### Prerequisites

- [Docker Desktop](https://docker.com) (required)
- Node.js 18+ (for development only)

### Installation

Install Zero Evaluation locally with a single command:

```bash
npx create-zero-eval
```

This will:
1. Check system requirements (Docker, Docker Compose)
2. Prompt for installation path and ports
3. Set up the database, backend, and frontend containers
4. Start all services automatically

### Access Your App

After installation, open your browser to:

```
http://localhost:3000
```

## Management Commands

Use the CLI to manage your installation:

```bash
# Start all services
npx zero-eval start

# Stop all services
npx zero-eval stop

# Restart services
npx zero-eval restart

# Check service status
npx zero-eval status

# View logs
npx zero-eval logs              # All services
npx zero-eval logs backend      # Specific service
npx zero-eval logs -f           # Follow logs

# Database backup
npx zero-eval backup
npx zero-eval restore <file>

# Reset all data
npx zero-eval reset

# Show configuration
npx zero-eval config

# Open in browser
npx zero-eval open
```

## Development Setup

For local development without Docker:

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Update DATABASE_URL in .env to your PostgreSQL instance
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Architecture

```
zero-evaluation/
├── backend/          # Express.js API with Prisma ORM
├── frontend/         # Next.js 15 React application
├── packages/         # CLI installer packages
│   ├── core/         # Shared business logic
│   ├── create-zero-eval/  # npx installer
│   └── zero-eval-cli/     # Management CLI
└── docker-compose.yml
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Prisma, PostgreSQL
- **Infrastructure**: Docker, Docker Compose

## Features

- Daily evaluation tracking
- Goal setting and progress monitoring
- Masters preparation tracking
- Job application pipeline management
- Dark mode support
- Data export/import

## Configuration

Configuration is stored in `~/.zero-eval/config.json` and includes:

- Installation path
- Port assignments (frontend, backend, database)
- Database credentials

## Troubleshooting

### Docker not running

```
Error: Docker is not installed or not running
```

Solution: Start Docker Desktop and try again.

### Port already in use

During installation, choose different ports or stop services using the default ports:

```bash
# Check what's using port 3000
lsof -i :3000
```

### Reset everything

To start fresh:

```bash
npx zero-eval reset
npx create-zero-eval
```

## License

MIT
