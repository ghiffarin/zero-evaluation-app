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
  Eye,
  MapPin,
  Calendar,
  Award,
  Globe,
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

interface University {
  id: string;
  universityName: string;
  country?: string;
  programName?: string;
  specialization?: string;
  programLength?: string;
  tuitionPerYear?: string;
  livingCostPerYear?: string;
  admissionRequirements?: string;
  englishTest?: string;
  applicationDeadline?: string;
  fundingOptions?: string;
  websiteUrl?: string;
  notes?: string;
  priority?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Scholarship {
  id: string;
  universityId?: string;
  name: string;
  provider?: string;
  type: string;
  amount?: string;
  currency?: string;
  coverage?: string;
  eligibility?: string;
  applicationLink?: string;
  websiteUrl?: string;
  deadline?: string;
  status: string;
  priority?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  university?: { id: string; universityName: string; country?: string };
}

const SCHOLARSHIP_TYPES = [
  { value: 'full', label: 'Full Scholarship' },
  { value: 'partial', label: 'Partial Scholarship' },
  { value: 'tuition', label: 'Tuition Only' },
  { value: 'living', label: 'Living Expenses' },
  { value: 'travel', label: 'Travel Grant' },
  { value: 'research', label: 'Research Grant' },
  { value: 'other', label: 'Other' },
] as const;

const SCHOLARSHIP_STATUSES = [
  { value: 'researching', label: 'Researching' },
  { value: 'eligible', label: 'Eligible' },
  { value: 'applying', label: 'Applying' },
  { value: 'applied', label: 'Applied' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
] as const;

const UNIVERSITY_STATUSES = [
  { value: 'researching', label: 'Researching' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'applying', label: 'Applying' },
  { value: 'applied', label: 'Applied' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'enrolled', label: 'Enrolled' },
] as const;

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
  const [universities, setUniversities] = React.useState<University[]>([]);
  const [scholarships, setScholarships] = React.useState<Scholarship[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showItemModal, setShowItemModal] = React.useState(false);
  const [showSessionModal, setShowSessionModal] = React.useState(false);
  const [showNoteModal, setShowNoteModal] = React.useState(false);
  const [showUniversityModal, setShowUniversityModal] = React.useState(false);
  const [showScholarshipModal, setShowScholarshipModal] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<PrepItem | null>(null);
  const [editingNote, setEditingNote] = React.useState<QuickNote | null>(null);
  const [editingUniversity, setEditingUniversity] = React.useState<University | null>(null);
  const [editingScholarship, setEditingScholarship] = React.useState<Scholarship | null>(null);
  const [sessionItemId, setSessionItemId] = React.useState<string | null>(null);
  const [previewUniversity, setPreviewUniversity] = React.useState<University | null>(null);
  const [previewScholarship, setPreviewScholarship] = React.useState<Scholarship | null>(null);

  // Filters & View
  const [activeTab, setActiveTab] = React.useState<'items' | 'readiness' | 'notes' | 'universities' | 'scholarships'>('items');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedItem, setExpandedItem] = React.useState<string | null>(null);
  const [noteSearchQuery, setNoteSearchQuery] = React.useState('');
  const [universitySearchQuery, setUniversitySearchQuery] = React.useState('');
  const [scholarshipSearchQuery, setScholarshipSearchQuery] = React.useState('');

