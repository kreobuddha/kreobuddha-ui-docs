# @kreobuddha/ui — documentation site

The public documentation site for [`@kreobuddha/ui`](https://github.com/kreobuddha/kreobuddha-ui):
guides, a component reference with a live playground, design tokens and a theme editor.

**Status: not deployed. Nine guides and six component pages are written in English, with navigation,
a table of contents, a language switcher, a full narrow-screen layout, light/dark/system themes, a
theme editor, full-text search behind a ⌘K palette and a landing page. The Russian translation of
the content is in progress: `/ru/` routes exist for every page and serve English behind a notice
where the translation has not landed. The numbers under [Verification](#verification) were measured
on a local machine against the production export, not against a deployment.**

## Deliberate constraints

Several things this site does not do are decisions, not gaps. They are listed because the reasoning
is the interesting part:

- **One documented version — the latest.** No version switcher, no versioned URLs, no API diffing.
  A library at 1.x with one consumer does not have a version-skew problem; a docs site with four
  versions of every page has a maintenance one.
- **No documentation engine.** Content handling is written for this site and generalised no
  further. There is no plugin system, no config file describing the content model, no abstraction
  over "a page". One site is not a framework.
- **Props tables are written by hand** through `<PropsTable>`. Extracting them from the library's
  types would couple the site to the library's internals and produce tables that describe the
  implementation rather than the contract. See the comment at the top of
  `components/docs/PropsTable.tsx`.
- **Static export, no server.** No route handlers, no middleware, no ISR. Anything that looks like
  it needs a request — Open Graph images, the search index, syntax highlighting, the token tables —
  is done at build time instead.
- **Cascade layers, and the library imported into one.** `styles/library.css` pulls the library in
  through a CSS `@import … layer(library)` rather than a JavaScript import, because unlayered styles
  beat every layer. The order is `reset, library, site, overrides`, declared alone in
  `styles/layers.css`, and `scripts/check-css-layers.mjs` fails the build if the built output loses
  it.
- **The theme editor is scoped to `.preview-scope`.** It writes tokens onto that element and
  nowhere else, so a reader can build an unreadable theme and still have the page around it —
  including the controls to undo it.
- **One `basePath` variable.** The site runs under `/kreobuddha-ui-docs` today and at a bare domain
  later. Next prefixes what it wrote; everything written by hand goes through `lib/links.ts`, and
  `scripts/check-links.mjs` fails the build on any absolute link that skipped it.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js, App Router, `output: 'export'` |
| Content | MDX through `next-mdx-remote/rsc` |
| Styling | Plain CSS — cascade layers, container queries, `:has` |
| Components | The site is built with `@kreobuddha/ui` itself |
| Search | Pagefind, indexed after the build |
| Hosting | GitHub Pages, deployed by GitHub Actions |

The site consumes the published npm release of the library. It never links to a local
checkout: what the docs show is what a real consumer installs.

## Local development

```bash
npm install
npm run dev
```

A production build writes the static export to `out/`:

```bash
npm run build
npm run serve
```

### `basePath`

The site is served from `https://kreobuddha.github.io/kreobuddha-ui-docs/` today and from a bare
domain later, so the sub-path lives in one variable, `NEXT_PUBLIC_BASE_PATH`. The Pages workflow
takes it from `actions/configure-pages`; a local build leaves it unset and runs from the root. To
reproduce what CI produces:

```bash
NEXT_PUBLIC_BASE_PATH=/kreobuddha-ui-docs npm run build
```

Next prefixes `<Link>` hrefs and its own assets by itself. Anything written by hand goes through
`lib/links.ts`.

### Content

Guides are MDX under `content/<locale>/guides/`, compiled in a server component by
`next-mdx-remote/rsc`. Frontmatter — `title`, `description`, `group`, `order` — is validated when
the file is read, and a missing field stops the build naming the file rather than rendering a page
with a hole in it.

`lib/nav.ts` builds one tree from that frontmatter, and the sidebar, the breadcrumbs and the
prev/next links are all read from it, so the three cannot disagree about where a page sits.

A locale routes to every guide English has. Until a translation exists the page serves English
behind a notice in the reader's own language, which keeps the URLs identical in both locales — that
is what lets the language switcher stay on the current page instead of dropping the reader at an
index.

Code is highlighted by Shiki at build time and token tables are read from the published stylesheet
at build time, so neither ships a byte of JavaScript to the reader.

### Adding a component page

Three steps, and the third is optional:

1. Write `content/en/components/<slug>.mdx` with `title`, `description` and `order` in the
   frontmatter. It appears in the sidebar, in the reading order and in the prev/next links on its
   own — the navigation is built from the files.
2. Fill in `<PropsTable rows={…} />` by hand. The tables are written, not generated: see the
   comment at the top of `components/docs/PropsTable.tsx` for why.
3. To give it a live example, add an entry to `components/docs/playground/specs.tsx` and reference
   it as `<Playground id="<slug>" />`. The code beside the example is written out of the current
   values by `lib/jsx.ts` — there is no compiler in the browser.

Re-export whatever the page renders from `components/ui.ts`, which is the site's client boundary
for the library.

### The landing page

Text leads and a working panel sits beside it: tabs, a form, a status and a progress bar built
from the library, inside `.preview-scope` with a row of theme presets under it. One click repaints
the panel and nothing else on the page — the theme editor demonstrating itself before anyone has
read about it.

The social preview images are drawn at build time by `scripts/og.mjs` — satori for the layout,
resvg for the raster — because a static export has no runtime to draw one on request.

### Search

Pagefind indexes the exported HTML after the build — `npm run build` is `next build` followed by
`pagefind --site out`. Only the article of each page is indexed (`data-pagefind-body`), and each
page carries its locale as a filter, so a search in Russian cannot answer with an English page.

The runtime and the index are fetched the first time the palette is opened and never at load: they
are the largest thing on the site, and a reader who never searches should not pay for them. The
import path is built rather than imported, because the file is written by the build after the
bundler has finished.

The palette is a `<dialog>` — the platform's focus trap and `Escape` again — driven as a combobox:
the arrows move a highlight through the results while focus stays in the field, which is what
`aria-activedescendant` is for. Whatever had focus when it was opened gets it back when it closes.

### Theming

Two levels, and keeping them apart is the point.

**The site's theme** — light, dark or system — is applied by a blocking script at the top of the
document, before anything is painted. Reading the stored choice from React would mean applying it
after the first paint, which is the flash. The script also sets `color-scheme` and the
`theme-color` meta, and the two page colours it uses are read from the library's own stylesheet at
build time rather than written down twice.

**The theme editor** at `/theme` writes tokens onto `.preview-scope` and nowhere else. The library
reads its tokens as inherited custom properties, so a value set on that element reaches every
component inside it and nothing outside — a reader can build something unreadable and still have
the page around it, including the controls to undo it. Contrast is checked against WCAG 2.1 as the
values change (`lib/contrast.ts`), and a theme travels as a URL fragment, which a static site can
do without a server.

### The narrow layout

Below 900px the rail becomes a drawer built on `<dialog>` and `showModal()` — the platform's own
focus trap, `Escape` handling and inert background, rather than a hand-rolled version of each. What
is written by hand is what the platform does not do: dismissing on a click outside or a swipe,
pinning the page behind it so opening the drawer does not throw the reader back to the top, and
suppressing the click that a swipe would otherwise land on a link.

Below 1200px the table of contents folds into a disclosure above the text. The header gets out of
the way when the reader scrolls down and returns on the way up, and stays put whenever focus is
inside it.

### Checks

```bash
npm run typecheck
npm test          # the rules that are awkward to observe in a browser
npm run e2e       # builds the export and drives it at 1280 and at 320
npm run check:css   # the cascade layer order, read from the built stylesheets
npm run check:links # every internal href, fragment and basePath, read from the built HTML
npm run lighthouse  # performance and accessibility budgets, mobile and desktop
```

`npm run e2e` serves `out/` through `scripts/serve-export.mjs`, which imitates GitHub Pages: the
project sub-path, `/x` redirecting to `/x/`, `/x/` resolving to `index.html`, gzip or brotli on
anything textual, and `immutable` caching on the content-hashed assets under `_next/static`. The
last two matter only for Lighthouse, and they matter a lot: without them the same export scores in
the seventies purely because the server is worse than the one it is imitating.

The suite runs with `prefers-reduced-motion: reduce`, which is both what makes position assertions
deterministic and the path least likely to be exercised otherwise.

`npm run lighthouse` expects a build to be there already — `npm run e2e` leaves one — and needs a
Chrome. CI points it at the browser Playwright installed, so the budget is measured against the same
binary the rest of the suite ran on:

```bash
npm run e2e
CHROME_PATH="$(node -e 'console.log(require("playwright-core").chromium.executablePath())')" \
  npm run lighthouse
```

### Accessibility

`e2e/axe.spec.ts` runs axe-core over the landing page, a guide page, a component page, the tokens
page and the theme editor, in both Playwright projects — so every scan happens at 1280 and at 320 —
plus the drawer while it is open, the ⌘K palette with results on screen, a guide page in the dark
theme, and the shell of the theme editor after the preview has deliberately been made unreadable.
The gate is zero `serious` and zero `critical` violations against `wcag2a`, `wcag2aa`, `wcag21a`
and `wcag21aa`.

axe is a floor, not a certificate. It cannot tell whether a name describes its control, whether the
keyboard path through a page makes sense, or whether focus lands anywhere useful. Those are covered
by the rest of the suite — `mobile.spec.ts` tabs thirty times through the open drawer checking focus
never reaches the page behind it, `search.spec.ts` checks the palette gives focus back to whatever
opened it, `theme.spec.ts` checks contrast in every mode — and by the hand checks recorded below.

### Cascade layers

`styles/layers.css` declares the order — `reset, library, site, overrides` — and `styles/library.css`
imports the library's stylesheet into the `library` layer. The library ships no layers of its own,
and unlayered styles beat every layer, so importing it from JavaScript would let it outrank every
rule this site writes. The two files stay separate because a bundler inlines an imported stylesheet
at the top of the file that imports it, which would lift the library above the order statement.

## Verification

Every number below was produced by running the command beside it and reading its output. Nothing
here is an estimate, and nothing describes a deployment — there isn't one yet.

Measured on 2026-08-21, macOS 15 on Apple silicon, Node 24, against the export built by
`npm run build:e2e` and served by `scripts/serve-export.mjs` under `/kreobuddha-ui-docs`.

### Lighthouse

`npm run lighthouse` — Lighthouse 12.6.1, headless Chrome 151 (the binary Playwright installed, so
CI measures the browser the rest of the suite ran on). Three runs per URL, median reported, budget
`≥ 95` on performance and accessibility.

| Page | Profile | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/en/` | mobile | 99 | 100 | 100 | 100 | 1264 ms | 1864 ms | 13 ms | 0.057 |
| `/en/docs/theming/` | mobile | 99 | 100 | 100 | 100 | 1257 ms | 1857 ms | 14 ms | 0.000 |
| `/en/components/button/` | mobile | 99 | 100 | 100 | 100 | 1275 ms | 1875 ms | 13 ms | 0.000 |
| `/en/` | desktop | 100 | 100 | 100 | 100 | 367 ms | 487 ms | 0 ms | 0.000 |
| `/en/docs/theming/` | desktop | 100 | 100 | 100 | 100 | 384 ms | 504 ms | 0 ms | 0.000 |
| `/en/components/button/` | desktop | 100 | 100 | 100 | 100 | 389 ms | 509 ms | 0 ms | 0.000 |

Every one of the nine mobile runs scored 99 and every desktop run 100; the medians are not hiding a
spread. Before this stage the same three pages scored 72, 81 and 80 on mobile — the gap was a
console 404 for a favicon nobody had declared, the font shift below, and a test server that neither
compressed nor cached while the deployment target does both.

The mobile profile is Lighthouse's default: a throttled 4G connection and a 4× CPU slowdown. Those
numbers are not what a reader on a fast connection sees; they are the floor.

The landing page's remaining 0.057 CLS is the last of the web-font shift. A metric-matched fallback
(`styles/base.css`) matches Inter's average advance and its vertical metrics, which took the shift
from **0.206** to **0.057**, but average advance is not per-glyph advance, so a heading can still
re-wrap when the real face arrives. 0.057 is inside Google's "good" band; it is not zero, and saying
so is the point of this section.

### axe

`npm run e2e` (which includes `e2e/axe.spec.ts`) — **0 violations at any impact level**, not only
zero `serious` and `critical`, on all five pages in both projects. Between 25 and 30 axe rules pass
per page.

Three defects were found by the first run and fixed:

- `color-contrast` — `github-light`, the Shiki theme, paints constants in `#E36209`, which is
  **3.48:1** on white where 4.5:1 is required at that size. Now `github-light-high-contrast` and
  `github-dark-high-contrast`.
- `link-name` — below 900px the language links had no accessible name at all. The full name was
  hidden with `display: none`, which removes it from the accessibility tree, and the two-letter code
  beside it is `aria-hidden`. Now clipped out of sight instead of removed.
- `nested-interactive` — each ⌘K result was an `<a>` inside an element with `role="option"`, which
  is two interactive things where the combobox pattern allows one. The role moved onto the anchor.

### Links

`npm run check:links` — **44 exported pages checked, every internal href, every `#fragment` and
every absolute path inside `basePath`.** The check was verified against three deliberately
introduced breaks — an absolute link written without `lib/links.ts`, a link to a route the export
never wrote, and a `#fragment` naming no element — and it caught all three and exited non-zero.

### By hand

Driven in a real browser rather than asserted by a rule engine:

- **Focus is always visible.** A 2px solid accent outline on every stop, at **6.64:1** against the
  header in the light theme and **7.72:1** in the dark one — the WCAG 2.2 minimum for a focus
  indicator is 3:1.
- **Text contrast.** Body text **13.59:1** light, **14.20:1** dark. Prose links **6.63:1** light,
  **7.89:1** dark.
- **The keyboard path.** Tabbed from the top of a guide page and of the theme editor, reading the
  accessible name at each stop: skip link first, then the brand, the header navigation, search, the
  theme control, the language links, then the rail group by group, then the article. No stop
  without a name, no stop without a ring, no trap.
- **No horizontal scroll at 320px.** `document.scrollWidth` is 305 against a 320 viewport on the
  landing page, a guide, a component page, the tokens page and the editor. The only elements wider
  than the viewport are inside `pre` and the tables, which scroll inside their own box on purpose.
- **Semantics.** One `<h1>` and one `<main>` per page; `nav` landmarks for the documentation tree,
  the language switcher, the breadcrumbs, prev/next and the table of contents.

### Known, and not fixed here

- **The library does not honour `prefers-reduced-motion`.** `@kreobuddha/ui@1.x` sets
  `--kreo-duration-*: 0s` inside a `prefers-reduced-motion: reduce` query at byte 4070 of its built
  stylesheet, and then re-declares `--kreo-duration-fast: .12s` in a plain `:root` at byte 36719.
  Same specificity, same layer, later in the file — so the reduce block never applies, and nine
  elements on the landing page still transition under `reduce`, including `transform` and
  `translate` on the switch thumb and the progress indicator. The site's own motion is gated
  correctly (`@media (prefers-reduced-motion: no-preference)` in four stylesheets, and
  `scroll-behavior` measured going from `smooth` to `auto`). This is the library's to fix, and it is
  not patched around here.
- **The library ships Inter with no metric-matched fallback**, which is what the `@font-face` in
  `styles/base.css` compensates for from the outside. A `size-adjust` fallback belongs beside the
  face it stands in for.
- **Four `nav` landmarks share the accessible name "Documentation"** — the header links, the rail,
  the drawer's copy of the rail and the breadcrumbs. A screen reader's landmark list reads the same
  word four times. Not a WCAG failure and not an axe `serious`, but worth distinct names; the fix
  needs new strings in `lib/i18n.ts` in both locales.
- **The rail's group headings are `<h2>` and come before the page's `<h1>` in the source.** Legal,
  and common for a navigation tree, but someone browsing by heading meets five group names before
  the page title.

## Licence

MIT
