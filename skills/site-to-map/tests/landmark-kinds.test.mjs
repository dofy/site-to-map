import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assignLandmarkKinds, LANDMARK_SILHOUETTES } from '../engine/world-gen.js';

const kinds = JSON.parse(readFileSync(new URL('../references/kinds.json', import.meta.url), 'utf8'));
const props = new Set(kinds.filter(k => k.type === 'prop').map(k => k.kind));
const buildings = new Set(kinds.filter(k => k.type === 'building').map(k => k.kind));

test('unassigned landmarks get stable, distinct building kinds and varied overflow props', () => {
  const source = Array.from({ length: 13 }, (_, i) => ({ name: `item ${i}`, url: `https://example.com/${i}` }));
  const result = assignLandmarkKinds(source, 'town-one', props);
  assert.deepEqual(result, assignLandmarkKinds(source, 'town-one', props));
  assert.equal(new Set(result.slice(0, 9).map(item => item.kind)).size, 9);
  assert.ok(result.slice(0, 9).every(item => buildings.has(item.kind)));
  assert.ok(result.slice(9).every(item => props.has(item.kind)));
  assert.equal(new Set(result.slice(9).map(item => item.kind)).size, 4);
  assert.ok(source.every(item => !('kind' in item)));
});

test('explicit choices and interleaved props are preserved without consuming building slots', () => {
  const source = [{ kind: 'oak' }, { kind: 'spire' }, ...Array.from({ length: 8 }, () => ({})), { kind: 'spire' }];
  const result = assignLandmarkKinds(source, 'another-town', props);
  assert.equal(result[0].kind, 'oak');
  assert.equal(result[1].kind, 'spire');
  assert.equal(result.at(-1).kind, 'spire');
  assert.ok(result.slice(2, 10).every(item => buildings.has(item.kind) && item.kind !== 'spire'));
  assert.equal(new Set(result.slice(2, 10).map(item => item.kind)).size, 8);
});


test('catalogue silhouettes match engine and defaults mix visible shapes', () => {
  for (const item of kinds.filter(k => k.type === 'building')) assert.equal(LANDMARK_SILHOUETTES[item.kind], item.silhouette);
  for (const id of ['alpha', 'beta', 'gamma', 'wujiaxian']) {
    const items = Array.from({ length: 9 }, () => ({}));
    const assigned = assignLandmarkKinds(items, id, props);
    const silhouettes = assigned.map(item => LANDMARK_SILHOUETTES[item.kind]);
    assert.ok(new Set(silhouettes).size >= 5, `${id} has too few silhouette types`);
    const counts = silhouettes.reduce((m, family) => m.set(family, (m.get(family) || 0) + 1), new Map());
    assert.ok(Math.max(...counts.values()) <= 2, `${id} is dominated by one silhouette`);
  }
});

test('builder warns about repeated silhouettes without changing explicit kinds', async () => {
  const { mkdtemp, readFile, rm, writeFile } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const dir = await mkdtemp(join(tmpdir(), 'map-silhouettes-'));
  try {
    const site = { cities: [{ id: 'test', name: 'Test', items: ['library', 'inn', 'school', 'mansion', 'radio'].map((kind, i) => ({ kind, name: `Item ${i}`, url: `https://example.com/${i}` })) }] };
    const input = join(dir, 'site.json'), output = join(dir, 'out');
    await writeFile(input, JSON.stringify(site));
    const result = spawnSync(process.execPath, [new URL('../scripts/build.mjs', import.meta.url).pathname, input, output], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /4 landmarks share the "house" silhouette/);
    const html = await readFile(join(output, 'index.html'), 'utf8');
    for (const item of site.cities[0].items) assert.ok(html.includes(`"kind":"${item.kind}"`));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
