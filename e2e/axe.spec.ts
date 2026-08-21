import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/*
 * The automated half of the accessibility check.
 *
 * axe finds a narrow class of defects very reliably and says nothing about the rest, so this file
 * is a floor, not a certificate: it cannot see whether a name describes the control, whether the
 * keyboard path through the page makes sense, or whether focus lands somewhere useful. Those are
 * driven by hand and by the other specs — `mobile.spec.ts` walks the drawer's focus trap,
 * `search.spec.ts` walks the palette's, `theme.spec.ts` checks contrast in every mode.
 *
 * It runs in both projects, so every page is scanned at 1280 and at 320: a violation can exist at
 * one width and not the other — a control that only appears in the narrow layout, a target that
 * only overlaps when the column is 320 wide.
 */

// WCAG 2.1 AA, which is what the site claims. `best-practice` is deliberately left out: it carries
// opinions (heading order in an isolated fragment, `region` on a landing page) that are not the
// standard and would make the gate mean something other than what it says.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** The severities the project gates on. `minor` and `moderate` are reported, not enforced. */
const BLOCKING = new Set(['serious', 'critical']);

type Violation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

function describe(violations: Violation[]): string {
  return violations
    .map(
      (violation) =>
        `${violation.impact}: ${violation.id} — ${violation.help}\n` +
        violation.nodes.map((node) => `    ${node.target.join(' ')}`).join('\n'),
    )
    .join('\n');
}

/**
 * Scans and asserts. Returns the non-blocking violations so a caller can look at them; the run
 * fails on anything `serious` or `critical`.
 */
async function scan(page: Page, options: { include?: string } = {}): Promise<Violation[]> {
  let builder = new AxeBuilder({ page }).withTags(TAGS);
  if (options.include !== undefined) builder = builder.include(options.include);

  const { violations } = await builder.analyze();

  const blocking = violations.filter((violation) => BLOCKING.has(violation.impact ?? ''));
  // Compared as text rather than as objects: a failed `toEqual` on axe's result prints several
  // hundred lines of nested checks, and the one thing a reader of the failure needs is the rule
  // and the selector.
  expect(describe(blocking), 'axe found blocking violations').toBe('');

  return violations;
}

/*
 * Presses the shortcut until the palette opens — the same reason as in `search.spec.ts`: a
 * keystroke sent before the listener is attached is simply lost, and pressing once makes the test
 * flaky rather than the palette wrong.
 */
async function openPalette(page: Page): Promise<void> {
  const palette = page.locator('dialog.palette');

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (await palette.isVisible()) return;
    await page.keyboard.press('ControlOrMeta+k');
    try {
      await palette.waitFor({ state: 'visible', timeout: 500 });
      return;
    } catch {
      // The next turn presses again.
    }
  }

  await expect(palette, 'the palette never opened').toBeVisible();
}

const PAGES = [
  { name: 'the landing page', path: 'en/' },
  { name: 'a guide page', path: 'en/docs/theming/' },
  { name: 'a component page', path: 'en/components/button/' },
  { name: 'the tokens page', path: 'en/tokens/' },
  { name: 'the theme editor', path: 'en/theme/' },
];

for (const { name, path } of PAGES) {
  test(`${name} has no serious or critical violations`, async ({ page }) => {
    await page.goto(path);
    await scan(page);
  });
}

/*
 * Every scan above runs in the light theme, because that is what a fresh profile gets. Dark is a
 * second set of colours over the same markup, and contrast is the one rule that cannot be inferred
 * from the light run — the guide pages carry syntax highlighting, which is a whole palette that
 * swaps with the theme.
 */
test('a guide page in the dark theme has no serious or critical violations', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('en/docs/theming/');
  await expect(page.locator('html')).toHaveAttribute('data-kreo-theme', 'dark');

  await scan(page);
});

test('the palette has no serious or critical violations while open', async ({ page }) => {
  await page.goto('en/docs/theming/');

  await openPalette(page);
  // Scanning an empty result list would scan a dialog that is barely there. Typing gives axe the
  // combobox in the state a reader actually sees it in: options rendered, one of them active.
  await page.locator('.palette__input').fill('theme');
  await expect(page.locator('.palette__results [role="option"]').first()).toBeVisible();

  await scan(page);
});

test('the drawer has no serious or critical violations while open', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) >= 900, 'The rail is still there above 900.');

  await page.goto('en/docs/theming/');
  await page.locator('.nav-drawer__trigger').click();
  await expect(page.locator('dialog.nav-drawer')).toBeVisible();

  await scan(page);
});

/*
 * The theme editor is the one place on the site where a reader can deliberately build something
 * unreadable, and the editor's whole promise is that doing so costs them the preview and not the
 * page. axe on the default theme cannot see that promise being kept, so this scans the shell after
 * the preview has been ruined: whatever the preview now says, the navigation around it must still
 * pass.
 */
test('a ruined preview theme leaves the shell passing', async ({ page }) => {
  await page.goto('en/theme/');

  const inputs = page.locator('input[type="color"]');
  // Page surface and body text, both set to the same colour: nothing inside the preview can be
  // read any more.
  await inputs.first().fill('#7f7f7f');
  await inputs.nth(2).fill('#7f7f7f');

  await scan(page, { include: '.site-header' });
});
