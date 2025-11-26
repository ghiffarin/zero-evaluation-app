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
  FileText,
  Clock,
  Star,
  Search,
  Trash2,
  Edit,
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { formatDate, toLocalDateString } from '@/lib/utils';

// Types
interface JournalEntry {
  id: string;
  date: string;
  title: string;
  authors?: string;
  source?: string;
  category: string;
  contentType: string;
  timeSpentMin?: number;
  summary?: string;
  keyInsights?: string;
  keyDataPoints?: string;
  methodsSummary?: string;
  modelsEquations?: string;
  limitations?: string;
  openQuestion?: string;
  projectRelevance?: string;
  confidenceScore?: number;
  ratingUsefulness?: number;
}

interface JournalStats {
  totalEntries: number;
  totalReadingMinutes: number;
  averageUsefulness: number | null;
  byCategory: Record<string, number>;
  byContentType: Record<string, number>;
}

const CATEGORIES = [
  { value: 'microalgae', label: 'Microalgae' },
  { value: 'co2_fixation', label: 'CO2 Fixation' },
  { value: 'bioprocess', label: 'Bioprocess' },
  { value: 'sustainability', label: 'Sustainability' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'other', label: 'Other' },
] as const;

const CONTENT_TYPES = [
  { value: 'review', label: 'Review Article' },
  { value: 'original', label: 'Original Research' },
  { value: 'thesis', label: 'Thesis' },
  { value: 'book_chapter', label: 'Book Chapter' },
  { value: 'report', label: 'Report' },
  { value: 'conference', label: 'Conference Paper' },
  { value: 'other', label: 'Other' },
] as const;

