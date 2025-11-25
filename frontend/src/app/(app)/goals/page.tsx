'use client';

import * as React from 'react';
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
  Flag,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  PlusCircle,
  History,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
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

interface GoalStats {
  total: number;
  achieved: number;
  inProgress: number;
  notStarted: number;
  dropped: number;
  successRate: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, {
    total: number;
    achieved: number;
    inProgress: number;
  }>;
}

interface Project {
  id: string;
  name: string;
}

const CATEGORIES = [
  { value: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'text-red-500' },
  { value: 'finance', label: 'Finance', icon: DollarSign, color: 'text-green-500' },
  { value: 'learning', label: 'Learning', icon: GraduationCap, color: 'text-blue-500' },
  { value: 'career', label: 'Career', icon: Briefcase, color: 'text-purple-500' },
  { value: 'masters', label: "Master's", icon: GraduationCap, color: 'text-indigo-500' },
  { value: 'wellness', label: 'Wellness', icon: Heart, color: 'text-pink-500' },
  { value: 'skill', label: 'Skill', icon: Code, color: 'text-orange-500' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'text-gray-500' },
] as const;

const STATUSES = [
  { value: 'not_started', label: 'Not Started', icon: Circle, color: 'text-gray-500' },
  { value: 'in_progress', label: 'In Progress', icon: PlayCircle, color: 'text-blue-500' },
  { value: 'achieved', label: 'Achieved', icon: CheckCircle2, color: 'text-green-500' },
  { value: 'dropped', label: 'Dropped', icon: XCircle, color: 'text-red-500' },
] as const;

export default function GoalsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [stats, setStats] = React.useState<GoalStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showModal, setShowModal] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const [showProgressModal, setShowProgressModal] = React.useState(false);
  const [progressGoal, setProgressGoal] = React.useState<Goal | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedGoal, setExpandedGoal] = React.useState<string | null>(null);

  // Fetch data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [goalsRes, statsRes, projectsRes] = await Promise.all([
          api.goals.list({ limit: 100 }),
          api.goals.stats(),
          api.projects.list({ limit: 100 }),
        ]);
        setGoals((goalsRes as any).data || []);
        setStats((statsRes as any).data || null);
        setProjects((projectsRes as any).data || []);
      } catch (err) {
        console.error('Failed to fetch goals data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAuthenticated]);

  // Refresh stats
  const refreshData = async () => {
    try {
      const [goalsRes, statsRes] = await Promise.all([
        api.goals.list({ limit: 100 }),
        api.goals.stats(),
      ]);
      setGoals((goalsRes as any).data || []);
      setStats((statsRes as any).data || null);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  // CRUD handlers
  const handleCreate = async (data: Partial<Goal>) => {
    try {
      const res = await api.goals.create(data);
      setGoals((prev) => [(res as any).data, ...prev]);
      setShowModal(false);
      refreshData();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Goal>) => {
    try {
      const res = await api.goals.update(id, data);
      setGoals((prev) => prev.map((g) => (g.id === id ? (res as any).data : g)));
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
      setGoals((prev) => prev.filter((g) => g.id !== id));
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

  // Filter goals
  const filteredGoals = goals.filter((goal) => {
    const matchesCategory = filterCategory === 'all' || goal.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || goal.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <PageContainer>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Goals"
        description="Set and track your personal goals with progress tracking"
        actions={
          <Button
            onClick={() => {
              setEditingGoal(null);
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
        }
      />

      {/* Stats Overview */}
      {stats && stats.total > 0 && (
        <PageSection title="Goals Overview">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
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
              label="Dropped"
              value={stats.dropped.toString()}
              icon={<XCircle className="h-5 w-5" />}
              variant="error"
            />
            <StatCard
              label="Success Rate"
              value={`${stats.successRate.toFixed(0)}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              variant={stats.successRate >= 50 ? 'success' : 'warning'}
            />
          </div>

          {/* Category breakdown */}
          {Object.keys(stats.byCategory).length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Goals by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {CATEGORIES.filter((cat) => stats.byCategory[cat.value]).map(({ value, label, icon: Icon, color }) => {
                    const catStats = stats.byCategory[value];
                    if (!catStats) return null;
                    const achievedPercent = catStats.total > 0 ? (catStats.achieved / catStats.total) * 100 : 0;
                    return (
                      <div key={value} className="p-3 border rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`h-4 w-4 ${color}`} />
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <p className="text-lg font-semibold">{catStats.total} goals</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{catStats.achieved} achieved</span>
                            <span>{achievedPercent.toFixed(0)}%</span>
                          </div>
                          <Progress value={achievedPercent} className="h-1.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </PageSection>
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
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
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
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {goals.length === 0 ? 'No goals set yet.' : 'No goals match your filters.'}
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
                Create Your First Goal
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
              <Badge variant="neutral" className="text-xs">
                {categoryInfo?.label || goal.category}
              </Badge>
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

            {/* Progress Bar - Show if target value exists */}
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

            {/* Expanded content - Progress History */}
            {isExpanded && (
              <div className="mt-4 space-y-3 border-t pt-4">
                {goal.description && (
                  <div>
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{goal.description}</p>
                  </div>
                )}

                {/* Progress History */}
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
                      No progress entries yet. Click "Add Progress" to log your first entry.
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
  projects,
  onClose,
  onSave,
}: {
  goal: Goal | null;
  projects: Project[];
  onClose: () => void;
  onSave: (data: Partial<Goal>) => void;
}) {
  const [formData, setFormData] = React.useState({
    title: goal?.title || '',
    description: goal?.description || '',
    category: goal?.category || 'learning',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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
              <label className="text-sm font-medium">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                required
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
                placeholder="e.g., kg, books"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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
          {/* Current Progress Summary */}
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

// Helper functions
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
