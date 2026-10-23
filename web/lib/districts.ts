import { STATES, STATE_ALIASES } from "@/data/reference";
import { slugify } from "@/lib/slug";
import { AMBIGUOUS_DISTRICTS, CITIES_SPANNING_DISTRICTS, DISTRICTS, DISTRICT_ALIASES, DISTRICT_TOWNS } from "@/data/districts";

/**
 * Bump when the matching below changes. Edits to data/districts.ts are picked up on their own
 * (the boot step hashes that data too), so this is only for changes to the code.
 */
export const DISTRICT_NORMALISER_VERSION = 2;

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

/*
 * District slugs for the "<course> colleges in <district>" landing pages. A slug is the official
 * name through slugify. Names are taken in code point order, so if two names in a state ever
 * slugified alike the later one would get "-2" (none do today). The mapping depends only on
 * data/districts.ts, so it is the same on every build and start.
 */
const slugIndex = new Map<string, { bySlug: Map<string, string>; byName: Map<string, string> }>();
for (const [state, list] of Object.entries(DISTRICTS)) {
  const bySlug = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const d of [...list].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    const base = slugify(d) || "district";
    let slug = base;
    for (let n = 2; bySlug.has(slug); n++) slug = `${base}-${n}`;
    bySlug.set(slug, d);
    byName.set(d, slug);
  }
  slugIndex.set(state, { bySlug, byName });
}

/** The URL slug of an official district name in a state (state name or code); null when it is not one. */
export function districtSlug(state: string | null | undefined, district: string | null | undefined): string | null {
  const name = stateName(state);
  return (name && district && slugIndex.get(name)?.byName.get(district)) || null;
}

/** The official district name for a slug in a state (state name or code); null for an unknown slug. */
export function districtFromSlug(state: string | null | undefined, slug: string | null | undefined): string | null {
  const name = stateName(state);
  return (name && slug && slugIndex.get(name)?.bySlug.get(slug)) || null;
}


/*
 * Towns and districts read from free text: an official list's college name ("Government Medical
 * College, Ernakulam"; NMC's lists have no address column) or its address line (NCH). Every
 * candidate goes through matchDistrict above, so only the hand-checked names, aliases and towns in
 * data/districts.ts are ever placed. A metro city that spans several districts, a split district
 * or an unknown word places nothing.
 */

/** How a place was read from the text, for the audit. */
export type TextPlaceMethod =
  | "district-mark" // a value marked "Dist." / "Distt." / "District" in the text
  | "segment" // a comma-separated part after the college's own name, or the town at the end of an address
  | "trailing" // the words after the last "College", "Hospital", "Institute" and so on in the name
  | "leading"; // the town the name starts with ("Coimbatore Medical College", "Government Erode Medical College")

export type TextPlace = {
  district: string | null;
  /** The town as written, when it is a known place; null when no town was found. */
  city: string | null;
  method: TextPlaceMethod | null;
  /** The text that decided the result, or the first place-like text when nothing could be placed. */
  raw: string | null;
  match: DistrictMatch | "conflict" | null;
  /** The districts, when the text names places in more than one. */
  conflicting?: string[];
};

const NO_PLACE: TextPlace = { district: null, city: null, method: null, raw: null, match: null };

/** Words that end a college's own name: what follows the last of them is a place. */
const INSTITUTION_WORD = /\b(?:college|collage|colleges|hospitals?|hopsital|institute|instt|institution|sciences?|centre|center|research|reseach|academy|university|foundation|school|medicine|faculty|mission|campus|pgimsr|pgimer)\b\.?/gi;
/** Words a college's own name starts with, after any leading town. */
const NAME_START = /\b(?:medical|institute|instt|college|government|govt|homoeopathic|homoeopathy|homeopathic|hospital|dental)\b/i;
const MARK = "(?:distt|dist|district|dt)";
const ROAD = /\b(?:road|rd|marg|highway|bypass|street|lane)\.?$/i;
/** Address words that come before a place: "P.O. Khanapara", "At Post Hatta", "Tq. Lonar", "Vill. Bagharbari". */
const PLACE_PREFIX = /^(?:(?:p\.?\s?o|post|at|at\.?\s?post|at\.?\s?po|via|vill(?:age)?|tq|tal(?:uka)?|teh(?:sil)?|tah|ta|near|opp)\b\.?\s*[-:.]?\s*)+/i;
/** State abbreviations the lists append ("Sambhal (UP)", "Distt. Durg CG", "Nahan, Sirmour H.P."). */
const STATE_ABBREVIATIONS: Record<string, string[]> = {
  "Tamil Nadu": ["T.N", "Tamilnadu"],
  "Uttar Pradesh": ["U.P"],
  "Madhya Pradesh": ["M.P"],
  "Andhra Pradesh": ["A.P"],
  "Himachal Pradesh": ["H.P"],
  Chhattisgarh: ["C.G"],
  "West Bengal": ["W.B"],
  Odisha: ["Odhisha"],
  Uttarakhand: ["Uttrakhand"],
  Maharashtra: ["M.S"],
};

