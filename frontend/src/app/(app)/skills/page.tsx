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
  Clock,
  Search,
  Trash2,
  Edit,
  X,
  Code,
  Palette,
  PenTool,
  BarChart3,
  Briefcase,
  Languages,
  Wrench,
  Lightbulb,
  Target,
  Zap,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { formatDate, toLocalDateString } from '@/lib/utils';

// Types
interface SkillSession {
  id: string;
  date: string;
  skillCategory: string;
  subSkill?: string;
  projectId?: string;
  timeSpentMin?: number;
  outputSummary?: string;
  outputLink?: string;
  learnedPoints?: string;
  difficulty?: number;
  masteryLevel?: number;
  mistakes?: string;
  nextStep?: string;
  energyScore?: number;
  qualityScore?: number;
  project?: {
    id: string;
    name: string;
  };
}

interface SkillStats {
  totalSessions: number;
  totalMinutes: number;
  averageMastery: number | null;
  averageQuality: number | null;
  byCategory: Record<string, {
    sessions: number;
    totalMinutes: number;
    averageMastery: number | null;
    averageQuality: number | null;
  }>;
}

const SKILL_CATEGORIES = [
  { value: 'uiux', label: 'UI/UX Design', icon: Palette },
  { value: 'framer', label: 'Framer', icon: PenTool },
  { value: 'writing', label: 'Writing', icon: PenTool },
  { value: 'pm', label: 'Product Management', icon: Briefcase },
  { value: 'data', label: 'Data Science', icon: BarChart3 },
  { value: 'engineering', label: 'Engineering', icon: Wrench },
  { value: 'programming', label: 'Programming', icon: Code },
  { value: 'career', label: 'Career Development', icon: TrendingUp },
  { value: 'language', label: 'Language', icon: Languages },
  { value: 'other', label: 'Other', icon: Lightbulb },
] as const;

