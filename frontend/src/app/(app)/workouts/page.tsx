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
  Flame,
  Heart,
  Footprints,
  Dumbbell,
  Bike,
  PersonStanding,
  Activity,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Waves,
  Mountain,
  Gauge,
  Timer,
  RotateCcw,
  Target,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// Types
interface WorkoutSession {
  id: string;
  date: string;
  workoutType: string;
  routineName?: string;
  durationMin?: number;
  // Running/Walking/Cycling
  distanceKm?: number;
  paceMinPerKm?: number;
  steps?: number;
  cadence?: number;
  elevationGain?: number;
  elevationLoss?: number;
  avgSpeed?: number;
  maxSpeed?: number;
  // Heart Rate
  avgHeartRate?: number;
  maxHeartRate?: number;
  // Swimming
  laps?: number;
  poolLength?: number;
  strokeType?: string;
  strokeCount?: number;
  swolfScore?: number;
  // Strength
  totalVolume?: number;
  totalSets?: number;
  totalReps?: number;
  rpe?: number;
  avgRestTime?: number;
  // HIIT
  rounds?: number;
  workInterval?: number;
  restInterval?: number;
  // General
  calories?: number;
  intensityLevel?: number;
  focus: string;
  preEnergy?: number;
  postMood?: string;
  workoutQuality?: number;
  notes?: string;
  sets?: WorkoutSet[];
}

interface WorkoutSet {
  id: string;
  exerciseName: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  durationSec?: number;
  restAfterSec?: number;
  rpe?: number;
  notes?: string;
}

interface WorkoutStats {
  totalSessions: number;
  totalMinutes: number;
  totalDistance: number;
  totalCalories: number;
  totalSteps: number;
  averageQuality: number | null;
  byType: Record<string, {
    sessions: number;
    totalMinutes: number;
    totalDistance: number;
    averageIntensity: number | null;
  }>;
}

const WORKOUT_TYPES = [
  { value: 'jogging', label: 'Jogging', icon: Footprints },
  { value: 'walking', label: 'Walking', icon: Footprints },
  { value: 'strength', label: 'Strength Training', icon: Dumbbell },
  { value: 'hiit', label: 'HIIT', icon: Zap },
  { value: 'swimming', label: 'Swimming', icon: Waves },
  { value: 'cycling', label: 'Cycling', icon: Bike },
  { value: 'stretching', label: 'Stretching', icon: PersonStanding },
  { value: 'yoga', label: 'Yoga', icon: PersonStanding },
  { value: 'sports', label: 'Sports', icon: Activity },
  { value: 'other', label: 'Other', icon: Activity },
] as const;

const WORKOUT_FOCUS = [
  { value: 'endurance', label: 'Endurance' },
  { value: 'fat_burn', label: 'Fat Burn' },
  { value: 'strength', label: 'Strength' },
  { value: 'core', label: 'Core' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'other', label: 'Other' },
] as const;

const STROKE_TYPES = [
  { value: 'freestyle', label: 'Freestyle' },
  { value: 'backstroke', label: 'Backstroke' },
  { value: 'breaststroke', label: 'Breaststroke' },
  { value: 'butterfly', label: 'Butterfly' },
  { value: 'mixed', label: 'Mixed' },
] as const;

const POOL_LENGTHS = [
  { value: 25, label: '25m' },
  { value: 50, label: '50m' },
] as const;

// Metrics configuration by workout type
const METRICS_BY_TYPE: Record<string, {
  primary: string[];
  secondary: string[];
}> = {
  jogging: {
    primary: ['distance', 'pace', 'cadence', 'steps', 'calories', 'avgHeartRate'],
    secondary: ['maxHeartRate', 'elevationGain', 'elevationLoss'],
  },
  walking: {
    primary: ['distance', 'steps', 'calories', 'avgHeartRate'],
    secondary: ['pace', 'cadence', 'elevationGain'],
  },
  cycling: {
    primary: ['distance', 'avgSpeed', 'cadence', 'calories', 'avgHeartRate'],
    secondary: ['maxSpeed', 'maxHeartRate', 'elevationGain', 'elevationLoss'],
  },
  swimming: {
    primary: ['distance', 'laps', 'poolLength', 'strokeType', 'swolfScore'],
    secondary: ['strokeCount', 'calories', 'avgHeartRate'],
  },
  strength: {
    primary: ['totalVolume', 'totalSets', 'totalReps', 'rpe'],
    secondary: ['avgRestTime', 'calories'],
  },
  hiit: {
    primary: ['rounds', 'workInterval', 'restInterval', 'calories', 'avgHeartRate'],
    secondary: ['maxHeartRate', 'rpe'],
  },
  yoga: {
    primary: ['calories'],
    secondary: ['avgHeartRate'],
  },
  stretching: {
    primary: ['calories'],
    secondary: [],
  },
  sports: {
    primary: ['calories', 'avgHeartRate'],
    secondary: ['maxHeartRate', 'distance', 'steps'],
  },
  other: {
    primary: ['calories', 'avgHeartRate'],
    secondary: ['distance', 'steps'],
  },
};

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

// Workout type chart colors
const WORKOUT_TYPE_COLORS: Record<string, string> = {
  jogging: '#ef4444',    // red
  walking: '#22c55e',    // green
  strength: '#3b82f6',   // blue
  hiit: '#f97316',       // orange
  swimming: '#06b6d4',   // cyan
  cycling: '#8b5cf6',    // purple
  stretching: '#ec4899', // pink
  yoga: '#14b8a6',       // teal
  sports: '#eab308',     // yellow
  other: '#6b7280',      // gray
};

