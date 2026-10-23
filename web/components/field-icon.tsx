import {
  Stethoscope,
  Smile,
  HeartPulse,
  Leaf,
  PawPrint,
  Pill,
  Activity,
  Cog,
  Briefcase,
  Scale,
  Building2,
  Sprout,
  FlaskConical,
  Calculator,
  BookOpen,
  Monitor,
  PenTool,
  GraduationCap,
  ConciergeBell,
  Newspaper,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  medical: Stethoscope,
  dental: Smile,
  nursing: HeartPulse,
  ayush: Leaf,
  veterinary: PawPrint,
  pharmacy: Pill,
  "allied-health": Activity,
  engineering: Cog,
  management: Briefcase,
  law: Scale,
  architecture: Building2,
  agriculture: Sprout,
  science: FlaskConical,
  commerce: Calculator,
  arts: BookOpen,
  "computer-applications": Monitor,
  design: PenTool,
  education: GraduationCap,
  "hotel-management": ConciergeBell,
  "mass-communication": Newspaper,
};

/** Each field gets its own tint so the grid scans quickly. */
const TINTS: Record<string, string> = {
  medical: "bg-[#ffe9e9] text-[#c2282d]",
  dental: "bg-[#e6f4ff] text-[#1265a8]",
  nursing: "bg-[#ffeef6] text-[#b4236b]",
  ayush: "bg-[#e9f7ec] text-[#237a3b]",
  veterinary: "bg-[#fff3e2] text-[#a65b00]",
  pharmacy: "bg-[#eef0ff] text-[#3b45b5]",
  "allied-health": "bg-[#e6faf7] text-[#0f7a6e]",
  engineering: "bg-[#eef2f7] text-[#2c4a72]",
  management: "bg-[#fff6dd] text-[#8a6400]",
  law: "bg-[#f3ecff] text-[#6334b5]",
  architecture: "bg-[#ecf1f5] text-[#41586b]",
  agriculture: "bg-[#eef8e4] text-[#4f7a14]",
  science: "bg-[#e8f8ff] text-[#0b6f95]",
  commerce: "bg-[#fff0e6] text-[#b2510b]",
  arts: "bg-[#fdeef0] text-[#a33148]",
  "computer-applications": "bg-[#e9efff] text-[#2847b8]",
  design: "bg-[#fff0fb] text-[#a32d8c]",
  education: "bg-[#edf6ff] text-[#25609b]",
  "hotel-management": "bg-[#fff5e8] text-[#9b5b13]",
  "mass-communication": "bg-[#f1f1f4] text-[#3d4160]",
};

export function FieldIcon({ slug, size = 22, className = "" }: { slug: string; size?: number; className?: string }) {
  const Icon = ICONS[slug] ?? GraduationCap;
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-xl ${TINTS[slug] ?? "bg-band text-ink"} ${className}`} aria-hidden="true">
      <Icon size={size} strokeWidth={1.9} />
    </span>
  );
}
