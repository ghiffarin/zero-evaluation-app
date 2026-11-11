// The app's information architecture. Each area owns one flat field color
// ("color = location") and lists the pages that belong to it.

export type AreaKey = 'today' | 'overview' | 'learn' | 'body' | 'money' | 'growth' | 'reports' | 'system';

// Field values map to [data-area] scopes in globals.css; white areas use none
export type AreaField = 'learn' | 'body' | 'money' | 'growth' | 'reports' | null;

export interface AreaPage {
  label: string;
  href: string;
}

export interface Area {
  key: AreaKey;
  label: string;
  href: string;
  field: AreaField;
  /** Route prefixes that belong to this area */
  match: string[];
  /** Sub-pages shown in column 1; empty when the area is a single page */
  pages: AreaPage[];
}

export const AREAS: Area[] = [
  { key: 'today', label: 'Today', href: '/today', field: null, match: ['/today'], pages: [] },
  { key: 'overview', label: 'Overview', href: '/dashboard', field: null, match: ['/dashboard'], pages: [] },
  {
    key: 'learn',
    label: 'Learn',
    href: '/learn',
    field: 'learn',
    match: ['/learn', '/quizzes', '/ielts'],
    pages: [
      { label: 'Sessions', href: '/learn' },
      { label: 'IELTS', href: '/ielts' },
      { label: 'Quizzes', href: '/quizzes' },
    ],
  },
  { key: 'body', label: 'Body', href: '/workouts', field: 'body', match: ['/workouts'], pages: [] },
  { key: 'money', label: 'Money', href: '/financial', field: 'money', match: ['/financial'], pages: [] },
  {
    key: 'growth',
    label: 'Growth',
    href: '/goals',
    field: 'growth',
    match: ['/goals', '/projects', '/masters-prep'],
    pages: [
      { label: 'Goals', href: '/goals' },
      { label: 'Projects', href: '/projects' },
      { label: "Master's prep", href: '/masters-prep' },
    ],
  },
  { key: 'reports', label: 'Reports', href: '/reports', field: 'reports', match: ['/reports'], pages: [] },
];

// Account pages live outside the main navigation, on a white field
export const SYSTEM_AREA: Area = {
  key: 'system',
  label: 'Settings',
  href: '/settings',
  field: null,
  match: ['/settings', '/export'],
  pages: [
    { label: 'Settings', href: '/settings' },
    { label: 'Transfer data', href: '/export' },
  ],
};

const matches = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function areaFor(pathname: string): Area {
  return (
    [...AREAS, SYSTEM_AREA].find((area) => area.match.some((prefix) => matches(pathname, prefix))) ??
    AREAS[0]
  );
}

export function isActivePage(pathname: string, href: string): boolean {
  return matches(pathname, href);
}
