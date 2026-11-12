#!/usr/bin/env node
// Render a page and dump what a site.json needs: title, language, sections and the links under each.
// usage: node extract.mjs <url> [out.json]    (needs `playwright`; falls back to plain fetch)
import { writeFileSync } from 'node:fs';

const [, , url, out] = process.argv;
if (!url) { console.error('usage: node extract.mjs <url> [out.json]'); process.exit(1); }

let data;
let browser;
try {
  const { chromium } = await import('playwright');
  browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  data = await page.evaluate(collect);
} catch (e) {
  console.error(`playwright unavailable or failed (${e.message.split('\n')[0]}); falling back to fetch, client-rendered sites will be empty`);
  const response = await fetch(url, { headers: { 'user-agent': 'site-to-map extractor' } });
  if (!response.ok) throw new Error(`fetch failed: HTTP ${response.status}`);
  const html = await response.text();
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM(html, { url });
  data = collect(dom.window.document);
} finally {
  if (browser) await browser.close();
}
data.source = url;
const json = JSON.stringify(data, null, 2);
if (out) writeFileSync(out, json + '\n'); else console.log(json);
console.error(`${data.sections.length} sections, ${data.sections.reduce((n, s) => n + s.links.length, 0)} links`);

// runs in the page: group every link under the nearest heading above it
function collect(doc = document) {
  const meta = n => doc.querySelector(`meta[name="${n}"], meta[property="${n}"]`)?.content || '';
  const sections = [{ heading: '(top)', level: 0, parent: '', text: '', links: [] }];
  let parent = '';
  const seen = new Set();
  const walker = doc.createTreeWalker(doc.body, 1);
  for (let el = walker.currentNode; el; el = walker.nextNode()) {
    const tag = el.tagName;
    if (/^H[1-4]$/.test(tag)) {
      const heading = el.textContent.trim().replace(/\s+/g, ' '), level = +tag[1];
      if (level <= 2) parent = heading;
      sections.push({ heading, level, parent: level > 2 ? parent : '', text: '', links: [] }); continue;
    }
    const cur = sections[sections.length - 1];
    if (tag === 'P' && cur.text.length < 400) cur.text += (cur.text ? ' ' : '') + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 300);
    if (tag === 'A' && el.href && !el.href.startsWith('javascript:')) {
      const href = el.href, own = href.split('#')[0] === doc.location.href.split('#')[0];
      if (own && href.includes('#')) continue; // in-page navigation
      const label = (el.textContent || el.getAttribute('aria-label') || el.title || el.querySelector('img')?.alt || '').trim().replace(/\s+/g, ' ');
      const key = href + '|' + cur.heading;
      if (seen.has(key)) continue; seen.add(key);
      // same-site links stay relative so the map works on every domain the site is served from
      const u = new URL(href), local = u.origin === doc.location.origin;
      cur.links.push({ text: label.slice(0, 80), href: local ? u.pathname + u.search + u.hash : href });
    }
  }
  return { title: doc.title, lang: doc.documentElement.lang || '', description: meta('description') || meta('og:description'),
    sections: sections.filter(s => s.links.length || s.level <= 3) };
}
