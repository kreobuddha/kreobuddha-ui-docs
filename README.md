# @kreobuddha/ui — documentation site

The public documentation site for [`@kreobuddha/ui`](https://github.com/kreobuddha/kreobuddha-ui):
guides, a component reference with a live playground, design tokens and a theme editor.

**Status: early. Nothing is deployed yet beyond the deployment pipeline itself.**

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

## Licence

MIT