export default function WorkoutsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tooltipStyles = getTooltipStyles(isDark);
  const chartColors = getChartColors(isDark);
  const [sessions, setSessions] = React.useState<WorkoutSession[]>([]);
  const [stats, setStats] = React.useState<WorkoutStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showModal, setShowModal] = React.useState(false);
  const [editingSession, setEditingSession] = React.useState<WorkoutSession | null>(null);

  // View mode toggle
  const [viewMode, setViewMode] = React.useState<'analytics' | 'log'>('analytics');

  // Filters
  const [filterType, setFilterType] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedSession, setExpandedSession] = React.useState<string | null>(null);

  // Fetch data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [sessionsRes, statsRes] = await Promise.all([
          api.workouts.list({ limit: 100 }),
          api.workouts.stats(),
        ]);
        setSessions((sessionsRes as any).data || []);
        setStats((statsRes as any).data || null);
      } catch (err) {
        console.error('Failed to fetch workouts data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAuthenticated]);

  // CRUD handlers
  const handleCreate = async (data: Partial<WorkoutSession>) => {
    try {
      const res = await api.workouts.create(data);
      setSessions((prev) => [(res as any).data, ...prev]);
      setShowModal(false);
      const statsRes = await api.workouts.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to create workout:', err);
    }
  };

  const handleUpdate = async (id: string, data: Partial<WorkoutSession>) => {
    try {
      const res = await api.workouts.update(id, data);
      setSessions((prev) => prev.map((s) => (s.id === id ? (res as any).data : s)));
      setEditingSession(null);
      setShowModal(false);
      const statsRes = await api.workouts.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to update workout:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;
    try {
      await api.workouts.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      const statsRes = await api.workouts.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to delete workout:', err);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    const matchesType = filterType === 'all' || session.workoutType === filterType;
    const matchesSearch = !searchQuery ||
      session.routineName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.postMood?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Get top workout types by sessions
  const topTypes = stats?.byType
    ? Object.entries(stats.byType)
        .sort((a, b) => b[1].sessions - a[1].sessions)
        .slice(0, 5)
    : [];

  // Helper function for daily workout duration data (stacked by workout type)
  function getDailyWorkoutData(workoutSessions: WorkoutSession[]) {
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
      const daySessions = workoutSessions.filter(s => s.date.split('T')[0] === date);
      return {
        date,
        displayDate,
        jogging: daySessions.filter(s => s.workoutType === 'jogging').reduce((sum, s) => sum + (s.durationMin || 0), 0),
        walking: daySessions.filter(s => s.workoutType === 'walking').reduce((sum, s) => sum + (s.durationMin || 0), 0),
        strength: daySessions.filter(s => s.workoutType === 'strength').reduce((sum, s) => sum + (s.durationMin || 0), 0),
        hiit: daySessions.filter(s => s.workoutType === 'hiit').reduce((sum, s) => sum + (s.durationMin || 0), 0),
        swimming: daySessions.filter(s => s.workoutType === 'swimming').reduce((sum, s) => sum + (s.durationMin || 0), 0),
        cycling: daySessions.filter(s => s.workoutType === 'cycling').reduce((sum, s) => sum + (s.durationMin || 0), 0),
        yoga: daySessions.filter(s => s.workoutType === 'yoga').reduce((sum, s) => sum + (s.durationMin || 0), 0),
        stretching: daySessions.filter(s => s.workoutType === 'stretching').reduce((sum, s) => sum + (s.durationMin || 0), 0),
        sports: daySessions.filter(s => s.workoutType === 'sports').reduce((sum, s) => sum + (s.durationMin || 0), 0),
        other: daySessions.filter(s => s.workoutType === 'other').reduce((sum, s) => sum + (s.durationMin || 0), 0),
      };
    });
  }

  // Helper function for daily calories data (stacked by workout type)
  function getDailyCaloriesData(workoutSessions: WorkoutSession[]) {
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
      const daySessions = workoutSessions.filter(s => s.date.split('T')[0] === date);
      return {
        date,
        displayDate,
        jogging: daySessions.filter(s => s.workoutType === 'jogging').reduce((sum, s) => sum + (s.calories || 0), 0),
        walking: daySessions.filter(s => s.workoutType === 'walking').reduce((sum, s) => sum + (s.calories || 0), 0),
        strength: daySessions.filter(s => s.workoutType === 'strength').reduce((sum, s) => sum + (s.calories || 0), 0),
        hiit: daySessions.filter(s => s.workoutType === 'hiit').reduce((sum, s) => sum + (s.calories || 0), 0),
        swimming: daySessions.filter(s => s.workoutType === 'swimming').reduce((sum, s) => sum + (s.calories || 0), 0),
        cycling: daySessions.filter(s => s.workoutType === 'cycling').reduce((sum, s) => sum + (s.calories || 0), 0),
        yoga: daySessions.filter(s => s.workoutType === 'yoga').reduce((sum, s) => sum + (s.calories || 0), 0),
        stretching: daySessions.filter(s => s.workoutType === 'stretching').reduce((sum, s) => sum + (s.calories || 0), 0),
        sports: daySessions.filter(s => s.workoutType === 'sports').reduce((sum, s) => sum + (s.calories || 0), 0),
        other: daySessions.filter(s => s.workoutType === 'other').reduce((sum, s) => sum + (s.calories || 0), 0),
      };
    });
  }

  const dailyWorkoutData = getDailyWorkoutData(sessions);
  const dailyCaloriesData = getDailyCaloriesData(sessions);

  // Get workout types that have data (for filtering legend/bars)
  const activeWorkoutTypes = React.useMemo(() => {
    const types = new Set<string>();
    sessions.forEach(s => {
      if (s.workoutType) types.add(s.workoutType);
    });
    return types;
  }, [sessions]);

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
        title="Workouts"
        description="Track your fitness activities with detailed metrics"
        actions={
          <Button
            onClick={() => {
              setEditingSession(null);
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Workout
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
          {stats && stats.totalSessions > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-6">
              <StatCard
                label="Workouts"
                value={stats.totalSessions.toString()}
                icon={<Dumbbell className="h-5 w-5" />}
              />
              <StatCard
                label="Duration"
                value={`${Math.round(stats.totalMinutes / 60)}h`}
                icon={<Clock className="h-5 w-5" />}
              />
              <StatCard
                label="Distance"
                value={`${stats.totalDistance.toFixed(1)}km`}
                icon={<Footprints className="h-5 w-5" />}
              />
              <StatCard
                label="Calories"
                value={stats.totalCalories.toLocaleString()}
                icon={<Flame className="h-5 w-5" />}
              />
              <StatCard
                label="Avg Quality"
                value={stats.averageQuality?.toFixed(1) || 'N/A'}
                icon={<TrendingUp className="h-5 w-5" />}
                suffix="/5"
              />
            </div>
          )}

          {/* Charts Grid - 2x2 layout with larger charts */}
          {stats && stats.totalSessions > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Daily Workout Duration (Stacked Bar Chart) */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Daily Workout Duration</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyWorkoutData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} vertical={false} />
                        <XAxis dataKey="displayDate" stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} width={30} />
                        <Tooltip
                          cursor={false}
                          {...tooltipStyles}
                          content={({ active, payload, label }) => {
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
                                  {payload[0]?.payload?.displayDate} - {total} min
                                </p>
                                {nonZeroItems.map((item: any, idx: number) => (
                                  <p key={idx} style={{ ...tooltipStyles.itemStyle, margin: '2px 0', fontSize: '10px' }}>
                                    <span style={{ color: item.fill }}>{getTypeLabel(item.dataKey)}</span>: {item.value} min
                                  </p>
                                ))}
                              </div>
                            );
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        {activeWorkoutTypes.has('jogging') && <Bar dataKey="jogging" name="Jogging" stackId="a" fill={WORKOUT_TYPE_COLORS.jogging} />}
                        {activeWorkoutTypes.has('walking') && <Bar dataKey="walking" name="Walking" stackId="a" fill={WORKOUT_TYPE_COLORS.walking} />}
                        {activeWorkoutTypes.has('strength') && <Bar dataKey="strength" name="Strength" stackId="a" fill={WORKOUT_TYPE_COLORS.strength} />}
                        {activeWorkoutTypes.has('hiit') && <Bar dataKey="hiit" name="HIIT" stackId="a" fill={WORKOUT_TYPE_COLORS.hiit} />}
                        {activeWorkoutTypes.has('swimming') && <Bar dataKey="swimming" name="Swimming" stackId="a" fill={WORKOUT_TYPE_COLORS.swimming} />}
                        {activeWorkoutTypes.has('cycling') && <Bar dataKey="cycling" name="Cycling" stackId="a" fill={WORKOUT_TYPE_COLORS.cycling} />}
                        {activeWorkoutTypes.has('yoga') && <Bar dataKey="yoga" name="Yoga" stackId="a" fill={WORKOUT_TYPE_COLORS.yoga} />}
                        {activeWorkoutTypes.has('stretching') && <Bar dataKey="stretching" name="Stretching" stackId="a" fill={WORKOUT_TYPE_COLORS.stretching} />}
                        {activeWorkoutTypes.has('sports') && <Bar dataKey="sports" name="Sports" stackId="a" fill={WORKOUT_TYPE_COLORS.sports} />}
                        {activeWorkoutTypes.has('other') && <Bar dataKey="other" name="Other" stackId="a" fill={WORKOUT_TYPE_COLORS.other} />}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Calories Burned (Stacked Bar Chart) */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Daily Calories Burned</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyCaloriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} vertical={false} />
                        <XAxis dataKey="displayDate" stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} width={35} />
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
                                  {payload[0]?.payload?.displayDate} - {total} cal
                                </p>
                                {nonZeroItems.map((item: any, idx: number) => (
                                  <p key={idx} style={{ ...tooltipStyles.itemStyle, margin: '2px 0', fontSize: '10px' }}>
                                    <span style={{ color: item.fill }}>{getTypeLabel(item.dataKey)}</span>: {item.value} cal
                                  </p>
                                ))}
                              </div>
                            );
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        {activeWorkoutTypes.has('jogging') && <Bar dataKey="jogging" name="Jogging" stackId="a" fill={WORKOUT_TYPE_COLORS.jogging} />}
                        {activeWorkoutTypes.has('walking') && <Bar dataKey="walking" name="Walking" stackId="a" fill={WORKOUT_TYPE_COLORS.walking} />}
                        {activeWorkoutTypes.has('strength') && <Bar dataKey="strength" name="Strength" stackId="a" fill={WORKOUT_TYPE_COLORS.strength} />}
                        {activeWorkoutTypes.has('hiit') && <Bar dataKey="hiit" name="HIIT" stackId="a" fill={WORKOUT_TYPE_COLORS.hiit} />}
                        {activeWorkoutTypes.has('swimming') && <Bar dataKey="swimming" name="Swimming" stackId="a" fill={WORKOUT_TYPE_COLORS.swimming} />}
                        {activeWorkoutTypes.has('cycling') && <Bar dataKey="cycling" name="Cycling" stackId="a" fill={WORKOUT_TYPE_COLORS.cycling} />}
                        {activeWorkoutTypes.has('yoga') && <Bar dataKey="yoga" name="Yoga" stackId="a" fill={WORKOUT_TYPE_COLORS.yoga} />}
                        {activeWorkoutTypes.has('stretching') && <Bar dataKey="stretching" name="Stretching" stackId="a" fill={WORKOUT_TYPE_COLORS.stretching} />}
                        {activeWorkoutTypes.has('sports') && <Bar dataKey="sports" name="Sports" stackId="a" fill={WORKOUT_TYPE_COLORS.sports} />}
                        {activeWorkoutTypes.has('other') && <Bar dataKey="other" name="Other" stackId="a" fill={WORKOUT_TYPE_COLORS.other} />}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Time Distribution by Type (Pie Chart) */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Time Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(stats.byType)
                            .filter(([_, data]) => data.totalMinutes > 0)
                            .slice(0, 6)
                            .map(([type, data]) => ({
                              name: WORKOUT_TYPES.find(t => t.value === type)?.label || type,
                              value: data.totalMinutes,
                              hours: Math.round(data.totalMinutes / 60 * 10) / 10,
                              color: WORKOUT_TYPE_COLORS[type] || '#6b7280',
                            }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {Object.entries(stats.byType)
                            .filter(([_, data]) => data.totalMinutes > 0)
                            .slice(0, 6)
                            .map(([type], index) => (
                              <Cell key={`cell-${index}`} fill={WORKOUT_TYPE_COLORS[type] || '#6b7280'} />
                            ))}
                        </Pie>
                        <Tooltip
                          cursor={false}
                          {...tooltipStyles}
                          formatter={(value: number, name: string, props: any) => [`${props.payload.hours}h`, name]}
                        />
                        <Legend
                          verticalAlign="middle"
                          align="right"
                          layout="vertical"
                          wrapperStyle={{ fontSize: '11px', paddingLeft: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Workouts by Type Progress */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Workouts by Type</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[280px] overflow-y-auto pr-2">
                    <div className="space-y-4">
                      {topTypes.map(([type, data]) => {
                        const percentage = stats.totalSessions > 0
                          ? (data.sessions / stats.totalSessions) * 100
                          : 0;
                        return (
                          <div key={type}>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="flex items-center gap-2">
                                {getTypeIcon(type)}
                                {getTypeLabel(type)}
                              </span>
                              <span className="text-muted-foreground">
                                {data.sessions} sessions • {Math.round(data.totalMinutes / 60)}h
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: WORKOUT_TYPE_COLORS[type] || '#6b7280',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty state for analytics */}
          {(!stats || stats.totalSessions === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No workout data yet. Start logging workouts to see analytics!</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setEditingSession(null);
                    setShowModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Log Your First Workout
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Log View */}
      {viewMode === 'log' && (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workouts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              {WORKOUT_TYPES.slice(0, 4).map(({ value, label }) => (
                <Button
                  key={value}
                  variant={filterType === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(value)}
                >
                  {label}
                </Button>
              ))}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">More...</option>
                {WORKOUT_TYPES.slice(4).map(({ value, label }) => (
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
                  {sessions.length === 0 ? 'No workouts logged yet.' : 'No workouts match your search.'}
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
                    Log Your First Workout
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
        </>
      )}

      {/* Modal */}
      {showModal && (
        <WorkoutModal
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
  session: WorkoutSession;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const TypeIcon = WORKOUT_TYPES.find((t) => t.value === session.workoutType)?.icon || Activity;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <TypeIcon className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {getTypeLabel(session.workoutType)}
                {session.routineName && ` - ${session.routineName}`}
              </span>
              <Badge variant={getIntensityVariant(session.intensityLevel)}>
                {getFocusLabel(session.focus)}
              </Badge>
              {session.workoutQuality && (
                <Badge variant={getQualityVariant(session.workoutQuality)}>
                  Quality: {session.workoutQuality}/5
                </Badge>
              )}
            </div>

            {/* Primary metrics row */}
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              <span>{formatDate(new Date(session.date), { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {session.durationMin && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {session.durationMin} min
                </span>
              )}
              {session.distanceKm && (
                <span className="flex items-center gap-1">
                  <Footprints className="h-3 w-3" /> {session.distanceKm} km
                </span>
              )}
              {session.calories && (
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3" /> {session.calories} cal
                </span>
              )}
              {session.avgHeartRate && (
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" /> {session.avgHeartRate} bpm
                </span>
              )}
              {/* Swimming specific */}
              {session.swolfScore && (
                <span className="flex items-center gap-1">
                  <Waves className="h-3 w-3" /> SWOLF: {session.swolfScore}
                </span>
              )}
              {/* Strength specific */}
              {session.totalVolume && (
                <span className="flex items-center gap-1">
                  <Dumbbell className="h-3 w-3" /> {session.totalVolume.toLocaleString()} kg
                </span>
              )}
              {/* HIIT specific */}
              {session.rounds && (
                <span className="flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" /> {session.rounds} rounds
                </span>
              )}
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {/* Running/Walking/Cycling metrics */}
                  {session.paceMinPerKm && (
                    <MetricItem label="Pace" value={`${session.paceMinPerKm.toFixed(2)} min/km`} />
                  )}
                  {session.cadence && (
                    <MetricItem
                      label={session.workoutType === 'cycling' ? 'Cadence (RPM)' : 'Cadence (SPM)'}
                      value={session.cadence.toString()}
                    />
                  )}
                  {session.steps && (
                    <MetricItem label="Steps" value={session.steps.toLocaleString()} />
                  )}
                  {session.avgSpeed && (
                    <MetricItem label="Avg Speed" value={`${session.avgSpeed.toFixed(1)} km/h`} />
                  )}
                  {session.maxSpeed && (
                    <MetricItem label="Max Speed" value={`${session.maxSpeed.toFixed(1)} km/h`} />
                  )}
                  {session.elevationGain && (
                    <MetricItem label="Elevation Gain" value={`${session.elevationGain} m`} />
                  )}
                  {session.elevationLoss && (
                    <MetricItem label="Elevation Loss" value={`${session.elevationLoss} m`} />
                  )}

                  {/* Heart Rate */}
                  {session.maxHeartRate && (
                    <MetricItem label="Max Heart Rate" value={`${session.maxHeartRate} bpm`} />
                  )}

                  {/* Swimming metrics */}
                  {session.laps && (
                    <MetricItem label="Laps" value={session.laps.toString()} />
                  )}
                  {session.poolLength && (
                    <MetricItem label="Pool Length" value={`${session.poolLength}m`} />
                  )}
                  {session.strokeType && (
                    <MetricItem label="Stroke Type" value={getStrokeLabel(session.strokeType)} />
                  )}
                  {session.strokeCount && (
                    <MetricItem label="Strokes/Lap" value={session.strokeCount.toString()} />
                  )}

                  {/* Strength metrics */}
                  {session.totalSets && (
                    <MetricItem label="Total Sets" value={session.totalSets.toString()} />
                  )}
                  {session.totalReps && (
                    <MetricItem label="Total Reps" value={session.totalReps.toString()} />
                  )}
                  {session.rpe && (
                    <MetricItem label="RPE" value={`${session.rpe}/10`} />
                  )}
                  {session.avgRestTime && (
                    <MetricItem label="Avg Rest" value={`${session.avgRestTime}s`} />
                  )}

                  {/* HIIT metrics */}
                  {session.workInterval && (
                    <MetricItem label="Work Interval" value={`${session.workInterval}s`} />
                  )}
                  {session.restInterval && (
                    <MetricItem label="Rest Interval" value={`${session.restInterval}s`} />
                  )}

                  {/* General */}
                  {session.intensityLevel && (
                    <MetricItem label="Intensity" value={`${session.intensityLevel}/5`} />
                  )}
                  {session.preEnergy && (
                    <MetricItem label="Pre-workout Energy" value={`${session.preEnergy}/5`} />
                  )}
                </div>

                {session.postMood && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Post-workout Mood:</span> {session.postMood}
                  </div>
                )}
                {session.notes && (
                  <div>
                    <h4 className="text-sm font-medium">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{session.notes}</p>
                  </div>
                )}
                {session.sets && session.sets.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Exercises ({session.sets.length} sets)</h4>
                    <div className="space-y-1">
                      {session.sets.map((set) => (
                        <div key={set.id} className="text-sm text-muted-foreground flex gap-2">
                          <span className="font-medium">{set.exerciseName}</span>
                          {set.reps && <span>• {set.reps} reps</span>}
                          {set.weight && <span>• {set.weight} kg</span>}
                          {set.durationSec && <span>• {set.durationSec}s</span>}
                          {set.rpe && <span>• RPE {set.rpe}</span>}
                        </div>
                      ))}
                    </div>
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

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>{' '}
      <span className="font-medium">{value}</span>
    </div>
  );
}

function WorkoutModal({
  session,
  onClose,
  onSave,
}: {
  session: WorkoutSession | null;
  onClose: () => void;
  onSave: (data: Partial<WorkoutSession>) => void;
}) {
  const [formData, setFormData] = React.useState({
    date: toLocalDateString(session?.date),
    workoutType: session?.workoutType || 'jogging',
    routineName: session?.routineName || '',
    durationMin: session?.durationMin || '',
    // Running/Walking/Cycling
    distanceKm: session?.distanceKm || '',
    paceMinPerKm: session?.paceMinPerKm || '',
    steps: session?.steps || '',
    cadence: session?.cadence || '',
    elevationGain: session?.elevationGain || '',
    elevationLoss: session?.elevationLoss || '',
    avgSpeed: session?.avgSpeed || '',
    maxSpeed: session?.maxSpeed || '',
    // Heart Rate
    avgHeartRate: session?.avgHeartRate || '',
    maxHeartRate: session?.maxHeartRate || '',
    // Swimming
    laps: session?.laps || '',
    poolLength: session?.poolLength || '',
    strokeType: session?.strokeType || 'freestyle',
    strokeCount: session?.strokeCount || '',
    swolfScore: session?.swolfScore || '',
    // Strength
    totalVolume: session?.totalVolume || '',
    totalSets: session?.totalSets || '',
    totalReps: session?.totalReps || '',
    rpe: session?.rpe || '',
    avgRestTime: session?.avgRestTime || '',
    // HIIT
    rounds: session?.rounds || '',
    workInterval: session?.workInterval || '',
    restInterval: session?.restInterval || '',
    // General
    calories: session?.calories || '',
    intensityLevel: session?.intensityLevel || '',
    focus: session?.focus || 'endurance',
    preEnergy: session?.preEnergy || '',
    postMood: session?.postMood || '',
    workoutQuality: session?.workoutQuality || '',
    notes: session?.notes || '',
  });
  const [saving, setSaving] = React.useState(false);

  const workoutType = formData.workoutType;
  const metricsConfig = METRICS_BY_TYPE[workoutType] || METRICS_BY_TYPE.other;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data: Partial<WorkoutSession> = {
      date: new Date(formData.date).toISOString(),
      workoutType: formData.workoutType,
      routineName: formData.routineName || undefined,
      durationMin: formData.durationMin ? Number(formData.durationMin) : undefined,
      focus: formData.focus,
      intensityLevel: formData.intensityLevel ? Number(formData.intensityLevel) : undefined,
      preEnergy: formData.preEnergy ? Number(formData.preEnergy) : undefined,
      postMood: formData.postMood || undefined,
      workoutQuality: formData.workoutQuality ? Number(formData.workoutQuality) : undefined,
      notes: formData.notes || undefined,
      calories: formData.calories ? Number(formData.calories) : undefined,
    };

    // Add type-specific metrics
    if (['jogging', 'walking', 'cycling'].includes(workoutType)) {
      data.distanceKm = formData.distanceKm ? Number(formData.distanceKm) : undefined;
      data.paceMinPerKm = formData.paceMinPerKm ? Number(formData.paceMinPerKm) : undefined;
      data.steps = formData.steps ? Number(formData.steps) : undefined;
      data.cadence = formData.cadence ? Number(formData.cadence) : undefined;
      data.elevationGain = formData.elevationGain ? Number(formData.elevationGain) : undefined;
      data.elevationLoss = formData.elevationLoss ? Number(formData.elevationLoss) : undefined;
    }

    if (workoutType === 'cycling') {
      data.avgSpeed = formData.avgSpeed ? Number(formData.avgSpeed) : undefined;
      data.maxSpeed = formData.maxSpeed ? Number(formData.maxSpeed) : undefined;
    }

    if (workoutType === 'swimming') {
      data.laps = formData.laps ? Number(formData.laps) : undefined;
      data.poolLength = formData.poolLength ? Number(formData.poolLength) : undefined;
      data.strokeType = formData.strokeType || undefined;
      data.strokeCount = formData.strokeCount ? Number(formData.strokeCount) : undefined;
      data.swolfScore = formData.swolfScore ? Number(formData.swolfScore) : undefined;
      data.distanceKm = formData.distanceKm ? Number(formData.distanceKm) : undefined;
    }

    if (workoutType === 'strength') {
      data.totalVolume = formData.totalVolume ? Number(formData.totalVolume) : undefined;
      data.totalSets = formData.totalSets ? Number(formData.totalSets) : undefined;
      data.totalReps = formData.totalReps ? Number(formData.totalReps) : undefined;
      data.rpe = formData.rpe ? Number(formData.rpe) : undefined;
      data.avgRestTime = formData.avgRestTime ? Number(formData.avgRestTime) : undefined;
    }

    if (workoutType === 'hiit') {
      data.rounds = formData.rounds ? Number(formData.rounds) : undefined;
      data.workInterval = formData.workInterval ? Number(formData.workInterval) : undefined;
      data.restInterval = formData.restInterval ? Number(formData.restInterval) : undefined;
      data.rpe = formData.rpe ? Number(formData.rpe) : undefined;
    }

    // Heart rate for cardio activities
    if (['jogging', 'walking', 'cycling', 'swimming', 'hiit', 'sports'].includes(workoutType)) {
      data.avgHeartRate = formData.avgHeartRate ? Number(formData.avgHeartRate) : undefined;
      data.maxHeartRate = formData.maxHeartRate ? Number(formData.maxHeartRate) : undefined;
    }

    await onSave(data);
    setSaving(false);
  };

  // Auto-calculate pace when distance and duration change
  React.useEffect(() => {
    if (formData.distanceKm && formData.durationMin && ['jogging', 'walking'].includes(workoutType)) {
      const distance = Number(formData.distanceKm);
      const duration = Number(formData.durationMin);
      if (distance > 0 && duration > 0) {
        const pace = duration / distance;
        setFormData((prev) => ({ ...prev, paceMinPerKm: pace.toFixed(2) }));
      }
    }
  }, [formData.distanceKm, formData.durationMin, workoutType]);

  // Auto-calculate avg speed for cycling
  React.useEffect(() => {
    if (formData.distanceKm && formData.durationMin && workoutType === 'cycling') {
      const distance = Number(formData.distanceKm);
      const duration = Number(formData.durationMin);
      if (distance > 0 && duration > 0) {
        const speed = (distance / duration) * 60;
        setFormData((prev) => ({ ...prev, avgSpeed: speed.toFixed(1) }));
      }
    }
  }, [formData.distanceKm, formData.durationMin, workoutType]);

  // Auto-calculate SWOLF for swimming
  React.useEffect(() => {
    if (formData.laps && formData.strokeCount && formData.durationMin && workoutType === 'swimming') {
      const laps = Number(formData.laps);
      const strokesPerLap = Number(formData.strokeCount);
      const duration = Number(formData.durationMin) * 60; // convert to seconds
      if (laps > 0 && strokesPerLap > 0 && duration > 0) {
        const timePerLap = duration / laps;
        const swolf = Math.round(timePerLap + strokesPerLap);
        setFormData((prev) => ({ ...prev, swolfScore: swolf.toString() }));
      }
    }
  }, [formData.laps, formData.strokeCount, formData.durationMin, workoutType]);

  // Auto-calculate swimming distance
  React.useEffect(() => {
    if (formData.laps && formData.poolLength && workoutType === 'swimming') {
      const laps = Number(formData.laps);
      const poolLength = Number(formData.poolLength);
      if (laps > 0 && poolLength > 0) {
        const distance = (laps * poolLength) / 1000; // convert to km
        setFormData((prev) => ({ ...prev, distanceKm: distance.toFixed(2) }));
      }
    }
  }, [formData.laps, formData.poolLength, workoutType]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {session ? 'Edit Workout' : 'Log Workout'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</h3>

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
                <label className="text-sm font-medium">Duration (min)</label>
                <Input
                  type="number"
                  value={formData.durationMin}
                  onChange={(e) => setFormData({ ...formData, durationMin: e.target.value })}
                  placeholder="45"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Workout Type *</label>
                <select
                  value={formData.workoutType}
                  onChange={(e) => setFormData({ ...formData, workoutType: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  required
                >
                  {WORKOUT_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Focus</label>
                <select
                  value={formData.focus}
                  onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {WORKOUT_FOCUS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Routine Name</label>
              <Input
                value={formData.routineName}
                onChange={(e) => setFormData({ ...formData, routineName: e.target.value })}
                placeholder="Morning Run, Leg Day, Pool Session..."
              />
            </div>
          </div>

          {/* Type-Specific Metrics Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {getTypeLabel(workoutType)} Metrics
            </h3>

            {/* Running/Walking Metrics */}
            {['jogging', 'walking'].includes(workoutType) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Distance (km)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.distanceKm}
                      onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
                      placeholder="5.0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pace (min/km) <span className="text-muted-foreground text-xs">auto</span></label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.paceMinPerKm}
                      onChange={(e) => setFormData({ ...formData, paceMinPerKm: e.target.value })}
                      placeholder="6.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Cadence (steps/min)</label>
                    <Input
                      type="number"
                      value={formData.cadence}
                      onChange={(e) => setFormData({ ...formData, cadence: e.target.value })}
                      placeholder="170"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Steps</label>
                    <Input
                      type="number"
                      value={formData.steps}
                      onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                      placeholder="5000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Elevation Gain (m)</label>
                    <Input
                      type="number"
                      value={formData.elevationGain}
                      onChange={(e) => setFormData({ ...formData, elevationGain: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Elevation Loss (m)</label>
                    <Input
                      type="number"
                      value={formData.elevationLoss}
                      onChange={(e) => setFormData({ ...formData, elevationLoss: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Cycling Metrics */}
            {workoutType === 'cycling' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Distance (km)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.distanceKm}
                      onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
                      placeholder="20.0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Avg Speed (km/h) <span className="text-muted-foreground text-xs">auto</span></label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.avgSpeed}
                      onChange={(e) => setFormData({ ...formData, avgSpeed: e.target.value })}
                      placeholder="25.0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Max Speed (km/h)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.maxSpeed}
                      onChange={(e) => setFormData({ ...formData, maxSpeed: e.target.value })}
                      placeholder="45.0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cadence (RPM)</label>
                    <Input
                      type="number"
                      value={formData.cadence}
                      onChange={(e) => setFormData({ ...formData, cadence: e.target.value })}
                      placeholder="85"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Elevation Gain (m)</label>
                    <Input
                      type="number"
                      value={formData.elevationGain}
                      onChange={(e) => setFormData({ ...formData, elevationGain: e.target.value })}
                      placeholder="200"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Elevation Loss (m)</label>
                    <Input
                      type="number"
                      value={formData.elevationLoss}
                      onChange={(e) => setFormData({ ...formData, elevationLoss: e.target.value })}
                      placeholder="200"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Swimming Metrics */}
            {workoutType === 'swimming' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Laps</label>
                    <Input
                      type="number"
                      value={formData.laps}
                      onChange={(e) => setFormData({ ...formData, laps: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pool Length</label>
                    <select
                      value={formData.poolLength}
                      onChange={(e) => setFormData({ ...formData, poolLength: e.target.value })}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Select...</option>
                      {POOL_LENGTHS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Stroke Type</label>
                    <select
                      value={formData.strokeType}
                      onChange={(e) => setFormData({ ...formData, strokeType: e.target.value })}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      {STROKE_TYPES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Strokes per Lap</label>
                    <Input
                      type="number"
                      value={formData.strokeCount}
                      onChange={(e) => setFormData({ ...formData, strokeCount: e.target.value })}
                      placeholder="15"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">SWOLF Score <span className="text-muted-foreground text-xs">auto</span></label>
                    <Input
                      type="number"
                      value={formData.swolfScore}
                      onChange={(e) => setFormData({ ...formData, swolfScore: e.target.value })}
                      placeholder="35"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Lower is better (time + strokes)</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Distance (km) <span className="text-muted-foreground text-xs">auto</span></label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.distanceKm}
                      onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
                      placeholder="0.5"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Strength Training Metrics */}
            {workoutType === 'strength' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Total Sets</label>
                    <Input
                      type="number"
                      value={formData.totalSets}
                      onChange={(e) => setFormData({ ...formData, totalSets: e.target.value })}
                      placeholder="15"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Total Reps</label>
                    <Input
                      type="number"
                      value={formData.totalReps}
                      onChange={(e) => setFormData({ ...formData, totalReps: e.target.value })}
                      placeholder="120"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Total Volume (kg)</label>
                    <Input
                      type="number"
                      value={formData.totalVolume}
                      onChange={(e) => setFormData({ ...formData, totalVolume: e.target.value })}
                      placeholder="5000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Sets × Reps × Weight</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">RPE (1-10)</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.rpe}
                      onChange={(e) => setFormData({ ...formData, rpe: e.target.value })}
                      placeholder="7"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Rate of Perceived Exertion</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Avg Rest Time (seconds)</label>
                  <Input
                    type="number"
                    value={formData.avgRestTime}
                    onChange={(e) => setFormData({ ...formData, avgRestTime: e.target.value })}
                    placeholder="90"
                  />
                </div>
              </>
            )}

            {/* HIIT Metrics */}
            {workoutType === 'hiit' && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Rounds</label>
                    <Input
                      type="number"
                      value={formData.rounds}
                      onChange={(e) => setFormData({ ...formData, rounds: e.target.value })}
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Work (sec)</label>
                    <Input
                      type="number"
                      value={formData.workInterval}
                      onChange={(e) => setFormData({ ...formData, workInterval: e.target.value })}
                      placeholder="40"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Rest (sec)</label>
                    <Input
                      type="number"
                      value={formData.restInterval}
                      onChange={(e) => setFormData({ ...formData, restInterval: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">RPE (1-10)</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.rpe}
                    onChange={(e) => setFormData({ ...formData, rpe: e.target.value })}
                    placeholder="8"
                  />
                </div>
              </>
            )}

            {/* Heart Rate for cardio activities */}
            {['jogging', 'walking', 'cycling', 'swimming', 'hiit', 'sports'].includes(workoutType) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Avg Heart Rate (bpm)</label>
                  <Input
                    type="number"
                    value={formData.avgHeartRate}
                    onChange={(e) => setFormData({ ...formData, avgHeartRate: e.target.value })}
                    placeholder="145"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Heart Rate (bpm)</label>
                  <Input
                    type="number"
                    value={formData.maxHeartRate}
                    onChange={(e) => setFormData({ ...formData, maxHeartRate: e.target.value })}
                    placeholder="175"
                  />
                </div>
              </div>
            )}

            {/* Calories for all types */}
            <div>
              <label className="text-sm font-medium">Calories</label>
              <Input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                placeholder="300"
              />
            </div>
          </div>

          {/* Quality & Notes Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quality & Notes</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Intensity (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.intensityLevel}
                  onChange={(e) => setFormData({ ...formData, intensityLevel: e.target.value })}
                  placeholder="3"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Quality (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.workoutQuality}
                  onChange={(e) => setFormData({ ...formData, workoutQuality: e.target.value })}
                  placeholder="4"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Pre-Energy (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.preEnergy}
                  onChange={(e) => setFormData({ ...formData, preEnergy: e.target.value })}
                  placeholder="3"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Post-workout Mood</label>
              <Input
                value={formData.postMood}
                onChange={(e) => setFormData({ ...formData, postMood: e.target.value })}
                placeholder="Energized, Tired, Great..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                placeholder="How was your workout? Any observations..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {session ? 'Update' : 'Log'} Workout
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper functions
function getTypeLabel(type: string): string {
  const typeObj = WORKOUT_TYPES.find((t) => t.value === type);
  return typeObj?.label || type;
}

function getTypeIcon(type: string): React.ReactNode {
  const typeObj = WORKOUT_TYPES.find((t) => t.value === type);
  const IconComponent = typeObj?.icon || Activity;
  return <IconComponent className="h-4 w-4" />;
}

function getFocusLabel(focus: string): string {
  const focusObj = WORKOUT_FOCUS.find((f) => f.value === focus);
  return focusObj?.label || focus;
}

function getStrokeLabel(stroke: string): string {
  const strokeObj = STROKE_TYPES.find((s) => s.value === stroke);
  return strokeObj?.label || stroke;
}

function getIntensityVariant(intensity?: number): 'success' | 'warning' | 'error' | 'neutral' {
  if (!intensity) return 'neutral';
  if (intensity >= 4) return 'error';
  if (intensity >= 3) return 'warning';
  return 'neutral';
}

function getQualityVariant(quality: number): 'success' | 'warning' | 'error' | 'neutral' {
  if (quality >= 4) return 'success';
  if (quality >= 3) return 'warning';
  if (quality >= 2) return 'neutral';
  return 'error';
}
