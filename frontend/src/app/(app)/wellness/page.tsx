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
  Moon,
  Sun,
  Brain,
  Heart,
  Smile,
  Frown,
  Activity,
  Droplets,
  Coffee,
  Utensils,
  Sparkles,
  Eye,
  Users,
  TreePine,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  BarChart3,
  List,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { formatDate, toLocalDateString } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';

// Types
interface WellnessEntry {
  id: string;
  date: string;
  sleepHours?: number;
  sleepQuality?: number;
  energyLevel?: number;
  appetiteControl?: number;
  hydrationLiters?: number;
  physicalSymptoms?: string;
  sunlightMinutes?: number;
  moodScore?: number;
  stressLevel?: number;
  mentalClarity?: number;
  anxietyLevel?: number;
  screenTimeMin?: number;
  socialTimeMin?: number;
  outdoorTimeMin?: number;
  hygieneScore?: number;
  dietDiscipline?: number;
  noLateSnacks?: boolean;
  morningRoutine?: boolean;
  eveningRoutine?: boolean;
  wellnessNote?: string;
  wellnessScore?: number;
}

interface WellnessStats {
  totalEntries: number;
  averages: {
    sleepHours: number | null;
    sleepQuality: number | null;
    energyLevel: number | null;
    moodScore: number | null;
    stressLevel: number | null;
    mentalClarity: number | null;
    anxietyLevel: number | null;
    dietDiscipline: number | null;
    wellnessScore: number | null;
  };
  totals: {
    screenTimeMin: number;
    socialTimeMin: number;
    outdoorTimeMin: number;
    sunlightMinutes: number;
  };
  habits: {
    morningRoutineDays: number;
    eveningRoutineDays: number;
    noLateSnacksDays: number;
  };
  trend: Array<{
    date: string;
    wellnessScore: number | null;
    sleepHours: number | null;
    energyLevel: number | null;
    moodScore: number | null;
  }>;
}

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

// Wellness metric colors
const WELLNESS_COLORS = {
  sleep: '#3b82f6',       // blue
  energy: '#f59e0b',      // amber
  mood: '#10b981',        // green
  stress: '#ef4444',      // red
  clarity: '#8b5cf6',     // purple
  wellness: '#06b6d4',    // cyan
  anxiety: '#ec4899',     // pink
};

// Helper function to get last 7 days
function getLast7Days() {
  const days: { date: string; displayDate: string }[] = [];
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const displayDate = `${date.getDate()} ${dayNames[date.getDay()]}`;
    days.push({
      date: dateStr,
      displayDate: displayDate,
    });
  }
  return days;
}

// Helper function for wellness trend data (last 7 days time series)
function getWellnessTrendData(
  trend: Array<{ date: string; wellnessScore: number | null; sleepHours: number | null; energyLevel: number | null; moodScore: number | null }>,
  wellnessEntries: WellnessEntry[]
) {
  const days = getLast7Days();

  return days.map(({ date, displayDate }) => {
    const dayEntry = wellnessEntries.find(e => e.date.split('T')[0] === date);
    return {
      date,
      displayDate,
      wellnessScore: dayEntry?.wellnessScore || null,
      energyLevel: dayEntry?.energyLevel || null,
      moodScore: dayEntry?.moodScore || null,
    };
  });
}

// Helper function for sleep data (last 7 days time series)
function getSleepData(wellnessEntries: WellnessEntry[]) {
  const days = getLast7Days();

  return days.map(({ date, displayDate }) => {
    const dayEntry = wellnessEntries.find(e => e.date.split('T')[0] === date);
    return {
      date,
      displayDate,
      hours: dayEntry?.sleepHours || 0,
    };
  });
}

