import { defaultLocale, type Locale } from './i18n';

// Next prefixes `basePath` onto `<Link>` hrefs and onto its own assets by itself. It does not
// prefix anything we write by hand: `fetch` of a JSON file, an `<a>` in raw HTML, an Open Graph
// URL in metadata. Those go through here, so moving to a bare domain stays a change of one
// environment variable.
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** An absolute-from-the-site-root path, prefixed with `basePath`. */
export function asset(path: string): string {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalised}`;
}

/** A route inside a locale. Pass to `<Link>`, which adds `basePath` itself. */
export function route(locale: Locale = defaultLocale, path = ''): string {
  const normalised = path === '' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalised}`;
}
