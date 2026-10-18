import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { discoverElection } from '../src/lib/tse/config';
import { normalizeResult } from '../src/lib/tse/normalizers';
import { CandidateColors, buildMapSnapshot, aggregateRegion } from '../src/lib/tse/map-normalizers';
import { MapCoordinator } from '../src/lib/tse/map-coordinator';
import definitions from '../src/lib/tse/map-geography.json';
import geometry from '../src/features/election/map/geometry.json';
import type { ElectionResponse, ElectionSnapshot } from '../src/lib/tse/types';
import type { StateInput } from '../src/lib/tse/map-types';
const fixture = (name: string) => JSON.parse(readFileSync(`tests/fixtures/${name}.json`, 'utf8'));
const config = discoverElection(fixture('ele-c'));
const base = normalizeResult(
  fixture('president-br'),
  config,
  { type: 'country', code: 'br', state: 'br', name: 'Brasil' },
  'https://resultados.tse.jus.br',
);
function snapshot(a = 100, b = 90, version = 'one'): ElectionSnapshot {
  const s = structuredClone(base);
  s.status = 'counting';
  s.version = version;
  s.progress.validVotes = a + b;
  s.progress.totalSections = 100;
  s.progress.countedSections = 20;
  s.candidates = s.candidates.slice(0, 2).map((c, i) => ({
    ...c,
    votes: i ? b : a,
    percentage: ((i ? b : a) / (a + b)) * 100,
    destination: 'Válido',
  }));
  return s;
}
const input = (s: ElectionSnapshot | null, uf = 'pb'): StateInput => ({
  uf,
  name: uf,
  region: 'Nordeste',
  snapshot: s,
  stale: !s,
  issue: null,
});
const response = (s: ElectionSnapshot): ElectionResponse => ({
  snapshot: s,
  status: s.status,
  stale: false,
  issue: null,
  checkedAt: null,
  nextPollMs: 3000,
});
describe('Electoral map', () => {
  it('uses the 60s fallback when EA14 has no signal instead of fetching every cycle', async () => {
    let now = Date.parse(base.progress.generatedAt);
    const state = vi.fn(async () => response(base));
    const coordinator = new MapCoordinator(
      {
        geography: async () => [{ code: 'pb', name: 'PB', municipalities: [] }],
        national: async () => response(base),
        tracking: async () => ({ signals: {}, issue: null }),
        state,
        cachedState: () => response(base),
      },
      [{ uf: 'pb', name: 'PB', region: 'Nordeste' }],
      3000,
      120000,
      () => now,
    );
    await coordinator.read();
    now += 3001;
    await coordinator.read();
    expect(state).toHaveBeenCalledTimes(1);
    now += 60000;
    await coordinator.read();
    expect(state).toHaveBeenCalledTimes(2);
  });
  it('contains exactly the 27 real UF geometries and five regions', () => {
    expect(new Set(geometry.states.map((s) => s.uf)).size).toBe(27);
    expect(geometry.states.every((s) => s.path.startsWith('M') && s.path.length > 100)).toBe(true);
    expect(new Set(definitions.map((s) => s.region)).size).toBe(5);
  });
  it('changes PB leader by absolute votes while preserving candidate colors', () => {
    const colors = new CandidateColors();
    const first = buildMapSnapshot([input(snapshot())], base, colors);
    const next = buildMapSnapshot([input(snapshot(110, 115, 'two'))], base, colors);
    expect(first.states[0].leader?.id).not.toBe(next.states[0].leader?.id);
    expect(first.states[0].marginVotes).toBe(10);
    expect(next.states[0].marginVotes).toBe(5);
    for (const c of first.legend)
      expect(next.legend.find((n) => n.id === c.id)?.color).toBe(c.color);
    expect(next.legend[0].stateCount).toBe(1);
  });
  it('keeps ties, zero and missing data neutral, with honest state timestamps', () => {
    const result = buildMapSnapshot(
      [input(snapshot(10, 10)), input(base, 'rn'), input(null, 'se')],
      base,
      new CandidateColors(),
    );
    expect(result.states.map((s) => s.outcome)).toEqual(['tie', 'waiting', 'missing']);
    expect(result.states.every((s) => !s.leader)).toBe(true);
    expect(result.tiedStates).toBe(1);
    expect(result.waitingStates).toBe(1);
    expect(result.missingStates).toBe(1);
    expect(result.states[0].updatedAt).toBe(base.progress.totaledAt ?? base.progress.generatedAt);
    expect(result.states[2].updatedAt).toBeNull();
  });
  it('sums valid absolute votes rather than averaging percentages', () => {
    const a = snapshot(90, 10),
      b = snapshot(100, 900);
    const colors = new CandidateColors();
    colors.assign(a.candidates);
    const result = aggregateRegion('Nordeste', [input(a), input(b, 'rn')], colors);
    expect(result.validVotes).toBe(1100);
    expect(result.candidates.find((c) => c.id === a.candidates[0].id)?.percentage).toBeCloseTo(
      (190 / 1100) * 100,
    );
    expect(result.countedPercentage).toBe(20);
  });
  it('excludes annulled votes and rejects inconsistent or incomplete regional denominators', () => {
    const s = snapshot(100, 90);
    s.candidates[1].destination = 'Anulado';
    s.progress.validVotes = 100;
    const colors = new CandidateColors();
    colors.assign(s.candidates);
    expect(aggregateRegion('Nordeste', [input(s)], colors).validVotes).toBe(100);
    s.progress.validVotes = 190;
    expect(aggregateRegion('Nordeste', [input(s)], colors).reliable).toBe(false);
    expect(aggregateRegion('Nordeste', [input(s), input(null)], colors).validVotes).toBeNull();
  });
  it('coalesces viewers, reuses unchanged snapshots and only revalidates changed UFs', async () => {
    let now = Date.parse(base.progress.totaledAt ?? base.progress.generatedAt);
    let signal = 'a';
    let current = snapshot();
    const state = vi.fn(async () => response(current));
    const coordinator = new MapCoordinator(
      {
        geography: async () => [{ code: 'pb', name: 'Paraíba', municipalities: [] }],
        national: async () => response(base),
        tracking: async () => ({ signals: { pb: `|${signal}` }, issue: null }),
        state,
        cachedState: () => response(current),
      },
      [{ uf: 'pb', name: 'Paraíba', region: 'Nordeste' }],
      3000,
      90000,
      () => now,
    );
    const [first, concurrent] = await Promise.all([coordinator.read(), coordinator.read()]);
    expect(first).toBe(concurrent);
    expect(state).toHaveBeenCalledTimes(1);
    now += 3001;
    expect(await coordinator.read()).toBe(first);
    expect(state).toHaveBeenCalledTimes(1);
    current = snapshot(110, 115, 'two');
    signal = 'b';
    now += 3001;
    expect((await coordinator.read()).snapshot.states[0].leader?.votes).toBe(115);
    expect(state).toHaveBeenCalledTimes(2);
  });
});
