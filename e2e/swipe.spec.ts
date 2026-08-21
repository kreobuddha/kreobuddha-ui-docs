import { expect, test } from '@playwright/test';

/*
 * The swipe that dismisses the drawer, driven by a pointer rather than a finger.
 *
 * Chrome's touch emulation claims a horizontal drag for panning and cancels the pointer stream
 * before the release arrives, so the gesture cannot be driven through the emulated touchscreen at
 * all. What is verified here is the handler: press, travel far enough, release, and the drawer
 * closes. The touch path itself — `touch-action: pan-y` and the pointer capture that back it —
 * is not covered, and a real finger on a real phone is still the only thing that proves it.
 */
test.use({ viewport: { width: 320, height: 640 }, isMobile: false, hasTouch: false });

test.skip(({ viewport }) => (viewport?.width ?? 0) >= 900, 'The drawer only exists below 900.');

test('a drag back towards the edge closes the drawer', async ({ page }) => {
  await page.goto('en/docs/theming/');
  await page.locator('.nav-drawer__trigger').click();

  const drawer = page.locator('dialog.nav-drawer');
  await expect(drawer).toBeVisible();

  await page.mouse.move(200, 400);
  await page.mouse.down();
  await page.mouse.move(60, 405, { steps: 8 });
  await page.mouse.up();

  await expect(drawer).toBeHidden();

  // A swipe ends on top of whatever link happens to be under the finger. Dismissing is not
  // choosing, so the page must not have moved.
  await expect(page).toHaveURL(/\/en\/docs\/theming\/$/);
});

test('a short drag is a fumbled tap, not a dismissal', async ({ page }) => {
  await page.goto('en/docs/theming/');
  await page.locator('.nav-drawer__trigger').click();

  const drawer = page.locator('dialog.nav-drawer');

  /*
   * Started on a section heading rather than on a link, so that what a short drag does — behave
   * like a press on whatever is under it — stays readable: the section collapses, and the drawer
   * is still open. On a link the same gesture would follow the link, which is also correct and
   * would tell us nothing about the threshold.
   */
  const heading = page.locator('.nav-drawer .nav-tree__group h2 button').first();
  await expect(heading).toHaveAttribute('aria-expanded', 'true');
  const box = (await heading.boundingBox())!;

  await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 40, box.y + box.height / 2 + 2, { steps: 4 });
  await page.mouse.up();

  await expect(drawer).toBeVisible();
  await expect(heading).toHaveAttribute('aria-expanded', 'false');
});
