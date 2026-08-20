# @kreobuddha/ui — documentation site

The public documentation site for [`@kreobuddha/ui`](https://github.com/kreobuddha/kreobuddha-ui):
guides, a component reference with a live playground, design tokens and a theme editor.

**Status: early. Nine guides are on the site in English, with navigation, a table of contents and
a language switcher. The component reference, the theme editor, search and the mobile drawer are
not built yet.**

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

### Cascade layers

`styles/layers.css` declares the order — `reset, library, site, overrides` — and `styles/library.css`
imports the library's stylesheet into the `library` layer. The library ships no layers of its own,
and unlayered styles beat every layer, so importing it from JavaScript would let it outrank every
rule this site writes. The two files stay separate because a bundler inlines an imported stylesheet
at the top of the file that imports it, which would lift the library above the order statement.

## Licence

MIT
