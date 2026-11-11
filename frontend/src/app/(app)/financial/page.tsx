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
  Label,
  Select,
} from '@/components/ui';
import {
  Plus,
  Loader2,
  Search,
  Trash2,
  Edit,
  X,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  CreditCard,
  Banknote,
  ShoppingCart,
  Car,
  Home,
  Film,
  Heart,
  Phone,
  Wifi,
  BookOpen,
  Briefcase,
  Users,
  Coffee,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Bitcoin,
  Building,
  BarChart3,
  List,
  AlertTriangle,
  CheckCircle,
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
  Legend,
} from 'recharts';
import type {
  Budget,
  BudgetStats,
  BudgetComparison,
  BudgetAlert,
  BudgetPeriod,
  BudgetCategoryInfo,
  FinancialCategory,
} from '@/types';

// =================================================================
// Financial Types & Constants
// =================================================================

interface FinancialTransaction {
  id: string;
  date: string;
  amountIdr: number;
  direction: 'spend' | 'income' | 'invest';
  category: string;
  isNecessary?: boolean;
  paymentMethod?: string;
  investmentType?: string;
  description?: string;
  notes?: string;
}

interface FinancialStats {
  totalTransactions: number;
  summary: {
    totalIncome: number;
    totalSpending: number;
    totalInvestment: number;
    netWorth: number;
    savingsRate: number;
  };
  spending: {
    total: number;
    necessary: number;
    unnecessary: number;
    necessaryPercentage: number;
    byCategory: Record<string, number>;
  };
  investments: {
    total: number;
    byType: Record<string, number>;
  };
  byPaymentMethod: Record<string, number>;
}

const DIRECTIONS = [
  { value: 'spend', label: 'Expense', icon: ArrowDownRight, color: 'text-red-500' },
  { value: 'income', label: 'Income', icon: ArrowUpRight, color: 'text-green-500' },
  { value: 'invest', label: 'Investment', icon: PiggyBank, color: 'text-blue-500' },
] as const;

const CATEGORIES = [
  { value: 'food', label: 'Food & Dining', icon: Coffee, direction: 'spend' },
  { value: 'transport', label: 'Transport', icon: Car, direction: 'spend' },
  { value: 'groceries', label: 'Groceries', icon: ShoppingCart, direction: 'spend' },
  { value: 'household', label: 'Household', icon: Home, direction: 'spend' },
  { value: 'entertainment', label: 'Entertainment', icon: Film, direction: 'spend' },
  { value: 'health', label: 'Health', icon: Heart, direction: 'spend' },
  { value: 'phone', label: 'Phone', icon: Phone, direction: 'spend' },
  { value: 'internet', label: 'Internet', icon: Wifi, direction: 'spend' },
  { value: 'subscription', label: 'Subscription', icon: CreditCard, direction: 'spend' },
  { value: 'family_support', label: 'Family Support', icon: Users, direction: 'spend' },
  { value: 'work', label: 'Work', icon: Briefcase, direction: 'spend' },
  { value: 'education', label: 'Education', icon: BookOpen, direction: 'spend' },
  { value: 'salary', label: 'Salary', icon: Banknote, direction: 'income' },
  { value: 'freelance', label: 'Freelance', icon: Briefcase, direction: 'income' },
  { value: 'savings', label: 'Savings', icon: PiggyBank, direction: 'invest' },
  { value: 'investment', label: 'Investment', icon: TrendingUp, direction: 'invest' },
  { value: 'other', label: 'Other', icon: Wallet, direction: 'all' },
] as const;

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'debit', label: 'Debit Card' },
  { value: 'e_wallet', label: 'E-Wallet' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'transfer', label: 'Bank Transfer' },
] as const;

const INVESTMENT_TYPES = [
  { value: 'bitcoin', label: 'Bitcoin', icon: Bitcoin },
  { value: 'savings', label: 'Savings', icon: PiggyBank },
  { value: 'emergency_fund', label: 'Emergency Fund', icon: Wallet },
  { value: 'stocks', label: 'Stocks', icon: TrendingUp },
  { value: 'mutual_funds', label: 'Mutual Funds', icon: Building },
  { value: 'business', label: 'Business', icon: Briefcase },
  { value: 'gold', label: 'Gold', icon: DollarSign },
  { value: 'other', label: 'Other', icon: Wallet },
] as const;

// =================================================================
// Theme & Chart Utilities
// =================================================================

const getTooltipStyles = (isDark: boolean) => ({
  contentStyle: {
    backgroundColor: isDark ? 'var(--popover)' : 'var(--popover)',
    border: `1px solid ${isDark ? 'var(--foreground)' : 'var(--foreground)'}`,
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  labelStyle: { color: isDark ? 'var(--popover-foreground)' : 'var(--popover-foreground)', fontWeight: 600 },
  itemStyle: { color: isDark ? 'var(--popover-foreground)' : 'var(--popover-foreground)' },
});

const getChartColors = (isDark: boolean) => ({
  gridStroke: isDark ? 'hsl(0 0% 25%)' : 'hsl(220 10% 88%)',
  axisColor: isDark ? 'hsl(0 0% 60%)' : 'hsl(220 10% 45%)',
});

const FINANCIAL_COLORS = {
  income: 'var(--chart-3)',
  spending: 'var(--chart-1)',
  investment: 'var(--chart-2)',
  necessary: 'var(--chart-3)',
  unnecessary: 'var(--chart-2)',
};

// =================================================================
// Utility Functions
// =================================================================

const formatIDR = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

function getDirectionVariant(direction: string): 'success' | 'warning' | 'error' | 'neutral' {
  switch (direction) {
    case 'income': return 'success';
    case 'spend': return 'error';
    case 'invest': return 'neutral';
    default: return 'neutral';
  }
}

function getLast7Days() {
  const days: { date: string; displayDate: string }[] = [];
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const displayDate = `${date.getDate()} ${dayNames[date.getDay()]}`;
    days.push({ date: dateStr, displayDate });
  }
  return days;
}