export default function JournalsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [stats, setStats] = React.useState<JournalStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<JournalEntry | null>(null);
  const [expandedEntry, setExpandedEntry] = React.useState<string | null>(null);
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Fetch data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [entriesRes, statsRes] = await Promise.all([
          api.journals.list({ limit: 100 }),
          api.journals.stats(),
        ]);
        setEntries((entriesRes as any).data || []);
        setStats((statsRes as any).data || null);
      } catch (err) {
        console.error('Failed to fetch journal data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAuthenticated]);

  const handleCreate = async (data: Partial<JournalEntry>) => {
    try {
      const res = await api.journals.create(data);
      setEntries((prev) => [(res as any).data, ...prev]);
      setShowModal(false);
      // Refresh stats
      const statsRes = await api.journals.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to create entry:', err);
    }
  };

  const handleUpdate = async (id: string, data: Partial<JournalEntry>) => {
    try {
      const res = await api.journals.update(id, data);
      setEntries((prev) => prev.map((e) => (e.id === id ? (res as any).data : e)));
      setEditingEntry(null);
      setShowModal(false);
      // Refresh stats
      const statsRes = await api.journals.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to update entry:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      await api.journals.delete(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      // Refresh stats
      const statsRes = await api.journals.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesCategory = filterCategory === 'all' || entry.category === filterCategory;
    const matchesSearch = !searchQuery ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.authors?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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
        title="Journal Reading"
        description="Track research papers and journal articles"
        actions={
          <Button onClick={() => {
            setEditingEntry(null);
            setShowModal(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        }
      />

      {/* Stats Overview */}
      {stats && stats.totalEntries > 0 && (
        <PageSection title="Reading Statistics">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Total Papers"
              value={stats.totalEntries.toString()}
              icon={<FileText className="h-5 w-5" />}
            />
            <StatCard
              label="Reading Hours"
              value={(stats.totalReadingMinutes / 60).toFixed(1)}
              icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
              label="Avg. Usefulness"
              value={stats.averageUsefulness?.toFixed(1) || 'N/A'}
              icon={<Star className="h-5 w-5" />}
              suffix="/5"
            />
            <StatCard
              label="Categories"
              value={Object.keys(stats.byCategory).length.toString()}
              icon={<BookOpen className="h-5 w-5" />}
            />
          </div>

          {/* Category breakdown */}
          {Object.keys(stats.byCategory).length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Papers by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.byCategory).map(([category, count]) => (
                    <Badge key={category} variant="neutral" className="text-sm">
                      {getCategoryLabel(category)}: {count}
                    </Badge>
                  ))}
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
            placeholder="Search papers..."
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
          {CATEGORIES.slice(0, 4).map(({ value, label }) => (
            <Button
              key={value}
              variant={filterCategory === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {entries.length === 0 ? 'No journal entries yet.' : 'No entries match your search.'}
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
                Add Your First Paper
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
        <JournalModal
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
  suffix
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
  entry: JournalEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className="font-medium">{entry.title}</h3>
              <Badge variant={getCategoryVariant(entry.category)}>
                {getCategoryLabel(entry.category)}
              </Badge>
              <Badge variant="neutral">
                {getContentTypeLabel(entry.contentType)}
              </Badge>
            </div>
            {entry.authors && (
              <p className="text-sm text-muted-foreground mt-1">{entry.authors}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
              <span>{formatDate(new Date(entry.date), { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {entry.timeSpentMin && <span>• {entry.timeSpentMin} min reading</span>}
              {entry.ratingUsefulness && (
                <span className="flex items-center gap-1">
                  • <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {entry.ratingUsefulness}/5
                </span>
              )}
              {entry.source && <span>• {entry.source}</span>}
            </div>

            {entry.summary && (
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{entry.summary}</p>
            )}

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-4 space-y-3 border-t pt-4">
                {entry.keyInsights && (
                  <div>
                    <h4 className="text-sm font-medium">Key Insights</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.keyInsights}</p>
                  </div>
                )}
                {entry.keyDataPoints && (
                  <div>
                    <h4 className="text-sm font-medium">Key Data Points</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.keyDataPoints}</p>
                  </div>
                )}
                {entry.methodsSummary && (
                  <div>
                    <h4 className="text-sm font-medium">Methods Summary</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.methodsSummary}</p>
                  </div>
                )}
                {entry.limitations && (
                  <div>
                    <h4 className="text-sm font-medium">Limitations</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.limitations}</p>
                  </div>
                )}
                {entry.openQuestion && (
                  <div>
                    <h4 className="text-sm font-medium">Open Questions</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.openQuestion}</p>
                  </div>
                )}
                {entry.projectRelevance && (
                  <div>
                    <h4 className="text-sm font-medium">Project Relevance</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.projectRelevance}</p>
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

function JournalModal({
  entry,
  onClose,
  onSave,
}: {
  entry: JournalEntry | null;
  onClose: () => void;
  onSave: (data: Partial<JournalEntry>) => void;
}) {
  const [formData, setFormData] = React.useState({
    date: toLocalDateString(entry?.date),
    title: entry?.title || '',
    authors: entry?.authors || '',
    source: entry?.source || '',
    category: entry?.category || 'other',
    contentType: entry?.contentType || 'original',
    timeSpentMin: entry?.timeSpentMin || '',
    summary: entry?.summary || '',
    keyInsights: entry?.keyInsights || '',
    keyDataPoints: entry?.keyDataPoints || '',
    methodsSummary: entry?.methodsSummary || '',
    limitations: entry?.limitations || '',
    openQuestion: entry?.openQuestion || '',
    projectRelevance: entry?.projectRelevance || '',
    confidenceScore: entry?.confidenceScore || '',
    ratingUsefulness: entry?.ratingUsefulness || '',
  });
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'basic' | 'notes'>('basic');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      date: new Date(formData.date).toISOString(),
      title: formData.title,
      authors: formData.authors || undefined,
      source: formData.source || undefined,
      category: formData.category,
      contentType: formData.contentType,
      timeSpentMin: formData.timeSpentMin ? Number(formData.timeSpentMin) : undefined,
      summary: formData.summary || undefined,
      keyInsights: formData.keyInsights || undefined,
      keyDataPoints: formData.keyDataPoints || undefined,
      methodsSummary: formData.methodsSummary || undefined,
      limitations: formData.limitations || undefined,
      openQuestion: formData.openQuestion || undefined,
      projectRelevance: formData.projectRelevance || undefined,
      confidenceScore: formData.confidenceScore ? Number(formData.confidenceScore) : undefined,
      ratingUsefulness: formData.ratingUsefulness ? Number(formData.ratingUsefulness) : undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {entry ? 'Edit Journal Entry' : 'Add Journal Entry'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
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
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'notes'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Notes & Insights
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {activeTab === 'basic' && (
            <>
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Paper title"
                  required
                />
              </div>

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
                  <label className="text-sm font-medium">Reading Time (min)</label>
                  <Input
                    type="number"
                    value={formData.timeSpentMin}
                    onChange={(e) => setFormData({ ...formData, timeSpentMin: e.target.value })}
                    placeholder="45"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Authors</label>
                <Input
                  value={formData.authors}
                  onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                  placeholder="Smith et al., 2024"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Source / Journal</label>
                <Input
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="Nature, DOI, URL..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {CATEGORIES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Content Type</label>
                  <select
                    value={formData.contentType}
                    onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {CONTENT_TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Usefulness (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.ratingUsefulness}
                    onChange={(e) => setFormData({ ...formData, ratingUsefulness: e.target.value })}
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Confidence (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.confidenceScore}
                    onChange={(e) => setFormData({ ...formData, confidenceScore: e.target.value })}
                    placeholder="3"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Summary</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Brief summary of the paper..."
                />
              </div>
            </>
          )}

          {activeTab === 'notes' && (
            <>
              <div>
                <label className="text-sm font-medium">Key Insights</label>
                <textarea
                  value={formData.keyInsights}
                  onChange={(e) => setFormData({ ...formData, keyInsights: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Main findings and takeaways..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Key Data Points</label>
                <textarea
                  value={formData.keyDataPoints}
                  onChange={(e) => setFormData({ ...formData, keyDataPoints: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Important numbers, statistics, results..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Methods Summary</label>
                <textarea
                  value={formData.methodsSummary}
                  onChange={(e) => setFormData({ ...formData, methodsSummary: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Research methodology used..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Limitations</label>
                <textarea
                  value={formData.limitations}
                  onChange={(e) => setFormData({ ...formData, limitations: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Study limitations and gaps..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Open Questions</label>
                <textarea
                  value={formData.openQuestion}
                  onChange={(e) => setFormData({ ...formData, openQuestion: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Questions raised for future research..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Project Relevance</label>
                <textarea
                  value={formData.projectRelevance}
                  onChange={(e) => setFormData({ ...formData, projectRelevance: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="How this relates to your project..."
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
              {entry ? 'Update' : 'Save'} Entry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getCategoryLabel(category: string): string {
  const cat = CATEGORIES.find((c) => c.value === category);
  return cat?.label || category;
}

function getContentTypeLabel(contentType: string): string {
  const type = CONTENT_TYPES.find((t) => t.value === contentType);
  return type?.label || contentType;
}

function getCategoryVariant(category: string): 'success' | 'warning' | 'error' | 'neutral' {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
    microalgae: 'success',
    co2_fixation: 'success',
    bioprocess: 'warning',
    sustainability: 'success',
    engineering: 'neutral',
    data_science: 'warning',
    other: 'neutral',
  };
  return variants[category] || 'neutral';
}
