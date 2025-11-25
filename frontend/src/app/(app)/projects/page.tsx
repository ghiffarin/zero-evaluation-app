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
  FolderKanban,
  User,
  Briefcase,
  GraduationCap,
  Heart,
  DollarSign,
  MoreHorizontal,
  CheckCircle2,
  Pause,
  PlayCircle,
  Archive,
  Target,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  Code,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { formatDate } from '@/lib/utils';

// Types
interface Goal {
  id: string;
  title: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  goals?: Goal[];
  _count?: {
    skillSessions: number;
    careerActivities: number;
  };
}

interface ProjectWithActivities extends Project {
  skillSessions?: { id: string; date: string; timeSpentMin?: number }[];
  careerActivities?: { id: string; date: string; timeSpentMin?: number }[];
  stats?: {
    totalSkillSessions: number;
    totalCareerActivities: number;
    totalSkillMinutes: number;
    totalCareerMinutes: number;
    totalMinutes: number;
    goalsCount: number;
    goalsAchieved: number;
  };
}

const PROJECT_TYPES = [
  { value: 'personal', label: 'Personal', icon: User, color: 'text-blue-500' },
  { value: 'career', label: 'Career', icon: Briefcase, color: 'text-purple-500' },
  { value: 'academic', label: 'Academic', icon: GraduationCap, color: 'text-indigo-500' },
  { value: 'health', label: 'Health', icon: Heart, color: 'text-red-500' },
  { value: 'finance', label: 'Finance', icon: DollarSign, color: 'text-green-500' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'text-gray-500' },
] as const;

