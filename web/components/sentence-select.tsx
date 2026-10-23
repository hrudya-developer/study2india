"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Option = { value: string; label: string };
type Group = { label: string; options: Option[] };

/**
 * A dropdown that reads as part of the hero sentence. The visible text is a big label; the real
 * <select> sits on top of it, invisible and at normal size, so the browser's option list opens
 * at a readable size instead of copying the headline font.
 */
export function SentenceSelect({
  id,
  name,
  label,
  placeholder,
  defaultValue = "",
  options = [],
  groups = [],
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  options?: Option[];
  groups?: Group[];
}) {
  const [value, setValue] = useState(defaultValue);
  const all = [...options, ...groups.flatMap((g) => g.options)];
  const shown = all.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <span className="group relative inline-flex max-w-full items-center gap-2 border-b-[3px] border-brand pb-0.5 pr-1 align-baseline has-[select:focus-visible]:outline has-[select:focus-visible]:outline-3 has-[select:focus-visible]:outline-offset-4 has-[select:focus-visible]:outline-brand">
      <span className="truncate">{shown}</span>
      <ChevronDown className="size-[0.6em] shrink-0 text-brand" strokeWidth={3} aria-hidden="true" />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 font-sans text-base font-normal"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {groups.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </span>
  );
}
