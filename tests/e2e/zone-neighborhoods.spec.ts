import { test, expect } from '@playwright/test';
for (const width of [1440, 390]) {
  test(`João Pessoa names zones by reference neighborhood at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/?state=pb&municipality=20516&zone=0070');
    await expect(page.locator('#conteudo')).toHaveAttribute('data-ready', 'true');
    for (const [zone, name] of [
      ['0001', 'Torre'],
      ['0064', 'Cristo Redentor'],
      ['0070', 'Mangabeira I'],
      ['0076', 'Bancários'],
      ['0077', 'Gramame'],
    ]) {
      await expect(page.locator(`.zone-row[data-zone="${zone}"]>b`)).toHaveText(name);
    }
    await expect(page.locator('.zone-tooltip')).toContainText('Mangabeira I');
    await expect(page.locator('.zone-tooltip')).toContainText('70ª zona');
    await expect(page.locator('.zones-list')).toContainText(
      'cada zona pode abranger outros bairros',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.locator('.cockpit-map')).toHaveAttribute('data-animating', 'false');
    await page.locator('.zone-row').first().scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `outputs/zone-neighborhoods-${width}.png`,
      fullPage: width < 769,
    });
  });
}
