import Link from "next/link";

export function PageHero({
  crumbs,
  title,
  intro,
  children,
}: {
  crumbs: { href?: string; label: string }[];
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-[linear-gradient(115deg,#0d0f36_0%,#1c2063_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-[0.9rem] text-[#b9bce0]">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          {crumbs.map((c) => (
            <span key={c.label}>
              {" / "}
              {c.href ? (
                <Link href={c.href} className="hover:text-white">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="mt-4 text-[2rem] font-extrabold leading-tight sm:text-[2.6rem]">{title}</h1>
        {intro ? <p className="mt-3 max-w-[64ch] text-[1.05rem] text-[#c9cbe6]">{intro}</p> : null}
        {children}
      </div>
    </section>
  );
}
