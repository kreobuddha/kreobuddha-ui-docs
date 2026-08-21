import { expect, test } from '@playwright/test';

const EDITOR = 'en/theme/';

const preview = '.theme-preview';

test('the editor paints the preview and nothing else', async ({ page }) => {
  await page.goto(EDITOR);

  const shellBefore = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  const previewBefore = await page
    .locator(preview)
    .evaluate((element) => getComputedStyle(element).backgroundColor);

  // The first colour input is the page surface.
  await page.locator('input[type="color"]').first().fill('#123456');

  const previewAfter = await page
    .locator(preview)
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  const shellAfter = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  expect(previewAfter).not.toBe(previewBefore);
  expect(previewAfter).toBe('rgb(18, 52, 86)');

  /*
   * The point of the whole scoping decision: a reader can build something unreadable and still
   * have the page around it — including the controls to undo it.
   */
  expect(shellAfter).toBe(shellBefore);
});

test('a component inside the preview follows the tokens', async ({ page }) => {
  await page.goto(EDITOR);

  const button = page.locator(`${preview} button`).first();
  const background = () =>
    button.evaluate((element) => getComputedStyle(element).backgroundColor);

  const before = await background();

  // The accent is the fifth input: page, card, body, muted, accent.
  await page.locator('input[type="color"]').nth(4).fill('#0a7d55');

  /*
   * Polled rather than read once. The library transitions its colours, so a single read lands
   * somewhere in the middle of the fade and reports a blend of the old accent and the new one.
   */
  await expect.poll(background).toBe('rgb(10, 125, 85)');
  expect(await background()).not.toBe(before);
});

test('the contrast check calls an unreadable pair unreadable', async ({ page }) => {
  await page.goto(EDITOR);

  const bodyOnPage = page.locator('.contrast-list li').filter({ hasText: 'Body on page' });
  await expect(bodyOnPage.locator('.contrast-list__verdict')).not.toHaveAttribute(
    'data-level',
    'fail',
  );

  // Body text and the page surface, set to the same colour: the worst case, and 1.00:1.
  await page.locator('input[type="color"]').first().fill('#808080');
  await page.locator('input[type="color"]').nth(2).fill('#808080');

  await expect(bodyOnPage).toContainText('1.00:1');
  await expect(bodyOnPage.locator('.contrast-list__verdict')).toHaveAttribute('data-level', 'fail');
});

test('a preset moves everything at once, and reset puts it back', async ({ page }) => {
  await page.goto(EDITOR);

  const previewColour = () =>
    page.locator(preview).evaluate((element) => getComputedStyle(element).backgroundColor);

  const original = await previewColour();
  await page.getByRole('button', { name: 'Terminal' }).click();
  const themed = await previewColour();
  expect(themed).not.toBe(original);

  await page.getByRole('button', { name: 'Reset' }).click();
  expect(await previewColour()).toBe(original);
});

test('a theme travels in the link, and the link refuses what it does not recognise', async ({
  page,
}) => {
  await page.goto(`${EDITOR}#theme=accent-500:0a7d55,shadow-overlay:ff0000`);

  const button = page.locator(`${preview} button`).first();
  await expect
    .poll(() => button.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe('rgb(10, 125, 85)');

  // The token that is not on the editor's list never reaches the stylesheet.
  const scope = await page.locator(preview).getAttribute('style');
  expect(scope).not.toContain('shadow-overlay');
});

test('sharing writes the theme into the address, and only what changed', async ({ page }) => {
  await page.goto(EDITOR);
  await page.locator('input[type="color"]').nth(4).fill('#0a7d55');
  await page.getByRole('button', { name: 'Copy link' }).click();

  await expect
    .poll(() => page.evaluate(() => window.location.hash))
    .toBe('#theme=accent-500:0a7d55');
});

test('the exported CSS carries the change', async ({ page }) => {
  await page.goto(EDITOR);
  await page.locator('input[type="color"]').nth(4).fill('#0a7d55');

  await expect(page.locator('.prose pre code').last()).toContainText('--kreo-accent-500: #0a7d55;');
});

test('the preview shows the theme being edited, whatever the site theme is', async ({ page }) => {
  await page.goto(EDITOR);

  const previewColour = () =>
    page.locator(preview).evaluate((element) => getComputedStyle(element).backgroundColor);

  const light = await previewColour();

  // Put the site itself into the dark theme, through whichever control this width offers.
  const inHeader = page.locator('.theme-toggle--header');
  if (await inHeader.isVisible()) {
    await inHeader.getByRole('radio', { name: 'Dark' }).check();
  } else {
    await page.locator('.nav-drawer__trigger').click();
    await page.locator('dialog.nav-drawer .theme-toggle').getByRole('radio', { name: 'Dark' }).check();
    await page.keyboard.press('Escape');
  }

  await expect(page.locator('html')).toHaveAttribute('data-kreo-theme', 'dark');

  // The shell went dark; the panel did not, because it is showing the theme under the cursor and
  // the contrast figures beside it are about that theme.
  await expect.poll(previewColour).toBe(light);
});
