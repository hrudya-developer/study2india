"use client";

import { useSyncExternalStore } from "react";

/** A shortlisted college, kept only in this viewer's browser. */
export type ShortlistItem = { slug: string; name: string; place: string };

const KEY = "s2i.shortlist.v1";
const EVENT = "s2i-shortlist";
export const SHORTLIST_MAX = 30;
const EMPTY: ShortlistItem[] = [];

let cacheRaw: string | null = null;
let cacheList: ShortlistItem[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): ShortlistItem[] {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return EMPTY;
    return v
      .filter((x): x is ShortlistItem => !!x && typeof x.slug === "string" && typeof x.name === "string")
      .map((x) => ({ slug: x.slug, name: x.name, place: typeof x.place === "string" ? x.place : "" }))
      .slice(0, SHORTLIST_MAX);
  } catch {
    return EMPTY;
  }
}

function snapshot(): ShortlistItem[] {
  const raw = readRaw();
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cacheList = parse(raw);
  }
  return cacheList;
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onChange);
  };
}

function write(list: ShortlistItem[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, SHORTLIST_MAX)));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
}

/** The shortlist, or null while rendering on the server and before the browser has been read. */
export function useShortlist(): ShortlistItem[] | null {
  return useSyncExternalStore<ShortlistItem[] | null>(subscribe, snapshot, () => null);
}

export function addToShortlist(item: ShortlistItem): boolean {
  const list = snapshot();
  if (list.some((x) => x.slug === item.slug)) return true;
  if (list.length >= SHORTLIST_MAX) return false;
  return write([...list, item]);
}

export function removeFromShortlist(slug: string): boolean {
  return write(snapshot().filter((x) => x.slug !== slug));
}

export function clearShortlist(): boolean {
  return write([]);
}