export default function SkillsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = React.useState<SkillSession[]>([]);
  const [stats, setStats] = React.useState<SkillStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showModal, setShowModal] = React.useState(false);
  const [editingSession, setEditingSession] = React.useState<SkillSession | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedSession, setExpandedSession] = React.useState<string | null>(null);

  // Fetch data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [sessionsRes, statsRes] = await Promise.all([
          api.skills.list({ limit: 100 }),
          api.skills.stats(),
        ]);
        setSessions((sessionsRes as any).data || []);
        setStats((statsRes as any).data || null);
      } catch (err) {
        console.error('Failed to fetch skills data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAuthenticated]);

  // CRUD handlers
  const handleCreate = async (data: Partial<SkillSession>) => {
    try {
      const res = await api.skills.create(data);
      setSessions((prev) => [(res as any).data, ...prev]);
      setShowModal(false);
      const statsRes = await api.skills.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleUpdate = async (id: string, data: Partial<SkillSession>) => {
    try {
      const res = await api.skills.update(id, data);
      setSessions((prev) => prev.map((s) => (s.id === id ? (res as any).data : s)));
      setEditingSession(null);
      setShowModal(false);
      const statsRes = await api.skills.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill session?')) return;
    try {
      await api.skills.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      const statsRes = await api.skills.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    const matchesCategory = filterCategory === 'all' || session.skillCategory === filterCategory;
    const matchesSearch = !searchQuery ||
      session.subSkill?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.outputSummary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.learnedPoints?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get top categories by time
  const topCategories = stats?.byCategory
    ? Object.entries(stats.byCategory)
        .sort((a, b) => b[1].totalMinutes - a[1].totalMinutes)
        .slice(0, 5)
    : [];

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
        title="Skills"
        description="Track your skill development journey"
        actions={
          <Button
            onClick={() => {
              setEditingSession(null);
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Session
          </Button>
        }
      />

      {/* Stats Overview */}
      {stats && stats.totalSessions > 0 && (
        <PageSection title="Learning Statistics">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Total Sessions"
              value={stats.totalSessions.toString()}
              icon={<Target className="h-5 w-5" />}
            />
            <StatCard
              label="Learning Time"
              value={`${Math.round(stats.totalMinutes / 60)}h`}
              icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
              label="Avg. Mastery"
              value={stats.averageMastery?.toFixed(1) || 'N/A'}
              icon={<TrendingUp className="h-5 w-5" />}
              suffix="/5"
            />
            <StatCard
              label="Avg. Quality"
              value={stats.averageQuality?.toFixed(1) || 'N/A'}
              icon={<Zap className="h-5 w-5" />}
              suffix="/5"
            />
          </div>

          {/* Category breakdown */}
          {topCategories.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Time by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topCategories.map(([category, data]) => {
                    const percentage = stats.totalMinutes > 0
                      ? (data.totalMinutes / stats.totalMinutes) * 100
                      : 0;
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-2">
                            {getCategoryIcon(category)}
                            {getCategoryLabel(category)}
                          </span>
                          <span className="text-muted-foreground">
                            {Math.round(data.totalMinutes / 60)}h ({data.sessions} sessions)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
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
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('all')}
          >
            All
          </Button>
          {SKILL_CATEGORIES.slice(0, 4).map(({ value, label }) => (
            <Button
              key={value}
              variant={filterCategory === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(value)}
            >
              {label}
            </Button>
          ))}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-8 px-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">More...</option>
            {SKILL_CATEGORIES.slice(4).map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {sessions.length === 0 ? 'No skill sessions logged yet.' : 'No sessions match your search.'}
            </p>
            {sessions.length === 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setEditingSession(null);
                  setShowModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Log Your First Session
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isExpanded={expandedSession === session.id}
              onToggleExpand={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
              onEdit={() => {
                setEditingSession(session);
                setShowModal(true);
              }}
              onDelete={() => handleDelete(session.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <SkillSessionModal
          session={editingSession}
          onClose={() => {
            setShowModal(false);
            setEditingSession(null);
          }}
          onSave={(data) => {
            if (editingSession) {
              handleUpdate(editingSession.id, data);
            } else {
              handleCreate(data);
            }
          }}
        />
      )}
    </PageContainer>
  );
}

// Helper components
function StatCard({
  label,
  value,
  icon,
  suffix,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-primary">{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">
              {value}{suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionCard({
  session,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  session: SkillSession;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const CategoryIcon = SKILL_CATEGORIES.find((c) => c.value === session.skillCategory)?.icon || Lightbulb;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryIcon className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {getCategoryLabel(session.skillCategory)}
                {session.subSkill && ` - ${session.subSkill}`}
              </span>
              {session.masteryLevel && (
                <Badge variant={getMasteryVariant(session.masteryLevel)}>
                  Mastery: {session.masteryLevel}/5
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
              <span>{formatDate(new Date(session.date), { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {session.timeSpentMin && <span>• {session.timeSpentMin} min</span>}
              {session.difficulty && <span>• Difficulty: {session.difficulty}/5</span>}
              {session.qualityScore && <span>• Quality: {session.qualityScore}/5</span>}
              {session.project && <span>• Project: {session.project.name}</span>}
            </div>
            {session.outputSummary && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{session.outputSummary}</p>
            )}

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-4 space-y-3 border-t pt-4">
                {session.learnedPoints && (
                  <div>
                    <h4 className="text-sm font-medium">What I Learned</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{session.learnedPoints}</p>
                  </div>
                )}
                {session.mistakes && (
                  <div>
                    <h4 className="text-sm font-medium">Mistakes & Challenges</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{session.mistakes}</p>
                  </div>
                )}
                {session.nextStep && (
                  <div>
                    <h4 className="text-sm font-medium">Next Steps</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{session.nextStep}</p>
                  </div>
                )}
                {session.outputLink && (
                  <div>
                    <h4 className="text-sm font-medium">Output Link</h4>
                    <a
                      href={session.outputLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center gap-1 hover:underline"
                    >
                      {session.outputLink}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {session.energyScore && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Energy Level:</span> {session.energyScore}/5
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-1 ml-2">
            <Button variant="ghost" size="sm" onClick={onToggleExpand}>
              {isExpanded ? 'Less' : 'More'}
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

function SkillSessionModal({
  session,
  onClose,
  onSave,
}: {
  session: SkillSession | null;
  onClose: () => void;
  onSave: (data: Partial<SkillSession>) => void;
}) {
  const [formData, setFormData] = React.useState({
    date: toLocalDateString(session?.date),
    skillCategory: session?.skillCategory || 'programming',
    subSkill: session?.subSkill || '',
    timeSpentMin: session?.timeSpentMin || '',
    outputSummary: session?.outputSummary || '',
    outputLink: session?.outputLink || '',
    learnedPoints: session?.learnedPoints || '',
    difficulty: session?.difficulty || '',
    masteryLevel: session?.masteryLevel || '',
    mistakes: session?.mistakes || '',
    nextStep: session?.nextStep || '',
    energyScore: session?.energyScore || '',
    qualityScore: session?.qualityScore || '',
  });
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'basic' | 'reflection'>('basic');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      date: new Date(formData.date).toISOString(),
      skillCategory: formData.skillCategory,
      subSkill: formData.subSkill || undefined,
      timeSpentMin: formData.timeSpentMin ? Number(formData.timeSpentMin) : undefined,
      outputSummary: formData.outputSummary || undefined,
      outputLink: formData.outputLink || undefined,
      learnedPoints: formData.learnedPoints || undefined,
      difficulty: formData.difficulty ? Number(formData.difficulty) : undefined,
      masteryLevel: formData.masteryLevel ? Number(formData.masteryLevel) : undefined,
      mistakes: formData.mistakes || undefined,
      nextStep: formData.nextStep || undefined,
      energyScore: formData.energyScore ? Number(formData.energyScore) : undefined,
      qualityScore: formData.qualityScore ? Number(formData.qualityScore) : undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {session ? 'Edit Skill Session' : 'Log Skill Session'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'basic'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reflection')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'reflection'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Reflection & Notes
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {activeTab === 'basic' && (
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
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category *</label>
                  <select
                    value={formData.skillCategory}
                    onChange={(e) => setFormData({ ...formData, skillCategory: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    required
                  >
                    {SKILL_CATEGORIES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Sub-skill / Topic</label>
                  <Input
                    value={formData.subSkill}
                    onChange={(e) => setFormData({ ...formData, subSkill: e.target.value })}
                    placeholder="React Hooks, Python Pandas..."
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Output Summary</label>
                <textarea
                  value={formData.outputSummary}
                  onChange={(e) => setFormData({ ...formData, outputSummary: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="What did you build/create/complete?"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Output Link</label>
                <Input
                  value={formData.outputLink}
                  onChange={(e) => setFormData({ ...formData, outputLink: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Difficulty (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mastery Level (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.masteryLevel}
                    onChange={(e) => setFormData({ ...formData, masteryLevel: e.target.value })}
                    placeholder="3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Quality Score (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.qualityScore}
                    onChange={(e) => setFormData({ ...formData, qualityScore: e.target.value })}
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Energy Level (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.energyScore}
                    onChange={(e) => setFormData({ ...formData, energyScore: e.target.value })}
                    placeholder="4"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'reflection' && (
            <>
              <div>
                <label className="text-sm font-medium">What I Learned</label>
                <textarea
                  value={formData.learnedPoints}
                  onChange={(e) => setFormData({ ...formData, learnedPoints: e.target.value })}
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Key takeaways and insights..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Mistakes & Challenges</label>
                <textarea
                  value={formData.mistakes}
                  onChange={(e) => setFormData({ ...formData, mistakes: e.target.value })}
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="What went wrong? What was challenging?"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Next Steps</label>
                <textarea
                  value={formData.nextStep}
                  onChange={(e) => setFormData({ ...formData, nextStep: e.target.value })}
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="What to focus on next time..."
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
              {session ? 'Update' : 'Log'} Session
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper functions
function getCategoryLabel(category: string): string {
  const cat = SKILL_CATEGORIES.find((c) => c.value === category);
  return cat?.label || category;
}

function getCategoryIcon(category: string): React.ReactNode {
  const cat = SKILL_CATEGORIES.find((c) => c.value === category);
  const IconComponent = cat?.icon || Lightbulb;
  return <IconComponent className="h-4 w-4" />;
}

function getMasteryVariant(level: number): 'success' | 'warning' | 'error' | 'neutral' {
  if (level >= 4) return 'success';
  if (level >= 3) return 'warning';
  if (level >= 2) return 'neutral';
  return 'error';
}
