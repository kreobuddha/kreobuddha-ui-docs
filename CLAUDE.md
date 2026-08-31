# Kreobuddha UI Docs

The documentation site for `@kreobuddha/ui`. A portfolio project: the craft is the point as much
as the content.

## Communication

- Talk to Rustam in Russian. Write the repository in English.
- State assumptions and continue. Ask only when the answer changes the URL structure or the stack.
- Keep it short. Prose that explains code belongs in a commit message, not beside the code.

## Scope

- One documented version — the latest. No version switcher, no API diffing.
- No documentation engine. This is one site, not a framework for others.
- Props tables are written by hand through `<PropsTable>`. No type extraction.
- Two locales, `en` and `ru`, both fully translated.
- Static output only. GitHub Pages serves files.

## Guardrails

- The library's stylesheet is imported through a CSS `@import` with `layer(library)`, never from
  JavaScript. Layer order: `reset, library, site, responsive, overrides` — nothing checks this
  any more. `responsive` exists so a co-located component stylesheet cannot outrank the
  adaptive rules, whatever order the module graph loads it in.
- Internal links written by hand go through the `basePath` helper in `src/app/utils/links.ts`.
- No styling engine, no CSS-in-JS, no component library besides `@kreobuddha/ui`.
- The library is an npm dependency, never a local path or a link. It is never edited from here.

## Comments

The repository carries twenty-three comments and one bundler directive, listed in the pull
requests that removed the rest. Each marks a place where the obvious fix is wrong. Do not add another without
saying why in the pull request.

## Confidentiality

Never reproduce code, APIs, tokens, styles, documentation or structure from any employer-owned
source. General knowledge applies only through an original implementation.

## Git

- Commits, branches, pull requests and deployments happen when Rustam asks for that exact action.
- Work reaches `master` through a pull request. A push to `master` publishes the site.
- Never rewrite history.

## Verification

There is no test suite. `npm run build` and `npm run typecheck` are the only automatic checks:
the build catches broken imports, `typecheck` catches types — the build strips them without
looking. Everything past that is looked at in a browser: claim only what was run and observed.
Accessibility is semantics, names, keyboard, focus, visible state, contrast and reduced motion.
Check 320 px before calling a layout done.
