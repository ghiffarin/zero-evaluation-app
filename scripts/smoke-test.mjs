#!/usr/bin/env node
// End-to-end smoke test for Zero Evaluation, run through the frontend's /api proxy.
//
// It registers two throwaway accounts, writes a week of data, and checks that
// the data comes back correctly from the dashboard, reports, budgets, quizzes
// and export, and that one account cannot read the other's data.
//
// It WRITES data. Run it only against a local database or a fresh production
// database before real use, and delete the accounts afterwards with the SQL
// it prints at the end. Registration must be open (ALLOW_REGISTRATION unset or
// "true") while it runs.
//
// Usage:
//   node scripts/smoke-test.mjs                       # http://localhost:3000
//   BASE_URL=https://your-app.vercel.app node scripts/smoke-test.mjs
//   VERCEL_BYPASS_TOKEN=...  # only if Vercel Deployment Protection is on
//
// Requires Node.js 18+ (global fetch).
import { readFileSync } from 'node:fs';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const API = `${BASE_URL}/api`;
const BYPASS = process.env.VERCEL_BYPASS_TOKEN;
const TIMEZONE = 'Asia/Jakarta';
const PASSWORD = `smoke-${Math.random().toString(36).slice(2)}-Pw1`;
const RUN = Date.now();
const EMAIL_A = `smoke+${RUN}@example.com`;
const EMAIL_B = `smoke+${RUN}-b@example.com`;

const results = [];
let token;

async function call(method, path, body, tok = token) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
      ...(BYPASS ? { 'x-vercel-protection-bypass': BYPASS } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON response */ }
  return { status: res.status, json };
}

function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? `  -> ${detail}` : ''}`);
}

const short = (r) => `${r.status} ${JSON.stringify(r.json).slice(0, 160)}`;

// The user's calendar dates (the app stores calendar dates per user timezone)
const ymd = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(d);
const days = [...Array(7)].map((_, i) => ymd(new Date(Date.now() - i * 86400000)));
const today = days[0];
const iso = (day) => new Date(`${day}T00:00:00.000Z`).toISOString();

console.log(`Target: ${API}`);
console.log(`User's today (${TIMEZONE}): ${today} | UTC now: ${new Date().toISOString()}\n`);

// --- health and accounts -----------------------------------------------------
const health = await call('GET', '/health', undefined, null);
check('API reachable through the frontend proxy', health.status === 200, short(health));
if (health.status !== 200) {
  console.error('\nCannot reach the API. Check BASE_URL, BACKEND_URL and Deployment Protection.');
  process.exit(1);
}

const regA = await call('POST', '/auth/register', { email: EMAIL_A, password: PASSWORD, name: 'Smoke A', timezone: TIMEZONE }, null);
if (regA.status === 403) {
  console.error('\nRegistration is closed (ALLOW_REGISTRATION=false). Open it temporarily to run this test.');
  process.exit(1);
}
check('register account A', regA.status === 201, short(regA));
const login = await call('POST', '/auth/login', { email: EMAIL_A, password: PASSWORD }, null);
token = login.json?.data?.token;
check('login account A', !!token, short(login));
if (!token) process.exit(1);
const me = (await call('GET', '/auth/me')).json?.data ?? {};

await call('POST', '/auth/register', { email: EMAIL_B, password: PASSWORD, name: 'Smoke B', timezone: TIMEZONE }, null);
const tokB = (await call('POST', '/auth/login', { email: EMAIL_B, password: PASSWORD }, null)).json?.data?.token;
check('register and login account B', !!tokB);
const meB = (await call('GET', '/auth/me', undefined, tokB)).json?.data ?? {};

