# @kreobuddha/ui — documentation site

The public documentation site for [`@kreobuddha/ui`](https://github.com/kreobuddha/kreobuddha-ui):
guides, a component reference with a live playground, design tokens and a theme editor.

**Status: early. What is deployed is the scaffold — routing, the cascade layer order and the
deployment pipeline. There is no documentation on the site yet.**

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

### Cascade layers

`styles/layers.css` declares the order — `reset, library, site, overrides` — and `styles/library.css`
imports the library's stylesheet into the `library` layer. The library ships no layers of its own,
and unlayered styles beat every layer, so importing it from JavaScript would let it outrank every
rule this site writes. The two files stay separate because a bundler inlines an imported stylesheet
at the top of the file that imports it, which would lift the library above the order statement.

## Licence

MIT
