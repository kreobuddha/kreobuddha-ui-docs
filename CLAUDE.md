# Kreobuddha UI Docs

The public documentation site for the `@kreobuddha/ui` component library. It is a portfolio
project: its purpose is to demonstrate frontend craft — navigation, contents, mobile, theming,
i18n, accessibility and performance — as much as to document the library.

The repository is early-stage unless its current files prove otherwise. Never describe it as
deployed, complete or adopted without evidence.

## Communication

- **Talk to Rustam in Russian. Write the repository in English** — code, identifiers, filenames,
  commits, documentation and site content.
- Do not translate error messages, API names or established terms when that would cost precision.
- Ambiguity that could change the public URL structure, the stack or the repository state: one
  focused question. Anything else: state the assumption and continue.

## Scope

The plan of record lives outside this repository and Rustam holds it. What it settles:

- **One version of the library is documented — the latest.** No versioned docs, no version
  switcher, no API diffing. This was decided and is not to be reopened.
- **No documentation engine.** This is one site, not a framework for others. Do not generalise
  content handling into a reusable engine.
- **Props tables are written by hand** through a `<PropsTable>` component. No type extraction.
- Two locales, `en` and `ru`, both fully translated.
- Static export only. No server routes, no middleware, no ISR — GitHub Pages serves files.

## Architecture guardrails

- The site is built with `@kreobuddha/ui`. Its stylesheet is imported through a CSS `@import`
  with `layer(library)` — unlayered styles beat every layer, so a plain JS import would let the
  library override the site everywhere. Layer order: `reset, library, site, overrides`.
- The theme editor changes tokens **only inside `.preview-scope`**, never the shell. An
  unreadable theme must never cost the reader their navigation.
- Every internal link goes through the `basePath`-aware helper. The site runs under
  `/kreobuddha-ui-docs` today and at a bare domain later; that must be one variable.
- Server components by default. A component becomes client-side only when it holds state.
- No styling engine, no CSS-in-JS, no component library besides `@kreobuddha/ui`.

## The library is a dependency, not a sibling

- The site installs the **published npm release** of `@kreobuddha/ui`. Never a local tarball,
  `file:` path or `npm link`. If a component is missing, the answer is to wait for a release.
- Never edit the library from this repository. A needed change there is raised as a separate task
  in the library's own repository.

## Confidentiality

Private knowledge bases and files outside this repository are not project sources. Never copy or
reproduce code, APIs, tokens, styles, documentation, assets or structure from any employer-owned
source. General knowledge may be applied only through an original implementation.

## Verification

- Never claim a command passed unless it was run and its output was observed.
- Never claim accessibility conformance, performance or browser support without the measurement
  that backs it.
- Accessibility is not an axe result: verify semantics, names, keyboard behaviour, focus, visible
  state, contrast and reduced motion.
- Check responsive behaviour at 320 px before calling a layout done.

## Git and external actions

- Do not create commits, branches, tags, pushes, pull requests or deployments unless Rustam asks
  for that exact action.
- Work happens on `feat/`, `fix/`, `docs/`, `chore/` or `ci/` branches and reaches `master`
  through a pull request. No release branches — the site has no versions.
- A push to `master` publishes the site. Treat it as a release, not as a save.
- Never rewrite history or use destructive Git commands.

## Completion report

Finish each task in Russian with: what changed, which files, decisions and assumptions, the exact
verification commands and their results, remaining risks, and the smallest sensible next step.
