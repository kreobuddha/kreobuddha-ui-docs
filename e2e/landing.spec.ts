import { expect, test } from '@playwright/test';

test('the hero leads with the text and carries a working panel', async ({ page }) => {
  await page.goto('en/');

  await expect(page.locator('h1')).toContainText('tools people work in');
  await expect(page.locator('.hero__install code')).toHaveText('npm install @kreobuddha/ui');

  // The panel is the library documenting itself: real controls, not a picture of them.
  const panel = page.locator('.hero-panel__frame');
  await expect(panel.getByRole('tab', { name: 'Deploy' })).toBeVisible();
  await expect(panel.getByLabel('Service')).toHaveValue('atlas-gateway');
});

test('a preset repaints the panel and nothing else on the page', async ({ page }) => {
  await page.goto('en/');

  const panel = page.locator('.hero-panel__frame');
  const button = panel.getByRole('button', { name: 'Deploy' });

  const pageBefore = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const accentBefore = await button.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );

  await page.getByRole('radio', { name: 'Terminal' }).check();

  await expect.poll(() => button.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe(accentBefore);

  // The page around it is untouched — the same scoping the theme editor relies on.
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    pageBefore,
  );
});

test('the panel tabs are the tab pattern, arrows and all', async ({ page }) => {
  await page.goto('en/');

  const panel = page.locator('.hero-panel__frame');
  const deploy = panel.getByRole('tab', { name: 'Deploy' });

  await deploy.focus();
  await expect(deploy).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowRight');
  await expect(panel.getByRole('tab', { name: 'Logs' })).toHaveAttribute('aria-selected', 'true');

  // Only the selected panel is rendered, which is the library's own promise about this component.
  await expect(panel.getByLabel('Service')).toHaveCount(0);

  await page.keyboard.press('Home');
  await expect(deploy).toHaveAttribute('aria-selected', 'true');
});

test('the promises lead somewhere', async ({ page }) => {
  await page.goto('en/');

  const links = page.locator('.promises h2 a');
  await expect(links).toHaveCount(3);

  await links.first().click();
  await expect(page).toHaveURL(/\/en\/docs\/accessibility\/$/);
});

test('the page says what it is to a crawler', async ({ page }) => {
  await page.goto('en/');

  const content = (selector: string) => page.locator(selector).getAttribute('content');

  expect(await content('meta[property="og:title"]')).toBe('@kreobuddha/ui');
  expect(await content('meta[name="twitter:card"]')).toBe('summary');

  await expect(page.locator('link[rel="alternate"][hreflang="ru"]')).toHaveAttribute(
    'href',
    'https://kreobuddha.github.io/kreobuddha-ui-docs/ru/',
  );
});
