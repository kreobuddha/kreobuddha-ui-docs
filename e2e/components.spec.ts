import { expect, test } from '@playwright/test';

const BUTTON = 'en/components/button/';

test('the reference page carries the props table and the example', async ({ page }) => {
  await page.goto(BUTTON);

  await expect(page.locator('h1')).toHaveText('Button');

  // A prop name is code: `fullWidth` must not be presented as `FULLWIDTH`.
  await expect(page.locator('.props-table tbody th').first()).toHaveText('variant');
  await expect(page.locator('.props-table tbody tr')).not.toHaveCount(0);
  await expect(page.locator('.playground__preview button')).toHaveText('Save changes');

  // The reference is part of the same reading order as the guides.
  await expect(page.locator('.breadcrumbs li')).toContainText(['Home', 'Components', 'Button']);
});

test('driving a control changes both the component and the code', async ({ page }) => {
  await page.goto(BUTTON);

  const code = page.locator('.playground__code code');
  const preview = page.locator('.playground__preview button');

  // Nothing is set, so nothing is written: a default written back says nothing.
  await expect(code).toHaveText('<Button>Save changes</Button>');

  const filled = await preview.evaluate((element) => getComputedStyle(element).backgroundColor);

  await page.locator('.playground__controls select').first().selectOption('outlined');
  await expect(code).toHaveText('<Button variant="outlined">Save changes</Button>');

  /*
   * The prop reached the component and not only the listing beside it. Compared against what the
   * previous variant computed rather than against a colour written here: a hard-coded value would
   * be this suite asserting the library's palette, which is not its business.
   */
  const outlined = await preview.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(outlined).not.toBe(filled);
});

test('a boolean control writes the shorthand and takes the component with it', async ({ page }) => {
  await page.goto(BUTTON);

  const preview = page.locator('.playground__preview button');
  await page.getByText('Loading', { exact: true }).click();

  await expect(page.locator('.playground__code code')).toHaveText(
    '<Button loading>Save changes</Button>',
  );
  await expect(preview).toHaveAttribute('aria-busy', 'true');

  /*
   * Loading keeps the button reachable — the whole reason it is not `disabled`. It is marked with
   * `aria-disabled`, which refuses activation without taking the button out of the tab order, so
   * the check is that focus can still land on it and that the native attribute is absent.
   */
  await preview.focus();
  await expect(preview).toBeFocused();
  await expect(preview).toHaveJSProperty('disabled', false);
});

test('the dialog example opens a real modal and Escape closes it', async ({ page }) => {
  await page.goto('en/components/dialog/');

  const dialog = page.locator('.playground dialog');
  await page.locator('.playground__preview button', { hasText: 'Open the dialog' }).click();
  await expect(dialog).toBeVisible();

  await expect(dialog).toHaveAttribute('aria-labelledby', /.+/);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test.describe('the narrow reference', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 900, 'The table has room above 900.');

  test('the props table becomes one card per prop', async ({ page }) => {
    await page.goto(BUTTON);

    await expect(page.locator('.props-table thead').first()).toBeHidden();
    const row = page.locator('.props-table tbody tr').first();
    expect(await row.evaluate((element) => getComputedStyle(element).display)).toBe('block');
  });
});
