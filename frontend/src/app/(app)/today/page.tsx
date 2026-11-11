'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageContainer, PageHeader, PageSection } from '@/components/layout';
import { Stat, Scale } from '@/components/editorial';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import { cn, getTodayISO, toISODateString } from '@/lib/utils';

// Today: the one daily check-in. Ten fields replace the old Daily Log,
// Wellness and Reflection pages. Learning, workout and spending are never
// typed here: they come from the sessions logged in their own areas.

interface DailyLog {
  dayScore: number | null;
  moodScore: number | null;
  energyScore: number | null;
  sleepHours: number | null;
  workHours: number | null;
  mainFocus: string | null;
  notes: string | null;
}
interface Wellness { stressLevel: number | null }
interface Reflection { wentWell: string | null; fixForTomorrow: string | null }
interface Aggregate {
  learningHours: number;
  workoutMinutes: number;
  moneySpent: number;
  pagesRead: number | null;
}
interface WeekLog { date: string; dayScore: number | null }

interface CheckIn {
  dayScore: number | null;
  mood: number | null;
  energy: number | null;
  stress: number | null;
  sleepHours: string;
  workHours: string;
  mainFocus: string;
  wentWell: string;
  fixForTomorrow: string;
  notes: string;
}

const EMPTY: CheckIn = {
  dayScore: null, mood: null, energy: null, stress: null,
  sleepHours: '', workHours: '', mainFocus: '', wentWell: '', fixForTomorrow: '', notes: '',
};

const shiftDay = (ymd: string, days: number) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return toISODateString(new Date(y, m - 1, d + days));
};

const longDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d));
};

const weekday = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(new Date(y, m - 1, d));
};

/** The day's entry from a list endpoint (an empty day is an empty list, not a 404) */
async function entryOn<T>(endpoint: string, date: string): Promise<T | null> {
  try {
    const res = await api.paginated<T>(endpoint, { startDate: date, endDate: date, limit: 1 });
    return res.data[0] ?? null;
  } catch {
    return null;
  }
}

/** Entries in a date range from a list endpoint */
async function entriesBetween<T>(endpoint: string, startDate: string, endDate: string): Promise<T[]> {
  try {
    return (await api.paginated<T>(endpoint, { startDate, endDate, limit: 31 })).data;
  } catch {
    return [];
  }
}

async function orNull<T>(request: Promise<{ data: unknown }>): Promise<T | null> {
  try {
    return (await request).data as T;
  } catch {
    return null;
  }
}

const numberOrNull = (value: string) => (value.trim() === '' ? null : Number(value));
const textOrNull = (value: string) => (value.trim() === '' ? null : value.trim());

const compactRupiah = (amount: number) =>
  amount >= 1_000_000 ? { value: (amount / 1_000_000).toFixed(1).replace(/\.0$/, ''), unit: 'M' }
  : amount >= 1_000 ? { value: Math.round(amount / 1_000).toString(), unit: 'k' }
  : { value: Math.round(amount).toString(), unit: '' };