// --- a week of daily logs, wellness and spending -----------------------------
for (const [i, d] of days.entries()) {
  const r1 = await call('PUT', `/daily-logs/date/${d}`, {
    mainFocus: `Focus day ${i}`, workHours: 6 + (i % 3), learningHours: 1.5, workoutMinutes: 30,
    moodScore: 4, energyScore: 3 + (i % 2), sleepHours: 7, dayScore: 7 + (i % 3),
  });
  const r2 = await call('PUT', `/wellness/date/${d}`, { sleepHours: 7, sleepQuality: 4, energyLevel: 4, moodScore: 4, stressLevel: 2 });
  const r3 = await call('POST', '/financial', { date: iso(d), amountIdr: 50000 + i * 1000, direction: 'spend', category: 'food', description: `Lunch ${i}` });
  if (r1.status >= 300 || r2.status >= 300 || r3.status >= 300) {
    check(`write day ${d}`, false, `${short(r1)} | ${short(r2)} | ${short(r3)}`);
  }
}
const logs = await call('GET', '/daily-logs');
check('7 daily logs stored', logs.json?.data?.length === 7, `got ${logs.json?.data?.length}`);
const storedDates = (logs.json?.data ?? []).map((l) => l.date.slice(0, 10)).sort();
check('stored dates match the dates sent', JSON.stringify(storedDates) === JSON.stringify([...days].sort()), storedDates.join(','));

// --- budget picks up the spending --------------------------------------------
const monthStart = `${today.slice(0, 8)}01`;
const lastDay = new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7), 0)).getUTCDate();
const monthEnd = `${today.slice(0, 8)}${String(lastDay).padStart(2, '0')}`;
const bud = await call('POST', '/budgets', { name: 'Food', category: 'food', amount: 1500000, period: 'monthly', startDate: monthStart, endDate: monthEnd });
check('create budget', bud.status === 201, short(bud));
const budget = (await call('GET', `/budgets/${bud.json?.data?.id}`)).json?.data ?? {};
const spentInMonth = days.filter((d) => d >= monthStart).reduce((s, d) => s + 50000 + days.indexOf(d) * 1000, 0);
check("budget counts this month's food spending", budget.currentSpent === spentInMonth, `currentSpent=${budget.currentSpent} expected ${spentInMonth}`);

// --- other modules -----------------------------------------------------------
const creates = [
  ['/goals', { title: 'Run 10k', category: 'fitness' }],
  ['/workouts', { date: today, workoutType: 'jogging', durationMin: 30 }],
  ['/skills', { date: iso(today), skillCategory: 'uiux', timeSpentMin: 60 }],
  ['/career/activities', { date: iso(today), activityType: 'portfolio', description: 'Update portfolio', timeSpentMin: 45 }],
  ['/books', { title: 'Atomic Habits', author: 'James Clear', totalPages: 300 }],
  ['/journals', { date: iso(today), title: 'Paper on CO2 capture', category: 'co2_fixation' }],
];
for (const [path, body] of creates) {
  const r = await call('POST', path, body);
  check(`create ${path}`, r.status === 201, short(r));
}

// --- quiz: upload the example, answer 5 correctly, check the score ----------
const quizJson = JSON.parse(readFileSync(new URL('../quiz_json_example/tipe_a_numerical_reasoning.md', import.meta.url), 'utf8'));
const quiz = await call('POST', '/quizzes', quizJson);
check('upload example quiz', quiz.status === 201, short(quiz));
if (quiz.json?.data?.id) {
  const start = await call('POST', `/quizzes/${quiz.json.data.id}/start`, { mode: 'practice' });
  const attemptId = start.json?.data?.id ?? start.json?.data?.attempt?.id;
  check('start quiz attempt', !!attemptId, short(start));
  for (const q of quizJson.questions.slice(0, 5)) {
    await call('PUT', `/quizzes/attempts/${attemptId}/answer`, { questionId: q.id, answer: q.answer });
  }
  const done = await call('POST', `/quizzes/attempts/${attemptId}/complete`);
  check('complete quiz attempt', done.status === 200, short(done));
  const res = (await call('GET', `/quizzes/attempts/${attemptId}/results`)).json?.data ?? {};
  const score = res.score ?? res.attempt?.score;
  check('quiz scores 5 correct answers', score === 5, `score=${score}`);
}

