// Helpers pasted into a browser tab on nirfindia.org to read the official ranking tables.
// Used only for reading public NIRF pages; the output is converted by scripts/nirf-convert.mjs.
window.__parse = (doc) => {
  const t = doc.getElementById("tbl_overall");
  if (!t) return [];
  return [...t.rows]
    .filter((r) => r.parentElement.closest("table") === t && r.cells.length >= 5 && !/Institute ID/i.test(r.cells[0].textContent))
    .map((r) => {
      const c = r.cells;
      let name = "";
      for (const n of c[1].childNodes) {
        if (n.nodeType === 3) name += n.textContent;
        else if (!(n.tagName === "TABLE" || n.tagName === "DIV" || n.tagName === "A" || n.querySelector?.("table"))) name += n.textContent;
      }
      name = name.replace(/More Details.*$/s, "").replace(/\s+/g, " ").trim();
      const cells = [...c].map((x) => x.textContent.replace(/\s+/g, " ").trim());
      return { id: cells[0], name, city: cells[2], state: cells[3], score: c.length >= 6 ? cells[4] : null, rank: c.length >= 6 ? cells[5] : cells[4] };
    });
};

window.__get = async (url) => {
  const html = await fetch(url).then((r) => r.text());
  const doc = new DOMParser().parseFromString(html, "text/html");
  const bands = [...doc.querySelectorAll("a")]
    .map((a) => a.getAttribute("href") || "")
    .filter((h) => /\.html$/i.test(h) && /Ranking\d|Band|\d{3}/i.test(h) && !/\/Rankings\/\d{4}\/Ranking/i.test(h));
  return { url, rows: window.__parse(doc), bands: [...new Set(bands)] };
};

window.__band = async (url) => {
  const html = await fetch(url).then((r) => r.text());
  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = doc.body.innerText;
  const m = text.match(/(?:rank[\s-]*band|rank)\s*:?\s*\(?\s*(\d{2,3})\s*[-–to ]+\s*(\d{2,3})/i);
  const t = [...doc.querySelectorAll("table")].find((x) => /Name/.test(x.rows[0]?.cells[0]?.textContent || ""));
  const rows = t
    ? [...t.rows]
        .slice(1)
        .filter((r) => r.cells.length >= 3)
        .map((r) => ({ name: r.cells[0].textContent.replace(/\s+/g, " ").trim(), city: r.cells[1].textContent.replace(/\s+/g, " ").trim(), state: r.cells[2].textContent.replace(/\s+/g, " ").trim() }))
    : [];
  return { url, band: m ? `${m[1]}-${m[2]}` : null, rows };
};

window.__cat = async (file, year = 2025) => {
  const base = `/Rankings/${year}/`;
  const main = await window.__get(base + file);
  const out = { file, urls: [location.origin + base + file], rows: main.rows.map((r) => [r.id, r.name, r.city, r.state, r.score, r.rank, null]) };
  for (const b of main.bands) {
    const x = await window.__band(base + b);
    out.urls.push(location.origin + base + b);
    for (const r of x.rows) out.rows.push([null, r.name, r.city, r.state, null, null, x.band]);
  }
  return out;
};

window.__show = (obj) => {
  document.title = "NIRF extract";
  document.body.innerHTML = "";
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(obj);
  document.body.appendChild(pre);
  return pre.textContent.length;
};
