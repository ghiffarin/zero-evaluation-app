'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Clock, FileText, TrendingUp, Trash2, Play, MoreVertical, Brain, Target, Lightbulb, Download, Upload } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import type { Quiz, QuizListResponse } from '@/types/quiz';

interface QuizStats {
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number | null;
  totalStudyTimeMinutes: number;
}

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load stats only on first render
      const promises: Promise<any>[] = [
        api.quizzes.getAll({
          search: debouncedSearch || undefined,
          difficulty: difficulty || undefined,
          limit: 50,
        }) as Promise<{ data: QuizListResponse }>
      ];

      if (statsLoading) {
        promises.push(api.quizzes.getStats() as Promise<{ data: QuizStats }>);
      }

      const results = await Promise.all(promises);

      setQuizzes(results[0].data.data);

      if (statsLoading && results[1]) {
        setStats(results[1].data);
        setStatsLoading(false);
      }
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, difficulty, statsLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      await api.quizzes.delete(id);
      // Reload stats after delete
      setStatsLoading(true);
      loadData();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      alert('Failed to delete quiz');
    }
  }, [loadData]);

  const getDifficultyColor = useCallback((diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'medium':
      case 'medium-high':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'hard':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const response = await api.quizzes.export() as { data: { quizzes: any[]; total: number; exported_at: string } };

      // Create JSON file
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quizzes-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Successfully exported ${response.data.total} quiz(zes)`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export quizzes');
    }
  }, []);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate the structure
      if (!data.quizzes || !Array.isArray(data.quizzes)) {
        alert('Invalid import file: missing quizzes array');
        return;
      }

      const response = await api.quizzes.import({ quizzes: data.quizzes }) as { data: { imported: number; failed: number; results: any } };

      if (response.data.failed > 0) {
        const failedList = response.data.results.failed.map((f: any) => `- ${f.title}: ${f.error}`).join('\n');
        alert(`Import completed:\n✓ ${response.data.imported} succeeded\n✗ ${response.data.failed} failed\n\nFailed imports:\n${failedList}`);
      } else {
        alert(`Successfully imported ${response.data.imported} quiz(zes)`);
      }

      // Reload data
      setStatsLoading(true);
      loadData();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import quizzes. Please check the file format.');
    }

    // Reset input
    event.target.value = '';
  }, [loadData]);

  return (
    <PageContainer>
      <PageHeader
        title="Quizzes"
        description="Practice and test your knowledge"
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 px-4 rounded-lg transition-colors"
              title="Export all quizzes"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <label className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
              title="Import quizzes from JSON file"
            >
              <Upload className="w-4 h-4" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <Link
              href="/quizzes/generator"
              className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              Generator
            </Link>
            <Link
              href="/quizzes/upload"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Upload
            </Link>
          </div>
        }
      />

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        {statsLoading ? (
          // Skeleton loading for stats
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-muted rounded animate-pulse" />
                    <div className="flex-1">
                      <div className="h-3 w-20 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-5 w-12 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-primary">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Quizzes</p>
                    <p className="text-lg font-semibold">{stats?.totalQuizzes || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Attempts</p>
                    <p className="text-lg font-semibold">{stats?.totalAttempts || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-primary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Average Score</p>
                    <p className="text-lg font-semibold">
                      {stats?.averageScore !== null && stats?.averageScore !== undefined ? `${stats.averageScore.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Study Time</p>
                    <p className="text-lg font-semibold">
                      {stats ? `${(stats.totalStudyTimeMinutes / 60).toFixed(1)}h` : '0h'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-4 py-2 bg-card border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="medium-high">Medium-High</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Quiz Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                {/* Header skeleton */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                  <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                </div>

                {/* Details skeleton */}
                <div className="space-y-0">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex items-center justify-between text-xs py-2 border-b border-border">
                      <div className="h-3 bg-muted rounded animate-pulse w-16" />
                      <div className="h-3 bg-muted rounded animate-pulse w-12" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No quizzes found
            </h3>
            <p className="text-muted-foreground mb-4">
              {search || difficulty ? 'Try adjusting your filters' : 'Upload your first quiz to get started'}
            </p>
            {!search && !difficulty && (
              <Link
                href="/quizzes/upload"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Upload Quiz
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/quizzes/${quiz.id}`)}
            >
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold mb-0.5 truncate">{quiz.title}</h3>
                    {quiz.stats && quiz.stats.totalAttempts > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        {quiz.stats.totalAttempts} attempt{quiz.stats.totalAttempts !== 1 ? 's' : ''}
                        {quiz.stats.bestScore !== null && ` • Best: ${quiz.stats.bestScore}/${quiz.maxScore}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(quiz.id);
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
                    title="Delete quiz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Details Grid */}
                <div className="space-y-0">
                  <div className="flex items-center justify-between text-xs py-2 border-b border-border">
                    <span className="text-muted-foreground">Difficulty</span>
                    <Badge className={getDifficultyColor(quiz.difficulty)}>
                      {quiz.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-border">
                    <span className="text-muted-foreground">Questions</span>
                    <span className="font-medium">{quiz.totalQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-border">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{quiz.recommendedTimeMin} min</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-border">
                    <span className="text-muted-foreground">Max Score</span>
                    <span className="font-medium">{quiz.maxScore}</span>
                  </div>
                  {quiz.stats && quiz.stats.averagePercentage !== null && (
                    <div className="flex items-center justify-between text-xs py-2">
                      <span className="text-muted-foreground">Avg Score</span>
                      <span className="font-medium">{quiz.stats.averagePercentage.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
