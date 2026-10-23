// Reads the MCC NEET UG final allotment PDFs and writes the extract scripts/cutoffs/mcc-convert.mjs reads
// (institutes.tsv, groups.txt, meta.json). Run it in a browser tab opened on one of the PDF URLs below
// (the PDFs are on cdnbbsr.s3waas.gov.in, so fetch is same-origin there), by pasting it into the console.
// It loads pdf.js from cdnjs, parses every page and leaves the three files in window.MCC_EXTRACT.
//
// How a page is read: the tables are rotated, so a text item's x coordinate is its line and y its
// column. Each record starts at the item in the first column (S.No in Round 1 and the Stray round,
// Rank in Round 2 and 3) and runs to the next record's first item. The record's first line gives one
// item per column; wrapped lines join the column they overlap most.
//
// Columns per list (after the first column):
//   Round 1, Stray: Rank, Quota, Institute, Course, Allotted category, Candidate category, Remarks
//   Round 2:        Round 1 quota, institute, course, remarks; Round 2 quota, institute, course,
//                   allotted category, candidate category, option no., remarks
//   Round 3:        Round 1 (4 columns), Round 2 (4 columns), Round 3 (7 columns as Round 2 above)
const BASE = "https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/";
const LISTS = {
  "Round 1": { file: "2026/08/20260824606525705.pdf", title: "Final Allotment Result for Round 1 of UG Counselling 2026" },
  "Round 2": { file: "2026/09/20260912351980769.pdf", title: "Final Result UG Round 2 Counselling 2026 dated 12.09.2026" },
  "Round 3": { file: "2026/10/202610011801857474.pdf", title: "Final Allotment result for UG Round 3 Counselling" },
  "Stray Vacancy Round": { file: "2026/10/202610201457709919.pdf", title: "Final Allotment Result for the UG Counselling Stray Vacancy Round" },
};
// Where the allotted seat of each list sits in a parsed record (record[0] is the first column).
const PICK = {
  "Round 1": (r) => ({ rank: +r[1], quota: r[2], inst: r[3], course: r[4], cat: r[5], remark: r[7] }),
  "Stray Vacancy Round": (r) => ({ rank: +r[1], quota: r[2], inst: r[3], course: r[4], cat: r[5], remark: r[7] }),
  "Round 2": (r) => ({ rank: +r[0], quota: r[5], inst: r[6], course: r[7], cat: r[8], remark: r[11] }),
  "Round 3": (r) => ({ rank: +r[0], quota: r[9], inst: r[10], course: r[11], cat: r[12], remark: r[15] }),
};
// A seat allotted in the round itself; Retained and similar remarks are seats held from earlier rounds.
const COUNTS = /^(Allotted|Fresh Allotted|Upgraded)/;

async function parsePage(doc, n) {
  const page = await doc.getPage(n);
  const content = await page.getTextContent();
  const items = content.items.filter((i) => i.str.trim()).map((i) => ({ x: i.transform[4], y: i.transform[5], w: i.width, s: i.str.trim() }));
  const anchors = items.filter((i) => i.y < 32 && /^\d+$/.test(i.s)).map((i) => i.x).sort((a, b) => a - b);
  const footer = items.filter((i) => /^Page No\./.test(i.s)).map((i) => i.x);
  const limit = footer.length ? Math.min(...footer) - 2 : Infinity;
  const records = [];
  for (let k = 0; k < anchors.length; k++) {
    const lo = anchors[k] - 3.5;
    const hi = k + 1 < anchors.length ? anchors[k + 1] - 3.5 : limit;
    const mine = items.filter((i) => i.x >= lo && i.x < hi);
    const cells = [];
    for (const i of mine.filter((i) => i.x < anchors[k] + 3.5).sort((a, b) => a.y - b.y)) {
      const last = cells[cells.length - 1];
      if (last && i.y - (last.y + last.w) < 2.5) {
        last.s += " " + i.s;
        last.w = i.y + i.w - last.y;
      } else cells.push({ ...i, parts: [] });
    }
    for (const i of mine.filter((i) => i.x >= anchors[k] + 3.5).sort((a, b) => a.x - b.x || a.y - b.y)) {
      let best = null;
      let bestScore = -Infinity;
      for (const c of cells) {
        const overlap = Math.min(c.y + c.w, i.y + i.w) - Math.max(c.y, i.y);
        const score = overlap > 0 ? overlap : -Math.abs(c.y + c.w / 2 - (i.y + i.w / 2));
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }
      best.parts.push(i.s);
    }
    records.push(cells.map((c) => [c.s, ...c.parts].join(" ")));
  }
  return records;
}

(async () => {
  const pdfjs = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";
  const key = (s) => s.replace(/\s+/g, "").toLowerCase();
  const clean = (s) => s.replace(/\s+/g, " ").trim();
  const rows = [];
  const pages = {};
  for (const [round, list] of Object.entries(LISTS)) {
    const doc = await pdfjs.getDocument({ data: await fetch(BASE + list.file).then((r) => r.arrayBuffer()) }).promise;
    pages[round] = doc.numPages;
    for (let n = 1; n <= doc.numPages; n++) {
      for (const record of await parsePage(doc, n)) {
        const x = PICK[round](record);
        if (!x.inst || x.inst === "-" || !COUNTS.test(x.remark)) continue;
        rows.push({ round, ...x });
      }
    }
  }
  // Institutes and quotas are keyed without spaces: narrow columns break words across lines.
  const institutes = [...new Set(rows.map((x) => key(x.inst)))];
  const fullName = new Map(rows.map((x) => [key(x.inst), clean(x.inst)]));
  const quotas = [...new Set(rows.map((x) => key(x.quota)))];
  const quotaName = new Map(rows.filter((x) => x.round === "Round 1").map((x) => [key(x.quota), clean(x.quota)]));
  const categories = [...new Set(rows.map((x) => clean(x.cat)))].sort();
  const COURSE = { MBBS: "M", BDS: "B", "B.Sc. Nursing": "N" };
  const ROUND = { "Round 1": "1", "Round 2": "2", "Round 3": "3", "Stray Vacancy Round": "S" };
  const groups = new Map();
  for (const x of rows) {
    const g = [institutes.indexOf(key(x.inst)), COURSE[clean(x.course)], ROUND[x.round], quotas.indexOf(key(x.quota)), categories.indexOf(clean(x.cat))].join(" ");
    const cur = groups.get(g) ?? { open: Infinity, close: 0, n: 0 };
    cur.open = Math.min(cur.open, x.rank);
    cur.close = Math.max(cur.close, x.rank);
    cur.n++;
    groups.set(g, cur);
  }
  window.MCC_EXTRACT = {
    "institutes.tsv": "index\tshort\tfull\n" + institutes.map((k, i) => `${i}\t${fullName.get(k).split(",")[0]}\t${fullName.get(k)}`).join("\n") + "\n",
    "groups.txt": [...groups].map(([g, v]) => `${g} ${v.open} ${v.close} ${v.n}`).join("\n") + "\n",
    "meta.json": JSON.stringify(
      {
        quotas: quotas.map((k) => quotaName.get(k) ?? k),
        categories,
        sources: Object.fromEntries(Object.entries(LISTS).map(([r, l]) => [r, { title: l.title, url: BASE + l.file, pages: pages[r] }])),
      },
      null,
      2,
    ),
  };
  console.log(`${rows.length} allotments, ${groups.size} groups, ${institutes.length} institutes`);
})();