export default function TodayPage() {
  const [date, setDate] = React.useState(getTodayISO);
  const [form, setForm] = React.useState<CheckIn>(EMPTY);
  const [aggregate, setAggregate] = React.useState<Aggregate | null>(null);
  const [week, setWeek] = React.useState<WeekLog[]>([]);
  const [hasReflection, setHasReflection] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const isToday = date === getTodayISO();

  // Switching day resets the form state; the effect below only loads data
  const goTo = (day: string) => {
    setDate(day);
    setLoading(true);
    setSavedAt(null);
    setError(null);
  };

  React.useEffect(() => {
    let cancelled = false;

    Promise.all([
      entryOn<DailyLog>('/daily-logs', date),
      entryOn<Wellness>('/wellness', date),
      entryOn<Reflection>('/reflections', date),
      orNull<Aggregate>(api.dailyLogs.aggregate(date)),
    ]).then(([log, wellness, reflection, agg]) => {
      if (cancelled) return;
      setForm({
        dayScore: log?.dayScore ?? null,
        mood: log?.moodScore ?? null,
        energy: log?.energyScore ?? null,
        stress: wellness?.stressLevel ?? null,
        sleepHours: log?.sleepHours?.toString() ?? '',
        workHours: log?.workHours?.toString() ?? '',
        mainFocus: log?.mainFocus ?? '',
        wentWell: reflection?.wentWell ?? '',
        fixForTomorrow: reflection?.fixForTomorrow ?? '',
        notes: log?.notes ?? '',
      });
      setHasReflection(Boolean(reflection));
      setAggregate(agg);
      setLoading(false);
    });
    entriesBetween<WeekLog>('/daily-logs', shiftDay(date, -6), date).then((logs) => {
      if (!cancelled) setWeek(logs);
    });

    return () => { cancelled = true; };
  }, [date]);

  const set = <K extends keyof CheckIn>(key: K, value: CheckIn[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSavedAt(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const sleepHours = numberOrNull(form.sleepHours);

    try {
      const writes: Promise<unknown>[] = [
        api.dailyLogs.upsertByDate(date, {
          dayScore: form.dayScore,
          moodScore: form.mood,
          energyScore: form.energy,
          sleepHours,
          workHours: numberOrNull(form.workHours),
          mainFocus: textOrNull(form.mainFocus),
          notes: textOrNull(form.notes),
          // Snapshot of the day's sessions, for older reports that read it here
          learningHours: aggregate?.learningHours ?? null,
          workoutMinutes: aggregate?.workoutMinutes ?? null,
          moneySpent: aggregate?.moneySpent ?? null,
        }),
      ];

      // Mood, energy, sleep and stress also feed the wellness trend charts
      if ([form.mood, form.energy, form.stress, sleepHours].some((v) => v !== null)) {
        writes.push(
          api.wellness.upsertByDate(date, {
            moodScore: form.mood,
            energyLevel: form.energy,
            stressLevel: form.stress,
            sleepHours,
          })
        );
      }

      const wentWell = textOrNull(form.wentWell);
      const fixForTomorrow = textOrNull(form.fixForTomorrow);
      if (wentWell || fixForTomorrow || hasReflection) {
        writes.push(api.reflections.upsertByDate(date, { wentWell, fixForTomorrow }));
        setHasReflection(true);
      }

      await Promise.all(writes);
      setSavedAt(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date()));
      setWeek(await entriesBetween<WeekLog>('/daily-logs', shiftDay(date, -6), date));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the check-in');
    } finally {
      setSaving(false);
    }
  };

  const spent = compactRupiah(aggregate?.moneySpent ?? 0);
  const weekDays = Array.from({ length: 7 }, (_, i) => shiftDay(date, i - 6));
  const scoreFor = (day: string) => week.find((log) => log.date.slice(0, 10) === day)?.dayScore ?? null;

  return (
    <PageContainer>
      <PageHeader
        title={isToday ? 'Today' : longDate(date).split(' ')[0]}
        description={longDate(date)}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => goTo(shiftDay(date, -1))}>
              ← Previous day
            </Button>
            {!isToday && (
              <Button variant="outline" size="sm" onClick={() => goTo(getTodayISO())}>
                Back to today
              </Button>
            )}
          </>
        }
      />

      <PageSection title="What you did" description="From the sessions you logged. Nothing to type here.">
        <div className="grid grid-cols-2 gap-x-[var(--gutter)] gap-y-10 md:grid-cols-3">
          <Stat
            value={loading ? '—' : (aggregate?.learningHours ?? 0).toFixed(1).replace(/\.0$/, '')}
            unit="h"
            caption={<>learning · <Link className="underline underline-offset-4" href="/learn">log a session</Link></>}
          />
          <Stat
            value={loading ? '—' : Math.round(aggregate?.workoutMinutes ?? 0)}
            unit="min"
            caption={<>training · <Link className="underline underline-offset-4" href="/workouts">log a workout</Link></>}
          />
          <Stat
            value={loading ? '—' : spent.value}
            unit={spent.unit}
            caption={<>rupiah spent · <Link className="underline underline-offset-4" href="/financial">log spending</Link></>}
          />
        </div>
      </PageSection>

      <form onSubmit={save}>
        <PageSection title="Check in" description="Ten questions, about two minutes.">
          <div className="grid gap-x-[var(--gutter)] gap-y-8 md:grid-cols-3">
            <div className="md:col-span-3">
              <Scale label="How was the day?" max={10} value={form.dayScore} onChange={(v) => set('dayScore', v)} low="rough" high="great" />
            </div>
            <Scale label="Mood" max={5} value={form.mood} onChange={(v) => set('mood', v)} low="low" high="high" />
            <Scale label="Energy" max={5} value={form.energy} onChange={(v) => set('energy', v)} low="drained" high="full" />
            <Scale label="Stress" max={5} value={form.stress} onChange={(v) => set('stress', v)} low="calm" high="tense" />

            <div>
              <Label htmlFor="sleep">Sleep (hours)</Label>
              <Input id="sleep" type="number" inputMode="decimal" min={0} max={24} step={0.5} className="num mt-2 text-2xl" value={form.sleepHours} onChange={(e) => set('sleepHours', e.target.value)} placeholder="7.5" />
            </div>
            <div>
              <Label htmlFor="work">Work (hours)</Label>
              <Input id="work" type="number" inputMode="decimal" min={0} max={24} step={0.5} className="num mt-2 text-2xl" value={form.workHours} onChange={(e) => set('workHours', e.target.value)} placeholder="8" />
            </div>
            <div>
              <Label htmlFor="focus">Main focus</Label>
              <Input id="focus" className="mt-2" value={form.mainFocus} onChange={(e) => set('mainFocus', e.target.value)} placeholder="The one thing that mattered" />
            </div>

            <div>
              <Label htmlFor="well">What went well</Label>
              <Textarea id="well" rows={3} className="mt-2" value={form.wentWell} onChange={(e) => set('wentWell', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="fix">Fix for tomorrow</Label>
              <Textarea id="fix" rows={3} className="mt-2" value={form.fixForTomorrow} onChange={(e) => set('fixForTomorrow', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="notes">Note</Label>
              <Textarea id="notes" rows={3} className="mt-2" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save check-in'}
            </Button>
            {savedAt && <span className="label-mono">Saved {savedAt}</span>}
            {error && <span className="text-sm text-destructive">{error}</span>}
          </div>
        </PageSection>
      </form>

      <PageSection title="This week" description="Day score, last seven days.">
        <div className="grid grid-cols-7 gap-x-2 md:gap-x-[var(--gutter)]">
          {weekDays.map((day) => {
            const score = scoreFor(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => goTo(day)}
                className={cn('flex flex-col items-start border-t pt-2 text-left', day === date ? 'border-t-2 border-foreground' : 'border-foreground')}
              >
                <span className="label-mono">{weekday(day)}</span>
                <span className={cn('num mt-2 text-[clamp(28px,3vw,56px)]', score === null && 'text-muted-foreground')}>
                  {score ?? '—'}
                </span>
              </button>
            );
          })}
        </div>
      </PageSection>
    </PageContainer>
  );
}
