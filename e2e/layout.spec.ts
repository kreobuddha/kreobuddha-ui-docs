import { expect, test } from '@playwright/test';

const GUIDE = 'en/docs/theming/';
const HEAVY = 'en/docs/colour-tokens/';

/*
 * The page itself must never scroll sideways. Code blocks and tables may, and they are the only
 * two things allowed to, so the check compares the document against the viewport rather than
 * looking for wide elements — a table inside its own scroller is wide on purpose.
 */
async function pageOverflow(page: import('@playwright/test').Page) {
  return page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
}

/*
 * Russian is checked at the same widths as English rather than trusted to behave like it: the
 * words are longer, and this test exists precisely to catch the one that does not fit.
 */
for (const path of ['en/', 'en/docs/', GUIDE, HEAVY, 'ru/', 'ru/docs/colour-tokens/']) {
  test(`no horizontal page scroll at ${path}`, async ({ page }) => {
    await page.goto(path);
    const { documentWidth, viewportWidth } = await pageOverflow(page);
    expect(documentWidth).toBeLessThanOrEqual(viewportWidth);
  });
}

test('the skip link is the first stop and moves focus to the main landmark', async ({ page }) => {
  await page.goto(GUIDE);
  await page.keyboard.press('Tab');

  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  // Hidden until focused, and genuinely on screen once it is.
  await expect(skip).toBeInViewport();

  await page.keyboard.press('Enter');
  await expect(page.locator('main#content')).toBeFocused();
});

test('a wide table scrolls inside itself and not with the page', async ({ page }) => {
  await page.goto(HEAVY);
  const scroller = page.locator('.table-scroll').first();
  const scrolls = await scroller.evaluate(
    (element) => element.scrollWidth > element.clientWidth || getComputedStyle(element).overflowX === 'auto',
  );
  expect(scrolls).toBe(true);
});

test.describe('the wide layout', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1200, 'The rail and the contents need room.');

  test('keeps the rail, the contents and no drawer trigger', async ({ page }) => {
    await page.goto(GUIDE);

    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.toc__panel')).toBeVisible();
    await expect(page.locator('.nav-drawer__trigger')).toBeHidden();

    // The open guide is the current page, and says so rather than only looking different.
    await expect(page.locator('.sidebar a[aria-current="page"]')).toHaveText('Theming');
  });

  test('the contents are above the text where the rail is gone', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.goto(GUIDE);

    const toc = (await page.locator('.toc').boundingBox())!;
    const prose = (await page.locator('.prose').boundingBox())!;
    expect(toc.y).toBeLessThan(prose.y);
  });
});
