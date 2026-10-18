import { configSchema, geographySchema } from './schemas';
import type { ElectionConfig, Geography } from './types';
export const CONFIG_URL = 'https://resultados.tse.jus.br/oficial/comum/config/ele-c.json';
export function discoverElection(input: unknown): ElectionConfig {
  const data = configSchema.parse(input);
  const contest = data.pl.find(
    (p) => p.dt === '04/10/2026' && p.c === 'ele2026' && p.cd === '3220',
  );
  const election = contest?.e.find(
    (e) => e.t === '1' && e.abr.some((a) => a.cd === 'br' && a.cp.some((c) => Number(c.cd) === 1)),
  );
  if (!contest || !election || election.cd !== '6257')
    throw new Error('Election configuration not published or changed');
  return {
    cycle: contest.c,
    contest: contest.cd,
    election: election.cd,
    office: '0001',
    turn: election.t,
    directories: Object.fromEntries(data.arq.map((a) => [a.tp, a.dir])),
  };
}
export function normalizeGeography(input: unknown): Geography[] {
  return geographySchema
    .parse(input)
    .abr.map((a) => ({
      code: a.cd,
      name: a.ds,
      municipalities: a.mu.map((m) => ({ code: m.cd, name: m.nm, ...(m.cdi ? { ibge: m.cdi } : {}), ...(m.z ? { zones: m.z } : {}) })),
    }));
}
