#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = "https://www.kinephysio.fr";
const OUT_DIR = path.join(process.cwd(), "assets", "images");
const MANIFEST = path.join(OUT_DIR, "manifest.json");
const ALLOWED_HOSTS = new Set(["www.kinephysio.fr", "kinephysio.fr", "static.wixstatic.com"]);
const START_PAGES = [
  "/",
  "/contact-5",
  "/general-8",
  "/s-projects-side-by-side",
  "/copie-de-massages-bien-être",
  "/copie-de-balnéothérapie",
  "/about-6",
  "/about-1",
];

const preferredNames = new Map([
  ["1c0277_c69ab86ebfce4e3498286de6bed9cd88", "cabinet-exterieur.jpg"],
  ["1c0277_615e074fe53a4d57bd82972e73b96740", "cabinet-interieur.jpg"],
  ["1c0277_495d96032b56481ba3df3226aea333a5", "balneotherapie.jpg"],
  ["1c0277_109bba99e7cc494b8999326d6c6b188b", "reeducation-piscine.jpg"],
  ["1c0277_b77e00dd44af44389ccb41788bad8965", "salle-reeducation.jpg"],
  ["1c0277_72b6bab301ae4b2cb312a0774d9d82c4", "plateau-technique.jpg"],
  ["1c0277_a4f094f7cf934a7692daf825906cb0f4", "table-soin.jpg"],
  ["11062b_d75076444824430a818741565ee5d57f", "kinesitherapie.jpg"],
  ["11062b_ec4b0d58fb8748fab3aee254d34ddfdb", "reeducation-effort.jpg"],
  ["11062b_590f6cf275c84f4fa988abce2b213f3f", "kinesitherapie-musicien.jpg"],
  ["f6958d14939a4269901bd24be79563b0", "osteopathie.jpg"],
  ["11062b_5860b9e541c2496bade718c78d69bcc7", "massage-bien-etre.jpg"],
  ["11062b_db8ccdacf38748458ce0ba9ee07bb5ef", "yoga.jpg"],
  ["1c0277_0ca46b55ebf644e6adab475956d89bda", "affiche-yoga.jpg"],
  ["1c0277_544048c94189463cb91dc31bfcb7afb9", "logo-kinephysio.png"],
  ["1c0277_334e1d77836f449db111c70b132b07d0", "equipe-01.jpg"],
  ["1c0277_4e34db5f25b2453b9b481eef21055796", "equipe-02.jpg"],
  ["1c0277_d32d955e32f24e77aa2f523657dda7e8", "equipe-03.jpg"],
  ["1c0277_7f455e2a8747432a93f75943b00401f0", "equipe-04.jpg"],
  ["1c0277_be150c8fed064d658a5fc52248498380", "equipe-05.jpg"],
  ["1c0277_d26a63ceeeb74d539e9c1943839297ac", "equipe-06.jpg"],
  ["1c0277_e808474fe85c473081712da88f7fe4aa", "equipe-07.jpg"],
  ["1c0277_eedf0710aa704e0d9022fea8989c9210", "equipe-08.jpg"],
  ["1c0277_a1541445137d4cb38373eb9966dfac75", "equipe-09.jpg"],
]);

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeUrl(raw, pageUrl) {
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return null;
  const clean = decodeEntities(raw.trim()).replace(/^['"]|['"]$/g, "");
  if (!clean.startsWith("http") && !clean.startsWith("/")) return null;
  try {
    const url = new URL(clean, pageUrl);
    if (!ALLOWED_HOSTS.has(url.hostname)) return null;
    if (!/\.(png|jpe?g|webp|avif|gif|svg)(?:$|[/?#])/i.test(url.href)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function imageKey(url) {
  const match = url.match(/\/media\/([^/?]+)/);
  if (match) {
    return match[1]
      .replace(/\.(png|jpe?g|webp|avif|gif|svg).*$/i, "")
      .replace(/~mv2.*/i, "");
  }
  return url.split("?")[0];
}

function dimensionsScore(url) {
  const pairs = [...url.matchAll(/[wh]_(\d+)/g)].map((m) => Number(m[1]));
  if (pairs.length >= 2) return pairs[0] * pairs[1];
  if (pairs.length === 1) return pairs[0];
  return 0;
}

function extractFromHtml(html, pageUrl) {
  const found = [];
  const attrRegex = /\b(src|href|srcset)=["']([^"']+)["']/gi;
  const cssRegex = /url\(([^)]+)\)/gi;
  const wixUriRegex = /"uri":"([^"]+\.(?:png|jpe?g|webp|avif|gif|svg))"/gi;

  for (const regex of [attrRegex, cssRegex]) {
    for (const match of html.matchAll(regex)) {
      const attrName = regex === attrRegex ? match[1].toLowerCase() : "";
      const raw = regex === attrRegex ? match[2] : match[1];
      const parts = attrName === "srcset"
        ? raw.split(/,\s+(?=https?:)/).map((part) => part.trim().replace(/\s+\d+[wx]$/, ""))
        : [raw];
      for (const part of parts) {
        const normalized = normalizeUrl(part, pageUrl);
        if (normalized) found.push(normalized);
      }
    }
  }

  for (const match of html.matchAll(wixUriRegex)) {
    const normalized = normalizeUrl(`https://static.wixstatic.com/media/${match[1]}`, pageUrl);
    if (normalized) found.push(normalized);
  }

  const imgBlocks = [...html.matchAll(/<img\b[^>]*>/gi)];
  const alts = new Map();
  for (const [tag] of imgBlocks) {
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    const alt = tag.match(/\balt=["']([^"']*)["']/i)?.[1] || "";
    const normalized = normalizeUrl(src, pageUrl);
    if (normalized && alt) alts.set(imageKey(normalized), decodeEntities(alt));
  }

  const links = [...html.matchAll(/\bhref=["'](https:\/\/www\.kinephysio\.fr\/[^"']+)["']/gi)]
    .map((m) => m[1])
    .filter((href) => !href.includes("#"));

  return { images: found, links, alts };
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 image crawler for private redesign" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

function extensionFor(url, contentType) {
  const fromType = contentType?.match(/image\/(jpeg|jpg|png|webp|avif|gif|svg\+xml)/i)?.[1];
  if (fromType) return fromType.replace("jpeg", "jpg").replace("svg+xml", "svg");
  return (url.match(/\.(png|jpe?g|webp|avif|gif|svg)(?:$|[/?#])/i)?.[1] || "jpg").replace("jpeg", "jpg");
}

async function download(url, filename) {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 image crawler for private redesign" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const contentType = response.headers.get("content-type");
  const ext = extensionFor(url, contentType);
  const finalName = filename.replace(/\.[^.]+$/, `.${ext}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(path.join(OUT_DIR, finalName), buffer);
  return finalName;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const queue = START_PAGES.map((page) => new URL(page, ROOT).href);
  const visited = new Set();
  const byKey = new Map();
  const altByKey = new Map();
  const foundOn = new Map();

  while (queue.length && visited.size < 24) {
    const page = queue.shift();
    if (visited.has(page)) continue;
    visited.add(page);
    const html = await fetchText(page);
    const { images, links, alts } = extractFromHtml(html, page);

    for (const link of links) {
      if (link.startsWith(ROOT) && !visited.has(link) && queue.length < 24) queue.push(link);
    }
    for (const image of images) {
      const key = imageKey(image);
      if (!byKey.has(key) || dimensionsScore(image) > dimensionsScore(byKey.get(key))) byKey.set(key, image);
      if (!foundOn.has(key)) foundOn.set(key, page);
    }
    for (const [key, alt] of alts) altByKey.set(key, alt);
  }

  const entries = [];
  let count = 1;
  for (const [key, url] of byKey) {
    const readable = preferredNames.get(key) || `image-${String(count).padStart(2, "0")}.jpg`;
    const localFilename = await download(url, readable);
    entries.push({
      originalUrl: url,
      localFilename,
      altText: altByKey.get(key) || "",
      foundOn: foundOn.get(key) || ROOT,
    });
    count += 1;
  }

  await fs.writeFile(MANIFEST, `${JSON.stringify(entries, null, 2)}\n`);
  console.log(`Downloaded ${entries.length} images from ${visited.size} pages.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
