'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Save, CheckCircle, Clock, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import QuestionRenderer from '@/components/quiz/QuestionRenderer';
import type { QuizAttempt, Question } from '@/types/quiz';

export default function QuizAttemptPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: string } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadAttempt = async () => {
    try {
      setLoading(true);
      const response = await api.quizzes.getAttempt(attemptId) as { data: QuizAttempt };
      const attemptData = response.data;

      setAttempt(attemptData);
      setAnswers(attemptData.answersJson);
      setCurrentIndex(attemptData.currentQuestionIndex);

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
      console.error('Failed to load quiz attempt:', error);
      alert('Quiz attempt not found');
      router.push('/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (answer: string) => {
    if (!attempt || !questions[currentIndex]) return;

    const questionId = questions[currentIndex].id;
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // Submit answer to backend
    try {
      const response = await api.quizzes.submitAnswer(attemptId, {
        questionId,
        answer,
      }) as { data: any };

      // Show feedback in practice mode
      if (attempt.mode === 'practice' && response.data.correct !== undefined) {
        setFeedback({
          correct: response.data.correct,
          correctAnswer: response.data.correctAnswer,
        });
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFeedback(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFeedback(null);
    }
  };

  const handleSaveProgress = async () => {
    try {
      setSaving(true);
      await api.quizzes.saveProgress(attemptId, { currentQuestionIndex: currentIndex });
      alert('Progress saved!');
    } catch (error) {
      console.error('Failed to save progress:', error);
      alert('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    const unanswered = questions.filter((q) => !answers[q.id]).length;

    if (unanswered > 0) {
      const confirm = window.confirm(
        `You have ${unanswered} unanswered question${unanswered !== 1 ? 's' : ''}. Are you sure you want to submit?`
      );
      if (!confirm) return;
    }

    try {
      setSubmitting(true);
      await api.quizzes.completeAttempt(attemptId);
      router.push(`/quizzes/results/${attemptId}`);
    } catch (error) {
      console.error('Failed to complete quiz:', error);
      alert('Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const answered = Object.keys(answers).length;
    return (answered / questions.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground mt-4">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!attempt || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">
                {attempt.quiz?.title}
              </h1>
              <p className="text-sm text-muted-foreground capitalize">
                {attempt.mode} Mode {attempt.isRandomized && '• Randomized'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-mono font-medium">{formatTime(elapsedSeconds)}</span>
              </div>
              <button
                onClick={handleSaveProgress}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span>
                {answeredCount} / {questions.length} answered
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-5xl mx-auto p-6">
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                {currentQuestion.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>

            <QuestionRenderer
              question={currentQuestion}
              selectedAnswer={currentAnswer || null}
              onAnswerSelect={handleAnswerSelect}
              showFeedback={attempt.mode === 'practice' && feedback !== null}
              isCorrect={feedback?.correct}
              disabled={submitting}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleComplete}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Complete Quiz
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator (Test Mode) */}
        {attempt.mode === 'test' && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Question Navigator
              </h3>
              <div className="grid grid-cols-10 gap-2">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setFeedback(null);
                    }}
                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                      idx === currentIndex
                        ? 'bg-primary text-primary-foreground'
                        : answers[q.id]
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
