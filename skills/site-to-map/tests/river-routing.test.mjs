import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, routeRiverAroundTowns, strSeed } from '../engine/world-gen.js';

function minDistance(points, x, z) {
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const [ax, az] = points[i - 1], [bx, bz] = points[i], dx = bx - ax, dz = bz - az, length = dx * dx + dz * dz;
    const t = length ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / length)) : 0;
    best = Math.min(best, Math.hypot(ax + dx * t - x, az + dz * t - z));
  }
  return best;
}
function check(world, towns) {
  for (const river of world.rivers) for (let i = 0; i < towns.length; i++) {
    const p = world.townPos[i], required = Math.max(towns[i].rx, towns[i].rz) * 1.25 + river.w + 1.2;
    assert.ok(minDistance(river.pts, p.cx, p.cz) >= required - .01, `river crosses town ${i} (${world.type}, seed ${world.seed})`);
  }
}
const noise = { vnoise: (x, z) => (Math.sin(x * 12.9898 + z * 78.233) * 43758.5453 % 1 + 1) % 1, fbm: () => .5, ridge: () => .5 };

test('river routing avoids whole segments even when control points are outside', () => {
  const towns = [{ cx: 0, cz: 0, rx: 4.45, rz: 4.45 }, { cx: 13, cz: 2, rx: 4, rz: 4 }];
  const points = [[-20, 0], [-8, 2], [8, 1], [24, 2]];
  const path = routeRiverAroundTowns(points, towns, .8);
  for (const t of towns) assert.ok(minDistance(path, t.cx, t.cz) >= Math.max(t.rx, t.rz) * 1.25 + .8 + 1.2);
  assert.deepEqual(path[0], points[0]); assert.deepEqual(path.at(-1), points.at(-1));
});

test('generated rivers clear towns across seeds, sizes and world types', () => {
  for (const count of [3, 6, 9]) for (const type of ['coast', 'twoCoasts', 'island', 'gulf', 'lakeland']) for (let seed = 1; seed <= 4; seed++) {
    const slots = ['center', 'coast', 'south', 'east', 'highland'];
    const towns = Array.from({ length: count }, (_, i) => ({ slot: slots[i] || 'town', rx: 4.45, rz: 4.45 }));
    check(makeWorld({ type, seed: strSeed(`route-${seed}`) }, towns, noise), towns);
  }
});

test('Pedro test seed keeps rivers clear of every town', () => {
  const towns = ['center', 'coast', 'south'].map(slot => ({ slot, rx: 4.45, rz: 4.45 }));
  check(makeWorld({ seed: strSeed('pedro-trial-b') }, towns, noise), towns);
});

test('a river source or mouth inside a town is moved outside before routing', () => {
  const town = { cx: 0, cz: 0, rx: 4.45, rz: 4.45 };
  const path = routeRiverAroundTowns([[0, 0], [5, 0], [20, 0]], [town], .8);
  const clearance = 4.45 * 1.25 + .8 + 1.2;
  assert.ok(Math.hypot(...path[0]) > clearance);
  assert.ok(minDistance(path, town.cx, town.cz) >= clearance);
});
