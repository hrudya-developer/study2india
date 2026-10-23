import type { CollegeDetail } from "@/lib/queries/college";

type Cutoff = CollegeDetail["cutoffs"][number];
type Params = Record<string, string | string[] | undefined>;

/** Up to this many rows the table shows everything; above it (JoSAA institutes have up to ~1,900) it is filtered. */
export const CUTOFF_FILTER_MIN_ROWS = 60;

/** Quotas shown by default when present: JoSAA's All India, Other State and Home State. */
const DEFAULT_QUOTAS = ["AI", "OS", "HS"];
/** The unreserved category as each counselling body prints it. */
const DEFAULT_CATEGORIES = ["OPEN", "Open"];
const DEFAULT_SEAT_POOL = "Gender-Neutral";

/** JoSAA's quota codes, for labels. */
export const QUOTA_NAMES: Record<string, string> = {
  AI: "All India",
  HS: "Home State",
  OS: "Other State",
  GO: "Goa",
  JK: "Jammu and Kashmir",
  LA: "Ladakh",
};

/** Round order as the lists run: Round 1, 2 ... 10, then stray and special rounds. */
export function roundOrder(a: string, b: string) {
  const rank = (r: string) => [/^stray|special|spot/i.test(r) ? 1 : 0, r.length, r] as const;
  const [x, y] = [rank(a), rank(b)];
  return x[0] - y[0] || x[1] - y[1] || x[2].localeCompare(y[2]);
}

const distinct = (list: (string | null)[]) => [...new Set(list.filter((v): v is string => !!v))];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

export type CutoffView = {
  /** False when the table is small enough to show whole; the other fields then show no filtering. */
  filterable: boolean;
  rows: Cutoff[];
  total: number;
  options: { years: number[]; rounds: string[]; quotas: string[]; categories: string[]; pools: string[]; branches: string[] };
  /** The applied filters; "" (or an empty quota list) means every value. */
  selected: { year: number | null; round: string; quotas: string[]; category: string; pool: string; branch: string };
  /** True when the URL set no filters and the defaults apply. */
  defaults: boolean;
};

/**
 * The rows the college page's cutoff table shows. Large tables default to the latest year's last
 * round, Gender-Neutral seats, the AI, OS and HS quotas and the OPEN category (each only when the
 * data has it), and URL parameters (from a plain GET form, so no script is needed) change them.
 * Once the form is sent (cf=1), an empty value means every value.
 */
export function cutoffView(cutoffs: Cutoff[], params: Params): CutoffView {
  const options = {
    years: [...new Set(cutoffs.map((x) => x.year))].sort((a, b) => b - a),
    rounds: distinct(cutoffs.map((x) => x.round)).sort(roundOrder),
    quotas: distinct(cutoffs.map((x) => x.quota)).sort(),
    categories: distinct(cutoffs.map((x) => x.category)),
    pools: distinct(cutoffs.map((x) => x.seatPool)).sort((a, b) => Number(b === DEFAULT_SEAT_POOL) - Number(a === DEFAULT_SEAT_POOL) || a.localeCompare(b)),
    branches: distinct(cutoffs.map((x) => x.branch)).sort(),
  };
  const all = { year: null, round: "", quotas: [], category: "", pool: "", branch: "" };
  if (cutoffs.length <= CUTOFF_FILTER_MIN_ROWS) {
    return { filterable: false, rows: cutoffs, total: cutoffs.length, options, selected: all, defaults: false };
  }

  const sent = one(params.cf) === "1";
  const pick = (value: string, list: string[]) => (list.includes(value) ? value : "");
  let selected: CutoffView["selected"];
  if (sent) {
    const year = Number(one(params.year));
    selected = {
      year: options.years.includes(year) ? year : null,
      round: pick(one(params.round), options.rounds),
      quotas: many(params.quota).filter((q) => options.quotas.includes(q)),
      category: pick(one(params.category), options.categories),
      pool: pick(one(params.pool), options.pools),
      branch: pick(one(params.branch), options.branches),
    };
  } else {
    const year = options.years[0] ?? null;
    const latest = cutoffs.filter((x) => x.year === year);
    selected = {
      year,
      round: distinct(latest.map((x) => x.round)).sort(roundOrder).at(-1) ?? "",
      quotas: DEFAULT_QUOTAS.filter((q) => options.quotas.includes(q)),
      category: DEFAULT_CATEGORIES.find((c) => options.categories.includes(c)) ?? "",
      pool: options.pools.includes(DEFAULT_SEAT_POOL) ? DEFAULT_SEAT_POOL : "",
      branch: "",
    };
  }

  const rows = cutoffs.filter(
    (x) =>
      (selected.year === null || x.year === selected.year) &&
      (!selected.round || x.round === selected.round) &&
      (!selected.quotas.length || (x.quota !== null && selected.quotas.includes(x.quota))) &&
      (!selected.category || x.category === selected.category) &&
      (!selected.pool || x.seatPool === selected.pool) &&
      (!selected.branch || x.branch === selected.branch),
  );
  return { filterable: true, rows, total: cutoffs.length, options, selected, defaults: !sent };
}
