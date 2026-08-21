# @kreobuddha/ui — documentation site

Guides, a component reference with a live playground and the design tokens for
[`@kreobuddha/ui`](https://github.com/kreobuddha/kreobuddha-ui), in English and Russian.

Live at <https://kreobuddha.github.io/kreobuddha-ui-docs/>.

## Stack

Next.js with `output: 'export'`, MDX content, plain CSS in cascade layers, Pagefind for search,
GitHub Pages for hosting. The site is built with the library it documents, installed from npm.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # static export into out/, then the search index
npm run serve   # serve out/ the way Pages serves it
```

The site is served from a sub-path today and from a bare domain later, so the prefix lives in
`NEXT_PUBLIC_BASE_PATH`. Links written by hand go through `lib/links.ts`; Next prefixes the rest.

```bash
NEXT_PUBLIC_BASE_PATH=/kreobuddha-ui-docs npm run build
```

## Deployment

A push to `master` publishes the site through `.github/workflows/pages.yml`.

## Licence

MIT.
