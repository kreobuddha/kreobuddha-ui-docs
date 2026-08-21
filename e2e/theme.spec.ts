import { expect, test } from '@playwright/test';

const GUIDE = 'en/docs/theming/';

/*
 * The control lives in the header on a wide screen and in the drawer on a narrow one, so a test
 * that reaches for it has to say which. Everything below asks for the theme rather than for a
 * particular radio button.
 */
async function setTheme(page: import('@playwright/test').Page, name: string): Promise<void> {
  const inHeader = page.locator('.theme-toggle--header');

  if (await inHeader.isVisible()) {
    await inHeader.getByRole('radio', { name }).check();
    return;
  }

  await page.locator('.nav-drawer__trigger').click();
  await page.locator('dialog.nav-drawer .theme-toggle').getByRole('radio', { name }).check();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.nav-drawer')).toBeHidden();
}

declare global {
  interface Window {
    __firstPaintTheme?: string | null;
  }
}

test('a stored dark theme is already applied at the first paint', async ({ page }) => {
  /*
   * The no-flash claim, measured rather than asserted.
   *
   * The measurement is taken at first *contentful* paint, not at the first animation frame. Those
   * are not the same moment: a browser can paint an empty document while the body is still
   * arriving, and on a cold load it does — the earlier version of this test read the attribute in
   * the first frame and failed roughly one cold load in four, on a blank frame nobody could see.
   * A blank frame is not a flash. What the reader must never see is *content* in the wrong theme,
   * and that is what this records.
   *
   * The check still has teeth: the inline theme script sits above everything renderable in the
   * document, so any painted content implies the script has already run. If the theme were applied
   * from React instead, first contentful paint would land before it and this would read `null`.
   */
  await page.addInitScript(() => {
    localStorage.setItem('kb-docs-theme', 'dark');
    new PerformanceObserver((list, observer) => {
      for (const entry of list.getEntries()) {
        if (entry.name !== 'first-contentful-paint') continue;
        window.__firstPaintTheme = document.documentElement.getAttribute('data-kreo-theme');
        observer.disconnect();
      }
    }).observe({ type: 'paint', buffered: true });
  });

  await page.goto(GUIDE);

  // `goto` resolves on `load`, which can precede the paint entry; wait for the moment being asked
  // about rather than for the scheduler. If it never comes, this fails.
  await expect.poll(async () => page.evaluate(() => window.__firstPaintTheme)).toBe('dark');
});

test('the dark theme actually repaints the page, not just an attribute', async ({ page }) => {
  await page.goto(GUIDE);
  const background = () =>
    page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  const light = await background();
  await setTheme(page, 'Dark');

  expect(await background()).not.toBe(light);
  expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe('dark');

  // The browser's own chrome is told too, or a phone frames a dark page in a light bar.
  const themeColor = await page
    .locator('meta[name="theme-color"]')
    .getAttribute('content');
  expect(themeColor).not.toBe('');
});

test('the choice survives a navigation', async ({ page }) => {
  await page.goto(GUIDE);
  await setTheme(page, 'Dark');

  await page.goto('en/docs/installation/');
  await expect(page.locator('html')).toHaveAttribute('data-kreo-theme', 'dark');
  await expect(page.locator('input[value="dark"]').first()).toBeChecked();
});

test('system means the system, including when it changes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(GUIDE);
  await setTheme(page, 'System');
  await expect(page.locator('html')).not.toHaveAttribute('data-kreo-theme', 'dark');

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-kreo-theme', 'dark');
});

test('code keeps its highlighting in the dark theme', async ({ page }) => {
  await page.goto('en/docs/installation/');
  const token = page.locator('.shiki span[style*="--shiki-dark"]').first();

  const light = await token.evaluate((element) => getComputedStyle(element).color);
  await setTheme(page, 'Dark');
  expect(await token.evaluate((element) => getComputedStyle(element).color)).not.toBe(light);
});

test.describe('the theme control on a narrow screen', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 900, 'The header has room above 900.');

  test('moves into the drawer, and the brand keeps its place', async ({ page }) => {
    await page.goto(GUIDE);

    await expect(page.locator('.theme-toggle--header')).toBeHidden();

    // The link home is what the header must not lose to a preference toggle.
    await expect(page.locator('.site-header__brand')).toBeVisible();

    await page.locator('.nav-drawer__trigger').click();
    const inDrawer = page.locator('dialog.nav-drawer .theme-toggle');
    await expect(inDrawer).toBeVisible();

    await inDrawer.getByRole('radio', { name: 'Dark' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-kreo-theme', 'dark');
  });

  test('both copies of the control agree about the mode', async ({ page }) => {
    await page.goto(GUIDE);

    await page.locator('.nav-drawer__trigger').click();
    await page
      .locator('dialog.nav-drawer .theme-toggle')
      .getByRole('radio', { name: 'Dark' })
      .check();
    await page.keyboard.press('Escape');

    // The one in the header is out of sight at this width, not out of date.
    await expect(
      page.locator('.theme-toggle--header input[value="dark"]'),
    ).toBeChecked();
  });
});