  // Fetch data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [itemsRes, statsRes, readinessRes, notesRes, universitiesRes, scholarshipsRes] = await Promise.all([
          api.mastersPrep.list({ limit: 100 }),
          api.mastersPrep.stats(),
          api.mastersPrep.readiness(),
          api.mastersPrep.notes.list({ limit: 100 }),
          api.mastersPrep.universities.list({ limit: 100 }),
          api.mastersPrep.scholarships.list({ limit: 100 }),
        ]);
        setItems((itemsRes as any).data || []);
        setStats((statsRes as any).data || null);
        setReadinessBreakdown((readinessRes as any).data || null);
        setNotes((notesRes as any).data || []);
        setUniversities((universitiesRes as any).data || []);
        setScholarships((scholarshipsRes as any).data || []);
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
      const [itemsRes, statsRes, readinessRes, notesRes, universitiesRes, scholarshipsRes] = await Promise.all([
        api.mastersPrep.list({ limit: 100 }),
        api.mastersPrep.stats(),
        api.mastersPrep.readiness(),
        api.mastersPrep.notes.list({ limit: 100 }),
        api.mastersPrep.universities.list({ limit: 100 }),
        api.mastersPrep.scholarships.list({ limit: 100 }),
      ]);
      setItems((itemsRes as any).data || []);
      setStats((statsRes as any).data || null);
      setReadinessBreakdown((readinessRes as any).data || null);
      setNotes((notesRes as any).data || []);
      setUniversities((universitiesRes as any).data || []);
      setScholarships((scholarshipsRes as any).data || []);
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

  // University CRUD handlers
  const handleCreateUniversity = async (data: Partial<University>) => {
    try {
      const res = await api.mastersPrep.universities.create(data);
      setUniversities((prev) => [(res as any).data, ...prev]);
      setShowUniversityModal(false);
    } catch (err) {
      console.error('Failed to create university:', err);
    }
  };

  const handleUpdateUniversity = async (id: string, data: Partial<University>) => {
    try {
      const res = await api.mastersPrep.universities.update(id, data);
      setUniversities((prev) => prev.map((u) => (u.id === id ? (res as any).data : u)));
      setEditingUniversity(null);
      setShowUniversityModal(false);
    } catch (err) {
      console.error('Failed to update university:', err);
    }
  };

  const handleDeleteUniversity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this university?')) return;
    try {
      await api.mastersPrep.universities.delete(id);
      setUniversities((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error('Failed to delete university:', err);
    }
  };

  // Scholarship CRUD handlers
  const handleCreateScholarship = async (data: Partial<Scholarship>) => {
    try {
      const res = await api.mastersPrep.scholarships.create(data);
      setScholarships((prev) => [(res as any).data, ...prev]);
      setShowScholarshipModal(false);
    } catch (err) {
      console.error('Failed to create scholarship:', err);
    }
  };

  const handleUpdateScholarship = async (id: string, data: Partial<Scholarship>) => {
    try {
      const res = await api.mastersPrep.scholarships.update(id, data);
      setScholarships((prev) => prev.map((s) => (s.id === id ? (res as any).data : s)));
      setEditingScholarship(null);
      setShowScholarshipModal(false);
    } catch (err) {
      console.error('Failed to update scholarship:', err);
    }
  };

  const handleDeleteScholarship = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scholarship?')) return;
    try {
      await api.mastersPrep.scholarships.delete(id);
      setScholarships((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete scholarship:', err);
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

  // Filter universities
  const filteredUniversities = universities.filter((uni) => {
    if (!universitySearchQuery) return true;
    const query = universitySearchQuery.toLowerCase();
    return (
      uni.universityName.toLowerCase().includes(query) ||
      uni.country?.toLowerCase().includes(query) ||
      uni.programName?.toLowerCase().includes(query) ||
      uni.specialization?.toLowerCase().includes(query)
    );
  });

  // Filter scholarships
  const filteredScholarships = scholarships.filter((sch) => {
    if (!scholarshipSearchQuery) return true;
    const query = scholarshipSearchQuery.toLowerCase();
    return (
      sch.name.toLowerCase().includes(query) ||
      sch.provider?.toLowerCase().includes(query) ||
      sch.university?.universityName?.toLowerCase().includes(query) ||
      sch.coverage?.toLowerCase().includes(query)
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
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'universities'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('universities')}
        >
          Universities ({universities.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'scholarships'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('scholarships')}
        >
          Scholarships ({scholarships.length})
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

      {/* Universities Tab */}
      {activeTab === 'universities' && (
        <>
          {/* Search and Add */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search universities..."
                value={universitySearchQuery}
                onChange={(e) => setUniversitySearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => {
                setEditingUniversity(null);
                setShowUniversityModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add University
            </Button>
          </div>

          {/* Universities Table */}
          {filteredUniversities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {universities.length === 0 ? 'No universities added yet.' : 'No universities match your search.'}
                </p>
                {universities.length === 0 && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setEditingUniversity(null);
                      setShowUniversityModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First University
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 text-sm font-medium">University</th>
                    <th className="text-left p-3 text-sm font-medium">Country</th>
                    <th className="text-left p-3 text-sm font-medium">Program</th>
                    <th className="text-left p-3 text-sm font-medium">Length</th>
                    <th className="text-left p-3 text-sm font-medium">Tuition/yr</th>
                    <th className="text-left p-3 text-sm font-medium">Living/yr</th>
                    <th className="text-left p-3 text-sm font-medium">Deadline</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-center p-3 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUniversities.map((uni) => (
                    <tr
                      key={uni.id}
                      className="border-b hover:bg-muted/30 cursor-pointer"
                      onClick={() => setPreviewUniversity(uni)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {uni.priority && (
                            <Badge
                              variant={uni.priority === 1 ? 'error' : uni.priority === 2 ? 'warning' : 'success'}
                              className="text-xs"
                            >
                              P{uni.priority}
                            </Badge>
                          )}
                          <span className="font-medium">{uni.universityName}</span>
                        </div>
                        {uni.specialization && (
                          <p className="text-xs text-muted-foreground mt-1">{uni.specialization}</p>
                        )}
                      </td>
                      <td className="p-3 text-sm">{uni.country || '-'}</td>
                      <td className="p-3 text-sm">{uni.programName || '-'}</td>
                      <td className="p-3 text-sm">{uni.programLength || '-'}</td>
                      <td className="p-3 text-sm">{uni.tuitionPerYear || '-'}</td>
                      <td className="p-3 text-sm">{uni.livingCostPerYear || '-'}</td>
                      <td className="p-3 text-sm">{uni.applicationDeadline || '-'}</td>
                      <td className="p-3">
                        <Badge variant={getUniversityStatusVariant(uni.status)}>
                          {UNIVERSITY_STATUSES.find(s => s.value === uni.status)?.label || uni.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingUniversity(uni);
                              setShowUniversityModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUniversity(uni.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Scholarships Tab */}
      {activeTab === 'scholarships' && (
        <>
          {/* Search and Add */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scholarships..."
                value={scholarshipSearchQuery}
                onChange={(e) => setScholarshipSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => {
                setEditingScholarship(null);
                setShowScholarshipModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Scholarship
            </Button>
          </div>

          {/* Scholarships Table */}
          {filteredScholarships.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {scholarships.length === 0 ? 'No scholarships added yet.' : 'No scholarships match your search.'}
                </p>
                {scholarships.length === 0 && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setEditingScholarship(null);
                      setShowScholarshipModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Scholarship
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 text-sm font-medium">Scholarship</th>
                    <th className="text-left p-3 text-sm font-medium">University</th>
                    <th className="text-left p-3 text-sm font-medium">Type</th>
                    <th className="text-left p-3 text-sm font-medium">Amount</th>
                    <th className="text-left p-3 text-sm font-medium">Deadline</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-center p-3 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScholarships.map((sch) => (
                    <tr
                      key={sch.id}
                      className="border-b hover:bg-muted/30 cursor-pointer"
                      onClick={() => setPreviewScholarship(sch)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {sch.priority && (
                            <Badge
                              variant={sch.priority === 1 ? 'error' : sch.priority === 2 ? 'warning' : 'success'}
                              className="text-xs"
                            >
                              P{sch.priority}
                            </Badge>
                          )}
                          <span className="font-medium">{sch.name}</span>
                        </div>
                        {sch.provider && (
                          <p className="text-xs text-muted-foreground mt-1">{sch.provider}</p>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {sch.university ? (
                          <span>{sch.university.universityName}</span>
                        ) : (
                          <span className="text-muted-foreground">Any/General</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {SCHOLARSHIP_TYPES.find(t => t.value === sch.type)?.label || sch.type}
                      </td>
                      <td className="p-3 text-sm">{sch.amount || '-'}</td>
                      <td className="p-3 text-sm">{sch.deadline || '-'}</td>
                      <td className="p-3">
                        <Badge variant={getScholarshipStatusVariant(sch.status)}>
                          {SCHOLARSHIP_STATUSES.find(s => s.value === sch.status)?.label || sch.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingScholarship(sch);
                              setShowScholarshipModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteScholarship(sch.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* University Modal */}
      {showUniversityModal && (
        <UniversityModal
          university={editingUniversity}
          onClose={() => {
            setShowUniversityModal(false);
            setEditingUniversity(null);
          }}
          onSave={(data) => {
            if (editingUniversity) {
              handleUpdateUniversity(editingUniversity.id, data);
            } else {
              handleCreateUniversity(data);
            }
          }}
        />
      )}

      {/* Scholarship Modal */}
      {showScholarshipModal && (
        <ScholarshipModal
          scholarship={editingScholarship}
          universities={universities}
          onClose={() => {
            setShowScholarshipModal(false);
            setEditingScholarship(null);
          }}
          onSave={(data) => {
            if (editingScholarship) {
              handleUpdateScholarship(editingScholarship.id, data);
            } else {
              handleCreateScholarship(data);
            }
          }}
        />
      )}

      {/* University Preview Modal */}
      {previewUniversity && (
        <UniversityPreviewModal
          university={previewUniversity}
          onClose={() => setPreviewUniversity(null)}
          onEdit={() => {
            setEditingUniversity(previewUniversity);
            setPreviewUniversity(null);
            setShowUniversityModal(true);
          }}
        />
      )}

      {/* Scholarship Preview Modal */}
      {previewScholarship && (
        <ScholarshipPreviewModal
          scholarship={previewScholarship}
          onClose={() => setPreviewScholarship(null)}
          onEdit={() => {
            setEditingScholarship(previewScholarship);
            setPreviewScholarship(null);
            setShowScholarshipModal(true);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
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

function UniversityModal({
  university,
  onClose,
  onSave,
}: {
  university: University | null;
  onClose: () => void;
  onSave: (data: Partial<University>) => void;
}) {
  const [formData, setFormData] = React.useState({
    universityName: university?.universityName || '',
    country: university?.country || '',
    programName: university?.programName || '',
    specialization: university?.specialization || '',
    programLength: university?.programLength || '',
    tuitionPerYear: university?.tuitionPerYear || '',
    livingCostPerYear: university?.livingCostPerYear || '',
    admissionRequirements: university?.admissionRequirements || '',
    englishTest: university?.englishTest || '',
    applicationDeadline: university?.applicationDeadline || '',
    fundingOptions: university?.fundingOptions || '',
    websiteUrl: university?.websiteUrl || '',
    notes: university?.notes || '',
    priority: university?.priority?.toString() || '',
    status: university?.status || 'researching',
  });
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  const tabs = ['Basic', 'Costs', 'Requirements', 'Notes'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      universityName: formData.universityName,
      country: formData.country || undefined,
      programName: formData.programName || undefined,
      specialization: formData.specialization || undefined,
      programLength: formData.programLength || undefined,
      tuitionPerYear: formData.tuitionPerYear || undefined,
      livingCostPerYear: formData.livingCostPerYear || undefined,
      admissionRequirements: formData.admissionRequirements || undefined,
      englishTest: formData.englishTest || undefined,
      applicationDeadline: formData.applicationDeadline || undefined,
      fundingOptions: formData.fundingOptions || undefined,
      websiteUrl: formData.websiteUrl || undefined,
      notes: formData.notes || undefined,
      priority: formData.priority ? Number(formData.priority) : undefined,
      status: formData.status,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{university ? 'Edit University' : 'Add University'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
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
                <label className="text-sm font-medium">University Name *</label>
                <Input
                  value={formData.universityName}
                  onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                  placeholder="e.g., MIT, Stanford, ETH Zurich"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g., USA, Germany"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Program Length</label>
                  <Input
                    value={formData.programLength}
                    onChange={(e) => setFormData({ ...formData, programLength: e.target.value })}
                    placeholder="e.g., 2 years"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Program Name</label>
                <Input
                  value={formData.programName}
                  onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
                  placeholder="e.g., M.Sc. Computer Science"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Specialization</label>
                <Input
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g., Machine Learning, Sustainability"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Website URL</label>
                <Input
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Select priority...</option>
                    <option value="1">1 - Top Choice</option>
                    <option value="2">2 - Good Option</option>
                    <option value="3">3 - Backup</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {UNIVERSITY_STATUSES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Costs Tab */}
          {activeTab === 1 && (
            <>
              <div>
                <label className="text-sm font-medium">Tuition (per year)</label>
                <Input
                  value={formData.tuitionPerYear}
                  onChange={(e) => setFormData({ ...formData, tuitionPerYear: e.target.value })}
                  placeholder="e.g., €15,000, $50,000"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Living Cost (per year)</label>
                <Input
                  value={formData.livingCostPerYear}
                  onChange={(e) => setFormData({ ...formData, livingCostPerYear: e.target.value })}
                  placeholder="e.g., €12,000, $25,000"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Funding Options</label>
                <textarea
                  value={formData.fundingOptions}
                  onChange={(e) => setFormData({ ...formData, fundingOptions: e.target.value })}
                  className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Scholarships, assistantships, loans..."
                />
              </div>
            </>
          )}

          {/* Requirements Tab */}
          {activeTab === 2 && (
            <>
              <div>
                <label className="text-sm font-medium">Application Deadline</label>
                <Input
                  value={formData.applicationDeadline}
                  onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                  placeholder="e.g., January 15, 2025"
                />
              </div>

              <div>
                <label className="text-sm font-medium">English Test Requirements</label>
                <Input
                  value={formData.englishTest}
                  onChange={(e) => setFormData({ ...formData, englishTest: e.target.value })}
                  placeholder="e.g., IELTS 7.0, TOEFL 100"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Admission Requirements</label>
                <textarea
                  value={formData.admissionRequirements}
                  onChange={(e) => setFormData({ ...formData, admissionRequirements: e.target.value })}
                  className="w-full min-h-[150px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="GPA, GRE, documents needed..."
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
                placeholder="Additional notes, pros/cons, research findings..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {university ? 'Update' : 'Add'} University
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScholarshipModal({
  scholarship,
  universities,
  onClose,
  onSave,
}: {
  scholarship: Scholarship | null;
  universities: University[];
  onClose: () => void;
  onSave: (data: Partial<Scholarship>) => void;
}) {
  const [formData, setFormData] = React.useState({
    name: scholarship?.name || '',
    universityId: scholarship?.universityId || '',
    provider: scholarship?.provider || '',
    type: scholarship?.type || 'partial',
    amount: scholarship?.amount || '',
    currency: scholarship?.currency || '',
    coverage: scholarship?.coverage || '',
    eligibility: scholarship?.eligibility || '',
    applicationLink: scholarship?.applicationLink || '',
    websiteUrl: scholarship?.websiteUrl || '',
    deadline: scholarship?.deadline || '',
    status: scholarship?.status || 'researching',
    priority: scholarship?.priority?.toString() || '',
    notes: scholarship?.notes || '',
  });
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  const tabs = ['Basic', 'Details', 'Requirements', 'Notes'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      name: formData.name,
      universityId: formData.universityId || null,
      provider: formData.provider || undefined,
      type: formData.type,
      amount: formData.amount || undefined,
      currency: formData.currency || undefined,
      coverage: formData.coverage || undefined,
      eligibility: formData.eligibility || undefined,
      applicationLink: formData.applicationLink || undefined,
      websiteUrl: formData.websiteUrl || undefined,
      deadline: formData.deadline || undefined,
      status: formData.status,
      priority: formData.priority ? Number(formData.priority) : undefined,
      notes: formData.notes || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{scholarship ? 'Edit Scholarship' : 'Add Scholarship'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
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
                <label className="text-sm font-medium">Scholarship Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Erasmus Mundus, DAAD"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Link to University</label>
                <select
                  value={formData.universityId}
                  onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">General / Any University</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.universityName} {uni.country ? `(${uni.country})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Link this scholarship to a specific university or leave empty for general scholarships
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Provider</label>
                <Input
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g., EU, DAAD, Gates Foundation"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {SCHOLARSHIP_TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {SCHOLARSHIP_STATUSES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
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

          {/* Details Tab */}
          {activeTab === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g., 15,000, Full tuition"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Currency</label>
                  <Input
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="e.g., EUR, USD"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Deadline</label>
                <Input
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  placeholder="e.g., January 15, 2025"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Application Link</label>
                <Input
                  value={formData.applicationLink}
                  onChange={(e) => setFormData({ ...formData, applicationLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Website URL</label>
                <Input
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Coverage</label>
                <textarea
                  value={formData.coverage}
                  onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="What does the scholarship cover? (tuition, living, travel, etc.)"
                />
              </div>
            </>
          )}

          {/* Requirements Tab */}
          {activeTab === 2 && (
            <div>
              <label className="text-sm font-medium">Eligibility Requirements</label>
              <textarea
                value={formData.eligibility}
                onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                className="w-full min-h-[200px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                placeholder="Requirements, qualifications, documents needed..."
              />
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 3 && (
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full min-h-[200px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                placeholder="Additional notes, tips, research findings..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {scholarship ? 'Update' : 'Add'} Scholarship
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

function getUniversityStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'accepted':
    case 'enrolled':
      return 'success';
    case 'applied':
    case 'applying':
      return 'info';
    case 'shortlisted':
      return 'warning';
    case 'rejected':
      return 'error';
    default:
      return 'neutral';
  }
}

function getScholarshipStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'awarded':
      return 'success';
    case 'applied':
    case 'applying':
      return 'info';
    case 'eligible':
      return 'warning';
    case 'rejected':
    case 'expired':
      return 'error';
    default:
      return 'neutral';
  }
}

// University Preview Modal
function UniversityPreviewModal({
  university,
  onClose,
  onEdit,
}: {
  university: University;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">{university.universityName}</h2>
              {university.country && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {university.country}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Status and Priority */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={getUniversityStatusVariant(university.status)}>
              {UNIVERSITY_STATUSES.find(s => s.value === university.status)?.label || university.status}
            </Badge>
            {university.priority && (
              <Badge variant={university.priority === 1 ? 'error' : university.priority === 2 ? 'warning' : 'success'}>
                Priority {university.priority}
              </Badge>
            )}
          </div>

          {/* Program Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {university.programName && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Program</h4>
                <p className="text-sm">{university.programName}</p>
              </div>
            )}
            {university.specialization && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Specialization</h4>
                <p className="text-sm">{university.specialization}</p>
              </div>
            )}
            {university.programLength && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Program Length</h4>
                <p className="text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {university.programLength}
                </p>
              </div>
            )}
            {university.applicationDeadline && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Application Deadline</h4>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {university.applicationDeadline}
                </p>
              </div>
            )}
          </div>

          {/* Website URL */}
          {university.websiteUrl && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Website
              </h4>
              <a
                href={university.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {university.websiteUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Costs */}
          {(university.tuitionPerYear || university.livingCostPerYear) && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Estimated Costs
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {university.tuitionPerYear && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground">Tuition per Year</p>
                    <p className="text-lg font-semibold">{university.tuitionPerYear}</p>
                  </div>
                )}
                {university.livingCostPerYear && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground">Living Cost per Year</p>
                    <p className="text-lg font-semibold">{university.livingCostPerYear}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admission Requirements */}
          {university.admissionRequirements && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Admission Requirements
              </h4>
              <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                {university.admissionRequirements}
              </div>
            </div>
          )}

          {/* English Test */}
          {university.englishTest && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">English Test Requirement</h4>
              <p className="text-sm">{university.englishTest}</p>
            </div>
          )}

          {/* Funding Options */}
          {university.fundingOptions && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Award className="h-4 w-4" />
                Funding Options
              </h4>
              <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                {university.fundingOptions}
              </div>
            </div>
          )}

          {/* Notes */}
          {university.notes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <StickyNote className="h-4 w-4" />
                Notes
              </h4>
              <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                {university.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Scholarship Preview Modal
function ScholarshipPreviewModal({
  scholarship,
  onClose,
  onEdit,
}: {
  scholarship: Scholarship;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">{scholarship.name}</h2>
              {scholarship.provider && (
                <p className="text-sm text-muted-foreground">{scholarship.provider}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Status, Type and Priority */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={getScholarshipStatusVariant(scholarship.status)}>
              {SCHOLARSHIP_STATUSES.find(s => s.value === scholarship.status)?.label || scholarship.status}
            </Badge>
            <Badge variant="info">
              {SCHOLARSHIP_TYPES.find(t => t.value === scholarship.type)?.label || scholarship.type}
            </Badge>
            {scholarship.priority && (
              <Badge variant={scholarship.priority === 1 ? 'error' : scholarship.priority === 2 ? 'warning' : 'success'}>
                Priority {scholarship.priority}
              </Badge>
            )}
          </div>

          {/* Linked University */}
          {scholarship.university && (
            <div className="p-3 bg-muted/50 rounded-md flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Linked University</p>
                <p className="text-sm font-medium">
                  {scholarship.university.universityName}
                  {scholarship.university.country && ` (${scholarship.university.country})`}
                </p>
              </div>
            </div>
          )}

          {/* Amount and Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scholarship.amount && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Amount
                </p>
                <p className="text-lg font-semibold">
                  {scholarship.amount}
                  {scholarship.currency && ` ${scholarship.currency}`}
                </p>
              </div>
            )}
            {scholarship.deadline && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Deadline
                </p>
                <p className="text-lg font-semibold">{scholarship.deadline}</p>
              </div>
            )}
          </div>

          {/* Application Link */}
          {scholarship.applicationLink && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Application Link
              </h4>
              <a
                href={scholarship.applicationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {scholarship.applicationLink}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Website URL */}
          {scholarship.websiteUrl && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Website
              </h4>
              <a
                href={scholarship.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {scholarship.websiteUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Coverage */}
          {scholarship.coverage && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <FileText className="h-4 w-4" />
                What It Covers
              </h4>
              <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                {scholarship.coverage}
              </div>
            </div>
          )}

          {/* Eligibility */}
          {scholarship.eligibility && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Target className="h-4 w-4" />
                Eligibility Requirements
              </h4>
              <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                {scholarship.eligibility}
              </div>
            </div>
          )}

          {/* Notes */}
          {scholarship.notes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <StickyNote className="h-4 w-4" />
                Notes
              </h4>
              <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                {scholarship.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
