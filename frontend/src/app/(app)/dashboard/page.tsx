'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { PageContainer, PageHeader, PageSection } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress } from '@/components/ui';
import {
  CalendarDays,
  Clock,
  Dumbbell,
  Heart,
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

// Theme-aware tooltip styles
const getTooltipStyles = (isDark: boolean) => ({
  contentStyle: {
    backgroundColor: isDark ? 'hsl(0 0% 12%)' : '#ffffff',
    border: `1px solid ${isDark ? 'hsl(0 0% 22%)' : '#e5e7eb'}`,
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  labelStyle: { color: isDark ? '#f5f5f5' : '#111827', fontWeight: 600 },
  itemStyle: { color: isDark ? '#d4d4d4' : '#374151' },
});

// Theme-aware chart colors
const getChartColors = (isDark: boolean) => ({
  gridStroke: isDark ? 'hsl(0 0% 25%)' : 'hsl(220 10% 88%)',
  axisColor: isDark ? 'hsl(0 0% 60%)' : 'hsl(220 10% 45%)',
});

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
  currentValue: number | null;
  dueDate: string | null;
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const today = new Date();
  const isDark = resolvedTheme === 'dark';
  const tooltipStyles = getTooltipStyles(isDark);
  const chartColors = getChartColors(isDark);

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

      {/* Charts Section */}
      <div className="space-y-4 mb-8">
        {/* Time Investment Chart - Full Width */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Time Investment</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData?.timeInvestment || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 10, fill: chartColors.axisColor }}
                    stroke={chartColors.gridStroke}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: chartColors.axisColor }}
                    stroke={chartColors.gridStroke}
                    width={30}
                  />
                  <Tooltip
                    cursor={false}
                    {...tooltipStyles}
                    content={({ active, payload }) => {
                      if (!active || !payload) return null;
                      const nonZeroItems = payload.filter((item: any) => item.value > 0);
                      if (nonZeroItems.length === 0) return null;
                      const total = nonZeroItems.reduce((sum: number, item: any) => sum + item.value, 0);
                      return (
                        <div style={{
                          ...tooltipStyles.contentStyle,
                          padding: '6px 8px',
                          fontSize: '10px',
                        }}>
                          <p style={{ ...tooltipStyles.labelStyle, marginBottom: '2px', fontSize: '10px' }}>
                            {payload[0]?.payload?.displayDate} - {total.toFixed(1)}h
                          </p>
                          {nonZeroItems.map((item: any, idx: number) => (
                            <p key={idx} style={{ ...tooltipStyles.itemStyle, margin: '1px 0', fontSize: '9px' }}>
                              <span style={{ color: item.fill }}>{item.name}</span>: {item.value.toFixed(1)}h
                            </p>
                          ))}
                        </div>
                      );
                    }}
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

        {/* 2 Charts Grid - Even 2 columns */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Wellness Trend */}
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm font-medium">Wellness Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData?.wellnessTrend || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                    <XAxis
                      dataKey="displayDate"
                      tick={{ fontSize: 9, fill: chartColors.axisColor }}
                      stroke={chartColors.gridStroke}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: chartColors.axisColor }}
                      stroke={chartColors.gridStroke}
                      width={20}
                      domain={[0, 8]}
                    />
                    <Tooltip
                      cursor={false}
                      {...tooltipStyles}
                      content={({ active, payload }) => {
                        if (!active || !payload) return null;
                        const nonZeroItems = payload.filter((item: any) => item.value != null && item.value > 0);
                        if (nonZeroItems.length === 0) return null;
                        return (
                          <div style={{
                            ...tooltipStyles.contentStyle,
                            padding: '6px 8px',
                            fontSize: '10px',
                          }}>
                            <p style={{ ...tooltipStyles.labelStyle, marginBottom: '2px', fontSize: '10px' }}>
                              {payload[0]?.payload?.displayDate}
                            </p>
                            {nonZeroItems.map((item: any, idx: number) => (
                              <p key={idx} style={{ ...tooltipStyles.itemStyle, margin: '1px 0', fontSize: '9px' }}>
                                <span style={{ color: item.stroke }}>{item.name}</span>: {item.value}
                              </p>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                    <Line
                      type="monotone"
                      dataKey="energy"
                      name="Energy"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 3 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="mood"
                      name="Mood"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', r: 3 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="stress"
                      name="Stress"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', r: 3 }}
                      connectNulls
                    />
                  </LineChart>
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
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 9, fill: chartColors.axisColor }}
                        stroke={chartColors.gridStroke}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: chartColors.axisColor }}
                        tickFormatter={(value) => `${value}h`}
                        stroke={chartColors.gridStroke}
                        width={25}
                      />
                      <Tooltip
                        cursor={false}
                        {...tooltipStyles}
                        content={({ active, payload }) => {
                          if (!active || !payload) return null;
                          const nonZeroItems = payload.filter((item: any) => item.value > 0);
                          if (nonZeroItems.length === 0) return null;
                          const total = nonZeroItems.reduce((sum: number, item: any) => sum + item.value, 0);
                          return (
                            <div style={{
                              ...tooltipStyles.contentStyle,
                              padding: '6px 8px',
                              fontSize: '10px',
                            }}>
                              <p style={{ ...tooltipStyles.labelStyle, marginBottom: '2px', fontSize: '10px' }}>
                                {payload[0]?.payload?.displayDate} - {total.toFixed(1)}h
                              </p>
                              {nonZeroItems.map((item: any, idx: number) => (
                                <p key={idx} style={{ ...tooltipStyles.itemStyle, margin: '1px 0', fontSize: '9px' }}>
                                  <span style={{ color: item.fill }}>{item.name}</span>: {item.value.toFixed(1)}h
                                </p>
                              ))}
                            </div>
                          );
                        }}
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
        </div>

        {/* Activity Heatmap */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Activity Heatmap</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
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
      </div>

      {/* Active Goals */}
      {goals.length > 0 && (
        <PageSection title="Active Goals">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                title={goal.title}
                progress={calculateGoalProgress(goal.currentValue, goal.targetValue)}
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
function calculateGoalProgress(currentValue: number | null, targetValue: number | null): number {
  if (!targetValue || targetValue === 0) return 0;
  const current = currentValue || 0;
  return Math.min(Math.round((current / targetValue) * 100), 100);
}

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
