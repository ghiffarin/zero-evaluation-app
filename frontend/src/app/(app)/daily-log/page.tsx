'use client';

import { useState, useEffect } from 'react';
import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api';
import { getTodayISO, isToday as checkIsToday } from '@/lib/utils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  Dumbbell,
  Wallet,
  Heart,
  Zap,
  Moon,
  Brain,
  Activity,
  FileText,
  Target,
  Briefcase,
  GraduationCap,
  Check,
  X,
  Loader2,
  Save,
  RefreshCw,
} from 'lucide-react';

interface AggregatedData {
  date: string;
  workHours: number;
  learningHours: number;
  workoutMinutes: number;
  sleepHours: number | null;
  sleepQuality: number | null;
  moodScore: number | null;
  energyScore: number | null;
  stressLevel: number | null;
  hydrationLiters: number | null;
  moneySpent: number;
  moneyEarned: number;
  moneyInvested: number;
  steps: number | null;
  calories: number | null;
  pagesRead: number | null;
  breakdown: {
    ielts: { sessions: number; minutes: number };
    skills: { sessions: number; minutes: number };
    books: { sessions: number; minutes: number; pagesRead: number };
    workouts: { sessions: number; minutes: number; calories: number; steps: number };
    career: { activities: number; minutes: number };
    mastersPrep: { sessions: number; minutes: number };
    financial: { transactions: number; spending: number; income: number; investment: number };
    journals: { entries: number };
    reflections: { entries: number };
    wellness: { logged: boolean; sleepHours?: number; moodScore?: number; energyLevel?: number };
  };
  hasData: Record<string, boolean>;
}

interface DailyLog {
  id: string;
  date: string;
  mainFocus: string | null;
  workHours: number | null;
  learningHours: number | null;
  workoutMinutes: number | null;
  moneySpent: number | null;
  moodScore: number | null;
  energyScore: number | null;
  sleepHours: number | null;
  steps: number | null;
  dayScore: number | null;
  notes: string | null;
}

