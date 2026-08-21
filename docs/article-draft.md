# Nine things a documentation site taught me that I did not expect to learn

*Draft. Not published anywhere yet. The numbers in it come from the repository's own
[verification section](../README.md#verification); if any of them changes, this changes with it.*

---

I built a documentation site for a component library I also wrote. Nine guides, six component
pages, two languages, a theme editor, search, a static export on GitHub Pages. On paper it is the
least surprising kind of project there is: the shape of it has been settled for a decade, and every
framework has a template.

What follows is the part that was not settled. Each of these cost between an hour and a day, none
of them is visible in the finished site, and every one of them was invisible in the source code
too — which is why I want to write them down. A bug you can see in a diff teaches you nothing. A
bug that lives in the gap between two correct-looking things is where the interesting knowledge is.

---

## 1. Importing a stylesheet from JavaScript quietly beats every rule you will ever write

The site is built with the library it documents. That is a nice property — the docs cannot drift
from the components, because they *are* the components — and it creates a problem on the first day:
two stylesheets that both have opinions about the same elements.

Cascade layers are the answer. Declare an order, put the library in a low layer, put the site
above it, and the site always wins without a single `!important` or a specificity war.

```css
@layer reset, library, site, overrides;
```

The trap is that **unlayered styles beat every layer**. Not "beat the low ones" — beat all of them,
including `overrides`. A layer is a demotion, and anything that never opted in stays above the
whole ladder. So this:

```js
import '@kreobuddha/ui/styles.css';
```

does not put the library anywhere. It puts it *on top*, permanently, and nothing you write in
`site` can reach it. The fix is a CSS import that names a layer:

```css
@import '@kreobuddha/ui/styles.css' layer(library);
```

Which then produced the second half of the problem. Layers are ordered by first appearance, and a
bundler inlines an imported stylesheet at the top of the file that imports it. Put the `@layer`
statement and the `@import` in the same file and the bundler hoists the library's block above the
order statement — so `library` registers itself first, `reset` lands *after* it, and you have a
reset that loses to the library. Nothing looks wrong. Every file is valid CSS. The order is simply
inverted in the output.

Two files, one line each, and a script that reads the *built* stylesheet and fails if the order
statement does not come first. That last part matters more than the fix: the failure is a property
of the bundler's output, not of the source, so only a check that reads the output can see it. It
was confirmed against the broken arrangement before being committed — it fails there and passes
here. A guard you have never seen fail is a guard you are trusting on faith.

## 2. MDX silently dropped every expression prop, and nothing failed

Four of the guides render token tables:

```mdx
<TokenTable tokens={['--kreo-accent-500', '--kreo-accent-600']} />
```

Every one of them rendered all 135 tokens the library publishes.

`next-mdx-remote` strips JavaScript expressions from MDX unless you turn them on, because its usual
job is rendering untrusted input and an expression is code. Perfectly reasonable. The consequence
is that string props survive and expression props do not — so `tokens` arrived as `undefined`, the
component fell back to "no filter", and rendered everything.

Nothing threw. Nothing warned. The page was longer than intended and otherwise correct-looking, and
the only way to notice was to know what the number should have been.

The lesson I actually took is not about MDX. It is that **a component whose "no argument" case is a
useful default is a component that cannot report being called wrongly.** If `<TokenTable />` with no
`tokens` had thrown instead of showing everything, the misconfiguration would have surfaced on the
first build. Defaults are a cost, and the cost is paid in silence.

## 3. IntersectionObserver delivers nothing in a hidden document

The table of contents highlights the section you are reading. The obvious implementation is an
`IntersectionObserver` over the headings, and that is what I wrote.

It worked in a browser and did nothing in a headless test — every assertion about the active
heading failed, with no error anywhere. `IntersectionObserver` does not fire while the document is
hidden, which is the state a headless browser leaves it in by default. The observer was not broken;
it was correctly doing nothing.

The interesting bit is what the fix revealed. The observer was never doing the work. The active
heading is computed from the headings' rectangles either way — the observer was only the *trigger*
for recomputing. So it came out, a scroll listener went in, and the decision itself moved into a
pure function:

```ts
activeHeading(headings: Rect[], scrollY: number, headerHeight: number): string | null
```

Which is now unit-tested at the top of the page, at the bottom, on a heading resting exactly on the
line, and across a jump that skips several sections at once — the cases that are miserable to
arrange in a browser and trivial to arrange in an array.

I have started treating "this is awkward to test" as information rather than as an obstacle. It
usually means a decision is tangled up with the mechanism that delivers it, and untangling them is
worth doing for its own sake.

## 4. `<dialog>` is the drawer, and the interesting work is everything it does not do

Below 900px the navigation rail becomes a drawer. I used `<dialog>` and `showModal()`, which gives
you the focus trap, `Escape`, the inert background and the top layer for free — the four things
hand-rolled drawers reliably get subtly wrong.

Then Playwright found four defects in the part I still had to write, and none of them were visible
in the source:

- Locking the page behind the drawer with `overflow: hidden` on the root **clamps the scroll offset
  to zero**. Opening the drawer threw the reader to the top of the guide they were reading, and
  closing it left them there. The body is pinned at a negative offset instead, and the position is
  handed back on close.
- `showModal()` moves focus, and moving focus scrolls the page. By the time an effect could read
  the scroll position worth saving, it was already gone.
- The browser's own link dragging cancels the pointer stream, so the swipe-to-dismiss died whenever
  a finger happened to land on a link rather than between two.
- A swipe that ends on top of a link makes the browser follow it. Dismissing is not choosing.

I also tried pointer capture for the swipe and reverted it: capturing on the dialog retargets the
release event, and every link in the drawer becomes dead text.

The pattern in all four is the same. The platform gives you a large, correct piece of behaviour,
and the bugs move to the seam between that piece and yours. That is an argument *for* using the
platform piece — the seam is smaller than the whole thing — but not an argument that the seam is
free.

## 5. A theme editor must not be able to lock the reader out

The site has a theme editor: change a token, watch the components repaint. The obvious
implementation writes to `:root`. The obvious implementation also lets a reader set text and
background to the same colour and lose the entire page — including the controls that would undo it.

So the editor writes to `.preview-scope` and nowhere else. The library reads its tokens as
inherited custom properties, so a value set on that element reaches every component inside it and
nothing outside. Someone can build something unreadable and still have their navigation.

The constraint turned out to be load-bearing in a way I did not plan. Because it is a scope rather
than a global, the same mechanism gave the landing page a hero panel with four theme presets under
it — one click repaints the panel and nothing else on the page. The theming feature demonstrating
itself, above the fold, before the reader has found the page that explains it. I did not design
that; it fell out of refusing to write to `:root`.

Two smaller things from the same stage:

- **Write every editable token to the scope, not only the changed ones.** Writing only the changes
  left the rest inherited from the site's theme, so a reader in dark mode saw a dark panel while
  the contrast figures beside it described the light values being edited. Correct arithmetic,
  describing a thing that was not on screen.
- **A theme travels as a URL fragment, and a fragment written by a stranger is filtered.** A token
  the editor does not offer, or a value that is not a colour, is dropped rather than written into
  a stylesheet. A link is untrusted input even when it looks like a feature.

## 6. Satori takes the first font face that matches and does not look further

The social preview images are drawn at build time — satori for the layout, resvg for the raster —
because a static export has no runtime to draw one on request.

Both locales need Cyrillic. So I registered the Cyrillic subset as a second face of the same
family, `Inter`, exactly as `@font-face` does it in a browser.

The Russian image came out as a row of `NO GLYPH` boxes.

Satori is not a browser. Given a family and a weight it takes the first face that matches and does
not fall through to the next one when a glyph is missing. In CSS, multiple faces of one family with
different `unicode-range` values is the *correct* way to do this. In satori, falling back has to be
expressed as a font-*family* list.

I keep this one because of how convincing the wrong mental model was. The API accepted the input,
the types were satisfied, and the concept — one family, several subsets — is the standard one.
It was the one place where knowing CSS well made the bug harder to find.

## 7. A keystroke can arrive before anything is listening for it

Two search tests pressed ⌘K once and asserted the palette opened. They passed on my machine and
failed in CI.

There is no defect in the palette. A keyboard shortcut cannot work before the script that listens
for it has run, and on a loaded machine a keystroke sent immediately after navigation lands in that
gap and is simply lost. Nothing can catch a key before it is listening.

The helper presses again rather than waiting a fixed time, and gives each press its own moment
before deciding it went nowhere — pressing immediately would toggle the palette shut as often as it
opened it.

What I like about this one is that the honest fix was to change the test and change nothing about
the site. The temptation to "fix" the palette — to attach the listener earlier, to buffer keys, to
add a loading state — was strong, and every version of it would have added code to work around a
gap that is a property of the universe rather than of the palette.

The same stage produced its mirror image: `build:e2e` called `next build` directly and produced an
export with no search index. The palette catches a missing index and says nothing rather than
throwing at someone who pressed a shortcut — good behaviour — so locally, where an index was left
over from an earlier build, everything passed. CI started from nothing and found nothing. **A
deliberate silence in production is a deliberate silence in your tests too.**

## 8. Lighthouse was measuring my test server, not my site

At the quality stage the three main pages scored **72, 81 and 80** on mobile. That was a genuine
surprise: a static export with almost no JavaScript on the critical path should not be in the
seventies.

Three causes, and only one of them was the site.

**A favicon nobody had declared.** With no `<link rel="icon">`, every browser asks the *origin* for
`/favicon.ico` — the origin, not the sub-path the site is deployed under. Under a `basePath` that
is a guaranteed 404 on every page load. Lighthouse counts it as a console error, and it is one.

**A test server worse than the deployment.** My little static file server sent no `Content-Encoding`
and no `Cache-Control`. GitHub Pages sends both. 425 KiB of text was arriving uncompressed over a
throttled 4G connection, which is most of a 4.9 s Largest Contentful Paint for a paragraph of text.
Adding gzip and brotli and `immutable` on the content-hashed assets did not make the site faster; it
stopped the harness from lying about it.

That distinction is worth sitting with. It is very easy to "improve performance" by fixing the
measurement, and the difference between that and cheating is entirely whether the deployment target
really behaves the way your harness now does. Mine does, and the README says so out loud, which is
the only thing that makes the claim checkable by someone else.

**One real defect: a 0.206 layout shift from the web font.** The library ships Inter with
`font-display: swap` and no metric-matched fallback, so the first paint uses whatever comes next in
the stack and every line re-sets when the woff2 lands. On the landing page the hero panel visibly
dropped down the screen.

The fix is a fallback face carrying Inter's metrics, and I insisted on measuring rather than copying
the numbers from a blog post: Inter and Helvetica rendered at 1000px in a real browser and read
back. Inter sits 0.969em above the baseline and 0.241em below it, with no line gap, and its average
advance over a full alphabet is 1.0432× Helvetica's. So the fallback is scaled by that ratio and the
overrides are Inter's metrics divided by it, because the overrides apply *after* `size-adjust`.

That took the shift from **0.206 to 0.057**. Not to zero — average advance is not per-glyph advance,
so a heading can still re-wrap when the real face arrives. Final numbers: **99 on mobile and 100 on
desktop** for performance, **100 for accessibility**, on all three pages, median of three runs.

## 9. axe finds real bugs and cannot tell you whether the page is usable

Running axe over five pages, at two widths, with the drawer open and the palette open, found three
`serious` violations. All three were real:

- **`color-contrast`.** `github-light`, the Shiki syntax theme, paints constants in `#E36209` —
  **3.48:1** on white, where 4.5:1 is required at that size. Every code block on every guide page.
  I had looked at those blocks hundreds of times.
- **`link-name`.** Below 900px the language links had no accessible name *at all*. The full name
  was hidden with `display: none`, which removes it from the accessibility tree, and the two-letter
  code beside it is `aria-hidden`. The comment above that rule said "the full name is still what a
  screen reader reads." The comment was wrong, and had been wrong since the day it was written.
- **`nested-interactive`.** Each search result was an `<a>` inside an element with `role="option"` —
  two interactive things where the combobox pattern allows one.

That third one is the one I would have argued about a year ago. It works fine with a mouse and fine
with a keyboard; you have to be using a screen reader in browse mode to meet a link inside a row
that claims to be the row. The fix was to move the role onto the anchor, which is *better* code —
the option is now the link rather than a wrapper around one, and it keeps middle-click and
open-in-new-tab.

And then the part axe cannot do. After it was green I still had to drive the pages by hand, and
the things that only that turns up:

- Four `nav` landmarks share the accessible name "Documentation" — the header links, the rail, the
  drawer's copy of the rail, and the breadcrumbs. A screen reader's landmark list reads the same
  word four times. Not a violation of anything. Still bad.
- The rail's group headings are `<h2>` and come before the page's `<h1>` in the source order, so
  someone browsing by heading meets five group names before the page title.
- The library's `prefers-reduced-motion` support does not work, and the reason is a *cascade* bug
  rather than a missing rule: it sets `--kreo-duration-*: 0s` inside the media query at byte 4070
  of its built stylesheet and then re-declares `--kreo-duration-fast: .12s` in a plain `:root` at
  byte 36719. Same specificity, same layer, later in the file. The reduce block is dead code. I
  found it by measuring computed durations under emulated `reduce` and not believing the answer.

The focus ring measures **6.64:1** against the header in the light theme and **7.72:1** in the dark
one, against a 3:1 requirement. Body text is **13.59:1** and **14.20:1**. Those are hand-measured
numbers, and they exist because "accessible" is a claim and a claim needs a number behind it.

---

## What I would tell myself at the start

**Check the output, not the source.** Three of these — the layer inversion, the dropped MDX props,
the broken reduced-motion rule — are invisible in the code and obvious in the built artefact. The
checks that earned their place in CI are the ones that read `out/`.

**Silence is the expensive failure mode.** Every bug here that took more than an hour was a thing
that did not throw: a filter that became "no filter", an observer that correctly did nothing, a
media query that was overwritten later in the same file, a font that fell back to boxes. Loud
failures are cheap.

**Measure the harness before you trust it.** Twenty-something Lighthouse points were a property of
my file server. It is worth asking, of every number you are about to act on, what would have to be
true of the *measuring apparatus* for it to be wrong.

**When the fix is a comment, the comment was the bug.** "The full name is still what a screen
reader reads" was written by someone who believed it — me — and it had never been true. A comment
asserting a behaviour is a test that never runs.
