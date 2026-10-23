import { STATES } from "@/data/reference";
import { AMBIGUOUS_DISTRICTS, CITIES_SPANNING_DISTRICTS, DISTRICTS, DISTRICT_ALIASES, DISTRICT_TOWNS } from "@/data/districts";

/**
 * Bump when the matching below changes. Edits to data/districts.ts are picked up on their own
 * (the boot step hashes that data too), so this is only for changes to the code.
 */
export const DISTRICT_NORMALISER_VERSION = 1;

/** How a raw value was matched; used by the audit report. */
export type DistrictMatch =
  | "exact" // already the official spelling
  | "normalised" // same name once case, spacing, punctuation and "District" are ignored
  | "alias" // a known misspelling or former name
  | "town" // a town inside one district
  | "part" // one part of a compound value ("Nitte, Udupi", "Prayagraj (Allahabad)")
  | "ambiguous" // a split district or a place across several districts
  | "city-spans-districts" // a metro city given as the city, whose colleges sit in several districts
  | "other-state" // a district of another state
  | "unknown"
  | "empty";

export type DistrictResult = { district: string | null; match: DistrictMatch };

/** Lower case, no accents or punctuation, single spaces, no leading or trailing "District"/"Dist". */
function words(s: string): string {
  let k = s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  k = k.replace(/^(district|dist|dt)\s+/, "").replace(/\s+(district|dist|dt)$/, "");
  return k;
}
/** The matching key: words with the spaces dropped, so "Yamuna Nagar" meets "Yamunanagar". */
const key = (s: string) => words(s).replace(/ /g, "");

type StateIndex = { official: Map<string, string>; alias: Map<string, string>; town: Map<string, string>; ambiguous: Set<string>; spans: Set<string> };

const codeToName = new Map(STATES.map((s) => [s.code, s.name]));
const index = new Map<string, StateIndex>();
for (const [state, list] of Object.entries(DISTRICTS)) {
  const official = new Map(list.map((d) => [key(d), d]));
  const byValue = (m: Record<string, string> | undefined, label: string) => {
    const out = new Map<string, string>();
    for (const [k, v] of Object.entries(m ?? {})) {
      if (!list.includes(v)) throw new Error(`data/districts.ts: ${label} "${k}" in ${state} points to "${v}", which is not one of its districts`);
      out.set(key(k), v);
    }
    return out;
  };
  index.set(state, {
    official,
    alias: byValue(DISTRICT_ALIASES[state], "alias"),
    town: byValue(DISTRICT_TOWNS[state], "town"),
    ambiguous: new Set((AMBIGUOUS_DISTRICTS[state] ?? []).map(key)),
    spans: new Set((CITIES_SPANNING_DISTRICTS[state] ?? []).map(key)),
  });
}
const allOfficial = new Map<string, string>();
for (const [state, list] of Object.entries(DISTRICTS)) for (const d of list) allOfficial.set(key(d), state);

function stateName(state: string | null | undefined): string | null {
  if (!state) return null;
  if (index.has(state)) return state;
  return codeToName.get(state.toUpperCase()) ?? null;
}

/** One value, without splitting it into parts. */
function matchOne(ix: StateIndex, raw: string, asCity: boolean): DistrictResult {
  const k = key(raw);
  if (!k) return { district: null, match: "empty" };
  if (ix.ambiguous.has(k)) return { district: null, match: "ambiguous" };
  if (asCity && ix.spans.has(k)) return { district: null, match: "city-spans-districts" };
  const official = ix.official.get(k);
  if (official) return { district: official, match: raw.trim() === official ? "exact" : "normalised" };
  const alias = ix.alias.get(k);
  if (alias) return { district: alias, match: "alias" };
  const town = ix.town.get(k);
  if (town) return { district: town, match: "town" };
  return { district: null, match: allOfficial.has(k) ? "other-state" : "unknown" };
}

/**
 * The official district for a raw district (or, with asCity, city) value in a state, with how it
 * was matched. Compound values are split at commas, " - " and brackets; their parts must all point
 * to the same district. Anything that cannot be placed in exactly one district gives null.
 */
export function matchDistrict(state: string | null | undefined, raw: string | null | undefined, opts: { asCity?: boolean } = {}): DistrictResult {
  if (!raw || !raw.trim()) return { district: null, match: "empty" };
  const name = stateName(state);
  if (!name) return { district: null, match: "unknown" };
  const ix = index.get(name)!;
  const asCity = !!opts.asCity;
  const whole = matchOne(ix, raw, asCity);
  if (whole.district || whole.match === "ambiguous" || whole.match === "city-spans-districts") return whole;

  const parts = new Set<string>();
  const outside = raw.replace(/\([^)]*\)?/g, " ");
  for (const m of raw.matchAll(/\(([^)]*)\)?/g)) parts.add(m[1]);
  for (const p of outside.split(/[,;/]|\s-\s?|-\s/)) parts.add(p);
  parts.add(outside);
  const found = new Set<string>();
  let spans = false;
  for (const p of parts) {
    if (!key(p) || key(p) === key(raw)) continue;
    const r = matchOne(ix, p, asCity);
    if (r.district) found.add(r.district);
    if (r.match === "city-spans-districts") spans = true;
  }
  if (found.size === 1) return { district: [...found][0], match: "part" };
  if (found.size > 1) return { district: null, match: "ambiguous" };
  if (spans) return { district: null, match: "city-spans-districts" };
  return whole;
}

/** The official district name for a raw value, or null when it cannot be placed in one district. */
export function normaliseDistrict(state: string | null | undefined, raw: string | null | undefined, opts: { asCity?: boolean } = {}): string | null {
  return matchDistrict(state, raw, opts).district;
}

/** Whether a value is already one of the state's official district names. */
export function isOfficialDistrict(state: string | null | undefined, value: string | null | undefined): boolean {
  const name = stateName(state);
  return !!(name && value && DISTRICTS[name]?.includes(value));
}
