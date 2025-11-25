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
  Loader2,
  Flame,
  Brain,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts';

// Types for API responses
interface TodaySummary {
  date: string;
  dailyLog: {
    moodScore: number | null;
    energyScore: number | null;
    sleepHours: number | null;
    workHours: number | null;
    learningHours: number | null;
  } | null;
  wellness: {
    sleepHours: number | null;
    sleepQuality: number | null;
    energyLevel: number | null;
    moodScore: number | null;
    wellnessScore: number | null;
  } | null;
  activities: {
    workoutSessions: number;
    workoutMinutes: number;
    skillSessions: number;
    skillMinutes: number;
    ieltsSessions: number;
    ieltsMinutes: number;
  };
  financial: {
    transactions: number;
    totalSpending: number;
  };
  completion: {
    hasDailyLog: boolean;
    hasWellness: boolean;
    hasReflection: boolean;
    hasWorkout: boolean;
  };
}

interface ChartData {
  period: { start: string; end: string; days: number };
  timeInvestment: Array<{
    date: string;
    displayDate: string;
    workout: number;
    learning: number;
    work: number;
  }>;
  wellnessTrend: Array<{
    date: string;
    displayDate: string;
    sleep: number | null;
    energy: number | null;
    mood: number | null;
    stress: number | null;
  }>;
  learningBreakdown: Array<{
    date: string;
    displayDate: string;
    ielts: number;
    skills: number;
    books: number;
    mastersPrep: number;
  }>;
  financialFlow: Array<{
    week: string;
    spending: number;
    income: number;
    investment: number;
  }>;
  activityHeatmap: Array<{
    date: string;
    day: number;
    weekday: number;
    intensity: number;
    level: number;
  }>;
  summary: {
    totalLearningHours: number;
    totalWorkoutHours: number;
    totalWorkHours: number;
    avgWellnessScore: number | null;
    daysTracked: number;
    streakDays: number;
  };
}

interface Goal {
  id: string;
  title: string;
  category: string;
  status: string;
  targetValue: number | null;
  dueDate: string | null;
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const today = new Date();

  const [todaySummary, setTodaySummary] = React.useState<TodaySummary | null>(null);
  const [chartData, setChartData] = React.useState<ChartData | null>(null);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [todayRes, chartsRes, goalsRes] = await Promise.all([
          api.dashboard.today(),
          api.dashboard.charts(14),
          api.goals.list({ limit: 6, status: 'in_progress' }),
        ]);

