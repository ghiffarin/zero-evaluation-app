# Zero Evaluation: UX Audit and Redesign

**Date:** 2026-11-11 · **Branch:** `ccr-c5b993d1-g22dsv` · **Design system:** athletic editorial (sport-skill)

## 1. Summary

The app had grown to 15 modules, 27 pages, about 384 input fields and 37 database tables, which is far more surface than one person needs to evaluate a day. The audit found that the main daily task, checking in, was split across three pages with duplicated questions, and that several numbers shown to the user were wrong or misleading. The redesign therefore does two things at once: it cuts and merges the app down to seven areas with one daily check-in, and it rebuilds the interface on the athletic editorial design system, where each area owns one flat color and every big number is set in mono type. The backend and the database are unchanged apart from the fixes listed in Section 7, so no data migration is needed.

## 2. Audit findings

The findings below come from reading every page, comparing the database models, and testing the running app on desktop and phone.

1. **Checking in took three pages and 43 fields.** Daily Log (11 fields), Wellness (21) and Reflection (11) each had their own page. Mood and sleep were asked twice, and energy appeared under two different names (`energyScore` and `energyLevel`). The Daily Log page even told the user to go to the Wellness page to finish the day.
2. **Typed totals double-counted work.** The daily log asked for work, learning and workout hours and money spent, although the app already computes these from sessions. The dashboard added career hours to the typed work hours, so the same hours could be counted twice.
3. **Learning was five near-identical pages.** Books, Journals, Skills, IELTS and Quizzes each logged "what you studied and for how long" with a different form.
4. **Situational modules dominated the code.** Master's prep alone was about 4,800 lines over four pages, the Financial page was 3,311 lines with 69 state variables, and the Safety Kit was a tab with four nested tabs inside the Financial page.
5. **Some numbers were wrong.** "Net Worth" was income plus investments minus spending for the period, which is neither net worth nor cash flow. Spending that was never tagged showed as "Unnecessary Rp 0 (100%)", because the unnecessary share was computed as 100% minus the necessary share.
6. **Some controls did nothing.** The header search box had no handler, and the login page linked to a "Forgot password?" page that does not exist.
7. **A CSS cascade bug hid colored borders.** The global `* { border-color }` rule was unlayered, so it overrode every Tailwind border-color utility (Tailwind 4 puts utilities in a layer). Colored borders across the app never rendered.
8. **The visual language was generic.** Rounded cards, shadows, centered stat tiles with colored icons, and about 450 hard-coded accent colors gave every page equal weight, so nothing guided the eye.

## 3. Decisions (owner, 2026-11-11)

| Question | Decision |
|---|---|
| Daily check-in | One "Today" page with ten fields |
| Situational modules | Keep Master's prep with IELTS, and IQ quizzes. Remove job hunting (career) and the Safety Kit |
| Learning | One Learn page for every study type |
| Areas | Four colored areas plus white Today and Overview, and black Reports |

## 4. New information architecture

| Area | Field color | Pages | Replaces |
|---|---|---|---|
| Today | White | Today check-in | Daily Log, Wellness, Reflections |
| Overview | White | Dashboard | |
| Learn | Cobalt `#425FC2` | Sessions, IELTS, Quizzes | Books, Journals, Skills |
| Body | Acid lime `#E9FA82` | Workouts | |
| Money | Oxblood `#5B1E19` | Analytics, Log, Budget | Safety Kit tab removed |
| Growth | Lilac `#C7ADC3` | Goals, Projects, Master's prep | Career removed |
| Reports | Black | Monthly report | |
| Settings | White | Settings, Transfer data | |

The area map lives in `frontend/src/lib/areas.ts`, which drives the header navigation, the column-one sub-navigation, the phone menu and the field color, so a new page needs one line there. The old URLs (`/daily-log`, `/wellness`, `/reflections`, `/books`, `/journals`, `/skills`, `/career`) redirect to their new homes, and login now lands on Today.

**Today** asks for day score (1–10), mood, energy and stress (1–5), sleep hours, work hours, main focus, what went well, fix for tomorrow and a note. It writes them into the existing daily log, wellness and reflection tables, so every existing chart and report keeps working. Learning, training and spending are shown, never typed: they come from the day's sessions.

