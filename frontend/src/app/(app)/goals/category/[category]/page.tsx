'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageContainer, PageHeader, PageSection } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Progress,
} from '@/components/ui';
import {
  ArrowLeft,
  Plus,
  Loader2,
  Search,
  Trash2,
  Edit,
  X,
  Target,
  Dumbbell,
  DollarSign,
  GraduationCap,
  Briefcase,
  Heart,
  Code,
  MoreHorizontal,
  Calendar,
  CheckCircle2,
  Circle,
  PlayCircle,
  XCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  PlusCircle,
  History,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { formatDate, getTodayISO } from '@/lib/utils';

// Types
interface GoalProgress {
  id: string;
  date: string;
  value: number;
  note?: string;
  createdAt: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  dueDate?: string;
  status: string;
  projectId?: string;
  project?: { id: string; name: string };
  progressEntries?: GoalProgress[];
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
}

const CATEGORIES = [
  { value: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'text-red-500', bgColor: 'bg-red-500' },
  { value: 'finance', label: 'Finance', icon: DollarSign, color: 'text-green-500', bgColor: 'bg-green-500' },
  { value: 'learning', label: 'Learning', icon: GraduationCap, color: 'text-blue-500', bgColor: 'bg-blue-500' },
  { value: 'career', label: 'Career', icon: Briefcase, color: 'text-purple-500', bgColor: 'bg-purple-500' },
  { value: 'masters', label: "Master's", icon: GraduationCap, color: 'text-indigo-500', bgColor: 'bg-indigo-500' },
  { value: 'wellness', label: 'Wellness', icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-500' },
  { value: 'skill', label: 'Skill', icon: Code, color: 'text-orange-500', bgColor: 'bg-orange-500' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'text-gray-500', bgColor: 'bg-gray-500' },
] as const;

const STATUSES = [
  { value: 'not_started', label: 'Not Started', icon: Circle, color: 'text-gray-500' },
  { value: 'in_progress', label: 'In Progress', icon: PlayCircle, color: 'text-blue-500' },
  { value: 'achieved', label: 'Achieved', icon: CheckCircle2, color: 'text-green-500' },
  { value: 'dropped', label: 'Dropped', icon: XCircle, color: 'text-red-500' },
] as const;

const PIE_COLORS = ['#22c55e', '#3b82f6', '#6b7280', '#ef4444'];

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showModal, setShowModal] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const [showProgressModal, setShowProgressModal] = React.useState(false);
  const [progressGoal, setProgressGoal] = React.useState<Goal | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedGoal, setExpandedGoal] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<'created' | 'due' | 'progress'>('created');

  const categoryInfo = CATEGORIES.find((c) => c.value === category);
  const CategoryIcon = categoryInfo?.icon || Target;

  // Fetch data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [goalsRes, projectsRes] = await Promise.all([
          api.goals.list({ limit: 100, category }),
          api.projects.list({ limit: 100 }),
        ]);
        setGoals((goalsRes as any).data || []);
        setProjects((projectsRes as any).data || []);
      } catch (err) {
        console.error('Failed to fetch goals data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAuthenticated, category]);

  // Refresh data
  const refreshData = async () => {
    try {
      const goalsRes = await api.goals.list({ limit: 100, category });
      setGoals((goalsRes as any).data || []);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  // CRUD handlers
  const handleCreate = async (data: Partial<Goal>) => {
    try {
      await api.goals.create({ ...data, category });
      setShowModal(false);
      refreshData();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Goal>) => {
    try {
      await api.goals.update(id, data);
      setEditingGoal(null);
      setShowModal(false);
      refreshData();
    } catch (err) {
      console.error('Failed to update goal:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await api.goals.delete(id);
      refreshData();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  // Progress handlers
  const handleAddProgress = async (goalId: string, data: { date: string; value: number; note?: string }) => {
    try {
      await api.goals.progress.add(goalId, data);
      setShowProgressModal(false);
      setProgressGoal(null);
      refreshData();
    } catch (err) {
      console.error('Failed to add progress:', err);
    }
  };

  const handleDeleteProgress = async (progressId: string) => {
    if (!confirm('Delete this progress entry?')) return;
    try {
      await api.goals.progress.delete(progressId);
      refreshData();
    } catch (err) {
      console.error('Failed to delete progress:', err);
    }
  };

  // Compute statistics
  const stats = React.useMemo(() => {
    const total = goals.length;
    const achieved = goals.filter((g) => g.status === 'achieved').length;
    const inProgress = goals.filter((g) => g.status === 'in_progress').length;
    const notStarted = goals.filter((g) => g.status === 'not_started').length;
    const dropped = goals.filter((g) => g.status === 'dropped').length;

    const goalsWithProgress = goals.filter((g) => g.targetValue && g.targetValue > 0);
    const avgProgress = goalsWithProgress.length > 0
      ? goalsWithProgress.reduce((sum, g) => {
          const progress = ((g.currentValue || 0) / g.targetValue!) * 100;
          return sum + Math.min(progress, 100);
        }, 0) / goalsWithProgress.length
      : 0;

    const successRate = total > 0 ? (achieved / total) * 100 : 0;

    return { total, achieved, inProgress, notStarted, dropped, avgProgress, successRate };
  }, [goals]);

  // Status distribution for pie chart
  const statusDistribution = React.useMemo(() => [
    { name: 'Achieved', value: stats.achieved, color: '#22c55e' },
    { name: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
    { name: 'Not Started', value: stats.notStarted, color: '#6b7280' },
    { name: 'Dropped', value: stats.dropped, color: '#ef4444' },
  ].filter((d) => d.value > 0), [stats]);

  // Progress per goal for bar chart
  const progressPerGoal = React.useMemo(() => {
    return goals
      .filter((g) => g.targetValue && g.targetValue > 0)
      .map((g) => ({
        name: g.title.length > 15 ? g.title.substring(0, 15) + '...' : g.title,
        progress: Math.min(((g.currentValue || 0) / g.targetValue!) * 100, 100),
        status: g.status,
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 10);
  }, [goals]);

  // Progress over time (aggregate all progress entries)
  const progressOverTime = React.useMemo(() => {
    const entries: { date: string; value: number }[] = [];
    goals.forEach((goal) => {
      goal.progressEntries?.forEach((entry) => {
        entries.push({ date: entry.date, value: entry.value });
      });
    });

    // Group by date and sum
    const grouped = entries.reduce((acc, entry) => {
      const date = entry.date.split('T')[0];
      acc[date] = (acc[date] || 0) + entry.value;
      return acc;
    }, {} as Record<string, number>);

    // Sort by date and calculate cumulative
    const sorted = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30);

    let cumulative = 0;
    return sorted.map(([date, value]) => {
      cumulative += value;
      return {
        date: formatDate(new Date(date), { month: 'short', day: 'numeric' }),
        daily: value,
        cumulative,
      };
    });
  }, [goals]);

  // Filter and sort goals
  const filteredGoals = React.useMemo(() => {
    let filtered = goals.filter((goal) => {
      const matchesStatus = filterStatus === 'all' || goal.status === filterStatus;
      const matchesSearch =
        !searchQuery ||
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'progress':
          const progressA = a.targetValue ? ((a.currentValue || 0) / a.targetValue) * 100 : 0;
          const progressB = b.targetValue ? ((b.currentValue || 0) / b.targetValue) * 100 : 0;
          return progressB - progressA;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [goals, filterStatus, searchQuery, sortBy]);

  // Chart tooltip styles
  const tooltipStyles = {
    contentStyle: {
      backgroundColor: isDark ? 'hsl(0 0% 12%)' : '#ffffff',
      border: `1px solid ${isDark ? 'hsl(0 0% 22%)' : '#e5e7eb'}`,
      borderRadius: '8px',
    },
    labelStyle: { color: isDark ? '#f5f5f5' : '#111827', fontWeight: 600 },
    itemStyle: { color: isDark ? '#d4d4d4' : '#374151' },
  };

  const chartColors = {
    gridStroke: isDark ? 'hsl(0 0% 25%)' : 'hsl(220 10% 88%)',
    axisColor: isDark ? 'hsl(0 0% 60%)' : 'hsl(220 10% 45%)',
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (!categoryInfo) {
    return (
      <PageContainer>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Category not found</p>
          <Link href="/goals">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Goals
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/goals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-lg ${categoryInfo.bgColor}/10`}>
            <CategoryIcon className={`h-6 w-6 ${categoryInfo.color}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{categoryInfo.label} Goals</h1>
            <p className="text-sm text-muted-foreground">
              {stats.total} goals &bull; {stats.achieved} achieved
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingGoal(null);
            setShowModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6 mb-6">
        <StatCard
          label="Total Goals"
          value={stats.total.toString()}
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          label="Achieved"
          value={stats.achieved.toString()}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress.toString()}
          icon={<PlayCircle className="h-5 w-5" />}
          variant="info"
        />
        <StatCard
          label="Not Started"
          value={stats.notStarted.toString()}
          icon={<Circle className="h-5 w-5" />}
        />
        <StatCard
          label="Avg Progress"
          value={`${stats.avgProgress.toFixed(0)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant={stats.avgProgress >= 50 ? 'success' : 'warning'}
        />
        <StatCard
          label="Success Rate"
          value={`${stats.successRate.toFixed(0)}%`}
          icon={<BarChart3 className="h-5 w-5" />}
          variant={stats.successRate >= 50 ? 'success' : 'warning'}
        />
      </div>

      {/* Charts */}
      {goals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {/* Status Distribution Pie */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-[200px]">
                {statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        {...tooltipStyles}
                        formatter={(value: number, name: string) => [`${value} goals`, name]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px' }}
                        formatter={(value) => <span className="text-xs">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                    No data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress per Goal Bar */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Progress by Goal</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-[200px]">
                {progressPerGoal.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressPerGoal} layout="vertical" margin={{ left: 0, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: chartColors.axisColor }}
                        stroke={chartColors.gridStroke}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 9, fill: chartColors.axisColor }}
                        stroke={chartColors.gridStroke}
                        width={80}
                      />
                      <Tooltip
                        {...tooltipStyles}
                        formatter={(value: number) => [`${value.toFixed(0)}%`, 'Progress']}
                      />
                      <Bar dataKey="progress" fill={categoryInfo.bgColor.replace('bg-', '#').replace('-500', '')} radius={[0, 4, 4, 0]}>
                        {progressPerGoal.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.status === 'achieved' ? '#22c55e' :
                              entry.status === 'in_progress' ? '#3b82f6' :
                              '#6b7280'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                    No goals with targets
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Over Time Line */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Progress Over Time</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-[200px]">
                {progressOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressOverTime} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fill: chartColors.axisColor }}
                        stroke={chartColors.gridStroke}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: chartColors.axisColor }}
                        stroke={chartColors.gridStroke}
                        width={30}
                      />
                      <Tooltip {...tooltipStyles} />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        name="Cumulative"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Bar dataKey="daily" name="Daily" fill="#10b981" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                    No progress entries
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="all">All Status</option>
          {STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="created">Sort by Created</option>
          <option value="due">Sort by Due Date</option>
          <option value="progress">Sort by Progress</option>
        </select>
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {goals.length === 0 ? `No ${categoryInfo.label.toLowerCase()} goals yet.` : 'No goals match your filters.'}
            </p>
            {goals.length === 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setEditingGoal(null);
                  setShowModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First {categoryInfo.label} Goal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              isExpanded={expandedGoal === goal.id}
              onToggleExpand={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
              onEdit={() => {
                setEditingGoal(goal);
                setShowModal(true);
              }}
              onDelete={() => handleDelete(goal.id)}
              onAddProgress={() => {
                setProgressGoal(goal);
                setShowProgressModal(true);
              }}
              onDeleteProgress={handleDeleteProgress}
            />
          ))}
        </div>
      )}

      {/* Goal Modal */}
      {showModal && (
        <GoalModal
          goal={editingGoal}
          category={category}
          projects={projects}
          onClose={() => {
            setShowModal(false);
            setEditingGoal(null);
          }}
          onSave={(data) => {
            if (editingGoal) {
              handleUpdate(editingGoal.id, data);
            } else {
              handleCreate(data);
            }
          }}
        />
      )}

      {/* Progress Modal */}
      {showProgressModal && progressGoal && (
        <ProgressModal
          goal={progressGoal}
          onClose={() => {
            setShowProgressModal(false);
            setProgressGoal(null);
          }}
          onSave={(data) => handleAddProgress(progressGoal.id, data)}
        />
      )}
    </PageContainer>
  );
}

// Helper Components
function StatCard({
  label,
  value,
  icon,
  variant = 'neutral',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant?: 'success' | 'error' | 'info' | 'warning' | 'neutral';
}) {
  const colorClass = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-yellow-500',
    neutral: 'text-primary',
  }[variant];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={colorClass}>{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GoalCard({
  goal,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddProgress,
  onDeleteProgress,
}: {
  goal: Goal;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddProgress: () => void;
  onDeleteProgress: (id: string) => void;
}) {
  const categoryInfo = CATEGORIES.find((c) => c.value === goal.category);
  const CategoryIcon = categoryInfo?.icon || Target;
  const statusInfo = STATUSES.find((s) => s.value === goal.status);
  const StatusIcon = statusInfo?.icon || Circle;

  const isOverdue = goal.dueDate && new Date(goal.dueDate) < new Date() && goal.status !== 'achieved';
  const progressPercent = goal.targetValue && goal.currentValue
    ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
    : 0;

  return (
    <Card className={isOverdue ? 'border-red-200' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryIcon className={`h-4 w-4 ${categoryInfo?.color || 'text-primary'}`} />
              <span className="font-medium">{goal.title}</span>
              <Badge
                variant={getStatusBadgeVariant(goal.status)}
                className="text-xs flex items-center gap-1"
              >
                <StatusIcon className="h-3 w-3" />
                {statusInfo?.label || goal.status}
              </Badge>
              {isOverdue && (
                <Badge variant="error" className="text-xs">
                  Overdue
                </Badge>
              )}
            </div>

            {goal.targetValue && (
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {goal.currentValue || 0} / {goal.targetValue} {goal.unit || ''}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {progressPercent.toFixed(0)}% complete
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
              {goal.dueDate && (
                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                  <Calendar className="h-3 w-3" />
                  Due: {formatDate(new Date(goal.dueDate), { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              {goal.project && (
                <span className="flex items-center gap-1">
                  <FolderKanban className="h-3 w-3" />
                  {goal.project.name}
                </span>
              )}
              {goal.progressEntries && goal.progressEntries.length > 0 && (
                <span className="flex items-center gap-1">
                  <History className="h-3 w-3" />
                  {goal.progressEntries.length} entries
                </span>
              )}
            </div>

            {goal.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
            )}

            {isExpanded && (
              <div className="mt-4 space-y-3 border-t pt-4">
                {goal.description && (
                  <div>
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{goal.description}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Progress History
                    </h4>
                    <Button variant="outline" size="sm" onClick={onAddProgress}>
                      <PlusCircle className="h-3 w-3 mr-1" />
                      Add Progress
                    </Button>
                  </div>

                  {goal.progressEntries && goal.progressEntries.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {goal.progressEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">
                              {formatDate(new Date(entry.date), { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="font-medium text-green-600">+{entry.value} {goal.unit || ''}</span>
                            {entry.note && <span className="text-muted-foreground">- {entry.note}</span>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteProgress(entry.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No progress entries yet.
                    </p>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Created: {formatDate(new Date(goal.createdAt), { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-1 ml-2">
            {goal.targetValue && (
              <Button variant="ghost" size="sm" onClick={onAddProgress} title="Add Progress">
                <PlusCircle className="h-4 w-4 text-green-600" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onToggleExpand}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GoalModal({
  goal,
  category,
  projects,
  onClose,
  onSave,
}: {
  goal: Goal | null;
  category: string;
  projects: Project[];
  onClose: () => void;
  onSave: (data: Partial<Goal>) => void;
}) {
  const [formData, setFormData] = React.useState({
    title: goal?.title || '',
    description: goal?.description || '',
    category: goal?.category || category,
    targetValue: goal?.targetValue || '',
    currentValue: goal?.currentValue || '',
    unit: goal?.unit || '',
    dueDate: goal?.dueDate ? new Date(goal.dueDate).toISOString().split('T')[0] : '',
    status: goal?.status || 'not_started',
    projectId: goal?.projectId || '',
  });
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      title: formData.title,
      description: formData.description || undefined,
      category: formData.category,
      targetValue: formData.targetValue ? Number(formData.targetValue) : undefined,
      currentValue: formData.currentValue ? Number(formData.currentValue) : undefined,
      unit: formData.unit || undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      status: formData.status,
      projectId: formData.projectId || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{goal ? 'Edit Goal' : 'New Goal'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Goal Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What do you want to achieve?"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              placeholder="Describe your goal in detail..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                disabled
              >
                {CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                required
              >
                {STATUSES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Target Value</label>
              <Input
                type="number"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                placeholder="e.g., 100"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Current Value</label>
              <Input
                type="number"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                placeholder="e.g., 25"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Unit</label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., kg"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Due Date</label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          {projects.length > 0 && (
            <div>
              <label className="text-sm font-medium">Link to Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {goal ? 'Update' : 'Create'} Goal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProgressModal({
  goal,
  onClose,
  onSave,
}: {
  goal: Goal;
  onClose: () => void;
  onSave: (data: { date: string; value: number; note?: string }) => void;
}) {
  const [formData, setFormData] = React.useState({
    date: getTodayISO(),
    value: '',
    note: '',
  });
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.value) return;
    setSaving(true);
    await onSave({
      date: formData.date,
      value: Number(formData.value),
      note: formData.note || undefined,
    });
    setSaving(false);
  };

  const remaining = goal.targetValue ? goal.targetValue - (goal.currentValue || 0) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Add Progress</h2>
            <p className="text-sm text-muted-foreground">{goal.title}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {goal.targetValue && (
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="flex justify-between text-sm mb-2">
                <span>Current Progress</span>
                <span className="font-medium">
                  {goal.currentValue || 0} / {goal.targetValue} {goal.unit || ''}
                </span>
              </div>
              <Progress
                value={goal.targetValue ? ((goal.currentValue || 0) / goal.targetValue) * 100 : 0}
                className="h-2"
              />
              {remaining !== null && remaining > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {remaining} {goal.unit || ''} remaining to reach your goal
                </p>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Date *</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Progress Value *</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={`Enter amount (${goal.unit || 'units'})`}
                required
                step="any"
              />
              {goal.unit && <span className="text-sm text-muted-foreground">{goal.unit}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This will be added to your current progress
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Note (optional)</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              placeholder="Add a note about this progress..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.value}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Progress
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'achieved':
      return 'success';
    case 'dropped':
      return 'error';
    case 'in_progress':
      return 'info';
    default:
      return 'neutral';
  }
}
