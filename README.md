# Zero Evaluation

A personal development tracking platform for daily self-evaluation, goal setting, and progress monitoring.

## Quick Start

### Prerequisites

- **PostgreSQL** - Required for the database
- **Node.js 18+** - Required for running the application

### Installation

Install Zero Evaluation locally with a single command:

```bash
npx create-zero-eval
```

This will:
1. Check system requirements (Node.js, PostgreSQL)
2. Guide you through PostgreSQL installation if not present
3. Prompt for installation path
4. Auto-detect available ports
5. Set up the database and install dependencies
6. Configure environment files

### PostgreSQL Installation

If PostgreSQL is not installed, the installer will provide OS-specific instructions:

**macOS (Homebrew)**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows**
Download from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)

### Start Your App

After installation:

```bash
cd ~/zero-evaluation  # or your install path
npm run dev
```

Then open your browser to:
```
http://localhost:3000
```

## Development Commands

```bash
# Start both frontend and backend
npm run dev

# Start frontend only
npm run dev:frontend

# Start backend only
npm run dev:backend
```

## Manual Setup

For manual development setup:

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
# Create .env.local with BACKEND_URL if using non-default backend port
npm run dev
```

## Architecture

```
zero-evaluation/
├── backend/          # Express.js API with Prisma ORM
├── frontend/         # Next.js 15 React application
├── packages/         # CLI installer packages
│   ├── core/         # Shared business logic
│   └── create-zero-eval/  # npx installer
└── package.json      # Root package with dev scripts
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Prisma, PostgreSQL
- **Database**: PostgreSQL (local)

## Features

- Daily evaluation tracking
- Goal setting and progress monitoring
- Masters preparation tracking
- Job application pipeline management
- Career activity tracking with daily logs
- IELTS preparation tracking
- Book reading progress
- Skill development tracking
- Dark mode support
- Data export/import

## Configuration

Configuration is stored in `~/.zero-eval/config.json` and includes:

- Installation path
- Port assignments (frontend, backend)
- Database connection details

Environment files are created during installation:
- `backend/.env` - Database URL, JWT secret, port
- `frontend/.env.local` - Backend URL for API proxy

## Troubleshooting

### PostgreSQL not running

```
Error: PostgreSQL is installed but not running
```

Solution:
```bash
# macOS
brew services start postgresql@16

# Linux
sudo systemctl start postgresql
```

### PostgreSQL not found

Make sure PostgreSQL is in your PATH:
```bash
# macOS (add to ~/.zshrc)
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
```

### Port already in use

The installer auto-detects available ports. If you need to check manually:
```bash
lsof -i :3000
lsof -i :3001
```

### Database connection issues

Verify PostgreSQL is running and accessible:
```bash
psql -c "SELECT 1"
```

### Reset everything

To start fresh:
```bash
rm -rf ~/.zero-eval
rm -rf ~/zero-evaluation  # or your install path
npx create-zero-eval
```

## License

MIT
