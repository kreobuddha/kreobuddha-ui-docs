import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { createBrotliCompress, createGzip } from 'node:zlib';

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

const COMPRESSIBLE = new Set([
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  'image/svg+xml',
  'text/plain',
]);

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

  const relative = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, relative);

  try {
    const found = await stat(file);
    if (found.isDirectory()) file = join(file, 'index.html');
  } catch {
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
  const type = TYPES.get(extname(file)) ?? 'application/octet-stream';

  const headers = {
    'content-type': type,
    'cache-control': pathname.startsWith('/_next/static/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate',
  };

  const accepted = String(request.headers['accept-encoding'] ?? '');
  const encoding = COMPRESSIBLE.has(type.split(';')[0])
    ? accepted.includes('br')
      ? 'br'
      : accepted.includes('gzip')
        ? 'gzip'
        : null
    : null;

  if (encoding === null) {
    response.writeHead(200, { ...headers, 'content-length': String(size) });
    createReadStream(file).pipe(response);
    return;
  }

  response.writeHead(200, { ...headers, 'content-encoding': encoding, vary: 'accept-encoding' });
  createReadStream(file)
    .pipe(encoding === 'br' ? createBrotliCompress() : createGzip())
    .pipe(response);
});

server.listen(PORT, () => {
  console.log(`Serving out/ at http://localhost:${PORT}${BASE_PATH}/`);
});