        setTodaySummary(todayRes.data as TodaySummary);
        setChartData(chartsRes.data as ChartData);
        setGoals((goalsRes as any).data || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [authLoading, isAuthenticated]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </PageContainer>
    );
  }

  const getEnergyLabel = (level: number | null | undefined): string => {
    if (!level) return 'N/A';
    if (level >= 4) return 'High';
    if (level >= 3) return 'Medium';
    return 'Low';
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Good ${getGreeting()}, ${user?.name?.split(' ')[0] || 'there'}!`}
        description={formatDate(today, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      />

      {/* Quick Actions */}
      <PageSection title="Quick Actions">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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

      {/* Summary Stats */}
      <PageSection title="Overview (Last 14 Days)">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <SummaryCard
            icon={<Brain className="h-5 w-5" />}
            label="Learning"
            value={`${chartData?.summary.totalLearningHours || 0}h`}
            color="text-blue-500"
          />
          <SummaryCard
            icon={<Dumbbell className="h-5 w-5" />}
            label="Workout"
            value={`${chartData?.summary.totalWorkoutHours || 0}h`}
            color="text-emerald-500"
          />
          <SummaryCard
            icon={<Clock className="h-5 w-5" />}
            label="Work"
            value={`${chartData?.summary.totalWorkHours || 0}h`}
            color="text-purple-500"
          />
          <SummaryCard
            icon={<Heart className="h-5 w-5" />}
            label="Avg Wellness"
            value={chartData?.summary.avgWellnessScore ? `${chartData.summary.avgWellnessScore}/5` : 'N/A'}
            color="text-rose-500"
          />
          <SummaryCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Days Tracked"
            value={`${chartData?.summary.daysTracked || 0}`}
            color="text-amber-500"
          />
          <SummaryCard
            icon={<Flame className="h-5 w-5" />}
            label="Streak"
            value={`${chartData?.summary.streakDays || 0} days`}
            color="text-orange-500"
          />
        </div>
      </PageSection>

      {/* Time Investment Chart - Full Width */}
      <Card>
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm font-medium">Time Investment</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.timeInvestment || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                  itemStyle={{ color: '#374151' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="workout" name="Workout" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="learning" name="Learning" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="work" name="Work" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3 Charts Grid - Even 3 columns */}
      <div className="grid gap-3 md:grid-cols-3">
        {/* Wellness Trend */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Wellness Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData?.wellnessTrend || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 9 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 9 }}
                    className="text-muted-foreground"
                    width={20}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }}
                    labelStyle={{ color: '#111827', fontWeight: 600 }}
                    itemStyle={{ color: '#374151' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '9px' }} />
                  <Bar dataKey="energy" name="Energy" stackId="wellness" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="mood" name="Mood" stackId="wellness" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="stress" name="Stress" stackId="wellness" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Learning Breakdown */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Learning Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-[180px]">
              {chartData?.learningBreakdown && chartData.learningBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.learningBreakdown} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="displayDate"
                      tick={{ fontSize: 9 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 9 }}
                      tickFormatter={(value) => `${value}h`}
                      className="text-muted-foreground"
                      width={25}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}h`, '']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      }}
                      labelStyle={{ color: '#111827', fontWeight: 600 }}
                      itemStyle={{ color: '#374151' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                    <Bar dataKey="ielts" name="IELTS" stackId="learning" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="skills" name="Skills" stackId="learning" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="books" name="Books" stackId="learning" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="mastersPrep" name="Masters Prep" stackId="learning" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No learning data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Flow */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Financial Flow</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData?.financialFlow || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 9 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 9 }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    className="text-muted-foreground"
                    width={25}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value),
                      ''
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }}
                    labelStyle={{ color: '#111827', fontWeight: 600 }}
                    itemStyle={{ color: '#374151' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '9px' }} />
                  <Bar dataKey="income" name="Income" stackId="financial" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="investment" name="Investment" stackId="financial" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="spending"
                    name="Spending"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <PageSection title="Activity Heatmap">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-1">
              {chartData?.activityHeatmap.map((day) => (
                <div
                  key={day.date}
                  className={`h-8 w-8 rounded-sm ${getHeatmapColor(day.level)} cursor-pointer transition-all hover:ring-2 hover:ring-primary`}
                  title={`${day.date}: ${day.intensity} active modules`}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="h-4 w-4 rounded-sm bg-muted" />
                <div className="h-4 w-4 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
                <div className="h-4 w-4 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
                <div className="h-4 w-4 rounded-sm bg-emerald-500 dark:bg-emerald-500" />
                <div className="h-4 w-4 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
              </div>
              <span>More</span>
            </div>
          </CardContent>
        </Card>
      </PageSection>

      {/* Today's Summary and Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Summary */}
        <PageSection title="Today's Status">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Mood"
              value={todaySummary?.dailyLog?.moodScore ? `${todaySummary.dailyLog.moodScore}/5` : 'N/A'}
              color="text-amber-500"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Work Hours"
              value={todaySummary?.dailyLog?.workHours ? `${todaySummary.dailyLog.workHours}h` : 'N/A'}
              color="text-blue-500"
            />
            <StatCard
              icon={<Heart className="h-5 w-5" />}
              label="Energy"
              value={getEnergyLabel(todaySummary?.wellness?.energyLevel || todaySummary?.dailyLog?.energyScore)}
              color="text-rose-500"
            />
            <StatCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Sleep"
              value={todaySummary?.wellness?.sleepHours || todaySummary?.dailyLog?.sleepHours ?
                `${todaySummary?.wellness?.sleepHours || todaySummary?.dailyLog?.sleepHours}h` : 'N/A'}
              color="text-purple-500"
            />
          </div>
        </PageSection>

        {/* Today's Checklist */}
        <PageSection title="Today's Checklist">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <ChecklistItem
                  label="Daily Log"
                  completed={todaySummary?.completion.hasDailyLog || false}
                  href="/daily-log"
                />
                <ChecklistItem
                  label="Wellness Entry"
                  completed={todaySummary?.completion.hasWellness || false}
                  href="/wellness"
                />
                <ChecklistItem
                  label="Reflection"
                  completed={todaySummary?.completion.hasReflection || false}
                  href="/reflections"
                />
                <ChecklistItem
                  label="Workout"
                  completed={todaySummary?.completion.hasWorkout || false}
                  href="/workouts"
                />
              </div>
            </CardContent>
          </Card>
        </PageSection>
      </div>

      {/* Active Goals */}
      {goals.length > 0 && (
        <PageSection title="Active Goals">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                title={goal.title}
                progress={0}
                dueDate={goal.dueDate ? formatDate(new Date(goal.dueDate), { month: 'short', year: 'numeric' }) : 'No deadline'}
                category={goal.category}
              />
            ))}
          </div>
        </PageSection>
      )}
    </PageContainer>
  );
}

// Helper functions and components
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function getHeatmapColor(level: number): string {
  switch (level) {
    case 0: return 'bg-muted';
    case 1: return 'bg-emerald-200 dark:bg-emerald-900';
    case 2: return 'bg-emerald-400 dark:bg-emerald-700';
    case 3: return 'bg-emerald-500 dark:bg-emerald-500';
    case 4: return 'bg-emerald-600 dark:bg-emerald-400';
    default: return 'bg-muted';
  }
}

function SummaryCard({
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
        <div className="flex flex-col items-center text-center gap-2">
          <div className={`${color}`}>{icon}</div>
          <div>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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

function ChecklistItem({
  label,
  completed,
  href,
}: {
  label: string;
  completed: boolean;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
            completed
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-muted-foreground'
          }`}
        >
          {completed && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className={completed ? 'text-muted-foreground line-through' : ''}>{label}</span>
      </div>
      {!completed && (
        <Badge variant="warning">Pending</Badge>
      )}
    </a>
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
