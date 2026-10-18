import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { MemoryCache } from '../src/lib/tse/cache';
import { TseClient } from '../src/lib/tse/client';
import { CONFIG_URL, discoverElection } from '../src/lib/tse/config';
import { geographyUrl, resultUrl } from '../src/lib/tse/urls';
import { readBootCache } from '../src/features/election/first-access/read-boot-cache';
const fixture = (name: string) => JSON.parse(readFileSync(`tests/fixtures/${name}.json`, 'utf8'));
describe('first HTML uses only validated existing cache', () => {
  it('returns honest missing values without requesting or writing upstream data', async () => {
    const cache = new MemoryCache(),
      transport = vi.fn(),
      write = vi.spyOn(cache, 'set');
    const result = await readBootCache(new TseClient(cache, transport));
    expect(result.initial.snapshot).toBeNull();
    expect(result.initial.checkedAt).toBeNull();
    expect(result.regions).toEqual([]);
    expect(transport).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });
  it('preserves cached official timestamp and exact votes without recording new history', async () => {
    const cache = new MemoryCache(),
      transport = vi.fn(),
      raw = fixture('president-br'),
      config = discoverElection(fixture('ele-c'));
    const scope = { type: 'country' as const, code: 'br', state: 'br', name: 'Brasil' },
      checkedAt = Date.parse('2026-10-04T22:00:03-03:00');
    for (const [url, body] of [
      [CONFIG_URL, fixture('ele-c')],
      [geographyUrl(config), fixture('municipalities')],
      [resultUrl(config, scope), raw],
    ] as const)
      await cache.set(url, { body: JSON.stringify(body), etag: null, modified: null, checkedAt });
    const write = vi.spyOn(cache, 'set'),
      result = await readBootCache(new TseClient(cache, transport));
    expect(result.initial.snapshot?.candidates).toHaveLength(12);
    expect(result.initial.checkedAt).toBe(new Date(checkedAt).toISOString());
    expect(result.initial.snapshot?.sourceUrl).toBe(resultUrl(config, scope));
    expect(result.regions.length).toBeGreaterThan(0);
    expect(transport).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });
  it('rejects corrupt cache instead of displaying fabricated results', async () => {
    const cache = new MemoryCache(),
      transport = vi.fn();
    await cache.set(CONFIG_URL, {
      body: '{"wrong":true}',
      etag: null,
      modified: null,
      checkedAt: 1,
    });
    const result = await readBootCache(new TseClient(cache, transport));
    expect(result.initial.snapshot).toBeNull();
    expect(transport).not.toHaveBeenCalled();
  });
});
