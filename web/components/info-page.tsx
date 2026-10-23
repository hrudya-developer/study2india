import { PageHero } from "@/components/page-hero";

export function InfoPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero crumbs={[{ label: title }]} title={title} intro={intro} />
      <div className="bg-band">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="card space-y-4 p-6 leading-relaxed sm:p-8 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_a]:font-bold [&_a]:underline [&_li]:ml-5 [&_li]:list-disc">{children}</div>
        </div>
      </div>
    </>
  );
}
