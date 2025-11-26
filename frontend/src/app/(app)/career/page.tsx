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
  Briefcase,
  FileText,
  Users,
  Linkedin,
  GraduationCap,
  Lightbulb,
  Building,
  Award,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { formatDate, toLocalDateString } from '@/lib/utils';

// Types
interface CareerActivity {
  id: string;
  date: string;
  activityType: string;
  subcategory?: string;
  targetEntity?: string;
  projectId?: string;
  timeSpentMin?: number;
  description?: string;
  outputSummary?: string;
  outputLink?: string;
  pipelineStage?: string;
  priority?: number;
  confidence?: number;
  careerImpact?: number;
  nextStep?: string;
  notes?: string;
  project?: { id: string; name: string };
}

interface JobApplication {
  id: string;
  company: string;
  roleTitle: string;
  link?: string;
  status: string;
  contactName?: string;
  contactEmail?: string;
  appliedDate?: string;
  expectedResponse?: string;
  salary?: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

interface CareerStats {
  activities: {
    total: number;
    totalMinutes: number;
    byType: Record<string, { count: number; totalMinutes: number }>;
    averageCareerImpact: number | null;
  };
  applications: {
    total: number;
    active: number;
    offers: number;
    rejected: number;
    successRate: number;
    byStatus: Record<string, number>;
  };
}

type Pipeline = Record<string, JobApplication[]>;

const ACTIVITY_TYPES = [
  { value: 'job_application', label: 'Job Application', icon: Send },
  { value: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { value: 'cv', label: 'CV/Resume', icon: FileText },
  { value: 'cover_letter', label: 'Cover Letter', icon: FileText },
  { value: 'networking', label: 'Networking', icon: Users },
  { value: 'linkedin_post', label: 'LinkedIn Post', icon: Linkedin },
  { value: 'learning', label: 'Learning', icon: GraduationCap },
  { value: 'interview_prep', label: 'Interview Prep', icon: MessageSquare },
  { value: 'company_research', label: 'Company Research', icon: Building },
  { value: 'strategy', label: 'Strategy', icon: Lightbulb },
  { value: 'certification', label: 'Certification', icon: Award },
  { value: 'other', label: 'Other', icon: Briefcase },
] as const;

const PIPELINE_STAGES = [
  { value: 'not_applicable', label: 'N/A' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'interview', label: 'Interview' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'completed', label: 'Completed' },
] as const;

const APPLICATION_STATUSES = [
  { value: 'draft', label: 'Draft', icon: FileText, color: 'text-gray-500', bgColor: 'bg-gray-100' },
  { value: 'applied', label: 'Applied', icon: Send, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  { value: 'screening', label: 'Screening', icon: Eye, color: 'text-purple-500', bgColor: 'bg-purple-100' },
  { value: 'interview', label: 'Interview', icon: MessageSquare, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  { value: 'offer', label: 'Offer', icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-100' },
  { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100' },
  { value: 'withdrawn', label: 'Withdrawn', icon: AlertCircle, color: 'text-orange-500', bgColor: 'bg-orange-100' },
  { value: 'accepted', label: 'Accepted', icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-100' },
] as const;

export default function CareerPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activities, setActivities] = React.useState<CareerActivity[]>([]);
  const [applications, setApplications] = React.useState<JobApplication[]>([]);
  const [pipeline, setPipeline] = React.useState<Pipeline | null>(null);
  const [stats, setStats] = React.useState<CareerStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showActivityModal, setShowActivityModal] = React.useState(false);
  const [showApplicationModal, setShowApplicationModal] = React.useState(false);
  const [editingActivity, setEditingActivity] = React.useState<CareerActivity | null>(null);
  const [editingApplication, setEditingApplication] = React.useState<JobApplication | null>(null);

  // Filters & View
  const [activeTab, setActiveTab] = React.useState<'activities' | 'applications'>('activities');
  const [filterType, setFilterType] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedActivity, setExpandedActivity] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'list' | 'pipeline'>('list');

  // Fetch data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [activitiesRes, applicationsRes, pipelineRes, statsRes] = await Promise.all([
          api.career.activities.list({ limit: 100 }),
          api.career.applications.list({ limit: 100 }),
          api.career.applications.pipeline(),
          api.career.stats(),
        ]);
        setActivities((activitiesRes as any).data || []);
        setApplications((applicationsRes as any).data || []);
        setPipeline((pipelineRes as any).data || null);
        setStats((statsRes as any).data || null);
      } catch (err) {
        console.error('Failed to fetch career data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAuthenticated]);

  // Refresh stats
  const refreshStats = async () => {
    try {
      const [pipelineRes, statsRes] = await Promise.all([
        api.career.applications.pipeline(),
        api.career.stats(),
      ]);
      setPipeline((pipelineRes as any).data || null);
      setStats((statsRes as any).data || null);
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  };

  // Activity CRUD
  const handleCreateActivity = async (data: Partial<CareerActivity>) => {
    try {
      const res = await api.career.activities.create(data);
      setActivities((prev) => [(res as any).data, ...prev]);
      setShowActivityModal(false);
      refreshStats();
    } catch (err) {
      console.error('Failed to create activity:', err);
    }
  };

  const handleUpdateActivity = async (id: string, data: Partial<CareerActivity>) => {
    try {
      const res = await api.career.activities.update(id, data);
      setActivities((prev) => prev.map((a) => (a.id === id ? (res as any).data : a)));
      setEditingActivity(null);
      setShowActivityModal(false);
      refreshStats();
    } catch (err) {
      console.error('Failed to update activity:', err);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      await api.career.activities.delete(id);
      setActivities((prev) => prev.filter((a) => a.id !== id));
      refreshStats();
    } catch (err) {
      console.error('Failed to delete activity:', err);
    }
  };

  // Application CRUD
  const handleCreateApplication = async (data: Partial<JobApplication>) => {
    try {
      const res = await api.career.applications.create(data);
      setApplications((prev) => [(res as any).data, ...prev]);
      setShowApplicationModal(false);
      refreshStats();
    } catch (err) {
      console.error('Failed to create application:', err);
    }
  };

  const handleUpdateApplication = async (id: string, data: Partial<JobApplication>) => {
    try {
      const res = await api.career.applications.update(id, data);
      setApplications((prev) => prev.map((a) => (a.id === id ? (res as any).data : a)));
      setEditingApplication(null);
      setShowApplicationModal(false);
      refreshStats();
    } catch (err) {
      console.error('Failed to update application:', err);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await api.career.applications.delete(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      refreshStats();
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    const matchesType = filterType === 'all' || activity.activityType === filterType;
    const matchesSearch =
      !searchQuery ||
      activity.targetEntity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.outputSummary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      !searchQuery ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
        title="Career"
        description="Track career activities and job applications"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingApplication(null);
                setShowApplicationModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
            <Button
              onClick={() => {
                setEditingActivity(null);
                setShowActivityModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </div>
        }
      />

      {/* Stats Overview */}
      {stats && (stats.activities.total > 0 || stats.applications.total > 0) && (
        <PageSection title="Overview">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <StatCard
              label="Activities"
              value={stats.activities.total.toString()}
              icon={<Briefcase className="h-5 w-5" />}
            />
            <StatCard
              label="Time Invested"
              value={formatMinutes(stats.activities.totalMinutes)}
              icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
              label="Avg Impact"
              value={stats.activities.averageCareerImpact?.toFixed(1) || '-'}
              icon={<Target className="h-5 w-5" />}
              suffix="/5"
            />
            <StatCard
              label="Applications"
              value={stats.applications.total.toString()}
              icon={<Send className="h-5 w-5" />}
            />
            <StatCard
              label="Active"
              value={stats.applications.active.toString()}
              icon={<AlertCircle className="h-5 w-5" />}
              variant="info"
            />
            <StatCard
              label="Success Rate"
              value={`${stats.applications.successRate.toFixed(0)}%`}
              icon={<CheckCircle2 className="h-5 w-5" />}
              variant={stats.applications.successRate >= 10 ? 'success' : 'neutral'}
            />
          </div>

          {/* Activity breakdown */}
          {Object.keys(stats.activities.byType).length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Activity Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {Object.entries(stats.activities.byType)
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 8)
                    .map(([type, data]) => {
                      const typeInfo = ACTIVITY_TYPES.find((t) => t.value === type);
                      const TypeIcon = typeInfo?.icon || Briefcase;
                      return (
                        <div key={type} className="p-3 border rounded-md">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <TypeIcon className="h-4 w-4" />
                            <span className="text-xs truncate">{typeInfo?.label || type}</span>
                          </div>
                          <p className="text-lg font-semibold">{data.count}</p>
                          <p className="text-xs text-muted-foreground">{formatMinutes(data.totalMinutes)}</p>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </PageSection>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'activities'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('activities')}
        >
          Activities ({activities.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'applications'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('applications')}
        >
          Applications ({applications.length})
        </button>
      </div>

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
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
              {ACTIVITY_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Activities List */}
          {filteredActivities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {activities.length === 0 ? 'No career activities logged yet.' : 'No activities match your search.'}
                </p>
                {activities.length === 0 && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setEditingActivity(null);
                      setShowActivityModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Log Your First Activity
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isExpanded={expandedActivity === activity.id}
                  onToggleExpand={() =>
                    setExpandedActivity(expandedActivity === activity.id ? null : activity.id)
                  }
                  onEdit={() => {
                    setEditingActivity(activity);
                    setShowActivityModal(true);
                  }}
                  onDelete={() => handleDeleteActivity(activity.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <>
          {/* View Toggle & Search */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
              <Button
                variant={viewMode === 'pipeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('pipeline')}
              >
                Pipeline
              </Button>
            </div>
          </div>

          {/* Pipeline View */}
          {viewMode === 'pipeline' && pipeline && (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {APPLICATION_STATUSES.map(({ value, label, icon: Icon, color, bgColor }) => (
                  <div key={value} className="w-64 flex-shrink-0">
                    <div className={`p-3 rounded-t-lg ${bgColor}`}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="font-medium text-sm">{label}</span>
                        <Badge variant="neutral" className="ml-auto">
                          {pipeline[value]?.length || 0}
                        </Badge>
                      </div>
                    </div>
                    <div className="border border-t-0 rounded-b-lg p-2 space-y-2 min-h-[200px] bg-muted/30">
                      {pipeline[value]?.map((app) => (
                        <div
                          key={app.id}
                          className="p-3 bg-background rounded-md border cursor-pointer hover:shadow-sm transition-shadow"
                          onClick={() => {
                            setEditingApplication(app);
                            setShowApplicationModal(true);
                          }}
                        >
                          <p className="font-medium text-sm truncate">{app.company}</p>
                          <p className="text-xs text-muted-foreground truncate">{app.roleTitle}</p>
                          {app.appliedDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(new Date(app.appliedDate), { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      ))}
                      {(!pipeline[value] || pipeline[value].length === 0) && (
                        <p className="text-xs text-muted-foreground text-center py-4">No applications</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <>
              {filteredApplications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">
                      {applications.length === 0 ? 'No job applications yet.' : 'No applications match your search.'}
                    </p>
                    {applications.length === 0 && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setEditingApplication(null);
                          setShowApplicationModal(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Application
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredApplications.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      onEdit={() => {
                        setEditingApplication(app);
                        setShowApplicationModal(true);
                      }}
                      onDelete={() => handleDeleteApplication(app.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Activity Modal */}
      {showActivityModal && (
        <ActivityModal
          activity={editingActivity}
          onClose={() => {
            setShowActivityModal(false);
            setEditingActivity(null);
          }}
          onSave={(data) => {
            if (editingActivity) {
              handleUpdateActivity(editingActivity.id, data);
            } else {
              handleCreateActivity(data);
            }
          }}
        />
      )}

      {/* Application Modal */}
      {showApplicationModal && (
        <ApplicationModal
          application={editingApplication}
          onClose={() => {
            setShowApplicationModal(false);
            setEditingApplication(null);
          }}
          onSave={(data) => {
            if (editingApplication) {
              handleUpdateApplication(editingApplication.id, data);
            } else {
              handleCreateApplication(data);
            }
          }}
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
  suffix,
  variant = 'neutral',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  suffix?: string;
  variant?: 'success' | 'error' | 'info' | 'neutral';
}) {
  const colorClass = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    neutral: 'text-primary',
  }[variant];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={colorClass}>{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">
              {value}
              {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityCard({
  activity,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  activity: CareerActivity;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeInfo = ACTIVITY_TYPES.find((t) => t.value === activity.activityType);
  const TypeIcon = typeInfo?.icon || Briefcase;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <TypeIcon className="h-4 w-4 text-primary" />
              <span className="font-medium">{typeInfo?.label || activity.activityType}</span>
              {activity.targetEntity && (
                <Badge variant="neutral" className="text-xs">
                  {activity.targetEntity}
                </Badge>
              )}
              {activity.pipelineStage && activity.pipelineStage !== 'not_applicable' && (
                <Badge variant="info" className="text-xs">
                  {PIPELINE_STAGES.find((s) => s.value === activity.pipelineStage)?.label || activity.pipelineStage}
                </Badge>
              )}
              {activity.priority && (
                <Badge variant={activity.priority === 1 ? 'success' : activity.priority === 3 ? 'error' : 'warning'} className="text-xs">
                  P{activity.priority}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              <span>{formatDate(new Date(activity.date), { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {activity.timeSpentMin && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {activity.timeSpentMin}min
                </span>
              )}
              {activity.careerImpact && (
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Impact: {activity.careerImpact}/5
                </span>
              )}
              {activity.outputLink && (
                <a
                  href={activity.outputLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  Link
                </a>
              )}
            </div>

            {activity.description && (
              <p className="mt-2 text-sm line-clamp-2">{activity.description}</p>
            )}

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-4 space-y-3 border-t pt-4">
                {activity.outputSummary && (
                  <div>
                    <h4 className="text-sm font-medium">Output Summary</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activity.outputSummary}</p>
                  </div>
                )}
                {activity.nextStep && (
                  <div>
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <ArrowRight className="h-4 w-4" />
                      Next Step
                    </h4>
                    <p className="text-sm text-muted-foreground">{activity.nextStep}</p>
                  </div>
                )}
                {activity.confidence && (
                  <div>
                    <h4 className="text-sm font-medium">Confidence: {activity.confidence}/5</h4>
                    <Progress value={activity.confidence * 20} className="h-2 mt-1" />
                  </div>
                )}
                {activity.notes && (
                  <div>
                    <h4 className="text-sm font-medium">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activity.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-1 ml-2">
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

function ApplicationCard({
  application,
  onEdit,
  onDelete,
}: {
  application: JobApplication;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusInfo = APPLICATION_STATUSES.find((s) => s.value === application.status);
  const StatusIcon = statusInfo?.icon || AlertCircle;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Building className="h-4 w-4 text-primary" />
              <span className="font-medium">{application.company}</span>
              <Badge variant="neutral" className="text-xs">
                {application.roleTitle}
              </Badge>
              <Badge variant={getStatusVariant(application.status)} className="text-xs flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusInfo?.label || application.status}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              {application.appliedDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Applied: {formatDate(new Date(application.appliedDate), { month: 'short', day: 'numeric' })}
                </span>
              )}
              {application.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {application.location}
                </span>
              )}
              {application.salary && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {application.salary}
                </span>
              )}
              {application.link && (
                <a
                  href={application.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  Job Link
                </a>
              )}
            </div>

            {(application.contactName || application.contactEmail) && (
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                {application.contactName && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {application.contactName}
                  </span>
                )}
                {application.contactEmail && (
                  <a
                    href={`mailto:${application.contactEmail}`}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    {application.contactEmail}
                  </a>
                )}
              </div>
            )}

            {application.notes && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{application.notes}</p>
            )}
          </div>
          <div className="flex gap-1 ml-2">
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

function ActivityModal({
  activity,
  onClose,
  onSave,
}: {
  activity: CareerActivity | null;
  onClose: () => void;
  onSave: (data: Partial<CareerActivity>) => void;
}) {
  const [formData, setFormData] = React.useState({
    date: toLocalDateString(activity?.date),
    activityType: activity?.activityType || 'portfolio',
    subcategory: activity?.subcategory || '',
    targetEntity: activity?.targetEntity || '',
    timeSpentMin: activity?.timeSpentMin || '',
    description: activity?.description || '',
    outputSummary: activity?.outputSummary || '',
    outputLink: activity?.outputLink || '',
    pipelineStage: activity?.pipelineStage || 'not_applicable',
    priority: activity?.priority || '',
    confidence: activity?.confidence || '',
    careerImpact: activity?.careerImpact || '',
    nextStep: activity?.nextStep || '',
    notes: activity?.notes || '',
  });
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  const tabs = ['Basic', 'Details', 'Assessment', 'Notes'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      date: new Date(formData.date).toISOString(),
      activityType: formData.activityType,
      subcategory: formData.subcategory || undefined,
      targetEntity: formData.targetEntity || undefined,
      timeSpentMin: formData.timeSpentMin ? Number(formData.timeSpentMin) : undefined,
      description: formData.description || undefined,
      outputSummary: formData.outputSummary || undefined,
      outputLink: formData.outputLink || undefined,
      pipelineStage: formData.pipelineStage || undefined,
      priority: formData.priority ? Number(formData.priority) : undefined,
      confidence: formData.confidence ? Number(formData.confidence) : undefined,
      careerImpact: formData.careerImpact ? Number(formData.careerImpact) : undefined,
      nextStep: formData.nextStep || undefined,
      notes: formData.notes || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{activity ? 'Edit Activity' : 'Add Activity'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === index
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(index)}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Basic Tab */}
          {activeTab === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="text-sm font-medium">Time Spent (min)</label>
                  <Input
                    type="number"
                    value={formData.timeSpentMin}
                    onChange={(e) => setFormData({ ...formData, timeSpentMin: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Activity Type *</label>
                <select
                  value={formData.activityType}
                  onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  required
                >
                  {ACTIVITY_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Target Entity</label>
                <Input
                  value={formData.targetEntity}
                  onChange={(e) => setFormData({ ...formData, targetEntity: e.target.value })}
                  placeholder="Company name, platform, etc."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Subcategory</label>
                <Input
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="e.g., Technical, Behavioral"
                />
              </div>
            </>
          )}

          {/* Details Tab */}
          {activeTab === 1 && (
            <>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="What did you do?"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Output Summary</label>
                <textarea
                  value={formData.outputSummary}
                  onChange={(e) => setFormData({ ...formData, outputSummary: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="What was the outcome?"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Output Link</label>
                <Input
                  value={formData.outputLink}
                  onChange={(e) => setFormData({ ...formData, outputLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Pipeline Stage</label>
                <select
                  value={formData.pipelineStage}
                  onChange={(e) => setFormData({ ...formData, pipelineStage: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {PIPELINE_STAGES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Assessment Tab */}
          {activeTab === 2 && (
            <>
              <div>
                <label className="text-sm font-medium">Priority (1-3)</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select priority...</option>
                  <option value="1">1 - High</option>
                  <option value="2">2 - Medium</option>
                  <option value="3">3 - Low</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Confidence (1-5)</label>
                <select
                  value={formData.confidence}
                  onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select confidence...</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} - {['Very Low', 'Low', 'Medium', 'High', 'Very High'][n - 1]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Career Impact (1-5)</label>
                <select
                  value={formData.careerImpact}
                  onChange={(e) => setFormData({ ...formData, careerImpact: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select impact...</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} - {['Minimal', 'Low', 'Moderate', 'High', 'Critical'][n - 1]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Next Step</label>
                <textarea
                  value={formData.nextStep}
                  onChange={(e) => setFormData({ ...formData, nextStep: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="What's the next action?"
                />
              </div>
            </>
          )}

          {/* Notes Tab */}
          {activeTab === 3 && (
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full min-h-[200px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                placeholder="Additional notes, learnings, insights..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {activity ? 'Update' : 'Add'} Activity
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplicationModal({
  application,
  onClose,
  onSave,
}: {
  application: JobApplication | null;
  onClose: () => void;
  onSave: (data: Partial<JobApplication>) => void;
}) {
  const [formData, setFormData] = React.useState({
    company: application?.company || '',
    roleTitle: application?.roleTitle || '',
    link: application?.link || '',
    status: application?.status || 'draft',
    contactName: application?.contactName || '',
    contactEmail: application?.contactEmail || '',
    appliedDate: application?.appliedDate
      ? new Date(application.appliedDate).toISOString().split('T')[0]
      : '',
    expectedResponse: application?.expectedResponse
      ? new Date(application.expectedResponse).toISOString().split('T')[0]
      : '',
    salary: application?.salary || '',
    location: application?.location || '',
    notes: application?.notes || '',
  });
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  const tabs = ['Basic', 'Contact', 'Details'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      company: formData.company,
      roleTitle: formData.roleTitle,
      link: formData.link || undefined,
      status: formData.status,
      contactName: formData.contactName || undefined,
      contactEmail: formData.contactEmail || undefined,
      appliedDate: formData.appliedDate ? new Date(formData.appliedDate).toISOString() : undefined,
      expectedResponse: formData.expectedResponse ? new Date(formData.expectedResponse).toISOString() : undefined,
      salary: formData.salary || undefined,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{application ? 'Edit Application' : 'Add Application'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === index
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(index)}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Basic Tab */}
          {activeTab === 0 && (
            <>
              <div>
                <label className="text-sm font-medium">Company *</label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Role Title *</label>
                <Input
                  value={formData.roleTitle}
                  onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  required
                >
                  {APPLICATION_STATUSES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Job Link</label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {/* Contact Tab */}
          {activeTab === 1 && (
            <>
              <div>
                <label className="text-sm font-medium">Contact Name</label>
                <Input
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="Recruiter or hiring manager name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Contact Email</label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Applied Date</label>
                  <Input
                    type="date"
                    value={formData.appliedDate}
                    onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Expected Response</label>
                  <Input
                    type="date"
                    value={formData.expectedResponse}
                    onChange={(e) => setFormData({ ...formData, expectedResponse: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {/* Details Tab */}
          {activeTab === 2 && (
            <>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Remote, Jakarta, Singapore"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Salary</label>
                <Input
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g., $100k-120k, IDR 30-40M"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Requirements, interview notes, thoughts..."
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {application ? 'Update' : 'Add'} Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper functions
function getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'offer':
    case 'accepted':
      return 'success';
    case 'rejected':
      return 'error';
    case 'interview':
    case 'screening':
      return 'warning';
    case 'applied':
      return 'info';
    default:
      return 'neutral';
  }
}
