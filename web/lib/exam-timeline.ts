/** Date helpers for exam schedules and scholarship deadlines. Dates are plain YYYY-MM-DD strings. */

export type Phase = "past" | "current" | "upcoming";

/** Today's date in India, so "past" and "upcoming" match what an Indian reader sees. */
export function todayInIndia(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Where a date or date range sits relative to today. */
export function phaseOf(startsOn: string, endsOn: string | null, today: string): Phase {
  const end = endsOn ?? startsOn;
  if (end < today) return "past";
  if (startsOn > today) return "upcoming";
  return "current";
}

const parts = (d: string) => {
  const date = new Date(`${d}T00:00:00Z`);
  return {
    day: date.getUTCDate(),
    month: date.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" }),
    year: date.getUTCFullYear(),
  };
};

export function formatDate(d: string): string {
  const p = parts(d);
  return `${p.day} ${p.month} ${p.year}`;
}

/** "17 to 22 Apr 2026", "28 Aug to 7 Oct 2025", "20 Dec 2025 to 12 Jan 2026". */
export function formatRange(startsOn: string, endsOn: string | null): string {
  if (!endsOn || endsOn === startsOn) return formatDate(startsOn);
  const a = parts(startsOn);
  const b = parts(endsOn);
  if (a.year !== b.year) return `${formatDate(startsOn)} to ${formatDate(endsOn)}`;
  if (a.month !== b.month) return `${a.day} ${a.month} to ${b.day} ${b.month} ${b.year}`;
  return `${a.day} to ${b.day} ${b.month} ${b.year}`;
}

/** Whole days from today to a date (negative when the date has passed). */
export function daysUntil(d: string, today: string): number {
  return Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

export const PHASE_LABEL: Record<Phase, string> = { past: "Past", current: "Open now", upcoming: "Upcoming" };