// --- dashboard, charts and reports -------------------------------------------
const dToday = (await call('GET', '/dashboard/today')).json?.data ?? {};
check("dashboard 'today' is the user's today", dToday.date?.slice(0, 10) === today && dToday.dailyLog?.workHours === 6, `date=${dToday.date} workHours=${dToday.dailyLog?.workHours}`);
const weekly = (await call('GET', '/dashboard/weekly')).json?.data ?? {};
check('weekly overview counts 7 days including today', weekly.dailyLogs?.daysLogged === 7, `daysLogged=${weekly.dailyLogs?.daysLogged}`);
const monthly = (await call('GET', '/dashboard/monthly')).json?.data ?? {};
const inMonth = days.filter((d) => d.slice(0, 7) === today.slice(0, 7)).length;
check("monthly stats count this month's logs", monthly.consistency?.daysLogged === inMonth, `daysLogged=${monthly.consistency?.daysLogged} expected ${inMonth}`);
const charts = (await call('GET', '/dashboard/charts?days=14')).json?.data ?? {};
const lastBar = charts.timeInvestment?.at(-1) ?? {};
check("chart ends on today with today's workout and skill", lastBar.date === today && lastBar.workout === 0.5 && lastBar.learning === 1, JSON.stringify(lastBar));
check('chart counts 7 tracked days', charts.summary?.daysTracked === 7, `daysTracked=${charts.summary?.daysTracked}`);
const custom = (await call('GET', `/dashboard/charts?startDate=${days[6]}&endDate=${days[1]}`)).json?.data ?? {};
const cDates = (custom.timeInvestment ?? []).map((d) => d.date);
check('custom chart range returns exactly the chosen days', cDates.length === 6 && cDates[0] === days[6] && cDates.at(-1) === days[1], cDates.join(','));
const [year, month] = today.split('-').map(Number);
const report = await call('GET', `/reports/monthly?year=${year}&month=${month}`);
check('monthly report', report.status === 200 && report.json?.data?.period?.startDate?.startsWith(monthStart), short(report));
const food = await call('GET', '/financial?category=food');
const transport = await call('GET', '/financial?category=transport');
check('list filters work', food.json?.data?.length === 7 && transport.json?.data?.length === 0, `food=${food.json?.data?.length} transport=${transport.json?.data?.length}`);
const exp = await call('GET', '/export/json');
check('export all data', exp.status === 200, short(exp));

// --- account isolation -------------------------------------------------------
const ownB = await call('GET', '/daily-logs', undefined, tokB);
check('account B starts empty', ownB.json?.data?.length === 0, `got ${ownB.json?.data?.length}`);
const leak = await call('GET', `/daily-logs?userId=${me.id}`, undefined, tokB);
check("B cannot read A's logs with ?userId=", (leak.json?.data?.length ?? 0) === 0, `got ${leak.json?.data?.length}`);
const leak2 = await call('GET', '/daily-logs?userId[not]=nobody', undefined, tokB);
check('B cannot widen the scope with ?userId[not]=', (leak2.json?.data?.length ?? 0) === 0, `got ${leak2.json?.data?.length}`);

// Protected fields: a body cannot assign a record to another account
const planted = await call('POST', '/goals', { title: 'Planted goal', category: 'fitness', userId: meB.id }, token);
check('a userId in the body is ignored on create', planted.status === 201 && planted.json?.data?.userId === me.id, short(planted));
const moved = await call('PUT', `/goals/${planted.json?.data?.id}`, { title: 'Moved goal', userId: meB.id }, token);
check('a userId in the body is ignored on update', moved.status === 200 && moved.json?.data?.userId === me.id, short(moved));

// --- summary -----------------------------------------------------------------
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
console.log('\nDelete the test accounts and all their data with:');
console.log(`  DELETE FROM users WHERE email IN ('${EMAIL_A}', '${EMAIL_B}');`);
process.exit(failed ? 1 : 0);
