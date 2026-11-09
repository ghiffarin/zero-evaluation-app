import prisma from './prisma.js';

const DEFAULT_TIMEZONE = 'Asia/Jakarta';

// Calendar dates live in Postgres DATE columns, which Prisma reads and writes
// as UTC midnight. "Today" must therefore be the user's calendar date turned
// into UTC midnight, not the server clock's local midnight: on a Jakarta
// machine local midnight is 17:00 UTC the day before, which the DATE column
// truncates to yesterday.

export const todayInTimezone = (timeZone: string, now: Date = new Date()): Date => {
  let ymd: string;
  try {
    ymd = new Intl.DateTimeFormat('en-CA', { timeZone }).format(now);
  } catch {
    // Unknown timezone string stored on the user: fall back to the app default.
    ymd = new Intl.DateTimeFormat('en-CA', { timeZone: DEFAULT_TIMEZONE }).format(now);
  }
  return new Date(`${ymd}T00:00:00.000Z`);
};

export const addDaysUTC = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

export const getUserToday = async (userId: string): Promise<Date> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return todayInTimezone(user?.timezone || DEFAULT_TIMEZONE);
};
