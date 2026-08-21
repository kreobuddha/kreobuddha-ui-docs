/*
 * Walks the built export and refuses to let a dead internal link ship.
 *
 * It reads `out/`, not the source. A link is only correct once `basePath` has been applied,
 * `trailingSlash` has decided where the file was written, and the MDX has been rendered — none of
 * which a check over the source can see. Three things are asserted, and they fail for different
 * reasons:
 *
 *   1. Every internal href resolves to a file that exists. `trailingSlash: true` means a route is
 *      `<route>/index.html`, so a link that forgets the slash points at nothing that was written.
 *   2. Every `#fragment` names an element that exists in the document it points into — including
 *      the ones written by hand in MDX, which no compiler checks.
 *   3. No absolute internal link escapes `basePath`. A link written as `/en/docs/` instead of
 *      through `lib/links.ts` works perfectly on a bare domain and 404s under the project
 *      sub-path, which is where the site actually lives today. That is the failure mode this
 *      repository is most exposed to, and the only one a local run at the root cannot see.
 *
 * Run it after a build. `npm run check:links` does the build itself.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, posix, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', 'out');

// Pagefind writes its own index and fragment files into the export. They are data for the search
// runtime, not pages, and nothing links to them by href.
const SKIPPED_DIRECTORIES = new Set(['pagefind', '_next']);

/** Every file in the export, as a POSIX path relative to `out/`. */
async function collect(directory = ROOT) {
  const entries = await readdir(directory, { withFileTypes: true });
  const found = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await collect(path)));
    else found.push(relative(ROOT, path).split('\\').join('/'));
  }

  return found;
}

const HREF = /\shref\s*=\s*"([^"]*)"/g;
const ID = /\sid\s*=\s*"([^"]*)"/g;
const NAME = /\sname\s*=\s*"([^"]*)"/g;

function attributes(html, pattern) {
  const found = [];
  for (const match of html.matchAll(pattern)) found.push(decodeHtml(match[1]));
  return found;
}

function decodeHtml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'");
}

/** The file the export wrote for a site-root-relative path, or `null` if it wrote none. */
function fileFor(pathname, files) {
  const withoutBase = BASE_PATH === '' ? pathname : pathname.slice(BASE_PATH.length);
  const trimmed = withoutBase === '' ? '/' : withoutBase;

  // `trailingSlash: true`: a route is a directory with an `index.html` in it.
  const candidate = trimmed.endsWith('/')
    ? `${trimmed}index.html`
    : /\.[a-z0-9]+$/i.test(trimmed)
      ? trimmed
      : null;

  if (candidate === null) return null;

  const relativePath = candidate.replace(/^\//, '');
  return files.has(relativePath) ? relativePath : null;
}

const problems = [];

// Every file, not only the pages: a link may point at an image or at a stylesheet.
const files = new Set(await collect());

/*
 * Read out of the export rather than out of the environment.
 *
 * The whole point of the third check is to catch a link that forgot the sub-path, and taking the
 * sub-path from `NEXT_PUBLIC_BASE_PATH` would mean a caller who forgot to set it gets a run where
 * every escaped link looks fine. Next stamps its own asset URLs with `basePath`, so the export
 * carries the answer; the variable is only a fallback for an export with no assets to read.
 */
function detectBasePath(html) {
  const match = /\shref\s*=\s*"([^"]*)\/_next\/static\//.exec(html);
  return match === null ? (process.env.NEXT_PUBLIC_BASE_PATH ?? '') : match[1];
}

const BASE_PATH = detectBasePath(await readFile(join(ROOT, 'en', 'index.html'), 'utf8'));

// The pages whose links are read. Pagefind's own output is data for the search runtime rather than
// pages, and `_next` is the bundler's — nothing links into either by href.
const pages = new Set(
  [...files].filter(
    (path) => path.endsWith('.html') && !SKIPPED_DIRECTORIES.has(path.split('/')[0]),
  ),
);

/** The ids and `name`s a document offers as fragment targets. */
const targetCache = new Map();
async function targetsOf(relativePath) {
  const cached = targetCache.get(relativePath);
  if (cached !== undefined) return cached;

  const html = await readFile(join(ROOT, relativePath), 'utf8');
  const targets = new Set([...attributes(html, ID), ...attributes(html, NAME)]);
  targetCache.set(relativePath, targets);
  return targets;
}

for (const page of [...pages].sort()) {
  const html = await readFile(join(ROOT, page), 'utf8');
  // `/en/docs/theming/index.html` → `/en/docs/theming/`, which is what a relative href resolves
  // against.
  const here = `/${posix.dirname(page)}/`.replace('//', '/').replace(/^\/\.\/$/, '/');

  for (const href of attributes(html, HREF)) {
    if (href === '') continue;
    // Off-site, or not a document request at all.
    if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(href)) continue;
    if (/^(?:mailto|tel|data|javascript):/i.test(href)) continue;

    const [rawPath, ...fragmentParts] = href.split('#');
    const fragment = fragmentParts.join('#');

    let pathname;
    if (rawPath === '') {
      // A bare `#anchor` points into this same document.
      pathname = null;
    } else if (rawPath.startsWith('/')) {
      if (BASE_PATH !== '' && !rawPath.startsWith(`${BASE_PATH}/`) && rawPath !== BASE_PATH) {
        problems.push(
          `${page}: "${href}" is an absolute link outside the base path — it escaped lib/links.ts ` +
            `and would 404 under ${BASE_PATH}/`,
        );
        continue;
      }
      pathname = rawPath;
    } else {
      /*
       * Resolved the way a browser resolves it, through `URL`. `path.resolve` looks like the right
       * tool and is not: it normalises away the trailing slash, which is the one character that
       * decides whether the export wrote a file for this route.
       */
      pathname = new URL(rawPath, `http://links.invalid${BASE_PATH}${here}`).pathname;
    }

    let target = page;
    if (pathname !== null) {
      const found = fileFor(pathname, files);
      if (found === null) {
        problems.push(`${page}: "${href}" resolves to nothing in the export`);
        continue;
      }
      target = found;
    }

    if (fragment === '') continue;
    // The top of the document; every page has one.
    if (fragment === 'top') continue;
    if (!target.endsWith('.html')) continue;

    const targets = await targetsOf(target);
    if (!targets.has(decodeURIComponent(fragment))) {
      problems.push(`${page}: "${href}" points at #${fragment}, which ${target} does not contain`);
    }
  }
}

if (problems.length > 0) {
  console.error(`Broken links in the export (${problems.length}):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exitCode = 1;
} else {
  console.log(
    `Checked ${pages.size} exported pages under "${BASE_PATH || '/'}": every internal link and ` +
      `fragment resolves.`,
  );
}
