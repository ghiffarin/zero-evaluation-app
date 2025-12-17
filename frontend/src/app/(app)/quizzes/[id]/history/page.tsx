'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Trophy, Calendar, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

interface HistoryAttempt {
  id: string;
  mode: 'practice' | 'test';
  score: number;
  maxScore: number;
  percentage: number;
  timeSpentSeconds: number;
  completedAt: string;
  isRandomized: boolean;
}

interface QuizHistory {
  quizId: string;
  quizTitle: string;
  attempts: HistoryAttempt[];
  totalAttempts: number;
}

export default function QuizHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;

  const [history, setHistory] = useState<QuizHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState<'all' | 'practice' | 'test'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'time'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadHistory();
  }, [quizId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await api.quizzes.getHistory(quizId) as { data: QuizHistory };
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to load history:', error);
      alert('Failed to load quiz history');
      router.push('/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
  };

  const getFilteredAndSortedAttempts = () => {
    if (!history) return [];

    let filtered = history.attempts;

    // Apply mode filter
    if (modeFilter !== 'all') {
      filtered = filtered.filter((a) => a.mode === modeFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
      } else if (sortBy === 'score') {
        comparison = a.percentage - b.percentage;
      } else if (sortBy === 'time') {
        comparison = a.timeSpentSeconds - b.timeSpentSeconds;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const getStats = () => {
    if (!history || history.attempts.length === 0) return null;

    const attempts = history.attempts;
    const avgScore = attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length;
    const bestScore = Math.max(...attempts.map((a) => a.percentage));
    const avgTime = attempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / attempts.length;

    const practiceAttempts = attempts.filter((a) => a.mode === 'practice').length;
    const testAttempts = attempts.filter((a) => a.mode === 'test').length;

    // Calculate trend (last 5 vs previous 5)
    const recent = attempts.slice(-5);
    const previous = attempts.slice(-10, -5);
    const recentAvg = recent.reduce((sum, a) => sum + a.percentage, 0) / recent.length;
    const previousAvg = previous.length > 0
      ? previous.reduce((sum, a) => sum + a.percentage, 0) / previous.length
      : recentAvg;
    const trend = recentAvg - previousAvg;

    return {
      avgScore,
      bestScore,
      avgTime,
      practiceAttempts,
      testAttempts,
      trend,
    };
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground mt-4">Loading history...</p>
        </div>
      </PageContainer>
    );
  }

  if (!history) return null;

  const filteredAttempts = getFilteredAndSortedAttempts();
  const stats = getStats();

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        <Link
          href={`/quizzes/${quizId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quiz
        </Link>

        <PageHeader
          title="Quiz History"
          description={history.quizTitle}
        />

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Total Attempts</div>
                <div className="text-2xl font-bold">{history.totalAttempts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Best Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(stats.bestScore)}`}>
                  {stats.bestScore.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Avg Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
                  {stats.avgScore.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Avg Time</div>
                <div className="text-2xl font-bold">{formatTime(Math.round(stats.avgTime))}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Trend</div>
                <div className={`text-2xl font-bold flex items-center gap-1 ${
                  stats.trend > 0 ? 'text-green-600 dark:text-green-400' :
                  stats.trend < 0 ? 'text-red-600 dark:text-red-400' :
                  'text-muted-foreground'
                }`}>
                  {stats.trend > 0 && <TrendingUp className="w-5 h-5" />}
                  {stats.trend < 0 && <TrendingDown className="w-5 h-5" />}
                  {Math.abs(stats.trend).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Mode Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Mode:</span>
                <div className="flex gap-2">
                  {(['all', 'practice', 'test'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setModeFilter(mode)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        modeFilter === mode
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 bg-secondary rounded-lg text-sm font-medium border-none outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="date">Date</option>
                  <option value="score">Score</option>
                  <option value="time">Time</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              {/* Results count */}
              <div className="ml-auto text-sm text-muted-foreground">
                {filteredAttempts.length} {filteredAttempts.length === 1 ? 'attempt' : 'attempts'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attempts List */}
        {filteredAttempts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No attempts found with the selected filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAttempts.map((attempt) => (
              <Card key={attempt.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    {/* Date */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{formatDate(attempt.completedAt)}</div>
                        <div className="text-xs text-muted-foreground">
                          {attempt.isRandomized && 'Randomized • '}
                          <span className="capitalize">{attempt.mode} Mode</span>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className={`text-xl font-bold ${getScoreColor(attempt.percentage)}`}>
                          {attempt.percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {attempt.score} / {attempt.maxScore} points
                        </div>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <div className="font-medium">{formatTime(attempt.timeSpentSeconds)}</div>
                    </div>

                    {/* Badge */}
                    <div>
                      <Badge className={getScoreBadge(attempt.percentage)}>
                        {attempt.percentage >= 80 ? 'Excellent' :
                         attempt.percentage >= 60 ? 'Good' :
                         'Needs Practice'}
                      </Badge>
                    </div>

                    {/* View Button */}
                    <Link
                      href={`/quizzes/results/${attempt.id}`}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                    >
                      View Results
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
