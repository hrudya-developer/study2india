/** What NIRF measures and how to read a list, in plain words. No figures beyond what NIRF publishes. */
const PARAMETERS = [
  { code: "TLR", name: "Teaching, Learning and Resources", text: "Faculty, student strength, finances and how they are used." },
  { code: "RP", name: "Research and Professional Practice", text: "Publications, citations, patents and professional work." },
  { code: "GO", name: "Graduation Outcomes", text: "Exam results, placements, higher studies and PhDs graduating." },
  { code: "OI", name: "Outreach and Inclusivity", text: "Students from other states, women, and economically and socially challenged groups." },
  { code: "PR", name: "Perception", text: "How employers, academics and the public see the institution." },
];

export function HowToRead({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-labelledby="how-nirf" className="card p-5 sm:p-6">
      <h2 id="how-nirf" className="text-[1.4rem] font-bold">
        How to read an NIRF list
      </h2>
      <div className={`mt-3 grid gap-6 ${compact ? "" : "lg:grid-cols-[1fr_1.2fr]"}`}>
        <div className="space-y-3 text-[0.97rem] text-ink-soft">
          <p>
            The National Institutional Ranking Framework is run by the Ministry of Education. Institutions apply, submit their data, and are scored out of 100 on five groups of
            parameters. Each subject list weighs the groups differently, and the Innovation and SDG lists use parameters of their own.
          </p>
          <p>
            NIRF publishes an exact rank, usually with a score, only for the top of each list. Below that it places institutions in bands such as 101-150, with no score, so two colleges in
            the same band are not ranked against each other.
          </p>
          <p>
            An institution that did not apply is not ranked. Missing from a list does not mean a college is weak, and a rank says nothing about one course&apos;s fees or
            cut-offs.
          </p>
          <p className="font-bold text-ink">We show every list exactly as published: no ads in the table, no ratings of our own, and partner colleges are never moved up.</p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {PARAMETERS.map((p) => (
            <li key={p.code} className="flex gap-3 rounded-xl border border-rule bg-band px-3.5 py-2.5">
              <span className="w-10 shrink-0 font-[family-name:var(--font-display)] font-extrabold text-ink-2">{p.code}</span>
              <span className="text-[0.92rem]">
                <span className="font-bold">{p.name}.</span> <span className="text-ink-soft">{p.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
