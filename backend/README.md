# PD-OS Backend API

Personal Development Operating System - Backend API Server

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update DATABASE_URL in .env with your PostgreSQL connection string

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pd_os"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/profile` | Update profile |
| POST | `/api/auth/change-password` | Change password |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/today` | Today's summary |
| GET | `/api/dashboard/weekly` | Weekly overview |
| GET | `/api/dashboard/monthly` | Monthly statistics |
| GET | `/api/dashboard/insights` | Cross-module insights |

### Daily Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/daily-logs` | List all daily logs |
| POST | `/api/daily-logs` | Create daily log |
| GET | `/api/daily-logs/:id` | Get daily log by ID |
| PUT | `/api/daily-logs/:id` | Update daily log |
| DELETE | `/api/daily-logs/:id` | Delete daily log |
| GET | `/api/daily-logs/date/:date` | Get log by date |
| PUT | `/api/daily-logs/date/:date` | Upsert log by date |
| GET | `/api/daily-logs/weekly-summary` | Weekly summary |

### IELTS Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ielts/sessions` | List IELTS sessions |
| POST | `/api/ielts/sessions` | Create session |
| GET | `/api/ielts/stats` | Get IELTS statistics |
| GET | `/api/ielts/vocab` | List vocabulary |
| POST | `/api/ielts/vocab` | Add vocabulary |

### Other Modules
Similar CRUD endpoints exist for:
- `/api/journals` - Research/paper reading
- `/api/books` - Book reading
- `/api/skills` - Skill building
- `/api/workouts` - Workout tracking
- `/api/wellness` - Wellness tracking
- `/api/financial` - Financial transactions
- `/api/reflections` - Daily reflections
- `/api/career/activities` - Career activities
- `/api/career/applications` - Job applications
- `/api/masters-prep` - Master's preparation
- `/api/projects` - Projects
- `/api/goals` - Goals

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Query Parameters

Most list endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search text
- `startDate` - Filter from date
- `endDate` - Filter to date

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities
│   └── server.ts         # Entry point
├── .env                  # Environment variables
├── package.json
└── tsconfig.json
```
