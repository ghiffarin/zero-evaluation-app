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
  BookOpen,
  Clock,
  Star,
  Search,
  Trash2,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  BookMarked,
  Target,
  Calendar,
  FileText,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { formatDate, toLocalDateString } from '@/lib/utils';

// Types
interface Book {
  id: string;
  title: string;
  author?: string;
  totalPages?: number;
  genre?: string;
  language?: string;
  status: 'to_read' | 'reading' | 'completed' | 'dropped';
  createdAt: string;
  readingSessions?: ReadingSession[];
}

interface ReadingSession {
  id: string;
  bookId: string;
  date: string;
  chapterLabel?: string;
  pagesStart?: number;
  pagesEnd?: number;
  pagesRead?: number;
  timeSpentMin?: number;
  readingSpeed?: number;
  summary?: string;
  keyIdeas?: string;
  favoriteLines?: string;
  newVocab?: string;
  emotionScore?: number;
  emotionLabel?: string;
  purpose: string;
  focusScore?: number;
  notes?: string;
  book?: Book;
}

interface BookStats {
  totalBooks: number;
  booksCompleted: number;
  booksReading: number;
  totalSessions: number;
  totalPagesRead: number;
  totalReadingMinutes: number;
  averageFocusScore: number | null;
  byPurpose: Record<string, number>;
}

const BOOK_STATUSES = [
  { value: 'to_read', label: 'To Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
] as const;

const READING_PURPOSES = [
  { value: 'language', label: 'Language Learning' },
  { value: 'leisure', label: 'Leisure' },
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'rest', label: 'Rest/Relaxation' },
  { value: 'other', label: 'Other' },
] as const;

const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Self-Help',
  'Biography',
  'Science',
  'Technology',
  'Business',
  'Philosophy',
  'Psychology',
  'History',
  'Fantasy',
  'Mystery',
  'Other',
];