const PROJECT_STATUSES = [
  { value: 'active', label: 'Active', icon: PlayCircle, color: 'text-green-500' },
  { value: 'paused', label: 'Paused', icon: Pause, color: 'text-yellow-500' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-blue-500' },
  { value: 'archived', label: 'Archived', icon: Archive, color: 'text-gray-500' },
] as const;

export default function ProjectsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showModal, setShowModal] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [viewingProject, setViewingProject] = React.useState<ProjectWithActivities | null>(null);
  const [loadingDetails, setLoadingDetails] = React.useState(false);

  // Filters
  const [filterType, setFilterType] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedProject, setExpandedProject] = React.useState<string | null>(null);

  // Fetch data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const res = await api.projects.list({ limit: 100 });
        setProjects((res as any).data || []);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAuthenticated]);

  // Fetch project details
  const fetchProjectDetails = async (id: string) => {
    try {
      setLoadingDetails(true);
      const res = await api.projects.getWithActivities(id);
      setViewingProject((res as any).data || null);
    } catch (err) {
      console.error('Failed to fetch project details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    try {
      const res = await api.projects.list({ limit: 100 });
      setProjects((res as any).data || []);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  // CRUD handlers
  const handleCreate = async (data: Partial<Project>) => {
    try {
      const res = await api.projects.create(data);
      setProjects((prev) => [(res as any).data, ...prev]);
      setShowModal(false);
      refreshData();
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Project>) => {
    try {
      const res = await api.projects.update(id, data);
      setProjects((prev) => prev.map((p) => (p.id === id ? (res as any).data : p)));
      setEditingProject(null);
      setShowModal(false);
      refreshData();
    } catch (err) {
      console.error('Failed to update project:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This will not delete linked goals.')) return;
    try {
      await api.projects.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      refreshData();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesType = filterType === 'all' || project.type === filterType;
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  // Calculate stats
  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    paused: projects.filter((p) => p.status === 'paused').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    totalGoals: projects.reduce((sum, p) => sum + (p.goals?.length || 0), 0),
    totalActivities: projects.reduce((sum, p) => sum + (p._count?.skillSessions || 0) + (p._count?.careerActivities || 0), 0),
  };

  // Format minutes to hours and minutes
  function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

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
        title="Projects"
        description="Manage your personal and professional projects"
        actions={
          <Button
            onClick={() => {
              setEditingProject(null);
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        }
      />

      {/* Stats Overview */}
      {stats.total > 0 && (
        <PageSection title="Projects Overview">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Total Projects"
              value={stats.total.toString()}
              icon={<FolderKanban className="h-5 w-5" />}
            />
            <StatCard
              label="Active"
              value={stats.active.toString()}
              icon={<PlayCircle className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              label="Paused"
              value={stats.paused.toString()}
              icon={<Pause className="h-5 w-5" />}
              variant="warning"
            />
            <StatCard
              label="Completed"
              value={stats.completed.toString()}
              icon={<CheckCircle2 className="h-5 w-5" />}
              variant="info"
            />
            <StatCard
              label="Total Goals"
              value={stats.totalGoals.toString()}
              icon={<Target className="h-5 w-5" />}
            />
            <StatCard
              label="Activities"
              value={stats.totalActivities.toString()}
              icon={<Code className="h-5 w-5" />}
            />
          </div>
        </PageSection>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="all">All Types</option>
          {PROJECT_TYPES.map(({ value, label }) => (
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
          {PROJECT_STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {projects.length === 0 ? 'No projects yet.' : 'No projects match your filters.'}
            </p>
            {projects.length === 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setEditingProject(null);
                  setShowModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isExpanded={expandedProject === project.id}
              onToggleExpand={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
              onEdit={() => {
                setEditingProject(project);
                setShowModal(true);
              }}
              onDelete={() => handleDelete(project.id)}
              onView={() => fetchProjectDetails(project.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <ProjectModal
          project={editingProject}
          onClose={() => {
            setShowModal(false);
            setEditingProject(null);
          }}
          onSave={(data) => {
            if (editingProject) {
              handleUpdate(editingProject.id, data);
            } else {
              handleCreate(data);
            }
          }}
        />
      )}

      {/* View Details Modal */}
      {viewingProject && (
        <ProjectDetailsModal
          project={viewingProject}
          loading={loadingDetails}
          onClose={() => setViewingProject(null)}
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

function ProjectCard({
  project,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onView,
}: {
  project: Project;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const typeInfo = PROJECT_TYPES.find((t) => t.value === project.type);
  const TypeIcon = typeInfo?.icon || FolderKanban;
  const statusInfo = PROJECT_STATUSES.find((s) => s.value === project.status);
  const StatusIcon = statusInfo?.icon || PlayCircle;

  const goalsCount = project.goals?.length || 0;
  const goalsAchieved = project.goals?.filter((g) => g.status === 'achieved').length || 0;
  const activitiesCount = (project._count?.skillSessions || 0) + (project._count?.careerActivities || 0);

  return (
    <Card className="h-fit">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <TypeIcon className={`h-5 w-5 ${typeInfo?.color || 'text-primary'}`} />
            <h3 className="font-medium">{project.name}</h3>
          </div>
          <Badge
            variant={getStatusBadgeVariant(project.status)}
            className="text-xs flex items-center gap-1"
          >
            <StatusIcon className="h-3 w-3" />
            {statusInfo?.label || project.status}
          </Badge>
        </div>

        <Badge variant="neutral" className="text-xs mb-3">
          {typeInfo?.label || project.type}
        </Badge>

        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            {goalsAchieved}/{goalsCount} goals
          </span>
          <span className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            {activitiesCount} activities
          </span>
        </div>

        {/* Progress bar for goals */}
        {goalsCount > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Goals Progress</span>
              <span>{goalsCount > 0 ? Math.round((goalsAchieved / goalsCount) * 100) : 0}%</span>
            </div>
            <Progress value={goalsCount > 0 ? (goalsAchieved / goalsCount) * 100 : 0} className="h-1.5" />
          </div>
        )}

        {/* Expanded content */}
        {isExpanded && project.goals && project.goals.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <h4 className="text-sm font-medium mb-2">Goals</h4>
            <div className="space-y-1">
              {project.goals.slice(0, 5).map((goal) => (
                <div key={goal.id} className="flex items-center gap-2 text-sm">
                  {goal.status === 'achieved' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <Target className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className={goal.status === 'achieved' ? 'text-muted-foreground line-through' : ''}>
                    {goal.title}
                  </span>
                </div>
              ))}
              {project.goals.length > 5 && (
                <p className="text-xs text-muted-foreground">+{project.goals.length - 5} more</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 mt-3 pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={onView} title="View details">
            <Eye className="h-4 w-4" />
          </Button>
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
      </CardContent>
    </Card>
  );
}

function ProjectModal({
  project,
  onClose,
  onSave,
}: {
  project: Project | null;
  onClose: () => void;
  onSave: (data: Partial<Project>) => void;
}) {
  const [formData, setFormData] = React.useState({
    name: project?.name || '',
    description: project?.description || '',
    type: project?.type || 'personal',
    status: project?.status || 'active',
  });
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type,
      status: formData.status,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{project ? 'Edit Project' : 'New Project'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Project Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Awesome Project"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              placeholder="Describe your project..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                required
              >
                {PROJECT_TYPES.map(({ value, label }) => (
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
                {PROJECT_STATUSES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {project ? 'Update' : 'Create'} Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectDetailsModal({
  project,
  loading,
  onClose,
}: {
  project: ProjectWithActivities;
  loading: boolean;
  onClose: () => void;
}) {
  const typeInfo = PROJECT_TYPES.find((t) => t.value === project.type);
  const TypeIcon = typeInfo?.icon || FolderKanban;
  const statusInfo = PROJECT_STATUSES.find((s) => s.value === project.status);

  // Format minutes to hours and minutes
  function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <TypeIcon className={`h-5 w-5 ${typeInfo?.color || 'text-primary'}`} />
            <h2 className="text-lg font-semibold">{project.name}</h2>
            <Badge variant={getStatusBadgeVariant(project.status)} className="text-xs">
              {statusInfo?.label || project.status}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {project.description && (
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            )}

            {/* Stats */}
            {project.stats && (
              <div>
                <h3 className="text-sm font-medium mb-3">Statistics</h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="p-3 border rounded-md">
                    <p className="text-xs text-muted-foreground">Total Time</p>
                    <p className="text-lg font-semibold">{formatMinutes(project.stats.totalMinutes)}</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-xs text-muted-foreground">Goals</p>
                    <p className="text-lg font-semibold">
                      {project.stats.goalsAchieved}/{project.stats.goalsCount}
                    </p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-xs text-muted-foreground">Skill Sessions</p>
                    <p className="text-lg font-semibold">{project.stats.totalSkillSessions}</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-xs text-muted-foreground">Career Activities</p>
                    <p className="text-lg font-semibold">{project.stats.totalCareerActivities}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Goals */}
            {project.goals && project.goals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Goals ({project.goals.length})</h3>
                <div className="space-y-2">
                  {project.goals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-2 p-2 border rounded-md">
                      {goal.status === 'achieved' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Target className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={goal.status === 'achieved' ? 'text-muted-foreground' : ''}>
                        {goal.title}
                      </span>
                      <Badge variant={getStatusBadgeVariant(goal.status)} className="text-xs ml-auto">
                        {goal.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Skill Sessions */}
            {project.skillSessions && project.skillSessions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Recent Skill Sessions</h3>
                <div className="space-y-2">
                  {project.skillSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(new Date(session.date), { month: 'short', day: 'numeric' })}</span>
                      {session.timeSpentMin && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.timeSpentMin}m
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Career Activities */}
            {project.careerActivities && project.careerActivities.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Recent Career Activities</h3>
                <div className="space-y-2">
                  {project.careerActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(new Date(activity.date), { month: 'short', day: 'numeric' })}</span>
                      {activity.timeSpentMin && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.timeSpentMin}m
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground pt-4 border-t">
              Created: {formatDate(new Date(project.createdAt), { month: 'short', day: 'numeric', year: 'numeric' })}
              {' · '}
              Updated: {formatDate(new Date(project.updatedAt), { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'active':
    case 'achieved':
      return 'success';
    case 'paused':
    case 'in_progress':
      return 'warning';
    case 'completed':
      return 'info';
    case 'archived':
    case 'dropped':
      return 'neutral';
    default:
      return 'neutral';
  }
}
