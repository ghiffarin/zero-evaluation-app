'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PageContainer, PageHeader, PageSection } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress } from '@/components/ui';
import {
  CalendarDays,
  BookOpen,
  Languages,
  Dumbbell,
  Heart,
  Target,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

// Mock data for demonstration
const todayStats = {
  mood: 4,
  energy: 'high',
  productive_hours: 6.5,
  sleep_hours: 7,
};

const weeklyProgress = [
  { module: 'IELTS', hours: 8, target: 10, color: 'bg-blue-500' },
  { module: 'Skills', hours: 5, target: 7, color: 'bg-purple-500' },
  { module: 'Workouts', hours: 4, target: 5, color: 'bg-emerald-500' },
  { module: 'Wellness', hours: 3, target: 5, color: 'bg-rose-500' },
];

const recentActivities = [
  { type: 'ielts', title: 'Reading Practice', time: '2 hours ago', duration: '45m' },
  { type: 'book', title: 'Atomic Habits - Chapter 5', time: '4 hours ago', duration: '30m' },
  { type: 'workout', title: 'Morning Run', time: 'Yesterday', duration: '35m' },
  { type: 'skill', title: 'React Patterns', time: 'Yesterday', duration: '60m' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const today = new Date();

  return (
    <PageContainer>
      <PageHeader
        title={`Good ${getGreeting()}, ${user?.name?.split(' ')[0] || 'there'}!`}
        description={formatDate(today, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      />

      {/* Today's Summary */}
      <PageSection title="Today's Summary">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Mood"
            value={`${todayStats.mood}/5`}
            color="text-amber-500"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Productive Hours"
            value={`${todayStats.productive_hours}h`}
            color="text-blue-500"
          />
          <StatCard
            icon={<Heart className="h-5 w-5" />}
            label="Energy"
            value={todayStats.energy}
            color="text-rose-500"
          />
          <StatCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Sleep"
            value={`${todayStats.sleep_hours}h`}
            color="text-purple-500"
          />
        </div>
      </PageSection>

      {/* Weekly Progress */}
      <PageSection title="Weekly Progress">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {weeklyProgress.map((item) => (
                <div key={item.module} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.module}</span>
                    <span className="text-muted-foreground">
                      {item.hours}h / {item.target}h
                    </span>
                  </div>
                  <Progress
                    value={item.hours}
                    max={item.target}
                    indicatorClassName={item.color}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageSection>

      {/* Quick Actions and Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <PageSection title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            <QuickActionCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Daily Log"
              href="/daily-log"
              color="bg-blue-500/10 text-blue-600"
            />
            <QuickActionCard
              icon={<Languages className="h-5 w-5" />}
              label="IELTS Session"
              href="/ielts"
              color="bg-purple-500/10 text-purple-600"
            />
            <QuickActionCard
              icon={<Dumbbell className="h-5 w-5" />}
              label="Log Workout"
              href="/workouts"
              color="bg-emerald-500/10 text-emerald-600"
            />
            <QuickActionCard
              icon={<BookOpen className="h-5 w-5" />}
              label="Reading Log"
              href="/books"
              color="bg-amber-500/10 text-amber-600"
            />
          </div>
        </PageSection>

        {/* Recent Activities */}
        <PageSection title="Recent Activities">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <ActivityIcon type={activity.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <Badge variant="neutral">{activity.duration}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </PageSection>
      </div>

      {/* Goals Overview */}
      <PageSection title="Active Goals">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <GoalCard
            title="IELTS Band 7.5"
            progress={65}
            dueDate="Dec 2024"
            category="Education"
          />
          <GoalCard
            title="Read 24 Books"
            progress={45}
            dueDate="Dec 2024"
            category="Personal"
          />
          <GoalCard
            title="Master TypeScript"
            progress={80}
            dueDate="Nov 2024"
            category="Career"
          />
        </div>
      </PageSection>
    </PageContainer>
  );
}

// Helper components
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`${color}`}>{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold capitalize">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  icon,
  label,
  href,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-accent"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, { icon: React.ReactNode; color: string }> = {
    ielts: { icon: <Languages className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
    book: { icon: <BookOpen className="h-4 w-4" />, color: 'bg-amber-500/10 text-amber-600' },
    workout: { icon: <Dumbbell className="h-4 w-4" />, color: 'bg-emerald-500/10 text-emerald-600' },
    skill: { icon: <Target className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-600' },
  };

  const { icon, color } = icons[type] || icons.skill;

  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>{icon}</div>
  );
}

function GoalCard({
  title,
  progress,
  dueDate,
  category,
}: {
  title: string;
  progress: number;
  dueDate: string;
  category: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="neutral">{category}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">Due: {dueDate}</p>
        </div>
      </CardContent>
    </Card>
  );
}
