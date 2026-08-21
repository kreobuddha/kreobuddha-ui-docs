import { expect, test } from '@playwright/test';

const GUIDE = 'en/docs/theming/';

test.describe('the narrow layout', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 900, 'The rail is still there above 900.');

  test('the rail is replaced by a drawer, not shrunk', async ({ page }) => {
    await page.goto(GUIDE);

    await expect(page.locator('.sidebar')).toBeHidden();

    const trigger = page.locator('.nav-drawer__trigger');
    await expect(trigger).toBeVisible();

    // A finger, not a cursor.
    const box = (await trigger.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('the drawer traps focus, closes on Escape and gives focus back', async ({ page }) => {
    await page.goto(GUIDE);

    const trigger = page.locator('.nav-drawer__trigger');
    const drawer = page.locator('dialog.nav-drawer');

    await trigger.click();
    await expect(drawer).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    /*
     * Tabbing far enough to go round the drawer twice, and checking every stop.
     *
     * The guarantee is not that focus never leaves the dialog element — a modal dialog in Chrome
     * passes through the document once on its way round, and through the browser's own chrome
     * beyond that. It is that focus never reaches the page behind: not the header, not the
     * article, not a link in either. That is what makes the background inert.
     */
    for (let step = 0; step < 30; step += 1) {
      await page.keyboard.press('Tab');
      const where = await page.evaluate(() => {
        const active = document.activeElement;
        const drawer = document.querySelector('dialog.nav-drawer')!;
        const inDrawer = drawer.contains(active);
        return {
          inDrawer,
          // The drawer is rendered inside the header, so "behind" means anything focusable that is
          // not part of the drawer itself.
          inPage:
            active !== null &&
            !inDrawer &&
            (document.querySelector('.site-header')!.contains(active) ||
              document.querySelector('main#content')!.contains(active)),
        };
      });
      expect(where.inPage, `focus reached the page behind the drawer after ${step + 1} tabs`).toBe(
        false,
      );
      if (!where.inDrawer) {
        // Having passed through the document, the next stop has to be back inside.
        await page.keyboard.press('Tab');
        const back = await page.evaluate(() =>
          document.querySelector('dialog.nav-drawer')!.contains(document.activeElement),
        );
        expect(back, 'focus did not return to the drawer').toBe(true);
      }
    }

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('the page behind the drawer stays where it was', async ({ page }) => {
    await page.goto(GUIDE);

    /*
     * Down the page, then a nudge back up — which is what a reader does, and what brings the
     * auto-hiding header back within reach. Without the nudge the trigger is off screen and the
     * click scrolls the page to reach it, which is the state this test is trying to measure.
     */
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(page.locator('.site-header')).toHaveAttribute('data-hidden', 'false');

    const before = await page.evaluate(() => window.scrollY);
    expect(before).toBeGreaterThan(0);

    const article = page.locator('.prose');
    const positionBefore = (await article.boundingBox())!.y;

    await page.locator('.nav-drawer__trigger').click();

    // The page is pinned, so its content has not moved on screen …
    expect((await article.boundingBox())!.y).toBeCloseTo(positionBefore, 0);

    // … and cannot be scrolled from behind the drawer.
    await page.evaluate(() => window.scrollTo(0, 1200));
    expect((await article.boundingBox())!.y).toBeCloseTo(positionBefore, 0);

    // Closing hands the position back rather than dropping the reader at the top.
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog.nav-drawer')).toBeHidden();
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('a click outside the panel closes the drawer', async ({ page }) => {
    await page.goto(GUIDE);
    await page.locator('.nav-drawer__trigger').click();

    const drawer = page.locator('dialog.nav-drawer');
    await expect(drawer).toBeVisible();

    // The far edge of the screen is backdrop, never panel: the panel is at most 85vw.
    await page.mouse.click(315, 400);
    await expect(drawer).toBeHidden();
  });

  test('following a link closes the drawer and navigates', async ({ page }) => {
    await page.goto(GUIDE);
    await page.locator('.nav-drawer__trigger').click();
    await page.locator('dialog.nav-drawer a', { hasText: 'Installation' }).click();

    await expect(page).toHaveURL(/\/en\/docs\/installation\/$/);
    await expect(page.locator('dialog.nav-drawer')).toBeHidden();
  });

  test('the contents fold into a disclosure above the text', async ({ page }) => {
    await page.goto(GUIDE);

    const toggle = page.locator('.toc__toggle');
    const panel = page.locator('.toc__panel');

    await expect(toggle).toBeVisible();
    await expect(panel).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(panel).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Choosing an entry closes it again: the reader asked to go somewhere, not to keep a list open.
    await panel.locator('a').first().click();
    await expect(panel).toBeHidden();
  });

  test('the header gets out of the way going down and comes back going up', async ({ page }) => {
    await page.goto(GUIDE);
    const header = page.locator('.site-header');

    await expect(header).toHaveAttribute('data-hidden', 'false');

    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(header).toHaveAttribute('data-hidden', 'true');

    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(header).toHaveAttribute('data-hidden', 'false');

    // Near the top it is always there, whichever way the last move went.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(header).toHaveAttribute('data-hidden', 'false');
  });

  test('the token table becomes cards when its column is too narrow for one', async ({ page }) => {
    await page.goto('en/docs/colour-tokens/');

    const head = page.locator('.token-table thead').first();
    await expect(head).toBeHidden();

    const row = page.locator('.token-table tbody tr').first();
    const display = await row.evaluate((element) => getComputedStyle(element).display);
    expect(display).toBe('block');
  });
});
