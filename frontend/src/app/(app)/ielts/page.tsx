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
  Headphones,
  Mic,
  PenTool,
  Clock,
  Target,
  Trash2,
  Edit,
  X,
  ChevronDown,
  TrendingUp,
  BarChart3,
  List,
} from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { formatDate, toLocalDateString } from '@/lib/utils';

// Types
interface IeltsSession {
  id: string;
  date: string;
  skillType: 'listening' | 'reading' | 'writing_task1' | 'writing_task2' | 'speaking';
  subSkill?: string;
  materialName?: string;
  timeSpentMin?: number;
  rawScore?: number;
  rawMaxScore?: number;
  estimatedBand?: number;
  mistakesSummary?: string;
  newVocabCount?: number;
  confidenceScore?: number;
  notes?: string;
  mistakes?: IeltsMistake[];
}

interface IeltsMistake {
  id: string;
  category: string;
  description: string;
  example?: string;
}

interface IeltsVocab {
  id: string;
  phrase: string;
  meaning: string;
  exampleUsage?: string;
  sourceType: string;
  createdAt: string;
}

interface IeltsStats {
  overall: {
    totalSessions: number;
    totalMinutes: number;
    averageBand: number | null;
    totalVocab: number;
  };
  bySkill: Record<string, {
    totalSessions: number;
    totalMinutes: number;
    averageBand: number | null;
    latestBand: number | null;
    averageConfidence: number | null;
  }>;
  mistakesByCategory: Record<string, number>;
}

const SKILL_TYPES = [
  { value: 'listening', label: 'Listening', icon: Headphones },
  { value: 'reading', label: 'Reading', icon: BookOpen },
  { value: 'writing_task1', label: 'Writing Task 1', icon: PenTool },
  { value: 'writing_task2', label: 'Writing Task 2', icon: PenTool },
  { value: 'speaking', label: 'Speaking', icon: Mic },
] as const;

const MISTAKE_CATEGORIES = [
  'grammar',
  'vocab',
  'spelling',
  'paraphrasing',
  'logic',
  'pronunciation',
  'timing',
  'comprehension',
  'other',
];

// Theme-aware tooltip styles
const getTooltipStyles = (isDark: boolean) => ({
  contentStyle: {
    backgroundColor: isDark ? 'hsl(0 0% 12%)' : '#ffffff',
    border: `1px solid ${isDark ? 'hsl(0 0% 22%)' : '#e5e7eb'}`,
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  labelStyle: { color: isDark ? '#f5f5f5' : '#111827', fontWeight: 600 },
  itemStyle: { color: isDark ? '#d4d4d4' : '#374151' },
});

// Theme-aware chart colors
const getChartColors = (isDark: boolean) => ({
  gridStroke: isDark ? 'hsl(0 0% 25%)' : 'hsl(220 10% 88%)',
  axisColor: isDark ? 'hsl(0 0% 60%)' : 'hsl(220 10% 45%)',
});

// Chart color palette for skills
const SKILL_CHART_COLORS = {
  listening: '#3b82f6',    // blue
  reading: '#10b981',      // green
  writing_task1: '#f59e0b', // amber
  writing_task2: '#f97316', // orange
  speaking: '#8b5cf6',     // purple
};

// Mistake category colors
const MISTAKE_CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6',
];

