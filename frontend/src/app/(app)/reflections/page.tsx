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
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Target,
  Heart,
  Brain,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Calendar,
  Shield,
  Zap,
  Smile,
  Frown,
  Meh,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { formatDate, toLocalDateString, getTodayISO } from '@/lib/utils';

// Types
interface ReflectionEntry {
  id: string;
  date: string;
  wentWell?: string;
  wentWrong?: string;
  rootCause?: string;
  learnedToday?: string;
  fixForTomorrow?: string;
  integrityScore?: number;
  disciplineScore?: number;
  emotionalState?: string;
  gratitude?: string;
  dayLesson?: string;
  notes?: string;
}

interface ReflectionStats {
  totalEntries: number;
  averageIntegrityScore: number | null;
  averageDisciplineScore: number | null;
  emotionalStateBreakdown: Record<string, number>;
  trend: Array<{
    date: string;
    integrityScore: number | null;
    disciplineScore: number | null;
    emotionalState: string | null;
  }>;
}

const EMOTIONAL_STATES = [
  { value: 'happy', label: 'Happy', icon: Smile, color: 'text-green-500' },
  { value: 'content', label: 'Content', icon: Smile, color: 'text-blue-500' },
  { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-gray-500' },
  { value: 'anxious', label: 'Anxious', icon: AlertCircle, color: 'text-yellow-500' },
  { value: 'stressed', label: 'Stressed', icon: AlertCircle, color: 'text-orange-500' },
  { value: 'sad', label: 'Sad', icon: Frown, color: 'text-blue-400' },
  { value: 'frustrated', label: 'Frustrated', icon: Frown, color: 'text-red-500' },
  { value: 'grateful', label: 'Grateful', icon: Heart, color: 'text-pink-500' },
  { value: 'motivated', label: 'Motivated', icon: Zap, color: 'text-yellow-500' },
  { value: 'tired', label: 'Tired', icon: Meh, color: 'text-gray-400' },
] as const;

export default function ReflectionsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = React.useState<ReflectionEntry[]>([]);
  const [stats, setStats] = React.useState<ReflectionStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showModal, setShowModal] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<ReflectionEntry | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedEntry, setExpandedEntry] = React.useState<string | null>(null);

  // Fetch data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [entriesRes, statsRes] = await Promise.all([
          api.reflections.list({ limit: 100 }),
          api.reflections.stats(),
        ]);
        setEntries((entriesRes as any).data || []);
        setStats((statsRes as any).data || null);
      } catch (err) {
        console.error('Failed to fetch reflections data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAuthenticated]);

  // CRUD handlers
  const handleCreate = async (data: Partial<ReflectionEntry>) => {
    try {
      const res = await api.reflections.create(data);
      setEntries((prev) => [(res as any).data, ...prev]);
      setShowModal(false);
      const statsRes = await api.reflections.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to create reflection:', err);
    }
  };

  const handleUpdate = async (id: string, data: Partial<ReflectionEntry>) => {
    try {
      const res = await api.reflections.update(id, data);
      setEntries((prev) => prev.map((e) => (e.id === id ? (res as any).data : e)));
      setEditingEntry(null);
      setShowModal(false);
      const statsRes = await api.reflections.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to update reflection:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reflection?')) return;
    try {
      await api.reflections.delete(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      const statsRes = await api.reflections.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to delete reflection:', err);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.wentWell?.toLowerCase().includes(query) ||
      entry.wentWrong?.toLowerCase().includes(query) ||
      entry.learnedToday?.toLowerCase().includes(query) ||
      entry.gratitude?.toLowerCase().includes(query) ||
      entry.dayLesson?.toLowerCase().includes(query) ||
      entry.notes?.toLowerCase().includes(query) ||
      formatDate(new Date(entry.date)).toLowerCase().includes(query)
    );
  });

  // Get emotional state breakdown sorted
  const emotionalBreakdown = stats?.emotionalStateBreakdown
    ? Object.entries(stats.emotionalStateBreakdown)
        .sort((a, b) => b[1] - a[1])
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
        title="Reflections"
        description="Daily reflections and personal insights"
        actions={
          <Button
            onClick={() => {
              setEditingEntry(null);
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Reflection
          </Button>
        }
      />

      {/* Stats Overview */}
      {stats && stats.totalEntries > 0 && (
        <PageSection title="Reflection Insights">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Total Reflections"
              value={stats.totalEntries.toString()}
              icon={<Calendar className="h-5 w-5" />}
            />
            <StatCard
              label="Avg Integrity"
              value={stats.averageIntegrityScore?.toFixed(1) || 'N/A'}
              icon={<Shield className="h-5 w-5" />}
              suffix="/5"
            />
            <StatCard
              label="Avg Discipline"
              value={stats.averageDisciplineScore?.toFixed(1) || 'N/A'}
              icon={<Target className="h-5 w-5" />}
              suffix="/5"
            />
            <StatCard
              label="Streak"
              value={calculateStreak(entries).toString()}
              icon={<TrendingUp className="h-5 w-5" />}
              suffix=" days"
            />
          </div>

          {/* Emotional State Breakdown */}
          {emotionalBreakdown.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Emotional States</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emotionalBreakdown.map(([state, count]) => {
                    const percentage = stats.totalEntries > 0
                      ? (count / stats.totalEntries) * 100
                      : 0;
                    const stateInfo = EMOTIONAL_STATES.find((s) => s.value === state);
                    const StateIcon = stateInfo?.icon || Meh;
                    return (
                      <div key={state}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-2">
                            <StateIcon className={`h-4 w-4 ${stateInfo?.color || ''}`} />
                            {stateInfo?.label || state}
                          </span>
                          <span className="text-muted-foreground">
                            {count} entries ({percentage.toFixed(0)}%)
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

      {/* Search */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reflections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {entries.length === 0 ? 'No reflections yet.' : 'No reflections match your search.'}
            </p>
            {entries.length === 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setEditingEntry(null);
                  setShowModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Write Your First Reflection
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              isExpanded={expandedEntry === entry.id}
              onToggleExpand={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
              onEdit={() => {
                setEditingEntry(entry);
                setShowModal(true);
              }}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ReflectionModal
          entry={editingEntry}
          onClose={() => {
            setShowModal(false);
            setEditingEntry(null);
          }}
          onSave={(data) => {
            if (editingEntry) {
              handleUpdate(editingEntry.id, data);
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

function EntryCard({
  entry,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  entry: ReflectionEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const emotionalInfo = EMOTIONAL_STATES.find((s) => s.value === entry.emotionalState);
  const EmotionalIcon = emotionalInfo?.icon || Meh;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">
                {formatDate(new Date(entry.date), { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {entry.emotionalState && (
                <Badge variant={getEmotionalVariant(entry.emotionalState)} className="text-xs">
                  <EmotionalIcon className={`h-3 w-3 mr-1 ${emotionalInfo?.color || ''}`} />
                  {emotionalInfo?.label || entry.emotionalState}
                </Badge>
              )}
              {entry.integrityScore && (
                <Badge variant={getScoreVariant(entry.integrityScore)}>
                  <Shield className="h-3 w-3 mr-1" />
                  {entry.integrityScore}/5
                </Badge>
              )}
              {entry.disciplineScore && (
                <Badge variant={getScoreVariant(entry.disciplineScore)}>
                  <Target className="h-3 w-3 mr-1" />
                  {entry.disciplineScore}/5
                </Badge>
              )}
            </div>

            {/* Preview */}
            <div className="mt-2 space-y-1">
              {entry.wentWell && (
                <div className="flex items-start gap-2 text-sm">
                  <ThumbsUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground line-clamp-1">{entry.wentWell}</span>
                </div>
              )}
              {entry.learnedToday && (
                <div className="flex items-start gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground line-clamp-1">{entry.learnedToday}</span>
                </div>
              )}
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-4 space-y-4 border-t pt-4">
                {entry.wentWell && (
                  <ReflectionSection
                    icon={<ThumbsUp className="h-4 w-4 text-green-500" />}
                    title="What Went Well"
                    content={entry.wentWell}
                  />
                )}
                {entry.wentWrong && (
                  <ReflectionSection
                    icon={<ThumbsDown className="h-4 w-4 text-red-500" />}
                    title="What Went Wrong"
                    content={entry.wentWrong}
                  />
                )}
                {entry.rootCause && (
                  <ReflectionSection
                    icon={<AlertCircle className="h-4 w-4 text-orange-500" />}
                    title="Root Cause"
                    content={entry.rootCause}
                  />
                )}
                {entry.learnedToday && (
                  <ReflectionSection
                    icon={<Lightbulb className="h-4 w-4 text-yellow-500" />}
                    title="What I Learned"
                    content={entry.learnedToday}
                  />
                )}
                {entry.fixForTomorrow && (
                  <ReflectionSection
                    icon={<CheckCircle className="h-4 w-4 text-blue-500" />}
                    title="Fix For Tomorrow"
                    content={entry.fixForTomorrow}
                  />
                )}
                {entry.gratitude && (
                  <ReflectionSection
                    icon={<Heart className="h-4 w-4 text-pink-500" />}
                    title="Gratitude"
                    content={entry.gratitude}
                  />
                )}
                {entry.dayLesson && (
                  <ReflectionSection
                    icon={<Brain className="h-4 w-4 text-purple-500" />}
                    title="Day's Lesson"
                    content={entry.dayLesson}
                  />
                )}
                {entry.notes && (
                  <ReflectionSection
                    icon={<Edit className="h-4 w-4 text-gray-500" />}
                    title="Notes"
                    content={entry.notes}
                  />
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

function ReflectionSection({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
}) {
  return (
    <div>
      <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
        {icon}
        {title}
      </h4>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">{content}</p>
    </div>
  );
}

function ReflectionModal({
  entry,
  onClose,
  onSave,
}: {
  entry: ReflectionEntry | null;
  onClose: () => void;
  onSave: (data: Partial<ReflectionEntry>) => void;
}) {
  const [formData, setFormData] = React.useState({
    date: toLocalDateString(entry?.date),
    wentWell: entry?.wentWell || '',
    wentWrong: entry?.wentWrong || '',
    rootCause: entry?.rootCause || '',
    learnedToday: entry?.learnedToday || '',
    fixForTomorrow: entry?.fixForTomorrow || '',
    integrityScore: entry?.integrityScore || '',
    disciplineScore: entry?.disciplineScore || '',
    emotionalState: entry?.emotionalState || '',
    gratitude: entry?.gratitude || '',
    dayLesson: entry?.dayLesson || '',
    notes: entry?.notes || '',
  });
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'review' | 'learning' | 'mindset' | 'notes'>('review');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      date: new Date(formData.date).toISOString(),
      wentWell: formData.wentWell || undefined,
      wentWrong: formData.wentWrong || undefined,
      rootCause: formData.rootCause || undefined,
      learnedToday: formData.learnedToday || undefined,
      fixForTomorrow: formData.fixForTomorrow || undefined,
      integrityScore: formData.integrityScore ? Number(formData.integrityScore) : undefined,
      disciplineScore: formData.disciplineScore ? Number(formData.disciplineScore) : undefined,
      emotionalState: formData.emotionalState || undefined,
      gratitude: formData.gratitude || undefined,
      dayLesson: formData.dayLesson || undefined,
      notes: formData.notes || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {entry ? 'Edit Reflection' : 'New Reflection'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto">
          {[
            { key: 'review', label: 'Day Review' },
            { key: 'learning', label: 'Learning' },
            { key: 'mindset', label: 'Mindset' },
            { key: 'notes', label: 'Notes' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === key
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {activeTab === 'review' && (
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
                  <label className="text-sm font-medium">Emotional State</label>
                  <select
                    value={formData.emotionalState}
                    onChange={(e) => setFormData({ ...formData, emotionalState: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Select state...</option>
                    {EMOTIONAL_STATES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  What Went Well
                </label>
                <textarea
                  value={formData.wentWell}
                  onChange={(e) => setFormData({ ...formData, wentWell: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="What positive things happened today?"
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  What Went Wrong
                </label>
                <textarea
                  value={formData.wentWrong}
                  onChange={(e) => setFormData({ ...formData, wentWrong: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="What challenges or difficulties did you face?"
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Root Cause Analysis
                </label>
                <textarea
                  value={formData.rootCause}
                  onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                  className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Why did the negative things happen? What's the underlying cause?"
                />
              </div>
            </>
          )}

          {activeTab === 'learning' && (
            <>
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  What I Learned Today
                </label>
                <textarea
                  value={formData.learnedToday}
                  onChange={(e) => setFormData({ ...formData, learnedToday: e.target.value })}
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Key learnings, insights, or new knowledge from today..."
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  Fix For Tomorrow
                </label>
                <textarea
                  value={formData.fixForTomorrow}
                  onChange={(e) => setFormData({ ...formData, fixForTomorrow: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="What will you do differently tomorrow? Action items..."
                />
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Day's Lesson
                </label>
                <textarea
                  value={formData.dayLesson}
                  onChange={(e) => setFormData({ ...formData, dayLesson: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="The main lesson or takeaway from today..."
                />
              </div>
            </>
          )}

          {activeTab === 'mindset' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Integrity Score (1-5)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.integrityScore}
                    onChange={(e) => setFormData({ ...formData, integrityScore: e.target.value })}
                    placeholder="How true were you to your values?"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Did you act according to your values and principles?
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    Discipline Score (1-5)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.disciplineScore}
                    onChange={(e) => setFormData({ ...formData, disciplineScore: e.target.value })}
                    placeholder="How disciplined were you today?"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Did you follow through on your commitments?
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  Gratitude
                </label>
                <textarea
                  value={formData.gratitude}
                  onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="What are you grateful for today? List 3 things..."
                />
              </div>
            </>
          )}

          {activeTab === 'notes' && (
            <div>
              <label className="text-sm font-medium">Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full min-h-[250px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                placeholder="Any other thoughts, observations, or notes about today..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {entry ? 'Update' : 'Save'} Reflection
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper functions
function getYesterdayISO(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateStreak(entries: ReflectionEntry[]): number {
  if (entries.length === 0) return 0;

  const sortedDates = entries
    .map((e) => toLocalDateString(e.date))
    .sort((a, b) => b.localeCompare(a));

  const today = getTodayISO();
  const yesterday = getYesterdayISO();

  // Check if there's an entry for today or yesterday
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i - 1]);
    const prev = new Date(sortedDates[i]);
    const diffDays = Math.round((current.getTime() - prev.getTime()) / 86400000);

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function getScoreVariant(score: number): 'success' | 'warning' | 'error' | 'neutral' {
  if (score >= 4) return 'success';
  if (score >= 3) return 'warning';
  if (score >= 2) return 'neutral';
  return 'error';
}

function getEmotionalVariant(state: string): 'success' | 'warning' | 'error' | 'neutral' {
  const positive = ['happy', 'content', 'grateful', 'motivated'];
  const neutral = ['neutral', 'tired'];
  const negative = ['anxious', 'stressed', 'sad', 'frustrated'];

  if (positive.includes(state)) return 'success';
  if (neutral.includes(state)) return 'neutral';
  if (negative.includes(state)) return 'warning';
  return 'neutral';
}