function getDailyCashFlowData(financialTransactions: FinancialTransaction[]) {
  const days = getLast7Days();
  return days.map(({ date, displayDate }) => {
    const dayTransactions = financialTransactions.filter(t => t.date.split('T')[0] === date);
    return {
      date,
      displayDate,
      income: dayTransactions.filter(t => t.direction === 'income').reduce((sum, t) => sum + t.amountIdr, 0),
      spending: dayTransactions.filter(t => t.direction === 'spend').reduce((sum, t) => sum + t.amountIdr, 0),
      investment: dayTransactions.filter(t => t.direction === 'invest').reduce((sum, t) => sum + t.amountIdr, 0),
    };
  });
}

function getDailySpendingData(financialTransactions: FinancialTransaction[]) {
  const days = getLast7Days();
  return days.map(({ date, displayDate }) => {
    const daySpending = financialTransactions.filter(t => t.date.split('T')[0] === date && t.direction === 'spend');
    return {
      date,
      displayDate,
      necessary: daySpending.filter(t => t.isNecessary === true).reduce((sum, t) => sum + t.amountIdr, 0),
      unnecessary: daySpending.filter(t => t.isNecessary === false).reduce((sum, t) => sum + t.amountIdr, 0),
    };
  });
}

// =================================================================
// Main Component
// =================================================================