export default function BooksPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [books, setBooks] = React.useState<Book[]>([]);
  const [stats, setStats] = React.useState<BookStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'library' | 'sessions'>('library');
  const [sessions, setSessions] = React.useState<ReadingSession[]>([]);

  // Modal states
  const [showBookModal, setShowBookModal] = React.useState(false);
  const [showSessionModal, setShowSessionModal] = React.useState(false);
  const [editingBook, setEditingBook] = React.useState<Book | null>(null);
  const [editingSession, setEditingSession] = React.useState<ReadingSession | null>(null);
  const [selectedBookForSession, setSelectedBookForSession] = React.useState<Book | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedBook, setExpandedBook] = React.useState<string | null>(null);

  // Fetch data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [booksRes, statsRes, sessionsRes] = await Promise.all([
          api.books.list({ limit: 100 }),
          api.books.stats(),
          api.books.sessions.list({ limit: 50 }),
        ]);
        setBooks((booksRes as any).data || []);
        setStats((statsRes as any).data || null);
        setSessions((sessionsRes as any).data || []);
      } catch (err) {
        console.error('Failed to fetch books data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAuthenticated]);

  // Book CRUD
  const handleCreateBook = async (data: Partial<Book>) => {
    try {
      const res = await api.books.create(data);
      setBooks((prev) => [(res as any).data, ...prev]);
      setShowBookModal(false);
      const statsRes = await api.books.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to create book:', err);
    }
  };

  const handleUpdateBook = async (id: string, data: Partial<Book>) => {
    try {
      const res = await api.books.update(id, data);
      setBooks((prev) => prev.map((b) => (b.id === id ? (res as any).data : b)));
      setEditingBook(null);
      setShowBookModal(false);
      const statsRes = await api.books.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to update book:', err);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book and all its reading sessions?')) return;
    try {
      await api.books.delete(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
      const statsRes = await api.books.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to delete book:', err);
    }
  };

  // Session CRUD
  const handleCreateSession = async (data: Partial<ReadingSession>) => {
    try {
      const res = await api.books.sessions.create(data);
      setSessions((prev) => [(res as any).data, ...prev]);
      setShowSessionModal(false);
      setSelectedBookForSession(null);
      // Refresh books to update reading sessions counts
      const [booksRes, statsRes] = await Promise.all([
        api.books.list({ limit: 100 }),
        api.books.stats(),
      ]);
      setBooks((booksRes as any).data || []);
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleUpdateSession = async (id: string, data: Partial<ReadingSession>) => {
    try {
      const res = await api.books.sessions.update(id, data);
      setSessions((prev) => prev.map((s) => (s.id === id ? (res as any).data : s)));
      setEditingSession(null);
      setShowSessionModal(false);
      const statsRes = await api.books.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reading session?')) return;
    try {
      await api.books.sessions.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      const statsRes = await api.books.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Calculate book progress
  const getBookProgress = (book: Book): number => {
    if (!book.totalPages) return 0;
    const sessionsForBook = sessions.filter((s) => s.bookId === book.id);
    const totalPagesRead = sessionsForBook.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
    return Math.min((totalPagesRead / book.totalPages) * 100, 100);
  };

  const getTotalPagesRead = (book: Book): number => {
    const sessionsForBook = sessions.filter((s) => s.bookId === book.id);
    return sessionsForBook.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
  };

  // Filter books
  const filteredBooks = books.filter((book) => {
    const matchesStatus = filterStatus === 'all' || book.status === filterStatus;
    const matchesSearch = !searchQuery ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
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
        title="Books"
        description="Track your reading progress and sessions"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingSession(null);
                setSelectedBookForSession(null);
                setShowSessionModal(true);
              }}
            >
              <Clock className="h-4 w-4 mr-2" />
              Log Session
            </Button>
            <Button
              onClick={() => {
                setEditingBook(null);
                setShowBookModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </div>
        }
      />

      {/* Stats Overview */}
      {stats && (stats.totalBooks > 0 || stats.totalSessions > 0) && (
        <PageSection title="Reading Statistics">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Books"
              value={`${stats.booksReading} / ${stats.totalBooks}`}
              icon={<BookOpen className="h-5 w-5" />}
              subtitle="currently reading"
            />
            <StatCard
              label="Completed"
              value={stats.booksCompleted.toString()}
              icon={<BookMarked className="h-5 w-5" />}
            />
            <StatCard
              label="Pages Read"
              value={stats.totalPagesRead.toLocaleString()}
              icon={<FileText className="h-5 w-5" />}
            />
            <StatCard
              label="Reading Time"
              value={`${Math.round(stats.totalReadingMinutes / 60)}h`}
              icon={<Clock className="h-5 w-5" />}
            />
          </div>

          {/* Purpose breakdown */}
          {Object.keys(stats.byPurpose).length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Sessions by Purpose</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.byPurpose).map(([purpose, count]) => (
                    <Badge key={purpose} variant="neutral" className="text-sm">
                      {getPurposeLabel(purpose)}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </PageSection>
      )}

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'library'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Library ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'sessions'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Recent Sessions ({sessions.length})
        </button>
      </div>

      {activeTab === 'library' && (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              {BOOK_STATUSES.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={filterStatus === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Books List */}
          {filteredBooks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {books.length === 0 ? 'No books in your library yet.' : 'No books match your search.'}
                </p>
                {books.length === 0 && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setEditingBook(null);
                      setShowBookModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Book
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  progress={getBookProgress(book)}
                  pagesRead={getTotalPagesRead(book)}
                  isExpanded={expandedBook === book.id}
                  onToggleExpand={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
                  onEdit={() => {
                    setEditingBook(book);
                    setShowBookModal(true);
                  }}
                  onDelete={() => handleDeleteBook(book.id)}
                  onLogSession={() => {
                    setSelectedBookForSession(book);
                    setEditingSession(null);
                    setShowSessionModal(true);
                  }}
                  sessions={sessions.filter((s) => s.bookId === book.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'sessions' && (
        <>
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No reading sessions logged yet.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setEditingSession(null);
                    setSelectedBookForSession(null);
                    setShowSessionModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Log Your First Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  books={books}
                  onEdit={() => {
                    setEditingSession(session);
                    setSelectedBookForSession(books.find((b) => b.id === session.bookId) || null);
                    setShowSessionModal(true);
                  }}
                  onDelete={() => handleDeleteSession(session.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Book Modal */}
      {showBookModal && (
        <BookModal
          book={editingBook}
          onClose={() => {
            setShowBookModal(false);
            setEditingBook(null);
          }}
          onSave={(data) => {
            if (editingBook) {
              handleUpdateBook(editingBook.id, data);
            } else {
              handleCreateBook(data);
            }
          }}
        />
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <SessionModal
          session={editingSession}
          books={books}
          selectedBook={selectedBookForSession}
          onClose={() => {
            setShowSessionModal(false);
            setEditingSession(null);
            setSelectedBookForSession(null);
          }}
          onSave={(data) => {
            if (editingSession) {
              handleUpdateSession(editingSession.id, data);
            } else {
              handleCreateSession(data);
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
  subtitle,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-primary">{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BookCard({
  book,
  progress,
  pagesRead,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onLogSession,
  sessions,
}: {
  book: Book;
  progress: number;
  pagesRead: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLogSession: () => void;
  sessions: ReadingSession[];
}) {
  return (
    <Card className="flex flex-col">
      <CardContent className="p-4 flex-1">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className="font-medium line-clamp-2">{book.title}</h3>
            </div>
            {book.author && (
              <p className="text-sm text-muted-foreground mt-1">by {book.author}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={getStatusVariant(book.status)}>
                {getStatusLabel(book.status)}
              </Badge>
              {book.genre && <Badge variant="neutral">{book.genre}</Badge>}
            </div>
          </div>
          <div className="flex gap-1 ml-2">
            <Button variant="ghost" size="sm" onClick={onToggleExpand}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Progress */}
        {book.totalPages && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{pagesRead} / {book.totalPages} pages</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-2">
            {book.language && (
              <div className="text-sm">
                <span className="text-muted-foreground">Language:</span> {book.language}
              </div>
            )}
            <div className="text-sm">
              <span className="text-muted-foreground">Sessions:</span> {sessions.length}
            </div>
            {sessions.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Last read:</span>{' '}
                {formatDate(new Date(sessions[0].date), { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="flex-1" onClick={onLogSession}>
            <Clock className="h-4 w-4 mr-1" />
            Log Session
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

function SessionCard({
  session,
  books,
  onEdit,
  onDelete,
}: {
  session: ReadingSession;
  books: Book[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const book = books.find((b) => b.id === session.bookId);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{book?.title || 'Unknown Book'}</span>
              <Badge variant="neutral">{getPurposeLabel(session.purpose)}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
              <span>{formatDate(new Date(session.date), { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {session.pagesRead && <span>• {session.pagesRead} pages</span>}
              {session.timeSpentMin && <span>• {session.timeSpentMin} min</span>}
              {session.chapterLabel && <span>• {session.chapterLabel}</span>}
              {session.focusScore && (
                <span className="flex items-center gap-1">
                  • <Target className="h-3 w-3" /> {session.focusScore}/5 focus
                </span>
              )}
            </div>
            {session.summary && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{session.summary}</p>
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

function BookModal({
  book,
  onClose,
  onSave,
}: {
  book: Book | null;
  onClose: () => void;
  onSave: (data: Partial<Book>) => void;
}) {
  const [formData, setFormData] = React.useState({
    title: book?.title || '',
    author: book?.author || '',
    totalPages: book?.totalPages || '',
    genre: book?.genre || '',
    language: book?.language || 'English',
    status: book?.status || 'to_read',
  });
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      title: formData.title,
      author: formData.author || undefined,
      totalPages: formData.totalPages ? Number(formData.totalPages) : undefined,
      genre: formData.genre || undefined,
      language: formData.language || undefined,
      status: formData.status as Book['status'],
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {book ? 'Edit Book' : 'Add Book'}
          </h2>
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
              placeholder="Book title"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Author</label>
            <Input
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Author name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Total Pages</label>
              <Input
                type="number"
                value={formData.totalPages}
                onChange={(e) => setFormData({ ...formData, totalPages: e.target.value })}
                placeholder="300"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Language</label>
              <Input
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                placeholder="English"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Genre</label>
              <select
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select genre...</option>
                {GENRES.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Book['status'] })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                {BOOK_STATUSES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
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
              {book ? 'Update' : 'Add'} Book
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SessionModal({
  session,
  books,
  selectedBook,
  onClose,
  onSave,
}: {
  session: ReadingSession | null;
  books: Book[];
  selectedBook: Book | null;
  onClose: () => void;
  onSave: (data: Partial<ReadingSession>) => void;
}) {
  const [formData, setFormData] = React.useState({
    bookId: session?.bookId || selectedBook?.id || '',
    date: toLocalDateString(session?.date),
    chapterLabel: session?.chapterLabel || '',
    pagesStart: session?.pagesStart || '',
    pagesEnd: session?.pagesEnd || '',
    pagesRead: session?.pagesRead || '',
    timeSpentMin: session?.timeSpentMin || '',
    purpose: session?.purpose || 'knowledge',
    focusScore: session?.focusScore || '',
    emotionScore: session?.emotionScore || '',
    emotionLabel: session?.emotionLabel || '',
    summary: session?.summary || '',
    keyIdeas: session?.keyIdeas || '',
    favoriteLines: session?.favoriteLines || '',
    newVocab: session?.newVocab || '',
    notes: session?.notes || '',
  });
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'basic' | 'notes'>('basic');

  // Auto-calculate pages read
  React.useEffect(() => {
    if (formData.pagesStart && formData.pagesEnd) {
      const start = Number(formData.pagesStart);
      const end = Number(formData.pagesEnd);
      if (end > start) {
        setFormData((prev) => ({ ...prev, pagesRead: String(end - start) }));
      }
    }
  }, [formData.pagesStart, formData.pagesEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bookId) {
      alert('Please select a book');
      return;
    }
    setSaving(true);
    await onSave({
      bookId: formData.bookId,
      date: new Date(formData.date).toISOString(),
      chapterLabel: formData.chapterLabel || undefined,
      pagesStart: formData.pagesStart ? Number(formData.pagesStart) : undefined,
      pagesEnd: formData.pagesEnd ? Number(formData.pagesEnd) : undefined,
      pagesRead: formData.pagesRead ? Number(formData.pagesRead) : undefined,
      timeSpentMin: formData.timeSpentMin ? Number(formData.timeSpentMin) : undefined,
      purpose: formData.purpose,
      focusScore: formData.focusScore ? Number(formData.focusScore) : undefined,
      emotionScore: formData.emotionScore ? Number(formData.emotionScore) : undefined,
      emotionLabel: formData.emotionLabel || undefined,
      summary: formData.summary || undefined,
      keyIdeas: formData.keyIdeas || undefined,
      favoriteLines: formData.favoriteLines || undefined,
      newVocab: formData.newVocab || undefined,
      notes: formData.notes || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {session ? 'Edit Reading Session' : 'Log Reading Session'}
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
                <label className="text-sm font-medium">Book *</label>
                <select
                  value={formData.bookId}
                  onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  required
                  disabled={!!selectedBook}
                >
                  <option value="">Select a book...</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>{book.title}</option>
                  ))}
                </select>
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
                <label className="text-sm font-medium">Chapter/Section</label>
                <Input
                  value={formData.chapterLabel}
                  onChange={(e) => setFormData({ ...formData, chapterLabel: e.target.value })}
                  placeholder="Chapter 5: The Beginning"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Page</label>
                  <Input
                    type="number"
                    value={formData.pagesStart}
                    onChange={(e) => setFormData({ ...formData, pagesStart: e.target.value })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Page</label>
                  <Input
                    type="number"
                    value={formData.pagesEnd}
                    onChange={(e) => setFormData({ ...formData, pagesEnd: e.target.value })}
                    placeholder="130"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Pages Read</label>
                  <Input
                    type="number"
                    value={formData.pagesRead}
                    onChange={(e) => setFormData({ ...formData, pagesRead: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Purpose</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {READING_PURPOSES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Focus Score (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.focusScore}
                    onChange={(e) => setFormData({ ...formData, focusScore: e.target.value })}
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Emotion Score (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.emotionScore}
                    onChange={(e) => setFormData({ ...formData, emotionScore: e.target.value })}
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Emotion Label</label>
                  <Input
                    value={formData.emotionLabel}
                    onChange={(e) => setFormData({ ...formData, emotionLabel: e.target.value })}
                    placeholder="Inspired, Curious, Relaxed..."
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'notes' && (
            <>
              <div>
                <label className="text-sm font-medium">Summary</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Brief summary of what you read..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Key Ideas</label>
                <textarea
                  value={formData.keyIdeas}
                  onChange={(e) => setFormData({ ...formData, keyIdeas: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Main ideas and takeaways..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Favorite Lines/Quotes</label>
                <textarea
                  value={formData.favoriteLines}
                  onChange={(e) => setFormData({ ...formData, favoriteLines: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Memorable quotes or passages..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">New Vocabulary</label>
                <textarea
                  value={formData.newVocab}
                  onChange={(e) => setFormData({ ...formData, newVocab: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="New words learned..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Additional notes..."
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
function getStatusLabel(status: string): string {
  const statusObj = BOOK_STATUSES.find((s) => s.value === status);
  return statusObj?.label || status;
}

function getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
    to_read: 'neutral',
    reading: 'warning',
    completed: 'success',
    dropped: 'error',
  };
  return variants[status] || 'neutral';
}

function getPurposeLabel(purpose: string): string {
  const purposeObj = READING_PURPOSES.find((p) => p.value === purpose);
  return purposeObj?.label || purpose;
}
