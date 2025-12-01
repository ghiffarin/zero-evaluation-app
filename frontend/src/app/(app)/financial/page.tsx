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

// Financial chart colors
const FINANCIAL_COLORS = {
  income: '#10b981',      // green
  spending: '#ef4444',    // red
  investment: '#3b82f6',  // blue
  necessary: '#22c55e',   // green
  unnecessary: '#f97316', // orange
};

// Category chart colors
const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
];

// Format IDR currency
const formatIDR = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
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

// Helper function for daily cash flow data (last 7 days time series)
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

// Helper function for daily spending breakdown by necessity (last 7 days)
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

export default function FinancialPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tooltipStyles = getTooltipStyles(isDark);
  const chartColors = getChartColors(isDark);
  const [transactions, setTransactions] = React.useState<FinancialTransaction[]>([]);
  const [stats, setStats] = React.useState<FinancialStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Modal states
  const [showModal, setShowModal] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<FinancialTransaction | null>(null);

  // View mode toggle
  const [viewMode, setViewMode] = React.useState<'analytics' | 'log'>('analytics');

  // Filters
  const [filterDirection, setFilterDirection] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedTransaction, setExpandedTransaction] = React.useState<string | null>(null);

  // Fetch data
  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchData() {
      try {
        setLoading(true);
        const [transactionsRes, statsRes] = await Promise.all([
          api.financial.list({ limit: 100 }),
          api.financial.stats(),
        ]);
        setTransactions((transactionsRes as any).data || []);
        setStats((statsRes as any).data || null);
      } catch (err) {
        console.error('Failed to fetch financial data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authLoading, isAuthenticated]);

  // CRUD handlers
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

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesDirection = filterDirection === 'all' || transaction.direction === filterDirection;
    const matchesSearch = !searchQuery ||
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDirection && matchesSearch;
  });

  // Get top spending categories
  const topCategories = stats?.spending.byCategory
    ? Object.entries(stats.spending.byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

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
        title="Financial"
        description="Track your income, expenses, and investments"
        actions={
          <Button
            onClick={() => {
              setEditingTransaction(null);
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
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
                <StatCard
                  label="Net Worth"
                  value={formatCurrency(stats.summary.netWorth)}
                  icon={<Wallet className="h-5 w-5" />}
                  variant={stats.summary.netWorth >= 0 ? 'success' : 'error'}
                />
              </div>

              {/* Spending & Savings Analysis */}
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                {/* Spending Breakdown */}
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
                      {/* Necessary vs Unnecessary */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Necessary</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(stats.spending.necessary)} ({stats.spending.necessaryPercentage.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={stats.spending.necessaryPercentage} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Unnecessary</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(stats.spending.unnecessary)} ({(100 - stats.spending.necessaryPercentage).toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={100 - stats.spending.necessaryPercentage} className="h-2 [&>div]:bg-red-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Spending Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topCategories.map(([category, amount]) => {
                        const percentage = stats.spending.total > 0
                          ? (amount / stats.spending.total) * 100
                          : 0;
                        const categoryInfo = CATEGORIES.find((c) => c.value === category);
                        const CategoryIcon = categoryInfo?.icon || Wallet;
                        return (
                          <div key={category}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="flex items-center gap-2">
                                <CategoryIcon className="h-4 w-4" />
                                {categoryInfo?.label || category}
                              </span>
                              <span className="text-muted-foreground">
                                {formatCurrency(amount)}
                              </span>
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
                {/* Daily Cash Flow (Stacked Bar Chart - Time Series) */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Daily Cash Flow</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getDailyCashFlowData(transactions)}
                          margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                        >
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

                {/* Daily Spending Discipline (Stacked Bar Chart - Time Series) */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Daily Spending Discipline</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getDailySpendingData(transactions)}
                          margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                        >
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
                                <div style={{
                                  ...tooltipStyles.contentStyle,
                                  padding: '8px 10px',
                                  fontSize: '11px',
                                }}>
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

          {/* Empty state for analytics */}
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
          {/* Search and Filter */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
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

          {/* Transactions List */}
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
              {filteredTransactions.map((transaction) => (
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
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
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
    </PageContainer>
  );
}

// Helper components
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
}: {
  transaction: FinancialTransaction;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
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

            {/* Expanded content */}
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

  // Get categories based on direction
  const filteredCategories = CATEGORIES.filter((c) =>
    c.direction === 'all' || c.direction === formData.direction
  );

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

  // Update category when direction changes
  React.useEffect(() => {
    const validCategory = filteredCategories.find((c) => c.value === formData.category);
    if (!validCategory) {
      const defaultCategory = filteredCategories[0]?.value || 'other';
      setFormData((prev) => ({ ...prev, category: defaultCategory }));
    }
  }, [formData.direction]);

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

          {formData.direction === 'spend' && (
            <>
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

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDirectionVariant(direction: string): 'success' | 'warning' | 'error' | 'neutral' {
  switch (direction) {
    case 'income': return 'success';
    case 'spend': return 'error';
    case 'invest': return 'neutral';
    default: return 'neutral';
  }
}