export default function DailyLogPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [aggregatedData, setAggregatedData] = useState<AggregatedData | null>(null);
  const [existingLog, setExistingLog] = useState<DailyLog | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state for manual fields
  const [mainFocus, setMainFocus] = useState('');
  const [dayScore, setDayScore] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aggregateRes, logRes, logsListRes] = await Promise.all([
        api.dailyLogs.aggregate(selectedDate),
        api.dailyLogs.getByDate(selectedDate).catch(() => null),
        api.dailyLogs.list({ limit: 30 }),
      ]);

      const aggData = (aggregateRes as any).data;
      setAggregatedData(aggData);

      const logData = (logRes as any)?.data;
      setExistingLog(logData || null);

      // Pre-fill manual fields if log exists
      if (logData) {
        setMainFocus(logData.mainFocus || '');
        setDayScore(logData.dayScore);
        setNotes(logData.notes || '');
      } else {
        setMainFocus('');
        setDayScore(null);
        setNotes('');
      }

      setLogs((logsListRes as any).data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAggregatedData = async () => {
    setRefreshing(true);
    try {
      const res = await api.dailyLogs.aggregate(selectedDate);
      setAggregatedData((res as any).data);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogThisDay = async () => {
    if (!aggregatedData) return;

    setSaving(true);
    try {
      const logData = {
        mainFocus: mainFocus || null,
        workHours: aggregatedData.workHours,
        learningHours: aggregatedData.learningHours,
        workoutMinutes: aggregatedData.workoutMinutes,
        moneySpent: aggregatedData.moneySpent,
        moodScore: aggregatedData.moodScore,
        energyScore: aggregatedData.energyScore,
        sleepHours: aggregatedData.sleepHours,
        steps: aggregatedData.steps,
        dayScore: dayScore,
        notes: notes || null,
      };

      await api.dailyLogs.upsertByDate(selectedDate, logData);

      // Refresh to get the saved log
      const logRes = await api.dailyLogs.getByDate(selectedDate);
      setExistingLog((logRes as any).data);

      // Refresh logs list
      const logsListRes = await api.dailyLogs.list({ limit: 30 });
      setLogs((logsListRes as any).data || []);
    } catch (error) {
      console.error('Failed to save log:', error);
    } finally {
      setSaving(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    if (hours === 0) return '-';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const formatMinutes = (minutes: number) => {
    if (minutes === 0) return '-';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const getScoreColor = (score: number | null, max: number = 5) => {
    if (score === null) return 'text-muted-foreground';
    const ratio = score / max;
    if (ratio >= 0.8) return 'text-green-500';
    if (ratio >= 0.6) return 'text-yellow-500';
    if (ratio >= 0.4) return 'text-orange-500';
    return 'text-red-500';
  };

  const isToday = checkIsToday(selectedDate);

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please log in to view your daily log.</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const hasAnyData = aggregatedData && Object.values(aggregatedData.hasData).some(Boolean);

  return (
    <PageContainer>
      <PageHeader
        title="Daily Log"
        description="Automated daily snapshot from your tracked activities"
      />

      {/* Date Navigation */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-3">
              {isToday ? (
                <span className="px-2.5 py-1 text-xs font-semibold bg-blue-500 text-white rounded-full">
                  Today
                </span>
              ) : (
                <Calendar className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="text-center">
                <div className="font-semibold">{formatDate(selectedDate)}</div>
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              disabled={isToday}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Banner */}
      {existingLog && (
        <Card className="mb-6 border-green-500/50 bg-green-500/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-medium">This day has been logged</span>
              {existingLog.dayScore && (
                <span className="ml-auto text-sm">
                  Day Score: <span className="font-bold">{existingLog.dayScore}/10</span>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Time Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Investment
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshAggregatedData}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 text-blue-500 mb-1">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-sm font-medium">Work</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {aggregatedData ? formatHours(aggregatedData.workHours) : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {aggregatedData?.breakdown.career.activities || 0} activities
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 text-purple-500 mb-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm font-medium">Learning</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {aggregatedData ? formatHours(aggregatedData.learningHours) : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    IELTS + Skills + Books + Masters
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-500 mb-1">
                    <Dumbbell className="h-4 w-4" />
                    <span className="text-sm font-medium">Workout</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {aggregatedData ? formatMinutes(aggregatedData.workoutMinutes) : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {aggregatedData?.breakdown.workouts.sessions || 0} sessions
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Learning Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-1">IELTS</div>
                  <div className="font-semibold">
                    {aggregatedData ? formatMinutes(aggregatedData.breakdown.ielts.minutes) : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {aggregatedData?.breakdown.ielts.sessions || 0} sessions
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-1">Skills</div>
                  <div className="font-semibold">
                    {aggregatedData ? formatMinutes(aggregatedData.breakdown.skills.minutes) : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {aggregatedData?.breakdown.skills.sessions || 0} sessions
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-1">Books</div>
                  <div className="font-semibold">
                    {aggregatedData ? formatMinutes(aggregatedData.breakdown.books.minutes) : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {aggregatedData?.breakdown.books.pagesRead || 0} pages
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-1">Masters Prep</div>
                  <div className="font-semibold">
                    {aggregatedData ? formatMinutes(aggregatedData.breakdown.mastersPrep.minutes) : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {aggregatedData?.breakdown.mastersPrep.sessions || 0} sessions
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wellness Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Wellness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Moon className="h-5 w-5 mx-auto mb-1 text-indigo-500" />
                  <div className="text-sm text-muted-foreground">Sleep</div>
                  <div className="font-semibold text-lg">
                    {aggregatedData?.sleepHours ? `${aggregatedData.sleepHours}h` : '-'}
                  </div>
                </div>

                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Heart className="h-5 w-5 mx-auto mb-1 text-pink-500" />
                  <div className="text-sm text-muted-foreground">Mood</div>
                  <div className={`font-semibold text-lg ${getScoreColor(aggregatedData?.moodScore || null)}`}>
                    {aggregatedData?.moodScore ? `${aggregatedData.moodScore}/5` : '-'}
                  </div>
                </div>

                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                  <div className="text-sm text-muted-foreground">Energy</div>
                  <div className={`font-semibold text-lg ${getScoreColor(aggregatedData?.energyScore || null)}`}>
                    {aggregatedData?.energyScore ? `${aggregatedData.energyScore}/5` : '-'}
                  </div>
                </div>

                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Brain className="h-5 w-5 mx-auto mb-1 text-red-500" />
                  <div className="text-sm text-muted-foreground">Stress</div>
                  <div className={`font-semibold text-lg ${getScoreColor(aggregatedData?.stressLevel ? 6 - aggregatedData.stressLevel : null)}`}>
                    {aggregatedData?.stressLevel ? `${aggregatedData.stressLevel}/5` : '-'}
                  </div>
                </div>
              </div>

              {!aggregatedData?.hasData.wellness && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  No wellness entry for this day. Add one in the Wellness page.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Financial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-sm text-red-500 mb-1">Spent</div>
                  <div className="font-semibold">
                    {aggregatedData ? formatCurrency(aggregatedData.moneySpent) : '-'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-sm text-green-500 mb-1">Earned</div>
                  <div className="font-semibold">
                    {aggregatedData ? formatCurrency(aggregatedData.moneyEarned) : '-'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-sm text-blue-500 mb-1">Invested</div>
                  <div className="font-semibold">
                    {aggregatedData ? formatCurrency(aggregatedData.moneyInvested) : '-'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center mt-3">
                {aggregatedData?.breakdown.financial.transactions || 0} transactions
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  {aggregatedData?.hasData.ielts ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">IELTS</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  {aggregatedData?.hasData.skills ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Skills</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  {aggregatedData?.hasData.books ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Reading</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  {aggregatedData?.hasData.workouts ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Workout</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  {aggregatedData?.hasData.wellness ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Wellness</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  {aggregatedData?.hasData.financial ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Financial</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  {aggregatedData?.hasData.journals ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Journal</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  {aggregatedData?.hasData.reflections ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Reflection</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Log This Day */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Log This Day
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mainFocus">Main Focus (optional)</Label>
                <Input
                  id="mainFocus"
                  value={mainFocus}
                  onChange={(e) => setMainFocus(e.target.value)}
                  placeholder="What was your main priority today?"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Day Score (1-10)</Label>
                <div className="grid grid-cols-10 gap-1 mt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      onClick={() => setDayScore(score === dayScore ? null : score)}
                      className={`h-8 rounded-lg text-xs font-medium transition-colors ${
                        dayScore === score
                          ? score <= 3
                            ? 'bg-red-500 text-white'
                            : score <= 5
                            ? 'bg-orange-500 text-white'
                            : score <= 7
                            ? 'bg-yellow-500 text-white'
                            : 'bg-green-500 text-white'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any reflections or notes about today..."
                  rows={4}
                  className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleLogThisDay}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : existingLog ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Log
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Log This Day
                  </>
                )}
              </Button>

              {!hasAnyData && (
                <p className="text-xs text-muted-foreground text-center">
                  No activity data found for this day. The log will be saved with empty metrics.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No logs yet
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {logs.map((log) => {
                    const logDate = new Date(log.date).toISOString().split('T')[0];
                    const isSelected = logDate === selectedDate;
                    return (
                      <button
                        key={log.id}
                        onClick={() => setSelectedDate(logDate)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border border-primary/30'
                            : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-medium">
                            {new Date(log.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          {log.dayScore && (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded ${
                                log.dayScore >= 8
                                  ? 'bg-green-500/20 text-green-500'
                                  : log.dayScore >= 6
                                  ? 'bg-yellow-500/20 text-yellow-500'
                                  : 'bg-red-500/20 text-red-500'
                              }`}
                            >
                              {log.dayScore}/10
                            </span>
                          )}
                        </div>
                        {log.mainFocus && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {log.mainFocus}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
