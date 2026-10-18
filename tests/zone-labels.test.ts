import { expect, test } from 'vitest';
import { zoneLabel, zoneNeighborhood } from '../src/features/election/cockpit/zone-labels';
import labels from '../data/geography/zone-neighborhoods.json';
import audit from '../data/geography/zone-neighborhoods-audit.json';
test('neighborhood references remain scoped to their municipality and preserve unknown zone numbers', () => {
  expect(
    ['0001', '0064', '0070', '0076', '0077'].map((zone) => zoneLabel('pb', '20516', zone)),
  ).toEqual(['Torre', 'Cristo Redentor', 'Mangabeira I', 'Bancários', 'Gramame']);
  expect(zoneLabel('pb', '20516', '9999')).toBe('Zona 9999');
  expect(zoneLabel('sp', '20516', '0070')).toBe('Zona 70');
  expect(zoneNeighborhood('pb', 'other-city', '0070')).toBeUndefined();
});

test('official neighborhood metadata covers all 5571 municipalities and 27 UFs without mixing zone identities', () => {
  const keys = Object.keys(labels);
  expect(new Set(keys.map((key) => key.split('/')[0])).size).toBe(27);
  expect(new Set(keys.map((key) => key.split('/').slice(0, 2).join('/'))).size).toBe(5571);
  expect(keys).toHaveLength(6106);
  for (const [key, name] of Object.entries(labels)) {
    expect(key).toMatch(/^[a-z]{2}\/\d{5}\/\d{4}$/);
    expect(name.length).toBeGreaterThan(0);
    expect(name).not.toContain('\uFFFD');
    const ranked = (audit.zones as unknown as Record<string, [string, number][]>)[key];
    expect(ranked[0][0]).toBe(name);
    expect(ranked.every(([, voters]) => voters <= ranked[0][1])).toBe(true);
  }
  expect(zoneLabel('sp', '71072', '0001')).toBe('Bela Vista');
  expect(zoneLabel('rj', '60011', '0004')).toBe('Botafogo');
  expect(zoneLabel('am', '02550', '0001')).toBe('Cachoeirinha');
  expect(zoneLabel('df', '97012', '0001')).toBe('Asa Sul');
});
