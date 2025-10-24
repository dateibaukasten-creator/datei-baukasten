// ops/generator.js (robust mit Fallback-Seeds)
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SITE = path.join(ROOT, "utility-site");
const SEED = path.join(ROOT, "ops", "seed.json");

// Fallback-Seed, falls die Datei fehlt/leer ist
const FALLBACK = [
  { slug:"png-zu-jpg", title:"PNG in JPG umwandeln", h1:"PNG → JPG umwandeln", desc:"Konvertiere PNG in JPG – direkt im Browser, ohne Upload." },
  { slug:"jpg-zu-png", title:"JPG in PNG umwandeln", h1:"JPG → PNG", desc:"Wandle JPG-Bilder in transparente PNGs um – lokal & schnell." },
  { slug:"webp-zu-jpg", title:"WEBP in JPG umwandeln", h1:"WEBP → JPG", desc:"WEBP in kompatible JPGs umwandeln." },
  { slug:"heic-zu-jpg", title:"HEIC in JPG umwandeln", h1:"HEIC → JPG", desc:"iPhone-Fotos (HEIC) in JPG konvertieren." },
  { slug:"pdf-komprimieren", title:"PDF komprimieren", h1:"PDF komprimieren", desc:"PDF-Dateien kleiner machen – bleibt lesbar." },
  { slug:"pdf-zusammenfuegen", title:"PDFs zusammenfügen", h1:"PDFs zusammenfügen", desc:"Mehrere PDFs zu einer Datei kombinieren." },
  { slug:"pdf-teilen", title:"PDF teilen", h1:"PDF teilen", desc:"PDF in einzelne Seiten aufsplitten." },
  { slug:"bild-verkleinern", title:"Bild verkleinern (online)", h1:"Bild verkleinern", desc:"Abmessungen reduzieren – alles im Browser." },
  { slug:"png-komprimieren", title:"PNG komprimieren", h1:"PNG komprimieren", desc:"PNG-Dateien stark verkleinern – gute Qualität." },
  { slug:"jpg-komprimieren", title:"JPG komprimieren", h1:"JPG komprimieren", desc:"Fotos komprimieren ohne sichtbaren Verlust." }
];

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function loadSeeds() {
  try {
    const raw = fs.readFileSync(SEED, "utf8");
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.length) return data;
    console.log("seed.json leer → benutze Fallback.");
    return FALLBACK;
  } catch (e) {
    console.log("seed.json fehlt → benutze Fallback.");
    return FALLBACK;
  }
}

function listExistingSlugs() {
  ensureDir(SITE);
  return fs.readdirSync(SITE)
    .filter(f => f.endsWith(".html"))
    .map(f => f.replace(/\.html$/,""))
    .filter(s => !["index","impressum","datenschutz"].includes(s));
}

function htmlPage({slug, title, h1, desc}) {
  const canonical = `https://datei-baukasten.de/${slug}.html`;
  return `<!doctype html>
<html lang="de"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} – Datei-Baukasten</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/styles.css">
</head><body>
<header class="container"><h1>${h1}</h1><p>${desc}</p><p><a href="/index.html">← Zurück</a></p></header>
<main class="container"><div class="card"><h2>Loslegen</h2><p>Alles lokal im Browser – keine Uploads.</p><p><a class="btn" href="/index.html#${slug}">Zum Tool</a></p></div></main>
<footer class="container"><p><a href="/impressum.html">Impressum</a> · <a href="/datenschutz.html">Datenschutz</a></p></footer>
</body></html>`;
}

function buildIndex(pages) {
  const items = pages.map(p => `<li><a href="/${p.slug}.html">${p.title}</a></li>`).join("\n");
  return `<!doctype html>
<html lang="de"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Datei-Baukasten – Kostenlose Datei-Tools</title>
<meta name="description" content="Konvertieren, Komprimieren, PDF & Bild bearbeiten – alles lokal im Browser.">
<link rel="canonical" href="https://datei-baukasten.de/">
<link rel="stylesheet" href="/styles.css">
</head><body>
<header class="container"><h1>Datei-Baukasten</h1><p>Konvertieren & Komprimieren – schnell, privat & kostenlos.</p></header>
<main class="container"><h2>Tools</h2><ul class="linklist">${items}</ul></main>
<footer class="container"><p><a href="/impressum.html">Impressum</a> · <a href="/datenschutz.html">Datenschutz</a></p></footer>
</body></html>`;
}

function buildSitemap(pages) {
  const urls = pages.map(p => `
  <url><loc>https://datei-baukasten.de/${p.slug}.html</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://datei-baukasten.de/</loc><priority>1.0</priority></url>
  ${urls}
</urlset>`;
}

function main() {
  ensureDir(SITE);
  const seeds = loadSeeds();
  const have = new Set(listExistingSlugs());
  const toCreate = seeds.filter(s => !have.has(s.slug)).slice(0, 10);
  if (!toCreate.length) { console.log("No new pages to create."); return; }
  for (const p of toCreate) {
    fs.writeFileSync(path.join(SITE, `${p.slug}.html`), htmlPage(p), "utf8");
    console.log("created", p.slug);
  }
  const allSlugs = new Set([...have, ...toCreate.map(p => p.slug)]);
  const pages = seeds.filter(s => allSlugs.has(s.slug));
  fs.writeFileSync(path.join(SITE, "index.html"), buildIndex(pages), "utf8");
  fs.writeFileSync(path.join(SITE, "sitemap.xml"), buildSitemap(pages), "utf8");
  console.log("index & sitemap updated.");
}
main();
