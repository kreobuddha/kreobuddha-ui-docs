import { expect, test } from '@playwright/test';

/*
 * Two guides and two component pages, chosen because they exercise the two collections and the two
 * URL shapes the site serves. Every page under `/ru/` is translated, so the check is the same
 * everywhere: Cyrillic prose, no fallback notice, and `lang` telling the truth about it.
 */
const RU_PAGES = ['ru/docs/theming/', 'ru/docs/introduction/', 'ru/components/button/', 'ru/components/toast/'];

const CYRILLIC = /[А-Яа-яЁё]/;

test.describe('the Russian locale', () => {
  for (const path of RU_PAGES) {
    test(`${path} is translated rather than served in English`, async ({ page }) => {
      await page.goto(path);

      // The notice is the site admitting it fell back to English. Under `/ru/` there is nothing
      // left for it to admit.
      await expect(page.locator('.fallback-notice')).toHaveCount(0);

      await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
      // The prose carries its own `lang`, and it is the one a screen reader reads the body in.
      await expect(page.locator('.prose__body')).toHaveAttribute('lang', 'ru');

      const heading = await page.locator('main h1').innerText();
      const body = await page.locator('.prose__body').innerText();
      // A component page is titled `Button`, which is Latin on purpose — the API name is not
      // translated. The body is where the translation has to show.
      expect(body).toMatch(CYRILLIC);
      expect(heading.length).toBeGreaterThan(0);
    });
  }

  test('switching language keeps the reader on the same document', async ({ page }) => {
    await page.goto('en/docs/accessibility/');

    const englishHeading = await page.locator('main h1').innerText();
    expect(englishHeading).toBe('Accessibility');

    // At 320 the switch lives in the drawer rather than in the header, so the reader opens it
    // first. Two widths, one switch, and the same guarantee about where it lands.
    const openDrawerIfNarrow = async () => {
      const trigger = page.locator('.nav-drawer__trigger');
      if (await trigger.isVisible()) await trigger.click();
    };

    await openDrawerIfNarrow();
    await page.locator('.locale-switcher a[hreflang="ru"]:visible').first().click();

    await expect(page).toHaveURL(/\/ru\/docs\/accessibility\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(page.locator('main h1')).toHaveText('Доступность');
    await expect(page.locator('.fallback-notice')).toHaveCount(0);

    // And back again, to the same document rather than to an index.
    await openDrawerIfNarrow();
    await page.locator('.locale-switcher a[hreflang="en"]:visible').first().click();
    await expect(page).toHaveURL(/\/en\/docs\/accessibility\/$/);
    await expect(page.locator('main h1')).toHaveText(englishHeading);
  });

  test('the sidebar and the chrome are Russian too, not only the prose', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop', 'The rail is a drawer on the narrow layout.');

    await page.goto('ru/docs/theming/');

    await expect(page.locator('.sidebar a[aria-current="page"]')).toHaveText('Темизация');
    await expect(page.locator('.toc')).toContainText('Содержание');
  });
});
