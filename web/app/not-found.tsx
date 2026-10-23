import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-band">
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="font-[family-name:var(--font-display)] text-6xl font-extrabold text-brand">404</p>
        <h1 className="mt-4 text-3xl font-bold">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-ink-soft">It may have moved, or it may not be published yet. Try searching, or start from one of these.</p>
        <form action="/search" method="get" role="search" className="mx-auto mt-6 flex max-w-md gap-2">
          <label htmlFor="nf-q" className="sr-only">Search</label>
          <input id="nf-q" name="q" type="search" placeholder="College, course or exam" className="min-w-0 flex-1 rounded-lg border border-rule bg-paper px-4 py-3" />
          <button type="submit" className="rounded-lg bg-ink px-5 py-3 font-bold text-white hover:bg-ink-2">Search</button>
        </form>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/colleges" className="rounded-lg border border-rule bg-paper px-4 py-2 font-bold hover:bg-rule">Colleges</Link>
          <Link href="/courses" className="rounded-lg border border-rule bg-paper px-4 py-2 font-bold hover:bg-rule">Courses</Link>
          <Link href="/exams" className="rounded-lg border border-rule bg-paper px-4 py-2 font-bold hover:bg-rule">Exams</Link>
          <Link href="/counselling" className="rounded-lg bg-brand px-4 py-2 font-bold text-ink hover:bg-brand-hover">Free counselling</Link>
        </div>
      </div>
    </div>
  );
}
