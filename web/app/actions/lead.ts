"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { db, schema } from "@/lib/db";
import { CONSENT_TEXT, type LeadState } from "@/lib/lead-shared";

const LeadInput = z.object({
  name: z.string().trim().min(2, "Enter the student's name").max(80),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+?91)(?=\d{10}$)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10 digit Indian mobile number")),
  course: z.string().trim().max(80).optional(),
  state: z.string().trim().max(60).optional(),
  rank: z.string().trim().max(40).optional(),
  consent: z.literal("on", { message: "Tick the box so we can call you" }),
  company: z.string().max(0).optional(),
});

export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  const raw = Object.fromEntries(form.entries());
  const parsed = LeadInput.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      errors[key] ??= key === "company" ? "Please try again." : issue.message;
    }
    return { ok: false, message: "Check the highlighted fields.", errors };
  }
  const d = parsed.data;
  const h = await headers();
  const referer = h.get("referer");
  let sourcePath: string | null = null;
  try {
    sourcePath = referer ? new URL(referer).pathname : null;
  } catch {
    sourcePath = null;
  }

  await db.insert(schema.leads).values({
    name: d.name,
    phone: d.phone,
    courseInterest: d.course || null,
    homeState: d.state || null,
    examRank: d.rank || null,
    sourcePath,
    consentText: CONSENT_TEXT,
  });

  return { ok: true, message: `Thanks, ${d.name.split(" ")[0]}. A counsellor will call you on ${d.phone} during office hours.` };
}
