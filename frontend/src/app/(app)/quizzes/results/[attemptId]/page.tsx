'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, Clock, CheckCircle, XCircle, RotateCcw, Home } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import QuestionRenderer from '@/components/quiz/QuestionRenderer';
import type { QuizAttempt, Question, QuestionResult } from '@/types/quiz';

export default function QuizResultsPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  useEffect(() => {
    loadResults();
  }, [attemptId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await api.quizzes.getResults(attemptId) as { data: QuizAttempt };
      const attemptData = response.data;

      setAttempt(attemptData);

      // Get questions in correct order
      const quizQuestions = attemptData.quiz?.questionsJson as Question[];
      if (attemptData.isRandomized && attemptData.randomizedOrderJson) {
        const orderedQuestions = attemptData.randomizedOrderJson.order.map(
          (id) => quizQuestions.find((q) => q.id === id)!
        );
        setQuestions(orderedQuestions);
      } else {
        setQuestions(quizQuestions);
      }
    } catch (error) {
      console.error('Failed to load results:', error);
      alert('Results not found');
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

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground mt-4">Loading results...</p>
        </div>
      </PageContainer>
    );
  }

  if (!attempt || !questions.length) return null;

  const results = attempt.resultsJson as Record<string, QuestionResult>;
  const correctCount = Object.values(results).filter((r) => r.correct).length;
  const percentage = attempt.percentage || 0;

  // Review mode
  if (reviewIndex !== null) {
    const question = questions[reviewIndex];
    const result = results[question.id];

    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setReviewIndex(null)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </button>

          <Card>
            <CardContent className="p-8">
              <div className="mb-4">
                <span className="text-sm text-muted-foreground">
                  Question {reviewIndex + 1} of {questions.length}
                </span>
              </div>

              <QuestionRenderer
                question={question}
                selectedAnswer={result.userAnswer}
                onAnswerSelect={() => {}}
                showFeedback={true}
                isCorrect={result.correct}
                disabled={true}
              />

              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <button
                  onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
                  disabled={reviewIndex === 0}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setReviewIndex(Math.min(questions.length - 1, reviewIndex + 1))}
                  disabled={reviewIndex === questions.length - 1}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  // Results summary
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

        {/* Score Card */}
        <Card className={`mb-6 border-2 ${getScoreBgColor(percentage)}`}>
          <CardContent className="p-8 text-center">
            <Trophy className={`w-16 h-16 mx-auto mb-4 ${getScoreColor(percentage)}`} />
            <h1 className="text-3xl font-bold mb-2">
              Quiz Completed!
            </h1>
            <p className="text-muted-foreground mb-6">{attempt.quiz?.title}</p>

            <div className={`text-6xl font-bold mb-2 ${getScoreColor(percentage)}`}>
              {percentage.toFixed(1)}%
            </div>
            <p className="text-xl">
              {attempt.score} / {attempt.maxScore} points
            </p>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Correct</span>
              </div>
              <p className="text-3xl font-bold">{correctCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <XCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Incorrect</span>
              </div>
              <p className="text-3xl font-bold">
                {questions.length - correctCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Time</span>
              </div>
              <p className="text-2xl font-bold">
                {formatTime(attempt.timeSpentSeconds || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-medium">Mode</span>
              </div>
              <p className="text-lg font-bold capitalize">
                {attempt.mode}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Question Review List */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Question Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {questions.map((q, idx) => {
                const result = results[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => setReviewIndex(idx)}
                    className="w-full flex items-center justify-between p-4 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {result.correct ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                      <span>
                        Question {idx + 1}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Your answer: {result.userAnswer || 'No answer'} • Correct: {result.correctAnswer}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/quizzes/${attempt.quizId}`}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Retake Quiz
          </Link>
          <Link
            href="/quizzes"
            className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Quizzes
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
