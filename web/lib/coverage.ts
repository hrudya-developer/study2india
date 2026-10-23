/**
 * The site's coverage rule for a figure that only some colleges (or courses) have: a total or count
 * is shown only when at least half of them have the value recorded. Below that the figure would
 * mostly reflect what is missing, so pages show "Not recorded" and how many have it.
 */
export function mostlyRecorded(recorded: number, total: number) {
  return total > 0 && recorded * 2 >= total;
}

const fmt = (n: number) => n.toLocaleString("en-IN");

/** How much of a college's course-wise seat list is recorded, and whether its sum may be shown. */
export type SeatCoverage = {
  /** Courses listed for the college. */
  courses: number;
  /** Courses with a seat figure. */
  recorded: number;
  /** Sum of the recorded figures, or null when fewer than half of the courses have one. */
  total: number | null;
  /** Every listed course has a figure, so the total is the college's full intake. */
  complete: boolean;
};

export function seatCoverage(seats: (number | null)[]): SeatCoverage {
  const known = seats.filter((n): n is number => n !== null);
  const recorded = known.length;
  return {
    courses: seats.length,
    recorded,
    total: recorded > 0 && mostlyRecorded(recorded, seats.length) ? known.reduce((a, b) => a + b, 0) : null,
    complete: seats.length > 0 && recorded === seats.length,
  };
}

/**
 * The qualifier for a seat total that is not the full intake: "in 7 of 11 courses (4 not recorded)"
 * when the total is shown, "recorded for 3 of 11 courses" when it is withheld. Null when every
 * course or no course has a figure.
 */
export function seatCoverageNote(c: SeatCoverage): string | null {
  if (c.complete || c.recorded === 0) return null;
  const of = `${fmt(c.recorded)} of ${fmt(c.courses)} ${c.courses === 1 ? "course" : "courses"}`;
  return c.total !== null ? `in ${of} (${fmt(c.courses - c.recorded)} not recorded)` : `recorded for ${of}`;
}
