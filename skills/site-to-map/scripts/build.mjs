#!/usr/bin/env node
// Build a standalone map page from a site.json.
// usage: node build.mjs <site.json> <out-dir>
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const engine = resolve(here, '../engine');
const [, , sitePath, outDir = 'dist'] = process.argv;
if (!sitePath) { console.error('usage: node build.mjs <site.json> <out-dir>'); process.exit(1); }

const site = JSON.parse(readFileSync(sitePath, 'utf8'));
const errors = validate(site);
if (errors.length) { console.error('site.json problems:\n- ' + errors.join('\n- ')); process.exit(1); }

const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const loc = (v, lang) => v == null ? '' : typeof v === 'string' ? v : (v[lang] ?? v.en ?? Object.values(v)[0] ?? '');
const lang = site.site?.lang && site.site.lang !== 'auto' ? site.site.lang : (site.site?.languages?.[0] || 'en');
const title = loc(site.text?.[lang]?.title, lang) || site.site?.brand || 'Map';
const noscript = `<nav class="no-js" aria-label="All links">${site.cities.map(c => `<section><h2>${esc(loc(c.name, lang))}</h2><ul>${c.items.map(it => `<li><a href="${esc(it.url)}">${esc(loc(it.name, lang))}</a></li>`).join('')}</ul></section>`).join('')}</nav>`;
const html = readFileSync(join(engine, 'template.html'), 'utf8')
  .replaceAll('{{LANG}}', lang === 'zh' ? 'zh-CN' : lang)
  .replaceAll('{{TITLE}}', esc(title))
  .replace('{{DAYLIGHT}}', typeof site.ui?.daylight === 'number' ? ` data-daylight="${site.ui.daylight}"` : '')
  .replaceAll('{{DESCRIPTION}}', esc(site.site?.description || title))
  .replace('{{NOSCRIPT}}', noscript)
  .replace('{{SITE_JSON}}', JSON.stringify(site).replace(/</g, '\\u003c'));

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'index.html'), html);
copyFileSync(join(engine, 'map-engine.js'), join(outDir, 'map-engine.js'));
copyFileSync(join(engine, 'world-gen.js'), join(outDir, 'world-gen.js'));
copyFileSync(join(engine, 'daylight.js'), join(outDir, 'daylight.js'));
copyFileSync(join(engine, 'map.css'), join(outDir, 'map.css'));
console.log(`built ${join(outDir, 'index.html')}: ${site.cities.length} towns, ${site.cities.reduce((n, c) => n + c.items.length, 0)} links`);

function validate(s) {
  const out = [];
  const KINDS = new Set(JSON.parse(readFileSync(join(here, '../references/kinds.json'), 'utf8')).map(k => k.kind));
  const SLOTS = ['center', 'highland', 'coast', 'south', 'east', 'town'];
  if (!Array.isArray(s.cities) || !s.cities.length) return ['cities must be a non-empty array'];
  if (s.cities.length > 9) out.push(`${s.cities.length} towns; the map holds at most 9 (merge categories)`);
  if (s.cities.length > 5 && s.world?.layout === 'classic') out.push('layout "classic" has five town spots; use a generated world for more towns');
  const slots = new Set(), keys = new Set();
  for (const c of s.cities) {
    const where = `town "${c.id}"`;
    if (!c.id || !/^[a-z0-9-]+$/.test(c.id)) out.push(`${where}: id must be lowercase letters, digits or hyphens`);
    if (!c.name) out.push(`${where}: name is required`);
    if (c.slot && !SLOTS.includes(c.slot)) out.push(`${where}: slot must be one of ${SLOTS.join(', ')}`);
    if (c.slot && c.slot !== 'town' && slots.has(c.slot)) out.push(`${where}: slot "${c.slot}" is used twice`); slots.add(c.slot);
    if (c.key) { if (!/^[a-z]$/i.test(c.key) || 'hotvli'.includes(c.key.toLowerCase())) out.push(`${where}: key "${c.key}" must be one letter and not H O T V L I`); if (keys.has(c.key.toLowerCase())) out.push(`${where}: key "${c.key}" is used twice`); keys.add(c.key.toLowerCase()); }
    if (!Array.isArray(c.items) || !c.items.length) { out.push(`${where}: needs at least one item`); continue; }
    for (const it of c.items) {
      if (!it.name || !it.url) out.push(`${where}: every item needs name and url`);
      if (it.kind && !KINDS.has(it.kind)) out.push(`${where}: unknown kind "${it.kind}" on "${loc(it.name, 'en')}"`);
    }
  }
  return out;
}
