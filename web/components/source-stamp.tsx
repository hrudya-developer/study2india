/** The small "where this came from" line that sits beside figures across the site. */
export function SourceStamp({ publisher, url, checked }: { publisher: string; url?: string | null; checked: string }) {
  const date = new Date(checked + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return (
    <p className="inline-flex items-center gap-2 rounded-md bg-verified-bg px-2.5 py-1 text-[0.85rem] text-verified">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.8 8.2l2.1 2.1 4.3-4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>
        Source:{" "}
        {url ? (
          <a href={url} className="underline underline-offset-2" rel="noopener" target="_blank">
            {publisher}
          </a>
        ) : (
          publisher
        )}
        , checked {date}
      </span>
    </p>
  );
}
