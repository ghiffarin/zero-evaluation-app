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
  GraduationCap,
  BookOpen,
  FileText,
  Code,
  PenTool,
  Briefcase,
  FolderKanban,
  Users,
  DollarSign,
  Lightbulb,
  Building,
  MoreHorizontal,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  AlertCircle,
  Timer,
  TrendingUp,
  BarChart3,
  StickyNote,
  Link,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { formatDate, getTodayISO } from '@/lib/utils';

// Types
interface PrepSession {
  id: string;
  date: string;
  timeSpentMin?: number;
  notes?: string;
}

interface PrepItem {
  id: string;
  category: string;
  subcategory?: string;
  taskTitle: string;
  description?: string;
  relatedGoalId?: string;
  priority?: number;
  status: string;
  progressPercent?: number;
  timeSpentMin?: number;
  outputSummary?: string;
  outputLink?: string;
  readinessScore?: number;
  nextStep?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  sessions?: PrepSession[];
  relatedGoal?: { id: string; title: string };
}

interface PrepStats {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  notStartedItems: number;
  overallProgress: number;
  overallReadiness: number | null;
  totalMinutes: number;
  byCategory: Record<string, {
    total: number;
    completed: number;
    inProgress: number;
    totalMinutes: number;
    averageProgress: number;
    averageReadiness: number | null;
  }>;
  byStatus: Record<string, number>;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

interface ReadinessBreakdown {
  [category: string]: {
    items: PrepItem[];
    averageReadiness: number;
    averageProgress: number;
  };
}

interface QuickNote {
  id: string;
  title: string;
  description?: string;
  link?: string;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'ielts', label: 'IELTS', icon: BookOpen },
  { value: 'journal', label: 'Journal/Publication', icon: FileText },
  { value: 'research_skills', label: 'Research Skills', icon: GraduationCap },
  { value: 'technical', label: 'Technical Skills', icon: Code },
  { value: 'writing', label: 'Academic Writing', icon: PenTool },
  { value: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { value: 'project_experience', label: 'Project Experience', icon: FolderKanban },
  { value: 'cv_docs', label: 'CV & Documents', icon: FileText },
  { value: 'recommendations', label: 'Recommendations', icon: Users },
  { value: 'financial', label: 'Financial Planning', icon: DollarSign },
  { value: 'strategy', label: 'Application Strategy', icon: Lightbulb },
  { value: 'university_research', label: 'University Research', icon: Building },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
] as const;

const STATUSES = [
  { value: 'not_started', label: 'Not Started', icon: Circle, color: 'text-gray-500' },
  { value: 'in_progress', label: 'In Progress', icon: PlayCircle, color: 'text-blue-500' },
  { value: 'halfway', label: 'Halfway', icon: Timer, color: 'text-yellow-500' },
  { value: 'almost_done', label: 'Almost Done', icon: AlertCircle, color: 'text-orange-500' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-500' },
] as const;

export default function MastersPrepPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = React.useState<PrepItem[]>([]);
  const [stats, setStats] = React.useState<PrepStats | null>(null);
  const [readinessBreakdown, setReadinessBreakdown] = React.useState<ReadinessBreakdown | null>(null);
  const [notes, setNotes] = React.useState<QuickNote[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showItemModal, setShowItemModal] = React.useState(false);
  const [showSessionModal, setShowSessionModal] = React.useState(false);
  const [showNoteModal, setShowNoteModal] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<PrepItem | null>(null);
  const [editingNote, setEditingNote] = React.useState<QuickNote | null>(null);
  const [sessionItemId, setSessionItemId] = React.useState<string | null>(null);

  // Filters & View
  const [activeTab, setActiveTab] = React.useState<'items' | 'readiness' | 'notes'>('items');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedItem, setExpandedItem] = React.useState<string | null>(null);
  const [noteSearchQuery, setNoteSearchQuery] = React.useState('');

