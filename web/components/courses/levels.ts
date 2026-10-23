/** Course levels in the order filters show them, with long and short labels. */
export const LEVELS = [
  { value: "ug", short: "UG", label: "Undergraduate" },
  { value: "pg", short: "PG", label: "Postgraduate" },
  { value: "diploma", short: "Diploma", label: "Diploma" },
  { value: "doctorate", short: "Doctorate", label: "Doctorate" },
  { value: "integrated", short: "Integrated", label: "Integrated" },
  { value: "certificate", short: "Certificate", label: "Certificate" },
] as const;

export function levelLabel(level: string): string {
  return LEVELS.find((l) => l.value === level)?.label ?? level;
}

export function levelShort(level: string): string {
  return LEVELS.find((l) => l.value === level)?.short ?? level;
}

/** Badge tint per level so cards scan quickly. */
export const LEVEL_TINT: Record<string, string> = {
  ug: "bg-[#e9efff] text-[#2847b8]",
  pg: "bg-[#f3ecff] text-[#6334b5]",
  diploma: "bg-[#fff3e2] text-[#a65b00]",
  doctorate: "bg-[#e6faf7] text-[#0f7a6e]",
  integrated: "bg-[#eef8e4] text-[#4f7a14]",
  certificate: "bg-band text-ink-soft",
};