**Learn** has one session form with a type switch (book, paper, skill, IELTS). Each type asks only for its own one or two fields, plus date, minutes and a note. The page also shows weekly hours by type, a merged list of recent sessions, and the reading list with progress per book.

## 5. Design system: how the sport-skill maps to an app

| Rule from the skill | Implementation |
|---|---|
| One hang line, nothing centered | Every page uses `PageContainer`: the title block and actions sit in column 1, content in columns 2–4, all top-aligned. Phones stack to one column |
| Column edge is sacred | 4-column grid with gutter and margin of 40 units on the 1920 canvas (`--gutter: clamp(16px, 2.08vw, 40px)`) |
| Column 1 = navigation | Title, title rule, deck, actions and the area's sub-pages live in column 1 |
| Running header | Paper-colored band, 1 px black rule, mono uppercase slots: brand, area navigation, date and account |
| Contrast by scale | `Stat` component: big Geist Mono numerals, small superscript unit, hairline, caption |
| Color = location | `[data-area]` scopes redefine the theme tokens, so all existing components inherit white type on cobalt and oxblood, and black type on lime and lilac |
| Numbers stay ink, no decoration | The Tailwind accent palettes (including red) are remapped to strengths of the current text color. Real errors use the separate `destructive` token |
| No shadows, no rounded cards | Radius and shadow tokens are zero. Only pills and rings stay round. Cards became sections with one top rule |
| Monochrome charts | Five chart tones derived from the text color, horizontal hairline grid only, legends and ticks in text color |
| Accordion table of contents | The phone menu: collapsed areas as ruled rows, the current area expanded in large bold type with its pages |

Fonts are Geist and Geist Mono, which the app already loaded. Dark mode swaps paper and ink and keeps the area colors.

## 6. What was removed

The pages for Daily Log, Wellness, Reflections, Books, Journals, Skills and Career are deleted, and the Safety Kit code (about 1,300 lines) is removed from the Money page. Their backend endpoints and database tables are kept, so no data is lost, and the old frontend code can be recovered from git history. The non-functional header search and the dead "Forgot password?" link are gone.

## 7. Fixes made along the way

- "Net Worth" is replaced by "Net cash flow" (income minus spending for the period).
- Necessary and unnecessary shares are computed against total spending, and untagged spending is shown as its own line.
- Base styles moved into CSS layers, so Tailwind border colors render again.
- Today reads the day's entries through list endpoints, so an empty day no longer produces 404 errors in the console.

## 8. Verification

- **Builds:** frontend production build and type check pass with zero errors. ESLint reports no issues in the new code.
- **API:** `scripts/smoke-test.mjs` passes 32 of 32 checks against the redesigned app.
- **Browser:** a Playwright suite passes 38 of 38 checks. It opens 15 routes on desktop and on an iPhone 13 viewport with no console errors, failed requests or horizontal overflow, checks that each route sits on the right area color, checks four old-URL redirects, saves a Today check-in and reloads it, and logs a Learn session.
- **Phone menu:** the menu expands the current area and closes after navigation.
- **Dark mode:** Today and Learn were checked visually.

## 9. Known gaps and next steps

1. **Large pages are restyled, not redesigned.** Workouts, Master's prep, Goals, IELTS and Quizzes picked up the new system through the shared components, but their inner layouts (icon stat tiles, boxed category tiles, tab bars) were not rebuilt. They are the next candidates, in that order of daily use.
2. **Hard-coded color classes remain in the code.** About 450 hard-coded color classes are neutralized by the palette remap rather than removed. They should be cleaned up page by page as each page is redesigned.
3. **IELTS sessions can be logged in two places,** in Learn and on the IELTS page. One entry point should win once IELTS vocabulary and mistakes find a home in Learn.
4. **Backend endpoints for removed modules still exist** (career, safety kit). They can be deleted once the owner confirms the data is not needed.
5. **Reports still mention career.** The report labels its work section "Work & Career" and shows career activity, which no longer has an entry point.