export default function WellnessPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tooltipStyles = getTooltipStyles(isDark);
  const chartColors = getChartColors(isDark);
  const [entries, setEntries] = React.useState<WellnessEntry[]>([]);
  const [stats, setStats] = React.useState<WellnessStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showModal, setShowModal] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<WellnessEntry | null>(null);

  // View mode toggle
  const [viewMode, setViewMode] = React.useState<'analytics' | 'log'>('analytics');

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
          api.wellness.list({ limit: 100 }),
          api.wellness.stats(),
        ]);
        setEntries((entriesRes as any).data || []);
        setStats((statsRes as any).data || null);
      } catch (err) {
        console.error('Failed to fetch wellness data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAuthenticated]);

  // CRUD handlers
  const handleCreate = async (data: Partial<WellnessEntry>) => {
    try {
      const res = await api.wellness.create(data);
      setEntries((prev) => [(res as any).data, ...prev]);
      setShowModal(false);
      const statsRes = await api.wellness.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to create wellness entry:', err);
    }
  };

  const handleUpdate = async (id: string, data: Partial<WellnessEntry>) => {
    try {
      const res = await api.wellness.update(id, data);
      setEntries((prev) => prev.map((e) => (e.id === id ? (res as any).data : e)));
      setEditingEntry(null);
      setShowModal(false);
      const statsRes = await api.wellness.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to update wellness entry:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this wellness entry?')) return;
    try {
      await api.wellness.delete(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      const statsRes = await api.wellness.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to delete wellness entry:', err);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.physicalSymptoms?.toLowerCase().includes(query) ||
      entry.wellnessNote?.toLowerCase().includes(query) ||
      formatDate(new Date(entry.date)).toLowerCase().includes(query)
    );
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
        title="Wellness"
        description="Track your daily health, sleep, mood, and habits"
        actions={
          <Button
            onClick={() => {
              setEditingEntry(null);
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Wellness
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
          {/* Stats Overview - Essential Metrics Only */}
          {stats && stats.totalEntries > 0 && (
            <>
              {/* Core Metrics - 4 essential cards */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
                <StatCard
                  label="Wellness Score"
                  value={stats.averages.wellnessScore?.toFixed(1) || 'N/A'}
                  icon={<Sparkles className="h-5 w-5" />}
                  suffix="/5"
                />
                <StatCard
                  label="Avg Sleep"
                  value={stats.averages.sleepHours?.toFixed(1) || 'N/A'}
                  icon={<Moon className="h-5 w-5" />}
                  suffix="h"
                />
                <StatCard
                  label="Energy"
                  value={stats.averages.energyLevel?.toFixed(1) || 'N/A'}
                  icon={<Activity className="h-5 w-5" />}
                  suffix="/5"
                />
                <StatCard
                  label="Mood"
                  value={stats.averages.moodScore?.toFixed(1) || 'N/A'}
                  icon={<Smile className="h-5 w-5" />}
                  suffix="/5"
                />
              </div>

              {/* Habits - Simplified inline */}
              <Card className="mb-6">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-6">
                      <HabitBadge
                        label="Morning"
                        icon={<Sun className="h-3.5 w-3.5" />}
                        completed={stats.habits.morningRoutineDays}
                        total={stats.totalEntries}
                      />
                      <HabitBadge
                        label="Evening"
                        icon={<Moon className="h-3.5 w-3.5" />}
                        completed={stats.habits.eveningRoutineDays}
                        total={stats.totalEntries}
                      />
                      <HabitBadge
                        label="No Snacks"
                        icon={<Utensils className="h-3.5 w-3.5" />}
                        completed={stats.habits.noLateSnacksDays}
                        total={stats.totalEntries}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stats.totalEntries} entries
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Analytics Charts */}
          {stats && stats.totalEntries > 0 && stats.trend && stats.trend.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Wellness Trend (Line Chart) */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Wellness Trend</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={getWellnessTrendData(stats.trend, entries)}
                        margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} vertical={false} />
                        <XAxis dataKey="displayDate" stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 5]} stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} width={20} />
                        <Tooltip
                          cursor={false}
                          {...tooltipStyles}
                          content={({ active, payload }) => {
                            if (!active || !payload) return null;
                            const nonZeroItems = payload.filter((item: any) => item.value && item.value > 0);
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
                                    <span style={{ color: item.stroke }}>{item.name}</span>: {item.value?.toFixed(1)}/5
                                  </p>
                                ))}
                              </div>
                            );
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '9px' }} />
                        <Line type="monotone" dataKey="wellnessScore" name="Wellness" stroke={WELLNESS_COLORS.wellness} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                        <Line type="monotone" dataKey="energyLevel" name="Energy" stroke={WELLNESS_COLORS.energy} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                        <Line type="monotone" dataKey="moodScore" name="Mood" stroke={WELLNESS_COLORS.mood} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Sleep Hours Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Sleep Hours</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getSleepData(entries)}
                        margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} vertical={false} />
                        <XAxis dataKey="displayDate" stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 12]} stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} width={20} />
                        <Tooltip
                          cursor={false}
                          {...tooltipStyles}
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload[0]) return null;
                            const value = payload[0].value as number;
                            if (!value || value === 0) return null;
                            return (
                              <div style={{
                                ...tooltipStyles.contentStyle,
                                padding: '8px 10px',
                                fontSize: '11px',
                              }}>
                                <p style={{ ...tooltipStyles.labelStyle, marginBottom: '4px', fontSize: '11px' }}>
                                  {payload[0]?.payload?.displayDate}
                                </p>
                                <p style={{ ...tooltipStyles.itemStyle, margin: '2px 0', fontSize: '10px' }}>
                                  <span style={{ color: WELLNESS_COLORS.sleep }}>Sleep</span>: {value?.toFixed(1)}h
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="hours" name="Sleep" fill={WELLNESS_COLORS.sleep} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty state for analytics */}
          {(!stats || stats.totalEntries === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No wellness data yet. Start logging entries to see analytics!</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setEditingEntry(null);
                    setShowModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Log Your First Entry
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Log View */}
      {viewMode === 'log' && (
        <>
          {/* Search */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search wellness entries..."
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
                  {entries.length === 0 ? 'No wellness entries logged yet.' : 'No entries match your search.'}
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
                    Log Your First Wellness Entry
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
        </>
      )}

      {/* Modal */}
      {showModal && (
        <WellnessModal
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

function HabitBadge({
  label,
  icon,
  completed,
  total,
}: {
  label: string;
  icon: React.ReactNode;
  completed: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isGood = percentage >= 80;
  const isOkay = percentage >= 50;

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 ${isGood ? 'text-green-600' : isOkay ? 'text-yellow-600' : 'text-muted-foreground'}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className={`text-xs font-semibold ${isGood ? 'text-green-600' : isOkay ? 'text-yellow-600' : 'text-muted-foreground'}`}>
        {percentage}%
      </span>
    </div>
  );
}


function EntryCard({
  entry,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  entry: WellnessEntry;
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">
                {formatDate(new Date(entry.date), { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {entry.wellnessScore && (
                <Badge variant={getWellnessVariant(entry.wellnessScore)}>
                  Score: {entry.wellnessScore.toFixed(1)}/5
                </Badge>
              )}
              {entry.morningRoutine && (
                <Badge variant="success" className="text-xs">
                  <Sun className="h-3 w-3 mr-1" />
                  Morning
                </Badge>
              )}
              {entry.eveningRoutine && (
                <Badge variant="success" className="text-xs">
                  <Moon className="h-3 w-3 mr-1" />
                  Evening
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              {entry.sleepHours && (
                <span className="flex items-center gap-1">
                  <Moon className="h-3 w-3" /> {entry.sleepHours}h sleep
                </span>
              )}
              {entry.energyLevel && (
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Energy: {entry.energyLevel}/5
                </span>
              )}
              {entry.moodScore && (
                <span className="flex items-center gap-1">
                  <Smile className="h-3 w-3" /> Mood: {entry.moodScore}/5
                </span>
              )}
              {entry.hydrationLiters && (
                <span className="flex items-center gap-1">
                  <Droplets className="h-3 w-3" /> {entry.hydrationLiters}L
                </span>
              )}
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                  {entry.sleepQuality && (
                    <div>
                      <span className="text-muted-foreground">Sleep Quality:</span> {entry.sleepQuality}/5
                    </div>
                  )}
                  {entry.mentalClarity && (
                    <div>
                      <span className="text-muted-foreground">Mental Clarity:</span> {entry.mentalClarity}/5
                    </div>
                  )}
                  {entry.stressLevel && (
                    <div>
                      <span className="text-muted-foreground">Stress Level:</span> {entry.stressLevel}/5
                    </div>
                  )}
                  {entry.anxietyLevel && (
                    <div>
                      <span className="text-muted-foreground">Anxiety Level:</span> {entry.anxietyLevel}/5
                    </div>
                  )}
                  {entry.appetiteControl && (
                    <div>
                      <span className="text-muted-foreground">Appetite Control:</span> {entry.appetiteControl}/5
                    </div>
                  )}
                  {entry.dietDiscipline && (
                    <div>
                      <span className="text-muted-foreground">Diet Discipline:</span> {entry.dietDiscipline}/5
                    </div>
                  )}
                  {entry.hygieneScore && (
                    <div>
                      <span className="text-muted-foreground">Hygiene:</span> {entry.hygieneScore}/5
                    </div>
                  )}
                  {entry.sunlightMinutes && (
                    <div>
                      <span className="text-muted-foreground">Sunlight:</span> {entry.sunlightMinutes} min
                    </div>
                  )}
                  {entry.screenTimeMin && (
                    <div>
                      <span className="text-muted-foreground">Screen Time:</span> {entry.screenTimeMin} min
                    </div>
                  )}
                  {entry.socialTimeMin && (
                    <div>
                      <span className="text-muted-foreground">Social Time:</span> {entry.socialTimeMin} min
                    </div>
                  )}
                  {entry.outdoorTimeMin && (
                    <div>
                      <span className="text-muted-foreground">Outdoor Time:</span> {entry.outdoorTimeMin} min
                    </div>
                  )}
                </div>

                <div className="flex gap-4 text-sm">
                  {entry.noLateSnacks !== undefined && (
                    <span className="flex items-center gap-1">
                      {entry.noLateSnacks ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                      No Late Snacks
                    </span>
                  )}
                </div>

                {entry.physicalSymptoms && (
                  <div>
                    <h4 className="text-sm font-medium">Physical Symptoms</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.physicalSymptoms}</p>
                  </div>
                )}
                {entry.wellnessNote && (
                  <div>
                    <h4 className="text-sm font-medium">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.wellnessNote}</p>
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

function WellnessModal({
  entry,
  onClose,
  onSave,
}: {
  entry: WellnessEntry | null;
  onClose: () => void;
  onSave: (data: Partial<WellnessEntry>) => void;
}) {
  const [formData, setFormData] = React.useState({
    date: toLocalDateString(entry?.date),
    sleepHours: entry?.sleepHours || '',
    sleepQuality: entry?.sleepQuality || '',
    energyLevel: entry?.energyLevel || '',
    appetiteControl: entry?.appetiteControl || '',
    hydrationLiters: entry?.hydrationLiters || '',
    physicalSymptoms: entry?.physicalSymptoms || '',
    sunlightMinutes: entry?.sunlightMinutes || '',
    moodScore: entry?.moodScore || '',
    stressLevel: entry?.stressLevel || '',
    mentalClarity: entry?.mentalClarity || '',
    anxietyLevel: entry?.anxietyLevel || '',
    screenTimeMin: entry?.screenTimeMin || '',
    socialTimeMin: entry?.socialTimeMin || '',
    outdoorTimeMin: entry?.outdoorTimeMin || '',
    hygieneScore: entry?.hygieneScore || '',
    dietDiscipline: entry?.dietDiscipline || '',
    noLateSnacks: entry?.noLateSnacks ?? true,
    morningRoutine: entry?.morningRoutine ?? false,
    eveningRoutine: entry?.eveningRoutine ?? false,
    wellnessNote: entry?.wellnessNote || '',
  });
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'physical' | 'mental' | 'habits' | 'notes'>('physical');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      date: new Date(formData.date).toISOString(),
      sleepHours: formData.sleepHours ? Number(formData.sleepHours) : undefined,
      sleepQuality: formData.sleepQuality ? Number(formData.sleepQuality) : undefined,
      energyLevel: formData.energyLevel ? Number(formData.energyLevel) : undefined,
      appetiteControl: formData.appetiteControl ? Number(formData.appetiteControl) : undefined,
      hydrationLiters: formData.hydrationLiters ? Number(formData.hydrationLiters) : undefined,
      physicalSymptoms: formData.physicalSymptoms || undefined,
      sunlightMinutes: formData.sunlightMinutes ? Number(formData.sunlightMinutes) : undefined,
      moodScore: formData.moodScore ? Number(formData.moodScore) : undefined,
      stressLevel: formData.stressLevel ? Number(formData.stressLevel) : undefined,
      mentalClarity: formData.mentalClarity ? Number(formData.mentalClarity) : undefined,
      anxietyLevel: formData.anxietyLevel ? Number(formData.anxietyLevel) : undefined,
      screenTimeMin: formData.screenTimeMin ? Number(formData.screenTimeMin) : undefined,
      socialTimeMin: formData.socialTimeMin ? Number(formData.socialTimeMin) : undefined,
      outdoorTimeMin: formData.outdoorTimeMin ? Number(formData.outdoorTimeMin) : undefined,
      hygieneScore: formData.hygieneScore ? Number(formData.hygieneScore) : undefined,
      dietDiscipline: formData.dietDiscipline ? Number(formData.dietDiscipline) : undefined,
      noLateSnacks: formData.noLateSnacks,
      morningRoutine: formData.morningRoutine,
      eveningRoutine: formData.eveningRoutine,
      wellnessNote: formData.wellnessNote || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {entry ? 'Edit Wellness Entry' : 'Log Wellness'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto">
          {[
            { key: 'physical', label: 'Physical' },
            { key: 'mental', label: 'Mental' },
            { key: 'habits', label: 'Habits & Time' },
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
          {activeTab === 'physical' && (
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
                  <label className="text-sm font-medium">Sleep Hours</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.sleepHours}
                    onChange={(e) => setFormData({ ...formData, sleepHours: e.target.value })}
                    placeholder="7.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sleep Quality (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.sleepQuality}
                    onChange={(e) => setFormData({ ...formData, sleepQuality: e.target.value })}
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Energy Level (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.energyLevel}
                    onChange={(e) => setFormData({ ...formData, energyLevel: e.target.value })}
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Hydration (liters)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.hydrationLiters}
                    onChange={(e) => setFormData({ ...formData, hydrationLiters: e.target.value })}
                    placeholder="2.0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Appetite Control (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.appetiteControl}
                    onChange={(e) => setFormData({ ...formData, appetiteControl: e.target.value })}
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Hygiene Score (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.hygieneScore}
                    onChange={(e) => setFormData({ ...formData, hygieneScore: e.target.value })}
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Sunlight (minutes)</label>
                  <Input
                    type="number"
                    value={formData.sunlightMinutes}
                    onChange={(e) => setFormData({ ...formData, sunlightMinutes: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Physical Symptoms</label>
                <textarea
                  value={formData.physicalSymptoms}
                  onChange={(e) => setFormData({ ...formData, physicalSymptoms: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                  placeholder="Any physical symptoms today..."
                />
              </div>
            </>
          )}

          {activeTab === 'mental' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Mood Score (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.moodScore}
                    onChange={(e) => setFormData({ ...formData, moodScore: e.target.value })}
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mental Clarity (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.mentalClarity}
                    onChange={(e) => setFormData({ ...formData, mentalClarity: e.target.value })}
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Stress Level (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.stressLevel}
                    onChange={(e) => setFormData({ ...formData, stressLevel: e.target.value })}
                    placeholder="2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">1 = low stress, 5 = high stress</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Anxiety Level (1-5)</label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.anxietyLevel}
                    onChange={(e) => setFormData({ ...formData, anxietyLevel: e.target.value })}
                    placeholder="2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">1 = low anxiety, 5 = high anxiety</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'habits' && (
            <>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.morningRoutine}
                    onChange={(e) => setFormData({ ...formData, morningRoutine: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Completed Morning Routine</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.eveningRoutine}
                    onChange={(e) => setFormData({ ...formData, eveningRoutine: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Moon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Completed Evening Routine</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.noLateSnacks}
                    onChange={(e) => setFormData({ ...formData, noLateSnacks: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Utensils className="h-4 w-4 text-green-500" />
                  <span className="text-sm">No Late Night Snacks</span>
                </label>
              </div>

              <div>
                <label className="text-sm font-medium">Diet Discipline (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.dietDiscipline}
                  onChange={(e) => setFormData({ ...formData, dietDiscipline: e.target.value })}
                  placeholder="4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Screen Time (min)</label>
                  <Input
                    type="number"
                    value={formData.screenTimeMin}
                    onChange={(e) => setFormData({ ...formData, screenTimeMin: e.target.value })}
                    placeholder="180"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Social Time (min)</label>
                  <Input
                    type="number"
                    value={formData.socialTimeMin}
                    onChange={(e) => setFormData({ ...formData, socialTimeMin: e.target.value })}
                    placeholder="60"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Outdoor Time (min)</label>
                <Input
                  type="number"
                  value={formData.outdoorTimeMin}
                  onChange={(e) => setFormData({ ...formData, outdoorTimeMin: e.target.value })}
                  placeholder="45"
                />
              </div>
            </>
          )}

          {activeTab === 'notes' && (
            <div>
              <label className="text-sm font-medium">Wellness Notes</label>
              <textarea
                value={formData.wellnessNote}
                onChange={(e) => setFormData({ ...formData, wellnessNote: e.target.value })}
                className="w-full min-h-[200px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                placeholder="How are you feeling today? Any observations about your health and wellness..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {entry ? 'Update' : 'Log'} Entry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper functions
function getWellnessVariant(score: number): 'success' | 'warning' | 'error' | 'neutral' {
  if (score >= 4) return 'success';
  if (score >= 3) return 'warning';
  if (score >= 2) return 'neutral';
  return 'error';
}
