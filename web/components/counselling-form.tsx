"use client";

import { useActionState } from "react";
import { submitLead } from "@/app/actions/lead";
import { CONSENT_TEXT, type LeadState } from "@/lib/lead-shared";
import type { Option } from "@/lib/queries/home";

const initial: LeadState = { ok: false, message: "" };

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[0.92rem] font-bold text-ink-soft">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[0.88rem] text-[#b42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-ink placeholder:text-[#9a9db0] focus:border-ink aria-[invalid=true]:border-[#b42318]";

export function CounsellingForm({ courses, states }: { courses: Option[]; states: Option[] }) {
  const [state, action, pending] = useActionState(submitLead, initial);

  if (state.ok) {
    return (
      <div role="status" className="rounded-xl bg-verified-bg p-6 text-ink">
        <p className="font-[family-name:var(--font-display)] text-xl font-bold">Request received</p>
        <p className="mt-2">{state.message}</p>
      </div>
    );
  }

  const err = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field id="lead-name" label="Student's name" error={err.name}>
        <input id="lead-name" name="name" autoComplete="name" className={inputClass} aria-invalid={!!err.name} aria-describedby={err.name ? "lead-name-error" : undefined} />
      </Field>
      <Field id="lead-phone" label="Mobile number" error={err.phone}>
        <input
          id="lead-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="10 digit number"
          className={`${inputClass} tabular`}
          aria-invalid={!!err.phone}
          aria-describedby={err.phone ? "lead-phone-error" : undefined}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="lead-course" label="Course">
          <select id="lead-course" name="course" className={inputClass} defaultValue="">
            <option value="">Not decided</option>
            {courses.map((c) => (
              <option key={c.value} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="lead-state" label="Preferred state">
          <select id="lead-state" name="state" className={inputClass} defaultValue="">
            <option value="">Any state</option>
            {states.map((s) => (
              <option key={s.value} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="lead-rank" label="Entrance rank or score, if you have one">
        <input id="lead-rank" name="rank" className={`${inputClass} tabular`} placeholder="For example NEET rank 45210" />
      </Field>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="lead-company">Company</label>
        <input id="lead-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label className="flex gap-3 text-[0.9rem] leading-snug text-ink-soft">
          <input type="checkbox" name="consent" className="mt-1 size-4 shrink-0 accent-[#0d0f36]" aria-invalid={!!err.consent} />
          <span>{CONSENT_TEXT}</span>
        </label>
        {err.consent ? <p className="mt-1 text-[0.88rem] text-[#b42318]">{err.consent}</p> : null}
      </div>
      {state.message && !state.ok ? (
        <p role="alert" className="text-[0.92rem] text-[#b42318]">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand px-4 py-3 font-bold text-ink hover:bg-[#ff9a33] disabled:opacity-60"
      >
        {pending ? "Sending" : "Request a call back"}
      </button>
    </form>
  );
}
