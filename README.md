# @kreobuddha/ui — documentation site

The public documentation site for [`@kreobuddha/ui`](https://github.com/kreobuddha/kreobuddha-ui):
guides, a component reference with a live playground, design tokens and a theme editor.

**Status: early. Nine guides and six component pages are on the site in English, with navigation, a
table of contents, a language switcher, a full narrow-screen layout, light/dark/system themes and a
theme editor. Search is not built yet.**

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
npm run check:css # the cascade layer order, read from the built stylesheets
```

`npm run e2e` serves `out/` through `scripts/serve-export.mjs`, which imitates GitHub Pages: the
project sub-path, `/x` redirecting to `/x/`, and `/x/` resolving to `index.html`. The suite runs
with `prefers-reduced-motion: reduce`, which is both what makes position assertions deterministic
and the path least likely to be exercised otherwise.

### Cascade layers

`styles/layers.css` declares the order — `reset, library, site, overrides` — and `styles/library.css`
imports the library's stylesheet into the `library` layer. The library ships no layers of its own,
and unlayered styles beat every layer, so importing it from JavaScript would let it outrank every
rule this site writes. The two files stay separate because a bundler inlines an imported stylesheet
at the top of the file that imports it, which would lift the library above the order statement.

## Licence

MIT
