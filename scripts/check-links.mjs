import { readdir, readFile } from 'node:fs/promises';
import { join, posix, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', 'out');

const SKIPPED_DIRECTORIES = new Set(['pagefind', '_next']);

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

function fileFor(pathname, files) {
  const withoutBase = BASE_PATH === '' ? pathname : pathname.slice(BASE_PATH.length);
  const trimmed = withoutBase === '' ? '/' : withoutBase;

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

const files = new Set(await collect());

function detectBasePath(html) {
  const match = /\shref\s*=\s*"([^"]*)\/_next\/static\//.exec(html);
  return match === null ? (process.env.NEXT_PUBLIC_BASE_PATH ?? '') : match[1];
}

const BASE_PATH = detectBasePath(await readFile(join(ROOT, 'en', 'index.html'), 'utf8'));

const pages = new Set(
  [...files].filter(
    (path) => path.endsWith('.html') && !SKIPPED_DIRECTORIES.has(path.split('/')[0]),
  ),
);

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
  const here = `/${posix.dirname(page)}/`.replace('//', '/').replace(/^\/\.\/$/, '/');

  for (const href of attributes(html, HREF)) {
    if (href === '') continue;
    if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(href)) continue;
    if (/^(?:mailto|tel|data|javascript):/i.test(href)) continue;

    const [rawPath, ...fragmentParts] = href.split('#');
    const fragment = fragmentParts.join('#');

    let pathname;
    if (rawPath === '') {
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
