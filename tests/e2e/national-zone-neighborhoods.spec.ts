import { expect, test } from '@playwright/test';

test('city and zone deep links show nationally sourced neighborhoods across regions', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1366, height: 768 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // Neighborhood metadata remains available even when zone results are unavailable.
  await page.route('**/api/election/president/zones?*', (route) =>
    route.fulfill({ status: 503, json: { error: 'Controlled outage' } }),
  );
  for (const [uf, municipality, zone, neighborhood] of [
    ['sp', '71072', '0001', 'Bela Vista'],
    ['rj', '60011', '0004', 'Botafogo'],
    ['am', '02550', '0001', 'Cachoeirinha'],
    ['ba', '38490', '0001', 'Canela'],
    ['rs', '88013', '0001', 'Centro Histórico'],
    ['df', '97012', '0001', 'Asa Sul'],
    ['pb', '19810', '0017', 'Catolé'],
  ]) {
    await page.goto(`/?state=${uf}&municipality=${municipality}&zone=${zone}`);
    await expect(page.locator('#conteudo')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator(`.zone-row[data-zone="${zone}"]>b`)).toHaveText(neighborhood);
    await expect(page.locator('.zone-tooltip')).toContainText(neighborhood);
    await expect(page.locator('.zones-list a')).toHaveText('Locais de votação · TSE (2026)');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.locator('.zone-row').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'outputs/national-zone-neighborhoods-1366.png' });
  expect(errors).toEqual([]);
});