/** Whether a value is, as a whole, one of the state's known places (district, alias, town, ambiguous or metro). */
function isKnownPlace(state: string, raw: string): boolean {
  const ix = index.get(state);
  const k = key(raw);
  return !!ix && !!k && (ix.official.has(k) || ix.alias.has(k) || ix.town.has(k) || ix.ambiguous.has(k) || ix.spans.has(k));
}

const stateSuffixCache = new Map<string, RegExp>();
/** The row's own state name and its spellings, as a trailing phrase to strip ("…, Chennai, Tamil Nadu"). */
function stateSuffix(state: string): RegExp {
  let re = stateSuffixCache.get(state);
  if (!re) {
    const code = STATES.find((s) => s.name === state)?.code;
    const names = [state, ...Object.entries(STATE_ALIASES).filter(([, c]) => c === code).map(([a]) => a), ...(STATE_ABBREVIATIONS[state] ?? [])];
    const alt = [...names, "India"]
      .map((n) => n.replace(/[.&]/g, (c) => (c === "." ? "\\.?\\s*" : "(?:&|and)")).replace(/\s+/g, "\\s*"))
      .join("|");
    re = new RegExp(`(?:^|[\\s,.(-])\\(?(?:${alt})\\.?\\)?\\s*$`, "i");
    stateSuffixCache.set(state, re);
  }
  return re;
}

/**
 * A part of the text with digits (PIN codes, plot numbers), address prefixes, the state name, a
 * "Dist." mark and stray punctuation removed. A part that is itself a known place ("Puducherry",
 * "New Delhi", "West Tripura") keeps its words.
 */
