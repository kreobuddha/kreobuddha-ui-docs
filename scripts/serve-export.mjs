/*
 * Serves `out/` the way GitHub Pages serves it, which is the point: under the project sub-path,
 * with `/x` redirecting to `/x/` and `/x/` resolving to `/x/index.html`.
 *
 * The end-to-end run needs the production shape rather than a convenient one. Serving the export
 * from the root would test a site that is never deployed, and `basePath` breaking links is exactly
 * the failure this is meant to catch.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../out/', import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 4173);
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const TYPES = new Map(
  Object.entries({
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.woff2': 'font/woff2',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.txt': 'text/plain; charset=utf-8',
  }),
);

const send = (response, status, body = '') => {
  response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(body);
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);

  if (BASE_PATH !== '') {
    if (pathname === BASE_PATH) {
      response.writeHead(308, { location: `${BASE_PATH}/` });
      response.end();
      return;
    }
    if (!pathname.startsWith(`${BASE_PATH}/`)) {
      send(response, 404, 'Outside the base path.');
      return;
    }
    pathname = pathname.slice(BASE_PATH.length);
  }

  // `..` in a request must never reach `join`.
  const relative = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, relative);

  try {
    const found = await stat(file);
    if (found.isDirectory()) file = join(file, 'index.html');
  } catch {
    // A path with no file may still be a route the export wrote with a trailing slash.
    file = `${file}.html`;
  }

  try {
    await stat(file);
  } catch {
    response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    createReadStream(join(ROOT, '404.html')).pipe(response);
    return;
  }

  const { size } = await stat(file);
  response.writeHead(200, {
    'content-type': TYPES.get(extname(file)) ?? 'application/octet-stream',
    'content-length': String(size),
  });
  createReadStream(file).pipe(response);
});

server.listen(PORT, () => {
  console.log(`Serving out/ at http://localhost:${PORT}${BASE_PATH}/`);
});