  // Fetch data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [itemsRes, statsRes, readinessRes, notesRes] = await Promise.all([
          api.mastersPrep.list({ limit: 100 }),
          api.mastersPrep.stats(),
          api.mastersPrep.readiness(),
          api.mastersPrep.notes.list({ limit: 100 }),
        ]);
        setItems((itemsRes as any).data || []);
        setStats((statsRes as any).data || null);
        setReadinessBreakdown((readinessRes as any).data || null);
        setNotes((notesRes as any).data || []);
      } catch (err) {
        console.error('Failed to fetch masters prep data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAuthenticated]);

  // Refresh stats
  const refreshData = async () => {
    try {
      const [itemsRes, statsRes, readinessRes, notesRes] = await Promise.all([
        api.mastersPrep.list({ limit: 100 }),
        api.mastersPrep.stats(),
        api.mastersPrep.readiness(),
        api.mastersPrep.notes.list({ limit: 100 }),
      ]);
      setItems((itemsRes as any).data || []);
      setStats((statsRes as any).data || null);
      setReadinessBreakdown((readinessRes as any).data || null);
      setNotes((notesRes as any).data || []);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  // CRUD handlers
  const handleCreate = async (data: Partial<PrepItem>) => {
    try {
      const res = await api.mastersPrep.create(data);
      setItems((prev) => [(res as any).data, ...prev]);
      setShowItemModal(false);
      refreshData();
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  };

  const handleUpdate = async (id: string, data: Partial<PrepItem>) => {
    try {
      const res = await api.mastersPrep.update(id, data);
      setItems((prev) => prev.map((i) => (i.id === id ? (res as any).data : i)));
      setEditingItem(null);
      setShowItemModal(false);
      refreshData();
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.mastersPrep.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      refreshData();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleAddSession = async (itemId: string, data: { date: string; timeSpentMin?: number; notes?: string }) => {
    try {
      await api.mastersPrep.addSession(itemId, data);
      setShowSessionModal(false);
      setSessionItemId(null);
      refreshData();
    } catch (err) {
      console.error('Failed to add session:', err);
    }
  };

  // Note CRUD handlers
  const handleCreateNote = async (data: Partial<QuickNote>) => {
    try {
      const res = await api.mastersPrep.notes.create(data);
      setNotes((prev) => [(res as any).data, ...prev]);
      setShowNoteModal(false);
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleUpdateNote = async (id: string, data: Partial<QuickNote>) => {
    try {
      const res = await api.mastersPrep.notes.update(id, data);
      setNotes((prev) => prev.map((n) => (n.id === id ? (res as any).data : n)));
      setEditingNote(null);
      setShowNoteModal(false);
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.mastersPrep.notes.delete(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      item.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subcategory?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    if (!noteSearchQuery) return true;
    return (
      note.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
      note.description?.toLowerCase().includes(noteSearchQuery.toLowerCase())
    );
  });

  // Format minutes to hours and minutes
  function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  // Get readiness color
  function getReadinessColor(score: number | null): string {
    if (score === null) return 'text-gray-400';
    if (score >= 4) return 'text-green-500';
    if (score >= 3) return 'text-yellow-500';
    if (score >= 2) return 'text-orange-500';
    return 'text-red-500';
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
        title="Master's Prep"
        description="Track your master's degree preparation progress"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingNote(null);
                setShowNoteModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
            <Button
              onClick={() => {
                setEditingItem(null);
                setShowItemModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Prep Item
            </Button>
          </div>
        }
      />

      {/* Stats Overview */}
      {stats && stats.totalItems > 0 && (
        <PageSection title="Preparation Overview">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <StatCard
              label="Total Items"
              value={stats.totalItems.toString()}
              icon={<GraduationCap className="h-5 w-5" />}
            />
            <StatCard
              label="Completed"
              value={stats.completedItems.toString()}
              icon={<CheckCircle2 className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              label="In Progress"
              value={stats.inProgressItems.toString()}
              icon={<PlayCircle className="h-5 w-5" />}
              variant="info"
            />
            <StatCard
              label="Overall Progress"
              value={`${stats.overallProgress.toFixed(0)}%`}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label="Readiness"
              value={stats.overallReadiness?.toFixed(1) || '-'}
              icon={<Target className="h-5 w-5" />}
              suffix="/5"
              variant={stats.overallReadiness && stats.overallReadiness >= 3 ? 'success' : 'warning'}
            />
            <StatCard
              label="Time Invested"
              value={formatMinutes(stats.totalMinutes)}
              icon={<Clock className="h-5 w-5" />}
            />
          </div>

          {/* Progress by Priority */}
          <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Badge variant="error">P1</Badge> High Priority
                    </span>
                    <span className="font-medium">{stats.byPriority.high}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Badge variant="warning">P2</Badge> Medium Priority
                    </span>
                    <span className="font-medium">{stats.byPriority.medium}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Badge variant="success">P3</Badge> Low Priority
                    </span>
                    <span className="font-medium">{stats.byPriority.low}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {STATUSES.map(({ value, label, color }) => {
                    const count = stats.byStatus[value] || 0;
                    const percentage = stats.totalItems > 0 ? (count / stats.totalItems) * 100 : 0;
                    return (
                      <div key={value}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={color}>{label}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </PageSection>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'items'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('items')}
        >
          Prep Items ({items.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'readiness'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('readiness')}
        >
          Readiness by Category
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'notes'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('notes')}
        >
          Quick Notes ({notes.length})
        </button>
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
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

          {/* Items List */}
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {items.length === 0 ? 'No prep items yet.' : 'No items match your filters.'}
                </p>
                {items.length === 0 && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setEditingItem(null);
                      setShowItemModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Prep Item
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <PrepItemCard
                  key={item.id}
                  item={item}
                  isExpanded={expandedItem === item.id}
                  onToggleExpand={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  onEdit={() => {
                    setEditingItem(item);
                    setShowItemModal(true);
                  }}
                  onDelete={() => handleDelete(item.id)}
                  onAddSession={() => {
                    setSessionItemId(item.id);
                    setShowSessionModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Readiness Tab */}
      {activeTab === 'readiness' && readinessBreakdown && (
        <div className="space-y-6">
          {Object.entries(readinessBreakdown).map(([category, data]) => {
            const categoryInfo = CATEGORIES.find((c) => c.value === category);
            const CategoryIcon = categoryInfo?.icon || GraduationCap;
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CategoryIcon className="h-5 w-5" />
                      {categoryInfo?.label || category}
                    </span>
                    <div className="flex items-center gap-4 text-sm font-normal">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        Progress: {data.averageProgress.toFixed(0)}%
                      </span>
                      <span className={`flex items-center gap-1 ${getReadinessColor(data.averageReadiness)}`}>
                        <Target className="h-4 w-4" />
                        Readiness: {data.averageReadiness?.toFixed(1) || '-'}/5
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.items.map((item) => {
                      const statusInfo = STATUSES.find((s) => s.value === item.status);
                      const StatusIcon = statusInfo?.icon || Circle;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            setEditingItem(item as PrepItem);
                            setShowItemModal(true);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <StatusIcon className={`h-4 w-4 ${statusInfo?.color || ''}`} />
                            <div>
                              <p className="font-medium text-sm">{item.taskTitle}</p>
                              {item.subcategory && (
                                <p className="text-xs text-muted-foreground">{item.subcategory}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {item.priority && (
                              <Badge
                                variant={item.priority === 1 ? 'error' : item.priority === 2 ? 'warning' : 'success'}
                              >
                                P{item.priority}
                              </Badge>
                            )}
                            <div className="text-right">
                              <p className="text-sm">{item.progressPercent || 0}%</p>
                              <p className={`text-xs ${getReadinessColor(item.readinessScore || null)}`}>
                                {item.readinessScore ? `${item.readinessScore}/5` : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {Object.keys(readinessBreakdown).length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No prep items to show readiness breakdown.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <>
          {/* Search */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={noteSearchQuery}
                onChange={(e) => setNoteSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {notes.length === 0 ? 'No quick notes yet.' : 'No notes match your search.'}
                </p>
                {notes.length === 0 && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setEditingNote(null);
                      setShowNoteModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Note
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StickyNote className="h-4 w-4 text-primary" />
                          <span className="font-medium">{note.title}</span>
                          {note.link && (
                            <a
                              href={note.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link className="h-3 w-3" />
                              Link
                            </a>
                          )}
                        </div>
                        {note.description && (
                          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {note.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Added {formatDate(new Date(note.createdAt), { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingNote(note);
                            setShowNoteModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <PrepItemModal
          item={editingItem}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
          onSave={(data) => {
            if (editingItem) {
              handleUpdate(editingItem.id, data);
            } else {
              handleCreate(data);
            }
          }}
        />
      )}

      {/* Session Modal */}
      {showSessionModal && sessionItemId && (
        <SessionModal
          onClose={() => {
            setShowSessionModal(false);
            setSessionItemId(null);
          }}
          onSave={(data) => handleAddSession(sessionItemId, data)}
        />
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <NoteModal
          note={editingNote}
          onClose={() => {
            setShowNoteModal(false);
            setEditingNote(null);
          }}
          onSave={(data) => {
            if (editingNote) {
              handleUpdateNote(editingNote.id, data);
            } else {
              handleCreateNote(data);
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

function PrepItemCard({
  item,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddSession,
}: {
  item: PrepItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSession: () => void;
}) {
  const categoryInfo = CATEGORIES.find((c) => c.value === item.category);
  const CategoryIcon = categoryInfo?.icon || GraduationCap;
  const statusInfo = STATUSES.find((s) => s.value === item.status);
  const StatusIcon = statusInfo?.icon || Circle;

  // Format minutes to hours and minutes
  function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryIcon className="h-4 w-4 text-primary" />
              <span className="font-medium">{item.taskTitle}</span>
              <Badge variant="neutral" className="text-xs">
                {categoryInfo?.label || item.category}
              </Badge>
              <Badge
                variant={getStatusBadgeVariant(item.status)}
                className="text-xs flex items-center gap-1"
              >
                <StatusIcon className="h-3 w-3" />
                {statusInfo?.label || item.status}
              </Badge>
              {item.priority && (
                <Badge
                  variant={item.priority === 1 ? 'error' : item.priority === 2 ? 'warning' : 'success'}
                  className="text-xs"
                >
                  P{item.priority}
                </Badge>
              )}
            </div>

            {item.subcategory && (
              <p className="text-sm text-muted-foreground mt-1">{item.subcategory}</p>
            )}

            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {item.progressPercent || 0}%
              </span>
              {item.readinessScore && (
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Readiness: {item.readinessScore}/5
                </span>
              )}
              {item.timeSpentMin && item.timeSpentMin > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatMinutes(item.timeSpentMin)}
                </span>
              )}
              {item.outputLink && (
                <a
                  href={item.outputLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  Output
                </a>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <Progress value={item.progressPercent || 0} className="h-2" />
            </div>

            {item.description && (
              <p className="mt-2 text-sm line-clamp-2">{item.description}</p>
            )}

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-4 space-y-3 border-t pt-4">
                {item.outputSummary && (
                  <div>
                    <h4 className="text-sm font-medium">Output Summary</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.outputSummary}</p>
                  </div>
                )}
                {item.nextStep && (
                  <div>
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <ArrowRight className="h-4 w-4" />
                      Next Step
                    </h4>
                    <p className="text-sm text-muted-foreground">{item.nextStep}</p>
                  </div>
                )}
                {item.notes && (
                  <div>
                    <h4 className="text-sm font-medium">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.notes}</p>
                  </div>
                )}
                {item.sessions && item.sessions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Recent Sessions</h4>
                    <div className="space-y-2">
                      {item.sessions.slice(0, 5).map((session) => (
                        <div key={session.id} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{formatDate(new Date(session.date), { month: 'short', day: 'numeric' })}</span>
                          {session.timeSpentMin && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {session.timeSpentMin}m
                            </span>
                          )}
                          {session.notes && <span className="truncate">- {session.notes}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-1 ml-2">
            <Button variant="ghost" size="sm" onClick={onAddSession} title="Log session">
              <Timer className="h-4 w-4" />
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
        </div>
      </CardContent>
    </Card>
  );
}

function PrepItemModal({
  item,
  onClose,
  onSave,
}: {
  item: PrepItem | null;
  onClose: () => void;
  onSave: (data: Partial<PrepItem>) => void;
}) {
  const [formData, setFormData] = React.useState({
    category: item?.category || 'ielts',
    subcategory: item?.subcategory || '',
    taskTitle: item?.taskTitle || '',
    description: item?.description || '',
    priority: item?.priority || '',
    status: item?.status || 'not_started',
    progressPercent: item?.progressPercent || 0,
    outputSummary: item?.outputSummary || '',
    outputLink: item?.outputLink || '',
    readinessScore: item?.readinessScore || '',
    nextStep: item?.nextStep || '',
    notes: item?.notes || '',
  });
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  const tabs = ['Basic', 'Progress', 'Output', 'Notes'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      taskTitle: formData.taskTitle,
      description: formData.description || undefined,
      priority: formData.priority ? Number(formData.priority) : undefined,
      status: formData.status,
      progressPercent: Number(formData.progressPercent),
      outputSummary: formData.outputSummary || undefined,
      outputLink: formData.outputLink || undefined,
      readinessScore: formData.readinessScore ? Number(formData.readinessScore) : undefined,
      nextStep: formData.nextStep || undefined,
      notes: formData.notes || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{item ? 'Edit Prep Item' : 'Add Prep Item'}</h2>
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
                <label className="text-sm font-medium">Subcategory</label>
                <Input
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="e.g., Speaking, Writing Task 2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Task Title *</label>
                <Input
                  value={formData.taskTitle}
                  onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
                  placeholder="What needs to be done?"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Detailed description..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select priority...</option>
                  <option value="1">1 - High Priority</option>
                  <option value="2">2 - Medium Priority</option>
                  <option value="3">3 - Low Priority</option>
                </select>
              </div>
            </>
          )}

          {/* Progress Tab */}
          {activeTab === 1 && (
            <>
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

              <div>
                <label className="text-sm font-medium">Progress ({formData.progressPercent}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progressPercent}
                  onChange={(e) => setFormData({ ...formData, progressPercent: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Readiness Score (1-5)</label>
                <select
                  value={formData.readinessScore}
                  onChange={(e) => setFormData({ ...formData, readinessScore: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select readiness...</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} - {['Not Ready', 'Needs Work', 'Getting There', 'Almost Ready', 'Fully Ready'][n - 1]}
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

          {/* Output Tab */}
          {activeTab === 2 && (
            <>
              <div>
                <label className="text-sm font-medium">Output Summary</label>
                <textarea
                  value={formData.outputSummary}
                  onChange={(e) => setFormData({ ...formData, outputSummary: e.target.value })}
                  className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="What was produced or achieved?"
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
                placeholder="Additional notes, resources, thoughts..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {item ? 'Update' : 'Add'} Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SessionModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: { date: string; timeSpentMin?: number; notes?: string }) => void;
}) {
  const [formData, setFormData] = React.useState({
    date: getTodayISO(),
    timeSpentMin: '',
    notes: '',
  });
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      date: new Date(formData.date).toISOString(),
      timeSpentMin: formData.timeSpentMin ? Number(formData.timeSpentMin) : undefined,
      notes: formData.notes || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Log Study Session</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
            <label className="text-sm font-medium">Time Spent (minutes)</label>
            <Input
              type="number"
              value={formData.timeSpentMin}
              onChange={(e) => setFormData({ ...formData, timeSpentMin: e.target.value })}
              placeholder="30"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              placeholder="What did you work on?"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log Session
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NoteModal({
  note,
  onClose,
  onSave,
}: {
  note: QuickNote | null;
  onClose: () => void;
  onSave: (data: Partial<QuickNote>) => void;
}) {
  const [formData, setFormData] = React.useState({
    title: note?.title || '',
    description: note?.description || '',
    link: note?.link || '',
  });
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      title: formData.title,
      description: formData.description || undefined,
      link: formData.link || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{note ? 'Edit Note' : 'Add Quick Note'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Note title..."
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              placeholder="Additional details..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Link</label>
            <Input
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {note ? 'Update' : 'Add'} Note
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
    case 'completed':
      return 'success';
    case 'almost_done':
      return 'warning';
    case 'halfway':
      return 'warning';
    case 'in_progress':
      return 'info';
    default:
      return 'neutral';
  }
}