function cleanPart(state: string, s: string): { text: string; marked: boolean } {
  let t = s
    .replace(/[–—]/g, "-")
    .replace(/-(?=\s*\d)|(?<=\d)\s*-/g, " ")
    .replace(/\S*\d\S*/g, " ")
    .replace(/\s+/g, " ");
  const strip = () => (t = t.replace(/^[\s,.:;()&-]+|[\s,.:;()&-]+$/g, "").replace(/\(\s*$/, "").trim());
  strip();
  t = t.replace(PLACE_PREFIX, "");
  strip();
  for (let i = 0; i < 2 && !isKnownPlace(state, t); i++) {
    t = t.replace(stateSuffix(state), "");
    strip();
  }
  let marked = false;
  const lead = new RegExp(`^${MARK}\\b\\.?\\s*[-:.]?\\s*`, "i");
  const trail = new RegExp(`\\s*\\b${MARK}\\.?$`, "i");
  if (!isKnownPlace(state, t) && (lead.test(t) || trail.test(t))) {
    marked = true;
    t = t.replace(lead, "").replace(trail, "");
    strip();
  }
  return { text: t, marked };
}

type Hit = { district: string | null; match: DistrictMatch; raw: string; method: TextPlaceMethod; asCity: boolean };

const isPlace = (h: Hit) => !!h.district || h.match === "ambiguous" || h.match === "city-spans-districts";

/**
 * Tries a part as a whole, then its words joined by hyphens as separate parts ("Jashpur-Kunkuri"),
 * then (with words) its last three, two or one words ("Perintalmanna Malappuram").
 */
function tryPart(state: string, part: string, method: TextPlaceMethod, words: boolean): Hit | null {
  const { text, marked } = cleanPart(state, part);
  if (!text) return null;
  const one = (raw: string): Hit => ({ ...matchDistrict(state, raw, { asCity: !marked }), raw, method: marked ? "district-mark" : method, asCity: !marked });
  const whole = one(text);
  if (isPlace(whole)) return whole;
  // A road named after a town ("Thuraiyur Road", "Lucknow-Ayodhya Road") is not where the college is.
  if (ROAD.test(text)) return whole;
  if (/\w-\w/.test(text)) {
    // Every hyphenated word must be a place in the same district.
    const each = text.split("-").map((w) => matchDistrict(state, w, { asCity: !marked }).district);
    if (each.every((d) => d && d === each[0])) return { district: each[0], match: "part", raw: text, method: marked ? "district-mark" : method, asCity: false };
  }
  if (words) {
    const w = text.split(" ");
    for (let n = Math.min(3, w.length - 1); n >= 1; n--) {
      const h = one(w.slice(-n).join(" "));
      if (isPlace(h)) return h;
    }
  }
  return whole;
}

/** "Dist. Jalna", "Distt.- Kottayam", "Ranga Reddy District": the districts the text marks as such. */
function markedDistricts(state: string, text: string): Hit[] {
  const out: Hit[] = [];
  const name = "([A-Za-z][A-Za-z .&'-]{1,40}?)";
  const after = new RegExp(`\\b${MARK}\\b\\.?\\s*[-:.]?\\s*${name}(?=\\s*(?:[-–,;()]|\\d|$))`, "gi");
  const before = new RegExp(`(?:^|[,(]\\s*)${name}\\s+(?:distt|dist|district)\\b\\.?`, "gi");
  for (const re of [after, before]) {
    for (const m of text.matchAll(re)) {
      const raw = cleanPart(state, m[1]).text;
      if (!raw) continue;
      // "Kulasekharam Distt. Kanyakumari" reads "Kanyakumari"; "Shamshabad Mandal, Ranga Reddy District"
      // reads "Ranga Reddy"; "District Surendra Nagar Limbdi" reads "Surendra Nagar".
      const w = raw.split(" ");
      let r = matchDistrict(state, raw);
      for (let n = Math.min(3, w.length - 1); !r.district && n >= 1; n--) {
        const t = matchDistrict(state, w.slice(-n).join(" "));
        const u = matchDistrict(state, w.slice(0, n).join(" "));
        if (t.district) r = t;
        else if (u.district) r = u;
      }
      out.push({ ...r, raw, method: "district-mark", asCity: false });
    }
  }
  return out;
}

/** One district when every place found agrees, a conflict when they do not, null when none is placed. */
function decide(hits: Hit[]): TextPlace | null {
  const placed = hits.filter((h) => h.district);
  const found = [...new Set(placed.map((h) => h.district!))];
  if (found.length === 1) {
    const town = placed.find((h) => h.asCity);
    return { district: found[0], city: town ? town.raw : null, method: placed[0].method, raw: placed[0].raw, match: placed[0].match };
  }
  if (found.length > 1) return { district: null, city: null, method: placed[0].method, raw: placed.map((h) => h.raw).join(" / "), match: "conflict", conflicting: found };
  return null;
}

/** A place that is not one district (a metro city, a split district): kept as the town only. */
function notOneDistrict(h: Hit): TextPlace {
  return { district: null, city: h.asCity ? h.raw : null, method: h.method, raw: h.raw, match: h.match };
}

function firstTried(hits: Hit[]): TextPlace {
  const h = hits[0];
  return h ? { district: null, city: null, method: h.method, raw: h.raw, match: h.match } : NO_PLACE;
}

/** Splits at commas, semicolons and dashes between words; bracketed text comes back separately. */
function splitParts(text: string): { outside: string[]; brackets: string[] } {
  const brackets = [...text.matchAll(/\(([^)]*)\)?/g)].map((m) => m[1]);
  const outside = text
    .replace(/\([^)]*\)?/g, " ")
    .split(/[,;]|\s[-–]\s?|[-–]\s/)
    .map((s) => s.trim())
    .filter(Boolean);
  return { outside, brackets };
}

/** What follows the last institution word of a name ("Nandha Medical College & Hospital Erode" gives "Erode"). */
function trailingWords(name: string): string | null {
  let end = -1;
  for (const m of name.matchAll(INSTITUTION_WORD)) end = m.index + m[0].length;
  if (end < 0) return null;
  const rest = name.slice(end).replace(/^\s*(?:and|&)?\s*/i, "").trim();
  return rest && rest.split(/\s+/).length <= 5 ? rest : null;
}

/** The town a name starts with, before its "Medical College" or "Institute" (a leading "Government" aside). */
function leadingWords(name: string): string | null {
  const t = name.replace(/^\s*(?:the\s+)?(?:government|govt\.?)\s+/i, "");
  const m = NAME_START.exec(t);
  if (!m || m.index === 0) return null;
  const lead = t.slice(0, m.index).trim();
  return lead && lead.split(/\s+/).length <= 2 ? lead : null;
}

