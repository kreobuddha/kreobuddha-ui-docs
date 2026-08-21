import { expect, test } from '@playwright/test';

const GUIDE = 'en/docs/theming/';

/*
 * Presses the shortcut until the palette actually opens.
 *
 * A keyboard shortcut cannot work before the script that listens for it has run, and on a loaded
 * machine a keystroke sent immediately after navigation lands in that gap and is simply lost. It is
 * not a defect in the palette — nothing can catch a key before it is listening — but it makes a
 * test that presses once flaky, so this presses again rather than waiting a fixed time.
 */
async function openPalette(page: import('@playwright/test').Page): Promise<void> {
  const palette = page.locator('dialog.palette');

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (await palette.isVisible()) return;

    await page.keyboard.press('ControlOrMeta+k');

    // Give this press its chance before deciding it was lost. Pressing again immediately would
    // toggle the palette shut as often as it opened it.
    try {
      await palette.waitFor({ state: 'visible', timeout: 500 });
      return;
    } catch {
      // Swallowed on purpose: the next turn of the loop presses again.
    }
  }

  await expect(palette, 'the palette never opened').toBeVisible();
}

test('the shortcut opens the palette and Escape gives focus back', async ({ page }) => {
  await page.goto(GUIDE);

  const palette = page.locator('dialog.palette');
  await expect(palette).toBeHidden();

  // Focus somewhere in the page, the way a reader would already be somewhere when they search.
  const link = page.locator('.prose__body a').first();
  await link.focus();

  await openPalette(page);
  await expect(page.locator('.palette__input')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(palette).toBeHidden();

  // Back where they were, not at the top of the document.
  await expect(link).toBeFocused();
});

test('the trigger gets focus back too', async ({ page }) => {
  await page.goto(GUIDE);

  const trigger = page.locator('.palette-trigger');
  await trigger.click();
  await expect(page.locator('dialog.palette')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('typing finds pages, and the arrows move through them without leaving the field', async ({
  page,
}) => {
  await page.goto(GUIDE);
  await openPalette(page);

  const input = page.locator('.palette__input');
  await input.fill('installation');

  const options = page.locator('.palette__results li');
  await expect(options.first()).toBeVisible();
  await expect(page.locator('.palette__status')).toContainText('results');

  // The first row is current, and the field still has focus: that is what a combobox is.
  await expect(options.first()).toHaveAttribute('aria-selected', 'true');
  await expect(input).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(options.first()).toHaveAttribute('aria-selected', 'false');
  await expect(input).toBeFocused();

  // What a screen reader is told is current has to be what is marked.
  const activeId = await input.getAttribute('aria-activedescendant');
  await expect(page.locator(`#${activeId}`)).toHaveAttribute('aria-selected', 'true');
});

test('Enter goes to the highlighted page', async ({ page }) => {
  await page.goto(GUIDE);
  await openPalette(page);
  await page.locator('.palette__input').fill('installation');

  await expect(page.locator('.palette__results li').first()).toBeVisible();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/en\/docs\/installation\/$/);
});

test('a search in one language does not answer with the other', async ({ page }) => {
  await page.goto('ru/docs/theming/');
  await openPalette(page);
  await page.locator('.palette__input').fill('installation');

  const links = page.locator('.palette__results li a');
  await expect(links.first()).toBeVisible();

  for (const href of await links.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('href') ?? ''),
  )) {
    expect(href).toContain('/ru/');
  }
});

test('a search that matches nothing says so', async ({ page }) => {
  await page.goto(GUIDE);
  await openPalette(page);
  await page.locator('.palette__input').fill('zzzzqqqq');

  await expect(page.locator('.palette__status')).toContainText('Nothing matched');
  await expect(page.locator('.palette__results li')).toHaveCount(0);
});

test('the index is not fetched until someone searches', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto(GUIDE);
  expect(requests.some((url) => url.includes('/pagefind/'))).toBe(false);

  await openPalette(page);
  await page.locator('.palette__input').fill('theming');
  await expect(page.locator('.palette__results li').first()).toBeVisible();

  expect(requests.some((url) => url.includes('/pagefind/pagefind.js'))).toBe(true);
});
