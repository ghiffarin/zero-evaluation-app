'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, FileText, TrendingUp, Play, BookOpen, Timer, Shuffle, AlertCircle, History } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import type { Quiz } from '@/types/quiz';

export default function QuizDetailPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [mode, setMode] = useState<'practice' | 'test'>('practice');
  const [randomize, setRandomize] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const response = await api.quizzes.getById(quizId) as { data: Quiz };
      setQuiz(response.data);
    } catch (error) {
      console.error('Failed to load quiz:', error);
      alert('Quiz not found');
      router.push('/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!quiz) return;

    // Check for in-progress attempt
    if (quiz.hasInProgressAttempt && quiz.inProgressAttempt) {
      const resume = confirm(
        'You have an unfinished quiz attempt. Do you want to resume it? Click Cancel to start a new attempt (your progress will be lost).'
      );

      if (resume) {
        router.push(`/quizzes/attempt/${quiz.inProgressAttempt.id}`);
        return;
      }
    }

    setShowModeSelector(true);
  };

  const handleConfirmStart = async () => {
    if (!quiz) return;

    try {
      setStarting(true);
      const response = await api.quizzes.startAttempt(quiz.id, { mode, randomize }) as { data: { id: string } };
      router.push(`/quizzes/attempt/${response.data.id}`);
    } catch (error) {
      console.error('Failed to start quiz:', error);
      alert('Failed to start quiz');
      setStarting(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
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
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground mt-4">Loading quiz...</p>
        </div>
      </PageContainer>
    );
  }

  if (!quiz) return null;

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <Link
          href="/quizzes"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quizzes
        </Link>

        {/* Quiz Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-3xl mb-2">{quiz.title}</CardTitle>
                <Badge className={getDifficultyColor(quiz.difficulty)}>
                  {quiz.difficulty}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* Quiz Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Questions</span>
                </div>
                <p className="text-2xl font-bold">{quiz.totalQuestions}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Time</span>
                </div>
                <p className="text-2xl font-bold">{quiz.recommendedTimeMin}m</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Max Score</span>
                </div>
                <p className="text-2xl font-bold">{quiz.maxScore}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Attempts</span>
                </div>
                <p className="text-2xl font-bold">
                  {quiz.stats?.totalAttempts || 0}
                </p>
              </div>
            </div>

            {/* Statistics */}
            {quiz.stats && quiz.stats.totalAttempts > 0 && (
              <div className="pt-6 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {quiz.stats.bestScore !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Best Score</p>
                      <p className="text-lg font-semibold">
                        {quiz.stats.bestScore}/{quiz.maxScore}
                      </p>
                    </div>
                  )}
                  {quiz.stats.averagePercentage !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Average</p>
                      <p className="text-lg font-semibold">
                        {quiz.stats.averagePercentage.toFixed(1)}%
                      </p>
                    </div>
                  )}
                  {quiz.stats.averageTime !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Time</p>
                      <p className="text-lg font-semibold">
                        {Math.floor(quiz.stats.averageTime / 60)}m {Math.floor(quiz.stats.averageTime % 60)}s
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sections */}
            {quiz.sectionsJson && quiz.sectionsJson.length > 0 && (
              <div className="pt-6 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Sections</h3>
                <div className="space-y-2">
                  {quiz.sectionsJson.map((section: any, idx: number) => (
                    <div key={section.id} className="flex items-center justify-between text-sm">
                      <span>{idx + 1}. {section.name}</span>
                      <span className="text-muted-foreground">
                        {section.question_ids.length} questions
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In-progress warning */}
            {quiz.hasInProgressAttempt && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                      Unfinished Attempt
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      You have an in-progress attempt. Starting a new quiz will abandon your current progress.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Start Button */}
            {!showModeSelector && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleStartQuiz}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  {quiz.hasInProgressAttempt ? 'Resume or Start New' : 'Start Quiz'}
                </button>

                {/* View History Button - Only show if there are attempts */}
                {quiz.stats && quiz.stats.totalAttempts > 0 && (
                  <Link
                    href={`/quizzes/${quiz.id}/history`}
                    className="w-full bg-secondary hover:bg-secondary/80 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <History className="w-5 h-5" />
                    View History ({quiz.stats.totalAttempts} {quiz.stats.totalAttempts === 1 ? 'attempt' : 'attempts'})
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mode Selector */}
        {showModeSelector && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Quiz Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Mode Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Practice Mode */}
                <button
                  onClick={() => setMode('practice')}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    mode === 'practice'
                      ? 'border-primary bg-primary/10'
                      : 'border-input hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Practice Mode</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get immediate feedback after each answer. Perfect for learning.
                  </p>
                </button>

                {/* Test Mode */}
                <button
                  onClick={() => setMode('test')}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    mode === 'test'
                      ? 'border-primary bg-primary/10'
                      : 'border-input hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Timer className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <h3 className="font-semibold">Test Mode</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Timed quiz with results at the end. Simulate real test conditions.
                  </p>
                </button>
              </div>

              {/* Options */}
              <div>
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={randomize}
                    onChange={(e) => setRandomize(e.target.checked)}
                    className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Shuffle className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Randomize Questions</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Questions will be shuffled within each section
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModeSelector(false)}
                  className="flex-1 bg-secondary hover:bg-secondary/80 font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStart}
                  disabled={starting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {starting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start {mode === 'practice' ? 'Practice' : 'Test'}
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
