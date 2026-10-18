import { test, expect } from '@playwright/test';

test('entry counts visibly while preserving official text, then stops exactly at the result', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const samples: { value: string; official: string }[] = [];
    Object.assign(window, { entrySamples: samples });
    const timer = setInterval(() => {
      const layer = document.querySelector<HTMLElement>(
        '.cockpit-top-two .cockpit-candidate>b [data-entry-counter]',
      );
      if (layer)
        samples.push({
          value: layer.dataset.countValue ?? '',
          official: layer.parentElement?.textContent ?? '',
        });
    }, 30);
    addEventListener('pagehide', () => clearInterval(timer));
  });
  await page.goto('/');
  await expect(page.locator('#conteudo')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.first-access-controller')).toHaveAttribute(
    'data-entry-counting',
    'complete',
    { timeout: 15000 },
  );
  const samples = await page.evaluate(
    () =>
      (window as unknown as { entrySamples: { value: string; official: string }[] }).entrySamples,
  );
  expect(samples.length).toBeGreaterThan(2);
  const numbers = samples.map((sample) =>
    Number(sample.value.replaceAll('.', '').replace(',', '.')),
  );
  const official = Number(samples[0].official.replace('%', '').replace(',', '.'));
  expect(numbers.some((value) => value > 0 && value < official)).toBe(true);
  expect(new Set(samples.map((sample) => sample.official)).size).toBe(1);
  expect(numbers.at(-1)).toBeGreaterThan(numbers[0]);
  await expect(page.locator('.cockpit-top-two .cockpit-candidate>b').first()).toHaveText(
    samples[0].official,
  );
  await expect(page.locator('.cockpit-top-two [data-entry-counter]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ampliar mapa', exact: true }).click();
  await page.waitForTimeout(200);
  expect(errors).toEqual([]);
});

test('reduced motion displays official values without counting', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#conteudo')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.first-access-controller')).toHaveAttribute(
    'data-entry-counting',
    'complete',
  );
  await expect(page.locator('[data-entry-counter]')).toHaveCount(0);
  await expect(page.locator('.cockpit-top-two .cockpit-candidate>b').first()).toHaveText(
    /\d+,\d+%/,
  );
});
