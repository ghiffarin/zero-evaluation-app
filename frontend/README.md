# PD-OS Frontend

Personal Development Operating System - Frontend Application

## Tech Stack

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4+
- **Icons**: Lucide React
- **State**: React Context + Custom Hooks

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on port 3001

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── (app)/             # Authenticated app pages
│   │   │   ├── dashboard/
│   │   │   ├── daily-log/
│   │   │   ├── ielts/
│   │   │   ├── journals/
│   │   │   ├── books/
│   │   │   ├── skills/
│   │   │   ├── workouts/
│   │   │   ├── wellness/
│   │   │   ├── financial/
│   │   │   ├── reflections/
│   │   │   ├── career/
│   │   │   ├── masters-prep/
│   │   │   ├── goals/
│   │   │   ├── projects/
│   │   │   └── settings/
│   │   ├── globals.css        # Design system tokens
│   │   ├── layout.tsx         # Root layout
│   │   └── providers.tsx      # Context providers
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── spinner.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── progress.tsx
│   │   │   └── index.ts
│   │   └── layout/            # Layout components
│   │       ├── sidebar.tsx
│   │       ├── header.tsx
│   │       ├── page-container.tsx
│   │       ├── app-layout.tsx
│   │       └── index.ts
│   ├── contexts/
│   │   └── auth-context.tsx   # Authentication context
│   ├── hooks/
│   │   └── use-api.ts         # API hooks (useApi, useMutation)
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── index.ts           # TypeScript types
├── .env.example
├── .env.local
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Design System

The app uses a comprehensive design system with:

- **CSS Custom Properties**: Defined in `globals.css`
- **Semantic Colors**: `background`, `foreground`, `primary`, `secondary`, `muted`, etc.
- **Dark Mode**: Automatic support via `.dark` class
- **Component Variants**: Using `class-variance-authority`

### Color Usage

```tsx
// Semantic colors
<div className="bg-background text-foreground" />
<div className="bg-card text-card-foreground" />
<div className="text-muted-foreground" />

// Status colors with opacity
<span className="bg-emerald-500/10 text-emerald-600">Success</span>
<span className="bg-rose-500/10 text-rose-600">Error</span>
<span className="bg-amber-500/10 text-amber-600">Warning</span>
<span className="bg-blue-500/10 text-blue-600">Info</span>
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Components

### UI Components

All UI components are exported from `@/components/ui`:

```tsx
import {
  Button,
  Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription,
  Badge,
  Input,
  Textarea,
  Label,
  Select,
  Spinner,
  Avatar,
  Progress
} from '@/components/ui';
```

### Layout Components

```tsx
import {
  AppLayout,
  Sidebar,
  Header,
  PageContainer,
  PageHeader,
  PageSection
} from '@/components/layout';
```

## API Client

The API client is available at `@/lib/api`:

```tsx
import { api } from '@/lib/api';

// Authentication
await api.auth.login(email, password);
await api.auth.register({ email, password, name });

// CRUD operations
const { data } = await api.dailyLogs.list({ page: 1, limit: 20 });
await api.dailyLogs.create(logData);
await api.dailyLogs.update(id, logData);
await api.dailyLogs.delete(id);
```

## Authentication

Use the `useAuth` hook for authentication:

```tsx
import { useAuth } from '@/contexts/auth-context';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  // ...
}
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | User login |
| `/register` | User registration |
| `/dashboard` | Main dashboard |
| `/daily-log` | Daily activity logging |
| `/ielts` | IELTS practice tracking |
| `/journals` | Research/paper reading |
| `/books` | Book reading tracker |
| `/skills` | Skill building |
| `/workouts` | Workout tracking |
| `/wellness` | Wellness activities |
| `/financial` | Financial transactions |
| `/reflections` | Daily reflections |
| `/career` | Career activities |
| `/masters-prep` | Master's preparation |
| `/goals` | Goals management |
| `/projects` | Projects management |
| `/settings` | Account settings |