/** The parts of a name that may be places, in the order they are written. */
function nameParts(state: string, name: string): Hit[] {
  const { outside, brackets } = splitParts(name);
  const hits: Hit[] = [];
  // After a place, the union territory's own name is the territory, not its district of that name
  // ("Vinayaka Missions Medical College, Karaikal, Pondicherry").
  const code = STATES.find((s) => s.name === state)?.code;
  const territory = new Set([state, ...Object.entries(STATE_ALIASES).filter(([, c]) => c === code).map(([a]) => a)].map(key));
  const push = (h: Hit | null) => {
    if (!h || (territory.has(key(h.raw)) && hits.some(isPlace))) return;
    hits.push(h);
  };
  const tail = outside[0] ? trailingWords(outside[0]) : null;
  if (tail) push(tryPart(state, tail, "trailing", true));
  for (const p of outside.slice(1)) push(tryPart(state, p, "segment", true));
  for (const b of brackets) {
    const bp = splitParts(b).outside;
    if (!bp.length) continue;
    const bt = trailingWords(bp[0]);
    if (bt) push(tryPart(state, bt, "trailing", true));
    // A bracket that is only a place ("(Allappuzha)", "(Bijapur"), not a former name.
    if (bp.length === 1 && !NAME_START.test(bp[0]) && !new RegExp(INSTITUTION_WORD.source, "i").test(bp[0])) push(tryPart(state, bp[0], "segment", false));
    for (const p of bp.slice(1)) push(tryPart(state, p, "segment", true));
  }
  return hits;
}

/**
 * The district (and town) a college's official name gives, for lists with no address column (NMC).
 * The place-like parts of the name are read in the order written: the words after the college's
 * own name, the parts after its commas, then bracketed former names; a "Dist." mark anywhere
 * counts too. The first place named decides: when it is a metro city or a split district
 * ("Akbarpur, Kanpur", "Juhu, Mumbai") nothing is placed; otherwise every place found must agree on
 * one district. Only when the name gives no place at all does a town it starts with count
 * ("Coimbatore Medical College").
 */
export function placeFromCollegeName(state: string | null | undefined, name: string | null | undefined): TextPlace {
  const st = stateName(state);
  if (!st || !name?.trim()) return NO_PLACE;
  const parts = nameParts(st, name);
  const marked = markedDistricts(st, name);
  const first = parts.find(isPlace);
  if (first && !first.district) return notOneDistrict(first);
  const decided = decide([...parts, ...marked]);
  if (decided) return decided;
  const { outside, brackets } = splitParts(name);
  const leads: Hit[] = [];
  for (const n of [outside[0], ...brackets.map((b) => splitParts(b).outside[0])]) {
    const lead = n ? leadingWords(n) : null;
    const h = lead ? tryPart(st, lead, "leading", false) : null;
    if (h) leads.push(h);
  }
  const firstLead = leads.find(isPlace);
  if (firstLead && !firstLead.district) return notOneDistrict(firstLead);
  return decide(leads) ?? firstTried([...parts, ...marked, ...leads]);
}

/**
 * The district (and town) an address line gives, for lists that print an address but no district
 * (NCH). A district marked "Dist."/"District" is read, and the town is the last part of the
 * address once the PIN and state are dropped; earlier parts are read only while the later ones are
 * not places at all. A marked district and the town must agree.
 */
export function placeFromAddress(state: string | null | undefined, address: string | null | undefined, name?: string | null): TextPlace {
  const st = stateName(state);
  if (!st || !address?.trim()) return NO_PLACE;
  let text = address.trim();
  const own = name?.trim();
  if (own && text.toLowerCase().startsWith(own.toLowerCase())) text = text.slice(own.length);
  // "Post- Deralakatte (Mangalore)": a bracketed town is a part of its own.
  text = text.replace(/[()]/g, ", ");
  const marked = markedDistricts(st, text);
  const markRe = new RegExp(`\\b${MARK}\\b`, "i");
  const parts = text
    .split(/[,;]|\s[-–]\s?|[-–]\s/)
    .map((s) => s.trim())
    .filter((s) => cleanPart(st, s).text);
  const tried: Hit[] = [];
  let town: Hit | null = null;
  // With a marked district, only the part just before it is read as the town: earlier parts are
  // as often a road named after the next town ("Sangli- Kolhapur Road, …, Distt. Kolhapur").
  const hasMark = marked.some((m) => m.district);
  for (const p of [...parts].reverse()) {
    if (markRe.test(p)) continue;
    const h = tryPart(st, p, "segment", true);
    if (!h) continue;
    tried.push(h);
    if (isPlace(h) || h.match === "other-state" || hasMark) {
      town = isPlace(h) ? h : null;
      break;
    }
  }
  if (town && !town.district && !marked.some((m) => m.district)) return notOneDistrict(town);
  const decided = decide([...marked, ...(town ? [town] : [])]);
  if (decided) return { ...decided, city: town?.district === decided.district ? town.raw : null };
  return firstTried([...marked, ...tried]);
}
