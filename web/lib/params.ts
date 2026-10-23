export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function one(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  const t = s?.trim();
  return t ? t.slice(0, 120) : undefined;
}

/**
 * A lookup that ignores inherited keys, so a request value such as "constructor" or "toString"
 * finds nothing instead of a function from Object.prototype.
 */
export function own<V>(map: Record<string, V>, key: string | null | undefined): V | undefined {
  return key !== null && key !== undefined && Object.hasOwn(map, key) ? map[key] : undefined;
}

export function pageNumber(v: string | string[] | undefined): number {
  const n = Number(one(v));
  return Number.isInteger(n) && n > 0 && n < 10000 ? n : 1;
}

/** Build a query string from the current filters, dropping empty values. */
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    u.set(k, v === true ? "1" : String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}