export default function FinancialPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tooltipStyles = getTooltipStyles(isDark);
  const chartColors = getChartColors(isDark);

  // View mode toggle: analytics, log or budget
  const [viewMode, setViewMode] = React.useState<'analytics' | 'log' | 'budget'>('analytics');

  // Financial state
  const [transactions, setTransactions] = React.useState<FinancialTransaction[]>([]);
  const [stats, setStats] = React.useState<FinancialStats | null>(null);
  const [financialLoading, setFinancialLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<FinancialTransaction | null>(null);
  const [filterDirection, setFilterDirection] = React.useState<string>('all');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedTransaction, setExpandedTransaction] = React.useState<string | null>(null);

  // Budget state
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [budgetStats, setBudgetStats] = React.useState<BudgetStats | null>(null);
  const [budgetComparison, setBudgetComparison] = React.useState<BudgetComparison[]>([]);
  const [budgetAlerts, setBudgetAlerts] = React.useState<BudgetAlert[]>([]);
  const [budgetLoading, setBudgetLoading] = React.useState(true);
  const [showBudgetModal, setShowBudgetModal] = React.useState(false);
  const [editingBudget, setEditingBudget] = React.useState<Budget | null>(null);

  // Fetch Financial Data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchFinancialData() {
      try {
        setFinancialLoading(true);
        const [transactionsRes, statsRes] = await Promise.all([
          api.financial.list({ limit: 100 }),
          api.financial.stats(),
        ]);
        setTransactions((transactionsRes as any).data || []);
        setStats((statsRes as any).data || null);
      } catch (err) {
        console.error('Failed to fetch financial data:', err);
      } finally {
        setFinancialLoading(false);
      }
    }

    fetchFinancialData();
  }, [authLoading, isAuthenticated]);

  // Fetch Budget Data
  const fetchBudgetData = React.useCallback(async () => {
    if (authLoading || !isAuthenticated) return;

    try {
      setBudgetLoading(true);
      const [budgetsRes, statsRes, comparisonRes, alertsRes] = await Promise.all([
        api.budgets.list({ limit: 100 }),
        api.budgets.stats(),
        api.budgets.comparison(),
        api.budgets.alerts(),
      ]);

      setBudgets((budgetsRes as any).data || []);
      setBudgetStats((statsRes as any).data);
      setBudgetComparison((comparisonRes as any).data || []);
      setBudgetAlerts((alertsRes as any).data || []);
    } catch (error) {
      console.error('Failed to fetch budget data:', error);
    } finally {
      setBudgetLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  React.useEffect(() => {
    if (viewMode === 'budget') {
      fetchBudgetData();
    }
  }, [viewMode, fetchBudgetData]);

  // Financial CRUD handlers
  const handleCreate = async (data: Partial<FinancialTransaction>) => {
    try {
      const res = await api.financial.create(data);
      setTransactions((prev) => [(res as any).data, ...prev]);
      setShowModal(false);
      const statsRes = await api.financial.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to create transaction:', err);
    }
  };

  const handleUpdate = async (id: string, data: Partial<FinancialTransaction>) => {
    try {
      const res = await api.financial.update(id, data);
      setTransactions((prev) => prev.map((t) => (t.id === id ? (res as any).data : t)));
      setEditingTransaction(null);
      setShowModal(false);
      const statsRes = await api.financial.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to update transaction:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.financial.delete(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      const statsRes = await api.financial.stats();
      setStats((statsRes as any).data);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  // Budget CRUD handlers
  const handleCreateBudget = async (data: Partial<Budget>) => {
    try {
      await api.budgets.create(data);
      setShowBudgetModal(false);
      fetchBudgetData();
    } catch (err) {
      console.error('Failed to create budget:', err);
    }
  };

  const handleUpdateBudget = async (id: string, data: Partial<Budget>) => {
    try {
      await api.budgets.update(id, data);
      setEditingBudget(null);
      setShowBudgetModal(false);
      fetchBudgetData();
    } catch (err) {
      console.error('Failed to update budget:', err);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    try {
      await api.budgets.delete(id);
      fetchBudgetData();
    } catch (err) {
      console.error('Failed to delete budget:', err);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesDirection = filterDirection === 'all' || transaction.direction === filterDirection;
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    const matchesSearch = !searchQuery ||
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDirection && matchesCategory && matchesSearch;
  });

  // Get top spending categories
  const topCategories = stats?.spending.byCategory
    ? Object.entries(stats.spending.byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  const loading = viewMode === 'budget' ? budgetLoading : financialLoading;

  // Shares of total spending; untagged spending is neither necessary nor not
  const totalSpent = stats?.summary.totalSpending ?? 0;
  const shareOfSpending = (amount: number) => (totalSpent > 0 ? (amount / totalSpent) * 100 : 0);
  const untaggedSpending = stats
    ? Math.max(0, totalSpent - stats.spending.necessary - stats.spending.unnecessary)
    : 0;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  // Determine header action based on view mode
  const getHeaderAction = () => {
    if (viewMode === 'analytics' || viewMode === 'log') {
      return (
        <Button
          onClick={() => {
            setEditingTransaction(null);
            setShowModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      );
    }
    if (viewMode === 'budget') {
      return (
        <Button
          onClick={() => {
            setEditingBudget(null);
            setShowBudgetModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Budget
        </Button>
      );
    }
    return null;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Money"
        description="Spending, income and budgets."
        actions={getHeaderAction()}
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
          <button
            onClick={() => setViewMode('budget')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'budget'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wallet className="h-4 w-4" />
            Budget
          </button>
        </div>
      </div>

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <>
          {stats && stats.totalTransactions > 0 && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
                <StatCard
                  label="Total Income"
                  value={formatCurrency(stats.summary.totalIncome)}
                  icon={<ArrowUpRight className="h-5 w-5" />}
                  variant="success"
                />
                <StatCard
                  label="Total Spending"
                  value={formatCurrency(stats.summary.totalSpending)}
                  icon={<ArrowDownRight className="h-5 w-5" />}
                  variant="error"
                />
                <StatCard
                  label="Investments"
                  value={formatCurrency(stats.summary.totalInvestment)}
                  icon={<PiggyBank className="h-5 w-5" />}
                  variant="info"
                />
                {/* Income minus spending for the period. Not net worth: the app
                    does not know balances, and investments are transfers. */}
                <StatCard
                  label="Net cash flow"
                  value={formatCurrency(stats.summary.totalIncome - stats.summary.totalSpending)}
                  icon={<Wallet className="h-5 w-5" />}
                  variant={stats.summary.totalIncome - stats.summary.totalSpending >= 0 ? 'success' : 'error'}
                />
              </div>

              {/* Spending & Savings Analysis */}
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Spending Analysis</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        Savings Rate: {stats.summary.savingsRate.toFixed(1)}%
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Necessary</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(stats.spending.necessary)} ({shareOfSpending(stats.spending.necessary).toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={shareOfSpending(stats.spending.necessary)} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Unnecessary</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(stats.spending.unnecessary)} ({shareOfSpending(stats.spending.unnecessary).toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={shareOfSpending(stats.spending.unnecessary)} />
                      </div>
                      {untaggedSpending > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(untaggedSpending)} ({shareOfSpending(untaggedSpending).toFixed(0)}%) not tagged yet.
                          Mark transactions as necessary or not to see the split.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Spending Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topCategories.map(([category, amount]) => {
                        const percentage = stats.spending.total > 0 ? (amount / stats.spending.total) * 100 : 0;
                        const categoryInfo = CATEGORIES.find((c) => c.value === category);
                        const CategoryIcon = categoryInfo?.icon || Wallet;
                        return (
                          <div key={category}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="flex items-center gap-2">
                                <CategoryIcon className="h-4 w-4" />
                                {categoryInfo?.label || category}
                              </span>
                              <span className="text-muted-foreground">{formatCurrency(amount)}</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                      {topCategories.length === 0 && (
                        <p className="text-sm text-muted-foreground">No spending data yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Investment Breakdown */}
              {stats.investments.total > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-base">Investment Portfolio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {Object.entries(stats.investments.byType).map(([type, amount]) => {
                        const typeInfo = INVESTMENT_TYPES.find((t) => t.value === type);
                        const TypeIcon = typeInfo?.icon || PiggyBank;
                        return (
                          <div key={type} className="p-3 border rounded-md">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <TypeIcon className="h-4 w-4" />
                              <span className="text-xs">{typeInfo?.label || type}</span>
                            </div>
                            <p className="text-lg font-semibold">{formatCurrency(amount)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Analytics Charts */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Daily Cash Flow</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getDailyCashFlowData(transactions)} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} vertical={false} />
                          <XAxis dataKey="displayDate" stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} width={35} tickFormatter={formatIDR} />
                          <Tooltip
                            cursor={false}
                            {...tooltipStyles}
                            content={({ active, payload }) => {
                              if (!active || !payload) return null;
                              const nonZeroItems = payload.filter((item: any) => item.value > 0);
                              if (nonZeroItems.length === 0) return null;
                              return (
                                <div style={{ ...tooltipStyles.contentStyle, padding: '8px 10px', fontSize: '11px' }}>
                                  <p style={{ ...tooltipStyles.labelStyle, marginBottom: '4px', fontSize: '11px' }}>
                                    {payload[0]?.payload?.displayDate}
                                  </p>
                                  {nonZeroItems.map((item: any, idx: number) => (
                                    <p key={idx} style={{ ...tooltipStyles.itemStyle, margin: '2px 0', fontSize: '10px' }}>
                                      <span style={{ color: item.fill }}>{item.name}</span>: Rp {formatIDR(item.value)}
                                    </p>
                                  ))}
                                </div>
                              );
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '9px' }} />
                          <Bar dataKey="income" name="Income" stackId="cashflow" fill={FINANCIAL_COLORS.income} radius={[0, 0, 0, 0]} />
                          <Bar dataKey="investment" name="Investment" stackId="cashflow" fill={FINANCIAL_COLORS.investment} radius={[0, 0, 0, 0]} />
                          <Bar dataKey="spending" name="Spending" stackId="cashflow" fill={FINANCIAL_COLORS.spending} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Daily Spending Discipline</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getDailySpendingData(transactions)} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} vertical={false} />
                          <XAxis dataKey="displayDate" stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke={chartColors.axisColor} fontSize={10} tickLine={false} axisLine={false} width={35} tickFormatter={formatIDR} />
                          <Tooltip
                            cursor={false}
                            {...tooltipStyles}
                            content={({ active, payload }) => {
                              if (!active || !payload) return null;
                              const nonZeroItems = payload.filter((item: any) => item.value > 0);
                              if (nonZeroItems.length === 0) return null;
                              const total = nonZeroItems.reduce((sum: number, item: any) => sum + item.value, 0);
                              return (
                                <div style={{ ...tooltipStyles.contentStyle, padding: '8px 10px', fontSize: '11px' }}>
                                  <p style={{ ...tooltipStyles.labelStyle, marginBottom: '4px', fontSize: '11px' }}>
                                    {payload[0]?.payload?.displayDate} - Total: Rp {formatIDR(total)}
                                  </p>
                                  {nonZeroItems.map((item: any, idx: number) => (
                                    <p key={idx} style={{ ...tooltipStyles.itemStyle, margin: '2px 0', fontSize: '10px' }}>
                                      <span style={{ color: item.fill }}>{item.name}</span>: Rp {formatIDR(item.value)}
                                    </p>
                                  ))}
                                </div>
                              );
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '9px' }} />
                          <Bar dataKey="necessary" name="Necessary" stackId="spending" fill={FINANCIAL_COLORS.necessary} radius={[0, 0, 0, 0]} />
                          <Bar dataKey="unnecessary" name="Unnecessary" stackId="spending" fill={FINANCIAL_COLORS.unnecessary} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {(!stats || stats.totalTransactions === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No financial data yet. Start adding transactions to see analytics!</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setEditingTransaction(null);
                    setShowModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Transaction
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Log View */}
      {viewMode === 'log' && (
        <>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterDirection === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterDirection('all')}
                >
                  All
                </Button>
                {DIRECTIONS.map(({ value, label, icon: Icon, color }) => (
                  <Button
                    key={value}
                    variant={filterDirection === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterDirection(value)}
                    className="gap-1"
                  >
                    <Icon className={`h-4 w-4 ${filterDirection !== value ? color : ''}`} />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category & Budget Filter Row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Category:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="h-8 px-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.filter(c =>
                    filterDirection === 'all' || c.direction === 'all' || c.direction === filterDirection
                  ).map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Quick budget filters - show budgets with spending */}
              {budgetComparison.length > 0 && filterDirection !== 'income' && filterDirection !== 'invest' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Budget:</span>
                  {budgetComparison.slice(0, 4).map(budget => {
                    const isActive = filterCategory === budget.category;
                    const CategoryIcon = CATEGORIES.find(c => c.value === budget.category)?.icon || Wallet;
                    return (
                      <Button
                        key={budget.budgetId}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterCategory(isActive ? 'all' : budget.category)}
                        className="gap-1 h-7 text-xs"
                      >
                        <CategoryIcon className="h-3 w-3" />
                        {budget.name}
                        <Badge
                          variant={
                            budget.status === 'over' ? 'error' :
                            budget.status === 'warning' ? 'warning' : 'success'
                          }
                          className="ml-1 text-[10px] px-1"
                        >
                          {budget.percentage.toFixed(0)}%
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Clear filters */}
              {(filterCategory !== 'all' || filterDirection !== 'all' || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterCategory('all');
                    setFilterDirection('all');
                    setSearchQuery('');
                  }}
                  className="h-7 text-xs text-muted-foreground"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {transactions.length === 0 ? 'No transactions recorded yet.' : 'No transactions match your search.'}
                </p>
                {transactions.length === 0 && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setEditingTransaction(null);
                      setShowModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Transaction
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
                // Find budget info for this transaction's category
                const txBudgetInfo = transaction.direction === 'spend'
                  ? budgetComparison.find(b => b.category === transaction.category)
                  : null;
                return (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    isExpanded={expandedTransaction === transaction.id}
                    onToggleExpand={() => setExpandedTransaction(expandedTransaction === transaction.id ? null : transaction.id)}
                    onEdit={() => {
                      setEditingTransaction(transaction);
                      setShowModal(true);
                    }}
                    onDelete={() => handleDelete(transaction.id)}
                    budgetInfo={txBudgetInfo}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Budget View */}
      {viewMode === 'budget' && (
        <>
          {/* Budget Stats Cards */}
          {budgetStats && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Wallet className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budgeted</p>
                      <p className="text-2xl font-semibold">{formatCurrency(budgetStats.totalBudgeted)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <TrendingDown className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-semibold">{formatCurrency(budgetStats.totalSpent)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">On Track</p>
                      <p className="text-2xl font-semibold">{budgetStats.onTrack}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Alerts</p>
                      <p className="text-2xl font-semibold">{budgetStats.warning + budgetStats.overBudget}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Budget Alerts Banner */}
          {budgetAlerts.length > 0 && (
            <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">Budget Alerts</h4>
                    <div className="space-y-2">
                      {budgetAlerts.slice(0, 3).map(alert => {
                        const categoryInfo = CATEGORIES.find(c => c.value === alert.category);
                        const CategoryIcon = categoryInfo?.icon || Wallet;
                        return (
                          <div
                            key={alert.id}
                            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-yellow-500/10 rounded px-2 py-1 -mx-2"
                            onClick={() => {
                              setFilterCategory(alert.category);
                              setFilterDirection('spend');
                              setViewMode('log');
                            }}
                            title="Click to view transactions"
                          >
                            <CategoryIcon className="h-4 w-4" />
                            <span className="font-medium">{alert.name}</span>
                            <span className="text-muted-foreground">at {alert.percentage.toFixed(0)}%</span>
                            <span className="text-muted-foreground">
                              ({formatCurrency(alert.currentSpent)} / {formatCurrency(alert.amount)})
                            </span>
                            {alert.daysRemaining > 0 && (
                              <span className="text-muted-foreground">- {alert.daysRemaining} days left</span>
                            )}
                            {alert.isOver && <Badge variant="error">Over Budget</Badge>}
                            <ArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget vs Actual Comparison */}
          {budgetComparison.length > 0 && (
            <PageSection title="Budget vs Actual">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="p-4 font-medium">Category</th>
                          <th className="p-4 font-medium text-right">Budgeted</th>
                          <th className="p-4 font-medium text-right">Spent</th>
                          <th className="p-4 font-medium">Progress</th>
                          <th className="p-4 font-medium text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {budgetComparison.map(item => {
                          const categoryInfo = CATEGORIES.find(c => c.value === item.category);
                          const CategoryIcon = categoryInfo?.icon || Wallet;
                          const percentage = Math.min(item.percentage, 100);
                          return (
                            <tr
                              key={item.budgetId}
                              className="hover:bg-muted/50 cursor-pointer"
                              onClick={() => {
                                setFilterCategory(item.category);
                                setFilterDirection('spend');
                                setViewMode('log');
                              }}
                              title="Click to view transactions"
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{item.name}</span>
                                </div>
                              </td>
                              <td className="p-4 text-right">{formatCurrency(item.budgeted)}</td>
                              <td className="p-4 text-right">{formatCurrency(item.actual)}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all ${
                                        item.status === 'over' ? 'bg-red-500' :
                                        item.status === 'warning' ? 'bg-yellow-500' :
                                        'bg-green-500'
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm text-muted-foreground w-12 text-right">
                                    {item.percentage.toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <Badge variant={
                                  item.status === 'over' ? 'error' :
                                  item.status === 'warning' ? 'warning' :
                                  'success'
                                }>
                                  {item.status === 'over' ? 'Over' :
                                   item.status === 'warning' ? 'Warning' :
                                   'On Track'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </PageSection>
          )}

          {/* Budget List */}
          <PageSection
            title="All Budgets"
            actions={
              <Button size="sm" onClick={() => { setEditingBudget(null); setShowBudgetModal(true); }}>
                <Plus className="h-4 w-4 mr-1" /> New Budget
              </Button>
            }
          >
            {budgets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No budgets yet</p>
                  <p className="text-sm mt-1">Create a budget to track your spending by category</p>
                  <Button className="mt-4" onClick={() => { setEditingBudget(null); setShowBudgetModal(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Create First Budget
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {budgets.map(budget => {
                  const categoryInfo = CATEGORIES.find(c => c.value === budget.category);
                  const CategoryIcon = categoryInfo?.icon || Wallet;
                  const spent = budget.currentSpent || 0;
                  const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
                  const status = spent > budget.amount ? 'over' :
                                spent >= budget.amount * budget.alertThreshold ? 'warning' : 'under';

                  return (
                    <Card key={budget.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-muted">
                              <CategoryIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{budget.name}</CardTitle>
                              <p className="text-xs text-muted-foreground capitalize">
                                {budget.period} budget
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setEditingBudget(budget); setShowBudgetModal(true); }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteBudget(budget.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>{formatCurrency(spent)}</span>
                            <span className="text-muted-foreground">of {formatCurrency(budget.amount)}</span>
                          </div>
                          <div
                            className="h-2 bg-muted rounded-full overflow-hidden cursor-pointer"
                            onClick={() => {
                              setFilterCategory(budget.category);
                              setFilterDirection('spend');
                              setViewMode('log');
                            }}
                            title="Click to view transactions"
                          >
                            <div
                              className={`h-full transition-all ${
                                status === 'over' ? 'bg-red-500' :
                                status === 'warning' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{percentage.toFixed(0)}% used</span>
                            <span>
                              {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            {!budget.isActive ? (
                              <Badge variant="neutral">Inactive</Badge>
                            ) : (
                              <Badge variant={
                                status === 'over' ? 'error' :
                                status === 'warning' ? 'warning' : 'success'
                              }>
                                {status === 'over' ? 'Over Budget' :
                                 status === 'warning' ? 'Near Limit' : 'On Track'}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setFilterCategory(budget.category);
                                setFilterDirection('spend');
                                setViewMode('log');
                              }}
                            >
                              View Transactions
                              <ArrowUpRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </PageSection>
        </>
      )}

      {/* Transaction Modal */}
      {showModal && (
        <TransactionModal
          transaction={editingTransaction}
          onClose={() => {
            setShowModal(false);
            setEditingTransaction(null);
          }}
          onSave={(data) => {
            if (editingTransaction) {
              handleUpdate(editingTransaction.id, data);
            } else {
              handleCreate(data);
            }
          }}
        />
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <BudgetModal
          budget={editingBudget}
          onClose={() => {
            setShowBudgetModal(false);
            setEditingBudget(null);
          }}
          onSave={(data) => {
            if (editingBudget) {
              handleUpdateBudget(editingBudget.id, data);
            } else {
              handleCreateBudget(data);
            }
          }}
        />
      )}
    </PageContainer>
  );
}

// =================================================================
// Financial Helper Components
// =================================================================

function StatCard({
  label,
  value,
  icon,
  variant = 'neutral',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant?: 'success' | 'error' | 'info' | 'neutral';
}) {
  const colorClass = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    neutral: 'text-primary',
  }[variant];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={colorClass}>{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionCard({
  transaction,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  budgetInfo,
}: {
  transaction: FinancialTransaction;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  budgetInfo?: BudgetComparison | null;
}) {
  const directionInfo = DIRECTIONS.find((d) => d.value === transaction.direction);
  const DirectionIcon = directionInfo?.icon || Wallet;
  const categoryInfo = CATEGORIES.find((c) => c.value === transaction.category);
  const CategoryIcon = categoryInfo?.icon || Wallet;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <DirectionIcon className={`h-4 w-4 ${directionInfo?.color || ''}`} />
              <span className={`font-semibold ${directionInfo?.color || ''}`}>
                {transaction.direction === 'income' ? '+' : '-'}{formatCurrency(transaction.amountIdr)}
              </span>
              <Badge variant={getDirectionVariant(transaction.direction)}>
                {directionInfo?.label || transaction.direction}
              </Badge>
              <Badge variant="neutral" className="text-xs">
                <CategoryIcon className="h-3 w-3 mr-1" />
                {categoryInfo?.label || transaction.category}
              </Badge>
              {transaction.isNecessary !== undefined && (
                <Badge variant={transaction.isNecessary ? 'success' : 'warning'} className="text-xs">
                  {transaction.isNecessary ? 'Necessary' : 'Unnecessary'}
                </Badge>
              )}
              {/* Budget status badge for spend transactions */}
              {budgetInfo && transaction.direction === 'spend' && (
                <Badge
                  variant={
                    budgetInfo.status === 'over' ? 'error' :
                    budgetInfo.status === 'warning' ? 'warning' : 'success'
                  }
                  className="text-xs"
                >
                  <Wallet className="h-3 w-3 mr-1" />
                  {budgetInfo.percentage.toFixed(0)}% of budget
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              <span>{formatDate(new Date(transaction.date), { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {transaction.paymentMethod && (
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  {PAYMENT_METHODS.find((p) => p.value === transaction.paymentMethod)?.label || transaction.paymentMethod}
                </span>
              )}
              {transaction.description && (
                <span className="line-clamp-1">{transaction.description}</span>
              )}
            </div>

            {isExpanded && (
              <div className="mt-4 space-y-3 border-t pt-4">
                {transaction.investmentType && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Investment Type:</span>{' '}
                    {INVESTMENT_TYPES.find((t) => t.value === transaction.investmentType)?.label || transaction.investmentType}
                  </div>
                )}
                {transaction.description && (
                  <div>
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="text-sm text-muted-foreground">{transaction.description}</p>
                  </div>
                )}
                {transaction.notes && (
                  <div>
                    <h4 className="text-sm font-medium">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{transaction.notes}</p>
                  </div>
                )}
                {/* Budget details in expanded view */}
                {budgetInfo && transaction.direction === 'spend' && (
                  <div className={`p-3 rounded-lg ${
                    budgetInfo.status === 'over' ? 'bg-red-500/10' :
                    budgetInfo.status === 'warning' ? 'bg-yellow-500/10' : 'bg-green-500/10'
                  }`}>
                    <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                      <Wallet className="h-4 w-4" />
                      Budget: {budgetInfo.name}
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Spent / Budget:</span>
                        <span>{formatCurrency(budgetInfo.actual)} / {formatCurrency(budgetInfo.budgeted)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            budgetInfo.status === 'over' ? 'bg-red-500' :
                            budgetInfo.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budgetInfo.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Remaining: {formatCurrency(Math.max(0, budgetInfo.budgeted - budgetInfo.actual))}</span>
                        <span>{budgetInfo.percentage.toFixed(1)}%</span>
                      </div>
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

function TransactionModal({
  transaction,
  onClose,
  onSave,
}: {
  transaction: FinancialTransaction | null;
  onClose: () => void;
  onSave: (data: Partial<FinancialTransaction>) => void;
}) {
  const [formData, setFormData] = React.useState({
    date: toLocalDateString(transaction?.date),
    amountIdr: transaction?.amountIdr || '',
    direction: transaction?.direction || 'spend',
    category: transaction?.category || 'food',
    isNecessary: transaction?.isNecessary ?? true,
    paymentMethod: transaction?.paymentMethod || '',
    investmentType: transaction?.investmentType || '',
    description: transaction?.description || '',
    notes: transaction?.notes || '',
  });
  const [saving, setSaving] = React.useState(false);
  const [budgetInfo, setBudgetInfo] = React.useState<BudgetCategoryInfo | null>(null);
  const [loadingBudget, setLoadingBudget] = React.useState(false);

  const filteredCategories = CATEGORIES.filter((c) =>
    c.direction === 'all' || c.direction === formData.direction
  );

  // Fetch budget info when category changes (for spend transactions)
  React.useEffect(() => {
    if (formData.direction !== 'spend') {
      setBudgetInfo(null);
      return;
    }

    const fetchBudgetInfo = async () => {
      setLoadingBudget(true);
      try {
        const response = await api.budgets.getByCategory(formData.category);
        setBudgetInfo(response.data as BudgetCategoryInfo | null);
      } catch {
        setBudgetInfo(null);
      } finally {
        setLoadingBudget(false);
      }
    };

    fetchBudgetInfo();
  }, [formData.category, formData.direction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      date: new Date(formData.date).toISOString(),
      amountIdr: Number(formData.amountIdr),
      direction: formData.direction as 'spend' | 'income' | 'invest',
      category: formData.category,
      isNecessary: formData.direction === 'spend' ? formData.isNecessary : undefined,
      paymentMethod: formData.paymentMethod || undefined,
      investmentType: formData.direction === 'invest' ? formData.investmentType || undefined : undefined,
      description: formData.description || undefined,
      notes: formData.notes || undefined,
    });
    setSaving(false);
  };

  React.useEffect(() => {
    const validCategory = filteredCategories.find((c) => c.value === formData.category);
    if (!validCategory) {
      const defaultCategory = filteredCategories[0]?.value || 'other';
      setFormData((prev) => ({ ...prev, category: defaultCategory }));
    }
  }, [formData.direction]);

  // Calculate budget impact preview
  const getBudgetImpact = () => {
    if (!budgetInfo || !formData.amountIdr) return null;
    const amount = Number(formData.amountIdr) || 0;
    const newSpent = budgetInfo.spent + amount;
    const newRemaining = budgetInfo.amount - newSpent;
    const newPercentage = budgetInfo.amount > 0 ? (newSpent / budgetInfo.amount) * 100 : 0;
    let newStatus: 'under' | 'warning' | 'over' = 'under';
    if (newSpent > budgetInfo.amount) {
      newStatus = 'over';
    } else if (newSpent >= budgetInfo.amount * budgetInfo.alertThreshold) {
      newStatus = 'warning';
    }
    return { newSpent, newRemaining, newPercentage, newStatus };
  };

  const budgetImpact = getBudgetImpact();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
              <label className="text-sm font-medium">Amount (IDR) *</label>
              <Input
                type="number"
                value={formData.amountIdr}
                onChange={(e) => setFormData({ ...formData, amountIdr: e.target.value })}
                placeholder="50000"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Type *</label>
            <div className="flex gap-2 mt-1">
              {DIRECTIONS.map(({ value, label, icon: Icon, color }) => (
                <Button
                  key={value}
                  type="button"
                  variant={formData.direction === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, direction: value })}
                  className="flex-1 gap-1"
                >
                  <Icon className={`h-4 w-4 ${formData.direction !== value ? color : ''}`} />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              required
            >
              {filteredCategories.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Budget Info Panel - Shows when selecting expense category with active budget */}
          {formData.direction === 'spend' && (
            <>
              {loadingBudget ? (
                <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking budget...
                </div>
              ) : budgetInfo ? (
                <div className={`p-3 rounded-lg border ${
                  budgetInfo.status === 'over' ? 'bg-red-500/10 border-red-500/30' :
                  budgetInfo.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-green-500/10 border-green-500/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span className="text-sm font-medium">{budgetInfo.name}</span>
                    </div>
                    <Badge variant={
                      budgetInfo.status === 'over' ? 'error' :
                      budgetInfo.status === 'warning' ? 'warning' : 'success'
                    }>
                      {budgetInfo.percentage.toFixed(0)}% used
                    </Badge>
                  </div>

                  {/* Current budget status */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Current:</span>
                      <span>{formatCurrency(budgetInfo.spent)} / {formatCurrency(budgetInfo.amount)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          budgetInfo.status === 'over' ? 'bg-red-500' :
                          budgetInfo.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budgetInfo.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Remaining: {formatCurrency(Math.max(0, budgetInfo.remaining))}</span>
                      <span>{budgetInfo.daysRemaining} days left</span>
                    </div>
                  </div>

                  {/* Budget impact preview */}
                  {budgetImpact && Number(formData.amountIdr) > 0 && (
                    <div className="mt-3 pt-3 border-t border-current/10">
                      <div className="text-xs font-medium mb-1 flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        After this transaction:
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">New spent:</span>
                          <span className={budgetImpact.newStatus === 'over' ? 'text-red-500 font-medium' : ''}>
                            {formatCurrency(budgetImpact.newSpent)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              budgetImpact.newStatus === 'over' ? 'bg-red-500' :
                              budgetImpact.newStatus === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(budgetImpact.newPercentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className={budgetImpact.newRemaining < 0 ? 'text-red-500' : 'text-muted-foreground'}>
                            {budgetImpact.newRemaining < 0
                              ? `Over budget by ${formatCurrency(Math.abs(budgetImpact.newRemaining))}`
                              : `Will have ${formatCurrency(budgetImpact.newRemaining)} left`
                            }
                          </span>
                          <span className={
                            budgetImpact.newStatus === 'over' ? 'text-red-500' :
                            budgetImpact.newStatus === 'warning' ? 'text-yellow-500' : 'text-green-500'
                          }>
                            {budgetImpact.newPercentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      {budgetImpact.newStatus === 'over' && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
                          <AlertTriangle className="h-3 w-3" />
                          This will exceed your budget!
                        </div>
                      )}
                      {budgetImpact.newStatus === 'warning' && budgetInfo.status === 'under' && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
                          <AlertTriangle className="h-3 w-3" />
                          This will put you near your budget limit
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  No active budget for this category
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select method...</option>
                  {PAYMENT_METHODS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNecessary}
                    onChange={(e) => setFormData({ ...formData, isNecessary: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">This is a necessary expense</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Uncheck if this was an optional or impulsive purchase
                </p>
              </div>
            </>
          )}

          {formData.direction === 'invest' && (
            <div>
              <label className="text-sm font-medium">Investment Type</label>
              <select
                value={formData.investmentType}
                onChange={(e) => setFormData({ ...formData, investmentType: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select type...</option>
                {INVESTMENT_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {transaction ? 'Update' : 'Add'} Transaction
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =================================================================
// Budget Modal
// =================================================================

const BUDGET_PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

const EXPENSE_CATEGORIES = CATEGORIES.filter(c => c.direction === 'spend' || c.direction === 'all');

function BudgetModal({
  budget,
  onClose,
  onSave,
}: {
  budget: Budget | null;
  onClose: () => void;
  onSave: (data: Partial<Budget>) => void;
}) {
  const [name, setName] = React.useState(budget?.name || '');
  const [category, setCategory] = React.useState<FinancialCategory>(budget?.category || 'food');
  const [amount, setAmount] = React.useState(budget?.amount?.toString() || '');
  const [period, setPeriod] = React.useState<BudgetPeriod>(budget?.period || 'monthly');
  const [startDate, setStartDate] = React.useState(
    budget?.startDate ? budget.startDate.split('T')[0] : toLocalDateString(new Date())
  );
  const [endDate, setEndDate] = React.useState(
    budget?.endDate ? budget.endDate.split('T')[0] : ''
  );
  const [alertThreshold, setAlertThreshold] = React.useState(
    budget?.alertThreshold ? (budget.alertThreshold * 100).toString() : '80'
  );
  const [isActive, setIsActive] = React.useState(budget?.isActive ?? true);

  // Auto-calculate end date when period or start date changes
  React.useEffect(() => {
    if (period === 'custom') return;

    const start = new Date(startDate);
    let end: Date;

    if (period === 'weekly') {
      end = new Date(start);
      end.setDate(end.getDate() + 6);
    } else {
      // Monthly - set to last day of month
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    }

    setEndDate(end.toISOString().split('T')[0]);
  }, [period, startDate]);

  // Auto-generate name based on category and period
  React.useEffect(() => {
    if (budget) return; // Don't auto-generate when editing
    const categoryInfo = CATEGORIES.find(c => c.value === category);
    const monthName = new Date(startDate).toLocaleDateString('en-US', { month: 'long' });
    setName(`${monthName} ${categoryInfo?.label || category} Budget`);
  }, [category, startDate, budget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Send dates as YYYY-MM-DD strings to avoid timezone issues
    // Backend will handle them as DATE type (no time component)
    onSave({
      name,
      category,
      amount: parseFloat(amount),
      period,
      startDate,
      endDate,
      alertThreshold: parseFloat(alertThreshold) / 100,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
      <div className="w-full max-w-lg bg-background rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{budget ? 'Edit Budget' : 'Create Budget'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <Label htmlFor="budgetName" required>Budget Name</Label>
            <Input
              id="budgetName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., January Food Budget"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budgetCategory" required>Category</Label>
              <Select
                id="budgetCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value as FinancialCategory)}
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="budgetPeriod" required>Period</Label>
              <Select
                id="budgetPeriod"
                value={period}
                onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
              >
                {BUDGET_PERIODS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="budgetAmount" required>Budget Amount (IDR)</Label>
            <Input
              id="budgetAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500000"
              min="0"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budgetStartDate" required>Start Date</Label>
              <Input
                id="budgetStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="budgetEndDate" required>End Date</Label>
              <Input
                id="budgetEndDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={period !== 'custom'}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
            <div className="flex items-center gap-4">
              <input
                id="alertThreshold"
                type="range"
                min="50"
                max="100"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="flex-1"
              />
              <span className="w-12 text-sm text-muted-foreground">{alertThreshold}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              You'll be alerted when spending reaches this percentage
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="budgetIsActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border"
            />
            <Label htmlFor="budgetIsActive">Budget is active</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{budget ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
