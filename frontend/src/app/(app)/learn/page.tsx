'use client';

import * as React from 'react';
import { PageContainer, PageHeader, PageSection } from '@/components/layout';
import { Stat } from '@/components/editorial';
import { Button, Input, Label, Select, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import { cn, getTodayISO, toISODateString } from '@/lib/utils';

// Learn: one place for every study hour. Books, papers, skills and IELTS
// practice share one session form; each type only asks for what it needs.

type Kind = 'book' | 'paper' | 'skill' | 'ielts';

const KINDS: { key: Kind; label: string }[] = [
  { key: 'book', label: 'Book' },
  { key: 'paper', label: 'Paper' },
  { key: 'skill', label: 'Skill' },
  { key: 'ielts', label: 'IELTS' },
];

const SKILL_CATEGORIES: Record<string, string> = {
  uiux: 'UI/UX', framer: 'Framer', writing: 'Writing', pm: 'Product management', data: 'Data',
  engineering: 'Engineering', programming: 'Programming', career: 'Career', language: 'Language', other: 'Other',
};
const PAPER_CATEGORIES: Record<string, string> = {
  microalgae: 'Microalgae', co2_fixation: 'CO₂ fixation', bioprocess: 'Bioprocess', sustainability: 'Sustainability',
  engineering: 'Engineering', data_science: 'Data science', other: 'Other',
};
const IELTS_SKILLS: Record<string, string> = {
  listening: 'Listening', reading: 'Reading', writing_task1: 'Writing task 1', writing_task2: 'Writing task 2', speaking: 'Speaking',
};

interface Book { id: string; title: string; author: string | null; totalPages: number | null; status: string }
interface BookSession { id: string; date: string; timeSpentMin: number | null; pagesRead: number | null; bookId: string; book?: { title: string } }
interface Paper { id: string; date: string; timeSpentMin: number | null; title: string; category: string }
interface SkillSession { id: string; date: string; timeSpentMin: number | null; skillCategory: string; subSkill: string | null }
interface IeltsSession { id: string; date: string; timeSpentMin: number | null; skillType: string; estimatedBand: number | null }

interface Session { id: string; kind: Kind; date: string; minutes: number; title: string; detail: string }

const isoDate = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`).toISOString();
const day = (iso: string) => iso.slice(0, 10);
const hours = (minutes: number) => (minutes / 60).toFixed(1).replace(/\.0$/, '');
const shortDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d));
};

async function list<T>(request: Promise<{ data: unknown }>): Promise<T[]> {
  try {
    return ((await request).data as T[]) ?? [];
  } catch {
    return [];
  }
}

interface Draft {
  kind: Kind; date: string; minutes: string; note: string;
  bookId: string; pages: string;
  paperTitle: string; paperCategory: string;
  skillCategory: string; topic: string;
  ieltsSkill: string; band: string;
}

const newDraft = (kind: Kind = 'book'): Draft => ({
  kind, date: getTodayISO(), minutes: '', note: '',
  bookId: '', pages: '', paperTitle: '', paperCategory: 'other',
  skillCategory: 'programming', topic: '', ieltsSkill: 'reading', band: '',
});

interface LearnData { books: Book[]; pagesByBook: Record<string, number>; sessions: Session[] }

/** Loads every learning type and merges them into one session list */
async function fetchLearnData(): Promise<LearnData> {
  const [bookList, bookSessions, papers, skills, ielts] = await Promise.all([
    list<Book>(api.books.list({ limit: 100 })),
    list<BookSession>(api.books.sessions.list({ limit: 200 })),
    list<Paper>(api.journals.list({ limit: 100 })),
    list<SkillSession>(api.skills.list({ limit: 100 })),
    list<IeltsSession>(api.ielts.sessions.list({ limit: 100 })),
  ]);

  const pages: Record<string, number> = {};
  for (const s of bookSessions) pages[s.bookId] = (pages[s.bookId] ?? 0) + (s.pagesRead ?? 0);

  const merged: Session[] = [
    ...bookSessions.map((s) => ({
      id: s.id, kind: 'book' as const, date: day(s.date), minutes: s.timeSpentMin ?? 0,
      title: s.book?.title ?? 'Book', detail: s.pagesRead ? `${s.pagesRead} pages` : '',
    })),
    ...papers.map((p) => ({
      id: p.id, kind: 'paper' as const, date: day(p.date), minutes: p.timeSpentMin ?? 0,
      title: p.title, detail: PAPER_CATEGORIES[p.category] ?? '',
    })),
    ...skills.map((s) => ({
      id: s.id, kind: 'skill' as const, date: day(s.date), minutes: s.timeSpentMin ?? 0,
      title: s.subSkill || SKILL_CATEGORIES[s.skillCategory] || 'Skill', detail: SKILL_CATEGORIES[s.skillCategory] ?? '',
    })),
    ...ielts.map((s) => ({
      id: s.id, kind: 'ielts' as const, date: day(s.date), minutes: s.timeSpentMin ?? 0,
      title: IELTS_SKILLS[s.skillType] ?? 'IELTS', detail: s.estimatedBand ? `band ${s.estimatedBand}` : '',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return { books: bookList, pagesByBook: pages, sessions: merged };
}

export default function LearnPage() {
  const [books, setBooks] = React.useState<Book[]>([]);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [pagesByBook, setPagesByBook] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState<Draft>(newDraft);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [newBook, setNewBook] = React.useState({ title: '', author: '', totalPages: '' });
  const formRef = React.useRef<HTMLFormElement>(null);

  const apply = (data: LearnData) => {
    setBooks(data.books);
    setPagesByBook(data.pagesByBook);
    setSessions(data.sessions);
    setLoading(false);
  };
  const load = async () => apply(await fetchLearnData());

  React.useEffect(() => {
    let cancelled = false;
    fetchLearnData().then((data) => { if (!cancelled) apply(data); });
    return () => { cancelled = true; };
  }, []);


  const openBooks = books.filter((b) => b.status === 'reading' || b.status === 'to_read');

  // This week = the last 7 calendar days including today
  const weekStart = (() => {
    const [y, m, d] = getTodayISO().split('-').map(Number);
    return toISODateString(new Date(y, m - 1, d - 6));
  })();
  const thisWeek = sessions.filter((s) => s.date >= weekStart);
  const minutesFor = (kind?: Kind) => thisWeek.filter((s) => !kind || s.kind === kind).reduce((sum, s) => sum + s.minutes, 0);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const minutes = draft.minutes ? Number(draft.minutes) : null;
    const note = draft.note.trim() || null;
    const date = isoDate(draft.date);

    try {
      setSaving(true);
      if (draft.kind === 'book') {
        if (!draft.bookId) throw new Error('Pick a book from your reading list, or add one below.');
        await api.books.sessions.create({ bookId: draft.bookId, date, timeSpentMin: minutes, pagesRead: draft.pages ? Number(draft.pages) : null, summary: note });
      } else if (draft.kind === 'paper') {
        if (!draft.paperTitle.trim()) throw new Error('Give the paper a title.');
        await api.journals.create({ date, title: draft.paperTitle.trim(), category: draft.paperCategory, timeSpentMin: minutes, summary: note });
      } else if (draft.kind === 'skill') {
        await api.skills.create({ date, skillCategory: draft.skillCategory, subSkill: draft.topic.trim() || null, timeSpentMin: minutes, learnedPoints: note });
      } else {
        await api.ielts.sessions.create({ date, skillType: draft.ieltsSkill, timeSpentMin: minutes, estimatedBand: draft.band ? Number(draft.band) : null, notes: note });
      }
      setDraft((d) => ({ ...newDraft(d.kind), bookId: d.bookId, skillCategory: d.skillCategory, ieltsSkill: d.ieltsSkill }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the session');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: Session) => {
    if (!confirm(`Delete "${s.title}" from ${shortDate(s.date)}?`)) return;
    const deleters: Record<Kind, (id: string) => Promise<unknown>> = {
      book: api.books.sessions.delete, paper: api.journals.delete, skill: api.skills.delete, ielts: api.ielts.sessions.delete,
    };
    await deleters[s.kind](s.id);
    await load();
  };

  const addBook = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newBook.title.trim()) return;
    const res = await api.books.create({
      title: newBook.title.trim(), author: newBook.author.trim() || null,
      totalPages: newBook.totalPages ? Number(newBook.totalPages) : null, status: 'reading',
    });
    setNewBook({ title: '', author: '', totalPages: '' });
    await load();
    const created = res.data as Book | undefined;
    if (created?.id) setDraft((d) => ({ ...d, kind: 'book', bookId: created.id }));
  };

  const finishBook = async (book: Book) => {
    await api.books.update(book.id, { status: 'completed' });
    await load();
  };

  return (
    <PageContainer>
      <PageHeader
        title="Learn"
        description="Every study hour in one place."
        actions={
          <Button onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            Log a session
          </Button>
        }
      />

      <PageSection title="This week" description="Last seven days, from your sessions.">
        <div className="grid grid-cols-2 gap-x-[var(--gutter)] gap-y-10 md:grid-cols-5">
          <Stat size="lg" className="col-span-2 md:col-span-1" value={loading ? '—' : hours(minutesFor())} unit="h" caption="learning in total" />
          {KINDS.map((k) => (
            <Stat key={k.key} value={loading ? '—' : hours(minutesFor(k.key))} unit="h" caption={k.label.toLowerCase() === 'ielts' ? 'IELTS practice' : `${k.label.toLowerCase()}s`} />
          ))}
        </div>
      </PageSection>

      <form ref={formRef} onSubmit={save} className="scroll-mt-20">
        <PageSection title="Log a session">
          <div role="radiogroup" aria-label="Session type" className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                role="radio"
                aria-checked={draft.kind === k.key}
                onClick={() => set('kind', k.key)}
                className={cn(
                  'h-9 rounded-full border border-foreground px-4 text-sm font-bold transition-colors',
                  draft.kind === k.key ? 'bg-foreground text-background' : 'hover:bg-accent'
                )}
              >
                {k.label}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-x-[var(--gutter)] gap-y-6 md:grid-cols-3">
            {draft.kind === 'book' && (
              <>
                <div>
                  <Label htmlFor="book">Book</Label>
                  <Select id="book" className="mt-2" value={draft.bookId} onChange={(e) => set('bookId', e.target.value)}>
                    <option value="">Choose a book</option>
                    {openBooks.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pages">Pages read</Label>
                  <Input id="pages" type="number" inputMode="numeric" min={0} className="num mt-2 text-2xl" value={draft.pages} onChange={(e) => set('pages', e.target.value)} placeholder="20" />
                </div>
              </>
            )}
            {draft.kind === 'paper' && (
              <>
                <div>
                  <Label htmlFor="title">Paper title</Label>
                  <Input id="title" className="mt-2" value={draft.paperTitle} onChange={(e) => set('paperTitle', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="pcat">Field</Label>
                  <Select id="pcat" className="mt-2" value={draft.paperCategory} onChange={(e) => set('paperCategory', e.target.value)}>
                    {Object.entries(PAPER_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                </div>
              </>
            )}
            {draft.kind === 'skill' && (
              <>
                <div>
                  <Label htmlFor="scat">Skill</Label>
                  <Select id="scat" className="mt-2" value={draft.skillCategory} onChange={(e) => set('skillCategory', e.target.value)}>
                    {Object.entries(SKILL_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input id="topic" className="mt-2" value={draft.topic} onChange={(e) => set('topic', e.target.value)} placeholder="What you practised" />
                </div>
              </>
            )}
            {draft.kind === 'ielts' && (
              <>
                <div>
                  <Label htmlFor="iskill">Section</Label>
                  <Select id="iskill" className="mt-2" value={draft.ieltsSkill} onChange={(e) => set('ieltsSkill', e.target.value)}>
                    {Object.entries(IELTS_SKILLS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="band">Estimated band</Label>
                  <Input id="band" type="number" inputMode="decimal" min={0} max={9} step={0.5} className="num mt-2 text-2xl" value={draft.band} onChange={(e) => set('band', e.target.value)} placeholder="6.5" />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-x-[var(--gutter)]">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" className="mt-2" value={draft.date} onChange={(e) => set('date', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="minutes">Minutes</Label>
                <Input id="minutes" type="number" inputMode="numeric" min={0} className="num mt-2 text-2xl" value={draft.minutes} onChange={(e) => set('minutes', e.target.value)} placeholder="45" />
              </div>
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="note">What you took away</Label>
              <Textarea id="note" rows={2} className="mt-2" value={draft.note} onChange={(e) => set('note', e.target.value)} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save session'}</Button>
            {error && <span className="text-sm font-bold">{error}</span>}
          </div>
        </PageSection>
      </form>

      <PageSection title="Recent sessions">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{loading ? 'Loading…' : 'No sessions yet. Log your first one above.'}</p>
        ) : (
          <ul className="border-b border-foreground">
            {sessions.slice(0, 15).map((s) => (
              <li key={`${s.kind}-${s.id}`} className="grid grid-cols-[4.5rem_1fr_auto_auto] items-baseline gap-x-4 border-t border-border py-2.5 text-sm first:border-foreground">
                <span className="label-mono">{shortDate(s.date)}</span>
                <span className="min-w-0 truncate">
                  <span className="font-bold">{s.title}</span>
                  <span className="text-muted-foreground"> · {KINDS.find((k) => k.key === s.kind)?.label}{s.detail && ` · ${s.detail}`}</span>
                </span>
                <span className="num text-base">{s.minutes ? `${s.minutes}′` : '—'}</span>
                <button type="button" onClick={() => remove(s)} className="label-mono hover:underline" aria-label={`Delete ${s.title}`}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </PageSection>

      <PageSection title="Reading list" description="Books you are reading or plan to read.">
        <ul className="border-b border-foreground">
          {openBooks.map((b) => {
            const read = pagesByBook[b.id] ?? 0;
            const pct = b.totalPages ? Math.min(100, Math.round((read / b.totalPages) * 100)) : null;
            return (
              <li key={b.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-t border-foreground py-3 md:grid-cols-[1fr_12rem_auto]">
                <span className="min-w-0">
                  <span className="font-bold">{b.title}</span>
                  {b.author && <span className="text-muted-foreground"> · {b.author}</span>}
                </span>
                <span className="col-span-2 flex items-center gap-3 md:col-span-1">
                  <span className="relative h-[3px] flex-1 bg-foreground/15">
                    <span className="absolute inset-y-0 left-0 bg-foreground" style={{ width: `${pct ?? 0}%` }} />
                  </span>
                  <span className="num w-12 text-right text-base">{pct === null ? `${read}p` : `${pct}%`}</span>
                </span>
                <button type="button" onClick={() => finishBook(b)} className="label-mono justify-self-end hover:underline">
                  Finished
                </button>
              </li>
            );
          })}
        </ul>

        <form onSubmit={addBook} className="mt-6 grid gap-x-[var(--gutter)] gap-y-4 md:grid-cols-[2fr_1.5fr_1fr_auto] md:items-end">
          <div>
            <Label htmlFor="btitle">Add a book</Label>
            <Input id="btitle" className="mt-2" value={newBook.title} onChange={(e) => setNewBook((n) => ({ ...n, title: e.target.value }))} placeholder="Title" />
          </div>
          <Input aria-label="Author" value={newBook.author} onChange={(e) => setNewBook((n) => ({ ...n, author: e.target.value }))} placeholder="Author" />
          <Input aria-label="Total pages" type="number" inputMode="numeric" min={1} value={newBook.totalPages} onChange={(e) => setNewBook((n) => ({ ...n, totalPages: e.target.value }))} placeholder="Pages" />
          <Button type="submit" variant="outline" disabled={!newBook.title.trim()}>Add</Button>
        </form>
      </PageSection>
    </PageContainer>
  );
}
