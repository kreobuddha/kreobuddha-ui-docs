import { expect, test } from '@playwright/test';

test.describe('table of contents', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1200, 'The rail is a disclosure below 1200.');

  test('follows the reader down the page and back up', async ({ page }) => {
    await page.goto('en/docs/theming/');

    const active = page.locator('.toc a[aria-current="true"]');
    const ids = await page.locator('.prose :is(h2, h3)').evaluateAll((elements) =>
      elements.map((element) => element.id),
    );
    expect(ids.length).toBeGreaterThan(2);

    // At the top the first heading is marked rather than nothing.
    await expect(active).toHaveAttribute('href', `#${ids[0]}`);

    /*
     * Each heading is scrolled to just under the sticky header — the exact position the rule is
     * about — rather than merely into view, which could leave it anywhere on the screen and make
     * the expected answer a matter of opinion.
     */
    for (const id of ids.slice(1)) {
      const reached = await page.evaluate((headingId) => {
        const heading = document.getElementById(headingId)!;
        const target = heading.getBoundingClientRect().top + window.scrollY - 60 + 2;
        window.scrollTo(0, target);
        // The last section can be shorter than the screen, so the page may refuse to go that far.
        return Math.abs(window.scrollY - target) < 2;
      }, id);

      if (!reached) break;
      await expect(active).toHaveAttribute('href', `#${id}`);
    }

    // At the very bottom the last heading wins, however short its section.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(active).toHaveAttribute('href', `#${ids[ids.length - 1]}`);

    // And back to the top.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(active).toHaveAttribute('href', `#${ids[0]}`);
  });

  test('clicking an entry lands under the sticky header, not behind it', async ({ page }) => {
    await page.goto('en/docs/theming/');

    const entry = page.locator('.toc a').nth(2);
    const id = (await entry.getAttribute('href'))!.slice(1);
    await entry.click();

    const box = await page.locator(`#${id}`).boundingBox();
    const headerHeight = await page
      .locator('.site-header')
      .evaluate((element) => element.getBoundingClientRect().height);

    expect(box!.y).toBeGreaterThanOrEqual(headerHeight - 1);
  });
});
