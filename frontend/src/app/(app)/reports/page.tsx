'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Clock, DollarSign, BookOpen, Activity } from 'lucide-react';

// Types
interface MonthlyReport {
  period: {
    type: string;
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  };
  timeInvestment: {
    total: number;
    learning: number;
    work: number;
    fitness: number;
    career: number;
    mastersPrep: number;
    breakdown: {
      ielts: number;
      ieltsBySkill?: Record<string, number>;
      journals: number;
      books: number;
      skills: number;
      skillsByCategory?: Record<string, number>;
      workoutsByType?: Record<string, number>;
      careerByType?: Record<string, number>;
      mastersPrepByCategory?: Record<string, number>;
    };
    dailyAverage: number;
  };
  wellness: {
    totalEntries: number;
    averages: Record<string, number>;
    compliance: Record<string, number>;
  };
  financial: {
    income: number;
    spending: number;
    investment: number;
    netSavings: number;
    savingsRate: number;
    necessarySpending: number;
    discretionarySpending: number;
    spendingByCategory: Record<string, number>;
    transactionCount: number;
    dailyAverageSpending: number;
  };
  learning: {
    ielts: any;
    journals: any;
    books: any;
    skills: any;
  };
  summary: {
    daysLogged: number;
    totalActivities: number;
    activeGoals: number;
    achievedGoals: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [reportData, setReportData] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    if (isAuthenticated) {
      fetchReport();
    }
  }, [isAuthenticated, selectedYear, selectedMonth]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.reports.monthly(selectedYear, selectedMonth);
      setReportData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  };

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  // Simple trend data for sparklines (mock data for now - would come from daily aggregates)
  const generateTrendData = (value: number) => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      value: value * (0.8 + Math.random() * 0.4), // Mock variation
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Monthly Report</h1>
        <p className="text-muted-foreground">Comprehensive overview of your activities and progress</p>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-accent rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">
                {monthNames[selectedMonth - 1]} {selectedYear}
              </h2>
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              disabled={selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Time Investment */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Time Investment</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Total Hours</CardTitle>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reportData.timeInvestment.total}h</div>
              <p className="text-sm text-muted-foreground mt-1">{reportData.timeInvestment.dailyAverage}h / day average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{reportData.timeInvestment.learning}h</div>
              <div className="mt-4 space-y-2 text-sm">
                {/* IELTS by skill type */}
                {reportData.timeInvestment.breakdown.ieltsBySkill && Object.keys(reportData.timeInvestment.breakdown.ieltsBySkill).length > 0 && (
                  <>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between font-semibold text-xs text-foreground uppercase mb-1.5">
                        <span>IELTS</span>
                        <span>{reportData.timeInvestment.breakdown.ielts}h</span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(reportData.timeInvestment.breakdown.ieltsBySkill).map(([skill, hours]) => (
                          <div key={skill} className="flex justify-between pl-3">
                            <span className="text-muted-foreground capitalize">{skill}</span>
                            <span className="font-medium text-foreground">{hours}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {/* Books */}
                {reportData.timeInvestment.breakdown.books > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Books</span>
                    <span className="font-semibold text-foreground">{reportData.timeInvestment.breakdown.books}h</span>
                  </div>
                )}
                {/* Journals */}
                {reportData.timeInvestment.breakdown.journals > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Journals</span>
                    <span className="font-semibold text-foreground">{reportData.timeInvestment.breakdown.journals}h</span>
                  </div>
                )}
                {/* Skills by category */}
                {reportData.timeInvestment.breakdown.skillsByCategory && Object.keys(reportData.timeInvestment.breakdown.skillsByCategory).length > 0 && (
                  <>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between font-semibold text-xs text-foreground uppercase mb-1.5">
                        <span>SKILLS</span>
                        <span>{reportData.timeInvestment.breakdown.skills}h</span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(reportData.timeInvestment.breakdown.skillsByCategory).map(([category, hours]) => (
                          <div key={category} className="flex justify-between pl-3">
                            <span className="text-muted-foreground capitalize">{category}</span>
                            <span className="font-medium text-foreground">{hours}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Work & Career</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{reportData.timeInvestment.work}h</div>
              <div className="mt-4 space-y-2 text-sm">
                {/* Career by activity type */}
                {reportData.timeInvestment.breakdown.careerByType && Object.keys(reportData.timeInvestment.breakdown.careerByType).length > 0 && (
                  <>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between font-semibold text-xs text-foreground uppercase mb-1.5">
                        <span>CAREER DEV</span>
                        <span>{reportData.timeInvestment.career}h</span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(reportData.timeInvestment.breakdown.careerByType).map(([type, hours]) => (
                          <div key={type} className="flex justify-between pl-3">
                            <span className="text-muted-foreground capitalize">{type.replace('_', ' ')}</span>
                            <span className="font-medium text-foreground">{hours}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {/* Masters Prep by category */}
                {reportData.timeInvestment.breakdown.mastersPrepByCategory && Object.keys(reportData.timeInvestment.breakdown.mastersPrepByCategory).length > 0 && (
                  <>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between font-semibold text-xs text-foreground uppercase mb-1.5">
                        <span>MASTERS PREP</span>
                        <span>{reportData.timeInvestment.mastersPrep}h</span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(reportData.timeInvestment.breakdown.mastersPrepByCategory).map(([category, hours]) => (
                          <div key={category} className="flex justify-between pl-3">
                            <span className="text-muted-foreground capitalize">{category.replace('_', ' ')}</span>
                            <span className="font-medium text-foreground">{hours}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Fitness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{reportData.timeInvestment.fitness}h</div>
              {/* Workouts by type */}
              {reportData.timeInvestment.breakdown.workoutsByType && Object.keys(reportData.timeInvestment.breakdown.workoutsByType).length > 0 && (
                <div className="mt-4 space-y-1 text-sm">
                  {Object.entries(reportData.timeInvestment.breakdown.workoutsByType).map(([type, hours], index) => (
                    <div key={type} className={`flex justify-between ${index > 0 ? 'pt-2 border-t' : 'pt-2 border-t'}`}>
                      <span className="text-muted-foreground capitalize">{type.replace('_', ' ')}</span>
                      <span className="font-semibold text-foreground">{hours}h</span>
                    </div>
                  ))}
                </div>
              )}
              {(!reportData.timeInvestment.breakdown.workoutsByType || Object.keys(reportData.timeInvestment.breakdown.workoutsByType).length === 0) && (
                <p className="text-sm text-muted-foreground mt-1">Workout sessions</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Learning Progress */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Learning Progress</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">IELTS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sessions</span>
                  <span className="font-semibold">{reportData.learning.ielts.sessionsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Hours</span>
                  <span className="font-semibold">{reportData.learning.ielts.totalHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Band</span>
                  <span className="font-semibold">{reportData.learning.ielts.averageBand || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Vocabulary</span>
                  <span className="font-semibold">{reportData.learning.ielts.newVocabCount} words</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-semibold">{reportData.learning.books.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pages Read</span>
                  <span className="font-semibold">{reportData.learning.books.totalPagesRead}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reading Hours</span>
                  <span className="font-semibold">{reportData.learning.books.totalHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reading Speed</span>
                  <span className="font-semibold">{reportData.learning.books.avgReadingSpeed} pages/h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Journals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entries</span>
                  <span className="font-semibold">{reportData.learning.journals.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Hours</span>
                  <span className="font-semibold">{reportData.learning.journals.totalHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Usefulness</span>
                  <span className="font-semibold">{reportData.learning.journals.avgUsefulness || 'N/A'}/5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Financial Summary</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.financial.income)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(reportData.financial.spending)}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Necessary: {formatCurrency(reportData.financial.necessarySpending)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Investment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.financial.investment)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Savings Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{reportData.financial.savingsRate}%</div>
              <p className="text-sm text-muted-foreground mt-1">
                Net: {formatCurrency(reportData.financial.netSavings)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Wellness Overview */}
      {reportData.wellness.totalEntries > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Wellness Averages</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Sleep</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.wellness.averages.sleepHours || 0}h</div>
                <p className="text-sm text-muted-foreground mt-1">Average per night</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Energy Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.wellness.averages.energyLevel || 0}/5</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Mood Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.wellness.averages.moodScore || 0}/5</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Wellness Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.wellness.averages.wellnessScore || 0}/5</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Summary</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Days Logged</CardTitle>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reportData.summary.daysLogged}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Total Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reportData.summary.totalActivities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Active Goals</CardTitle>
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reportData.summary.activeGoals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Goals Achieved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{reportData.summary.achievedGoals}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
