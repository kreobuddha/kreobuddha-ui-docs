# @kreobuddha/ui — documentation site

Guides, a component reference with a live playground and the design tokens for
[`@kreobuddha/ui`](https://github.com/kreobuddha/kreobuddha-ui), in English and Russian.

Live at <https://kreobuddha.github.io/kreobuddha-ui-docs/>.

## Stack

Vite with `vite-react-ssg`, React Router and i18next. MDX content compiled at build time, plain
CSS in cascade layers, Pagefind for search, GitHub Pages for hosting. The site is built with the
library it documents, installed from npm.

## Development

```bash
npm install
npm run start
```

## Build

```bash
npm run build     # static site into build/, then the search index
npm run preview   # serve build/
npm run typecheck # tsc --noEmit, which the build does not do
```

The site is served from a sub-path today and from a bare domain later, so the prefix lives in
`VITE_BASE_PATH`. Links written by hand go through `src/app/utils/links.ts`; Vite prefixes
its own assets.

```bash
VITE_BASE_PATH=/kreobuddha-ui-docs npm run build
```

## Deployment

A push to `master` publishes the site through `.github/workflows/pages.yml`.

## Licence

MIT.