export default function IeltsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tooltipStyles = getTooltipStyles(isDark);
  const chartColors = getChartColors(isDark);
  const [viewMode, setViewMode] = React.useState<'analytics' | 'log'>('analytics');
  const [logTab, setLogTab] = React.useState<'sessions' | 'vocab'>('sessions');
  const [sessions, setSessions] = React.useState<IeltsSession[]>([]);
  const [vocab, setVocab] = React.useState<IeltsVocab[]>([]);
  const [stats, setStats] = React.useState<IeltsStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showSessionModal, setShowSessionModal] = React.useState(false);
  const [showVocabModal, setShowVocabModal] = React.useState(false);
  const [editingSession, setEditingSession] = React.useState<IeltsSession | null>(null);
  const [editingVocab, setEditingVocab] = React.useState<IeltsVocab | null>(null);
  const [filterSkill, setFilterSkill] = React.useState<string>('all');

  // Get skill types that have data (for filtering legend/bars)
  const activeSkillTypes = React.useMemo(() => {
    const types = new Set<string>();
    sessions.forEach(s => {
      if (s.skillType) types.add(s.skillType);
    });
    return types;
  }, [sessions]);

  // Fetch data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [sessionsRes, vocabRes, statsRes] = await Promise.all([
          api.ielts.sessions.list({ limit: 50 }),
          api.ielts.vocab.list({ limit: 100 }),
          api.ielts.stats(),
        ]);
        setSessions((sessionsRes as any).data || []);
        setVocab((vocabRes as any).data || []);
        setStats((statsRes as any).data || null);
      } catch (err) {
        console.error('Failed to fetch IELTS data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAuthenticated]);

  const handleCreateSession = async (data: Partial<IeltsSession>) => {
    try {
      const res = await api.ielts.sessions.create(data);
      setSessions((prev) => [(res as any).data, ...prev]);
      setShowSessionModal(false);
      // Refresh stats
      const statsRes = await api.ielts.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleUpdateSession = async (id: string, data: Partial<IeltsSession>) => {
    try {
      const res = await api.ielts.sessions.update(id, data);
      setSessions((prev) => prev.map((s) => (s.id === id ? (res as any).data : s)));
      setEditingSession(null);
      setShowSessionModal(false);
      // Refresh stats
      const statsRes = await api.ielts.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await api.ielts.sessions.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      // Refresh stats
      const statsRes = await api.ielts.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleCreateVocab = async (data: Partial<IeltsVocab>) => {
    try {
      const res = await api.ielts.vocab.create(data);
      setVocab((prev) => [(res as any).data, ...prev]);
      setShowVocabModal(false);
    } catch (err) {
      console.error('Failed to create vocab:', err);
    }
  };

  const handleUpdateVocab = async (id: string, data: Partial<IeltsVocab>) => {
    try {
      const res = await api.ielts.vocab.update(id, data);
      setVocab((prev) => prev.map((v) => (v.id === id ? (res as any).data : v)));
      setEditingVocab(null);
      setShowVocabModal(false);
    } catch (err) {
      console.error('Failed to update vocab:', err);
    }
  };

  const handleDeleteVocab = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vocabulary?')) return;
    try {
      await api.ielts.vocab.delete(id);
      setVocab((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error('Failed to delete vocab:', err);
    }
  };

  const filteredSessions = filterSkill === 'all'
    ? sessions
    : sessions.filter((s) => s.skillType === filterSkill);

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
        title="IELTS Practice"
        description="Track your IELTS preparation progress"
        actions={
          <Button onClick={() => {
            setEditingSession(null);
            setShowSessionModal(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Log Session
          </Button>
        }
      />

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <div className="inline-flex rounded-lg border p-1 bg-muted/30">
          <button
            onClick={() => setViewMode('analytics')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'analytics'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button
            onClick={() => setViewMode('log')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'log'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="h-4 w-4" />
            Log
          </button>
        </div>
      </div>

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
            <StatCard
              label="Total Sessions"
              value={stats?.overall.totalSessions.toString() || '0'}
              icon={<Target className="h-5 w-5" />}
            />
            <StatCard
              label="Total Hours"
              value={stats ? (stats.overall.totalMinutes / 60).toFixed(1) : '0'}
              icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
              label="Avg. Band"
              value={stats?.overall.averageBand?.toFixed(1) || 'N/A'}
              icon={<BookOpen className="h-5 w-5" />}
            />
            <StatCard
              label="Vocab Learned"
              value={stats?.overall.totalVocab.toString() || '0'}
              icon={<PenTool className="h-5 w-5" />}
            />
          </div>

          {/* Charts Grid - 2x2 for larger charts */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Daily Practice Time - Stacked Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Daily Practice Time</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getDailyPracticeData(sessions)}
                      margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 10, fill: chartColors.axisColor }}
                        stroke={chartColors.gridStroke}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: chartColors.axisColor }}
                        stroke={chartColors.gridStroke}
                        width={30}
                        tickFormatter={(value) => `${Math.round(value)}m`}
                      />
                      <Tooltip
                        cursor={false}
                        {...tooltipStyles}
                        content={({ active, payload }) => {
                          if (!active || !payload) return null;
                          const nonZeroItems = payload.filter((item: any) => item.value > 0);
                          if (nonZeroItems.length === 0) return null;
                          const total = nonZeroItems.reduce((sum: number, item: any) => sum + item.value, 0);
                          return (
                            <div style={{
                              ...tooltipStyles.contentStyle,
                              padding: '8px 10px',
                              fontSize: '11px',
                            }}>
                              <p style={{ ...tooltipStyles.labelStyle, marginBottom: '4px', fontSize: '11px' }}>
                                {payload[0]?.payload?.displayDate} - {Math.round(total)} min
                              </p>
                              {nonZeroItems.map((item: any, idx: number) => (
                                <p key={idx} style={{ ...tooltipStyles.itemStyle, margin: '2px 0', fontSize: '10px' }}>
                                  <span style={{ color: item.fill }}>{item.name}</span>: {Math.round(item.value)} min
                                </p>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      {activeSkillTypes.has('listening') && <Bar dataKey="listening" name="Listening" stackId="skills" fill={SKILL_CHART_COLORS.listening} />}
                      {activeSkillTypes.has('reading') && <Bar dataKey="reading" name="Reading" stackId="skills" fill={SKILL_CHART_COLORS.reading} />}
                      {activeSkillTypes.has('writing_task1') && <Bar dataKey="writing_task1" name="Writing 1" stackId="skills" fill={SKILL_CHART_COLORS.writing_task1} />}
                      {activeSkillTypes.has('writing_task2') && <Bar dataKey="writing_task2" name="Writing 2" stackId="skills" fill={SKILL_CHART_COLORS.writing_task2} />}
                      {activeSkillTypes.has('speaking') && <Bar dataKey="speaking" name="Speaking" stackId="skills" fill={SKILL_CHART_COLORS.speaking} />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Daily Band Scores - Stacked Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Daily Band Scores</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getDailyBandData(sessions)}
                      margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 10, fill: chartColors.axisColor }}
                        stroke={chartColors.gridStroke}
                      />
                      <YAxis
                        domain={[0, 9]}
                        tick={{ fontSize: 10, fill: chartColors.axisColor }}
                        stroke={chartColors.gridStroke}
                        width={25}
                      />
                      <Tooltip
                        cursor={false}
                        {...tooltipStyles}
                        content={({ active, payload }) => {
                          if (!active || !payload) return null;
                          const nonZeroItems = payload.filter((item: any) => item.value > 0);
                          if (nonZeroItems.length === 0) return null;
                          return (
                            <div style={{
                              ...tooltipStyles.contentStyle,
                              padding: '8px 10px',
                              fontSize: '11px',
                            }}>
                              <p style={{ ...tooltipStyles.labelStyle, marginBottom: '4px', fontSize: '11px' }}>
                                {payload[0]?.payload?.displayDate}
                              </p>
                              {nonZeroItems.map((item: any, idx: number) => (
                                <p key={idx} style={{ ...tooltipStyles.itemStyle, margin: '2px 0', fontSize: '10px' }}>
                                  <span style={{ color: item.fill }}>{item.name}</span>: Band {item.value.toFixed(1)}
                                </p>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      {activeSkillTypes.has('listening') && <Bar dataKey="listening" name="Listening" stackId="bands" fill={SKILL_CHART_COLORS.listening} />}
                      {activeSkillTypes.has('reading') && <Bar dataKey="reading" name="Reading" stackId="bands" fill={SKILL_CHART_COLORS.reading} />}
                      {activeSkillTypes.has('writing_task1') && <Bar dataKey="writing_task1" name="Writing 1" stackId="bands" fill={SKILL_CHART_COLORS.writing_task1} />}
                      {activeSkillTypes.has('writing_task2') && <Bar dataKey="writing_task2" name="Writing 2" stackId="bands" fill={SKILL_CHART_COLORS.writing_task2} />}
                      {activeSkillTypes.has('speaking') && <Bar dataKey="speaking" name="Speaking" stackId="bands" fill={SKILL_CHART_COLORS.speaking} />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Skills Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Skills Progress</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {SKILL_TYPES.map(({ value, label }) => {
                    const skillStats = stats?.bySkill[value];
                    return (
                      <div key={value} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{label}</span>
                          <span className="text-muted-foreground">
                            {skillStats?.totalSessions || 0} sessions
                            {skillStats?.averageBand && ` • Band ${skillStats.averageBand.toFixed(1)}`}
                          </span>
                        </div>
                        <Progress
                          value={skillStats?.totalSessions || 0}
                          max={10}
                          className="h-2"
                          indicatorClassName={getSkillColor(value)}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Mistake Categories */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Mistake Categories</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {stats && Object.keys(stats.mistakesByCategory).length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(stats.mistakesByCategory)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 6)
                          .map(([category, count]) => ({
                            category: category.charAt(0).toUpperCase() + category.slice(1),
                            count,
                          }))}
                        layout="vertical"
                        margin={{ top: 5, right: 15, left: 70, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} horizontal={true} vertical={false} />
                        <XAxis type="number" stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis dataKey="category" type="category" stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} width={65} />
                        <Tooltip
                          cursor={false}
                          {...tooltipStyles}
                          formatter={(value: number) => [`${value}`, 'Mistakes']}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {Object.entries(stats.mistakesByCategory).slice(0, 6).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={MISTAKE_CATEGORY_COLORS[index % MISTAKE_CATEGORY_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    No mistake data recorded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Log View */}
      {viewMode === 'log' && (
        <>
          {/* Log Tabs */}
          <div className="flex gap-2 border-b mb-6">
            <button
              onClick={() => setLogTab('sessions')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                logTab === 'sessions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Sessions ({sessions.length})
            </button>
            <button
              onClick={() => setLogTab('vocab')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                logTab === 'vocab'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Vocabulary ({vocab.length})
            </button>
          </div>

          {/* Sessions Tab */}
          {logTab === 'sessions' && (
            <div>
              {/* Filter */}
              <div className="flex gap-2 mb-4 flex-wrap">
                <Button
                  variant={filterSkill === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSkill('all')}
                >
                  All
                </Button>
                {SKILL_TYPES.map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={filterSkill === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterSkill(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {filteredSessions.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">No IELTS sessions logged yet.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setEditingSession(null);
                        setShowSessionModal(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start Practice Session
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onEdit={() => {
                        setEditingSession(session);
                        setShowSessionModal(true);
                      }}
                      onDelete={() => handleDeleteSession(session.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vocab Tab */}
          {logTab === 'vocab' && (
            <div>
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => {
                    setEditingVocab(null);
                    setShowVocabModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vocabulary
                </Button>
              </div>

              {vocab.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">No vocabulary saved yet.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setEditingVocab(null);
                        setShowVocabModal(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Word
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vocab.map((v) => (
                    <VocabCard
                      key={v.id}
                      vocab={v}
                      onEdit={() => {
                        setEditingVocab(v);
                        setShowVocabModal(true);
                      }}
                      onDelete={() => handleDeleteVocab(v.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <SessionModal
          session={editingSession}
          onClose={() => {
            setShowSessionModal(false);
            setEditingSession(null);
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

      {/* Vocab Modal */}
      {showVocabModal && (
        <VocabModal
          vocab={editingVocab}
          onClose={() => {
            setShowVocabModal(false);
            setEditingVocab(null);
          }}
          onSave={(data) => {
            if (editingVocab) {
              handleUpdateVocab(editingVocab.id, data);
            } else {
              handleCreateVocab(data);
            }
          }}
        />
      )}
    </PageContainer>
  );
}

// Helper components
function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-primary">{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionCard({
  session,
  onEdit,
  onDelete,
}: {
  session: IeltsSession;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const skillInfo = SKILL_TYPES.find((s) => s.value === session.skillType);
  const Icon = skillInfo?.icon || BookOpen;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${getSkillBgColor(session.skillType)}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{skillInfo?.label || session.skillType}</h3>
                {session.estimatedBand && (
                  <Badge variant="success">Band {session.estimatedBand}</Badge>
                )}
              </div>
              {session.materialName && (
                <p className="text-sm text-muted-foreground">{session.materialName}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                <span>{formatDate(new Date(session.date), { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                {session.timeSpentMin && <span>• {session.timeSpentMin} min</span>}
                {session.rawScore !== undefined && session.rawMaxScore && (
                  <span>• Score: {session.rawScore}/{session.rawMaxScore}</span>
                )}
                {session.confidenceScore && <span>• Confidence: {session.confidenceScore}/5</span>}
              </div>
              {session.notes && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{session.notes}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
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

function VocabCard({
  vocab,
  onEdit,
  onDelete,
}: {
  vocab: IeltsVocab;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium">{vocab.phrase}</h3>
            <p className="text-sm text-muted-foreground mt-1">{vocab.meaning}</p>
            {vocab.exampleUsage && (
              <p className="text-xs text-muted-foreground mt-2 italic">"{vocab.exampleUsage}"</p>
            )}
          </div>
          <div className="flex gap-1">
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

function SessionModal({
  session,
  onClose,
  onSave,
}: {
  session: IeltsSession | null;
  onClose: () => void;
  onSave: (data: Partial<IeltsSession>) => void;
}) {
  const [formData, setFormData] = React.useState({
    date: toLocalDateString(session?.date),
    skillType: session?.skillType || 'reading',
    subSkill: session?.subSkill || '',
    materialName: session?.materialName || '',
    timeSpentMin: session?.timeSpentMin || '',
    rawScore: session?.rawScore || '',
    rawMaxScore: session?.rawMaxScore || '',
    estimatedBand: session?.estimatedBand || '',
    confidenceScore: session?.confidenceScore || '',
    notes: session?.notes || '',
  });
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      date: new Date(formData.date).toISOString(),
      skillType: formData.skillType as IeltsSession['skillType'],
      subSkill: formData.subSkill || undefined,
      materialName: formData.materialName || undefined,
      timeSpentMin: formData.timeSpentMin ? Number(formData.timeSpentMin) : undefined,
      rawScore: formData.rawScore ? Number(formData.rawScore) : undefined,
      rawMaxScore: formData.rawMaxScore ? Number(formData.rawMaxScore) : undefined,
      estimatedBand: formData.estimatedBand ? Number(formData.estimatedBand) : undefined,
      confidenceScore: formData.confidenceScore ? Number(formData.confidenceScore) : undefined,
      notes: formData.notes || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {session ? 'Edit Session' : 'Log IELTS Session'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Skill Type</label>
              <select
                value={formData.skillType}
                onChange={(e) => setFormData({ ...formData, skillType: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                required
              >
                {SKILL_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Material Name</label>
            <Input
              value={formData.materialName}
              onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
              placeholder="e.g., Cambridge 18 Test 1"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Time (min)</label>
              <Input
                type="number"
                value={formData.timeSpentMin}
                onChange={(e) => setFormData({ ...formData, timeSpentMin: e.target.value })}
                placeholder="45"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Score</label>
              <Input
                type="number"
                value={formData.rawScore}
                onChange={(e) => setFormData({ ...formData, rawScore: e.target.value })}
                placeholder="32"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Max Score</label>
              <Input
                type="number"
                value={formData.rawMaxScore}
                onChange={(e) => setFormData({ ...formData, rawMaxScore: e.target.value })}
                placeholder="40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Estimated Band</label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="9"
                value={formData.estimatedBand}
                onChange={(e) => setFormData({ ...formData, estimatedBand: e.target.value })}
                placeholder="7.0"
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
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              placeholder="Key takeaways, mistakes made, areas to improve..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {session ? 'Update' : 'Save'} Session
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VocabModal({
  vocab,
  onClose,
  onSave,
}: {
  vocab: IeltsVocab | null;
  onClose: () => void;
  onSave: (data: Partial<IeltsVocab>) => void;
}) {
  const [formData, setFormData] = React.useState({
    phrase: vocab?.phrase || '',
    meaning: vocab?.meaning || '',
    exampleUsage: vocab?.exampleUsage || '',
  });
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      phrase: formData.phrase,
      meaning: formData.meaning,
      exampleUsage: formData.exampleUsage || undefined,
      sourceType: 'ielts',
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {vocab ? 'Edit Vocabulary' : 'Add Vocabulary'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Word / Phrase</label>
            <Input
              value={formData.phrase}
              onChange={(e) => setFormData({ ...formData, phrase: e.target.value })}
              placeholder="e.g., ubiquitous"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Meaning</label>
            <textarea
              value={formData.meaning}
              onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              placeholder="Present, appearing, or found everywhere"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Example Usage</label>
            <textarea
              value={formData.exampleUsage}
              onChange={(e) => setFormData({ ...formData, exampleUsage: e.target.value })}
              className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              placeholder="Smartphones have become ubiquitous in modern society."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {vocab ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getSkillColor(skill: string): string {
  const colors: Record<string, string> = {
    listening: 'bg-blue-500',
    reading: 'bg-emerald-500',
    writing_task1: 'bg-amber-500',
    writing_task2: 'bg-orange-500',
    speaking: 'bg-purple-500',
  };
  return colors[skill] || 'bg-gray-500';
}

function getSkillBgColor(skill: string): string {
  const colors: Record<string, string> = {
    listening: 'bg-blue-500/10 text-blue-600',
    reading: 'bg-emerald-500/10 text-emerald-600',
    writing_task1: 'bg-amber-500/10 text-amber-600',
    writing_task2: 'bg-orange-500/10 text-orange-600',
    speaking: 'bg-purple-500/10 text-purple-600',
  };
  return colors[skill] || 'bg-gray-500/10 text-gray-600';
}

// Helper function to generate daily practice time data for time series chart
function getDailyPracticeData(sessions: IeltsSession[]) {
  // Get last 7 days
  const days: { date: string; displayDate: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }

  return days.map(({ date, displayDate }) => {
    const daySessions = sessions.filter(s => s.date.split('T')[0] === date);

    return {
      date,
      displayDate,
      listening: daySessions
        .filter(s => s.skillType === 'listening')
        .reduce((sum, s) => sum + (s.timeSpentMin || 0), 0),
      reading: daySessions
        .filter(s => s.skillType === 'reading')
        .reduce((sum, s) => sum + (s.timeSpentMin || 0), 0),
      writing_task1: daySessions
        .filter(s => s.skillType === 'writing_task1')
        .reduce((sum, s) => sum + (s.timeSpentMin || 0), 0),
      writing_task2: daySessions
        .filter(s => s.skillType === 'writing_task2')
        .reduce((sum, s) => sum + (s.timeSpentMin || 0), 0),
      speaking: daySessions
        .filter(s => s.skillType === 'speaking')
        .reduce((sum, s) => sum + (s.timeSpentMin || 0), 0),
    };
  });
}

// Helper function to generate daily band score data for time series chart
function getDailyBandData(sessions: IeltsSession[]) {
  // Get last 7 days
  const days: { date: string; displayDate: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }

  return days.map(({ date, displayDate }) => {
    const daySessions = sessions.filter(s => s.date.split('T')[0] === date);

    const getAvgBand = (skillType: string) => {
      const skillSessions = daySessions.filter(s => s.skillType === skillType && s.estimatedBand);
      if (skillSessions.length === 0) return 0;
      return skillSessions.reduce((sum, s) => sum + (s.estimatedBand || 0), 0) / skillSessions.length;
    };

    return {
      date,
      displayDate,
      listening: getAvgBand('listening'),
      reading: getAvgBand('reading'),
      writing_task1: getAvgBand('writing_task1'),
      writing_task2: getAvgBand('writing_task2'),
      speaking: getAvgBand('speaking'),
    };
  });
}
