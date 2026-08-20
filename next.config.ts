import type { NextConfig } from 'next';

// GitHub Pages serves this site from a sub-path today and from a bare domain later. Everything
// that has to know about that reads this one variable — see `lib/links.ts` for the parts Next
// does not prefix on its own.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  // Pages serves files, not a Node server: no ISR, no middleware, no route handlers.
  output: 'export',

  basePath,

  // Every route becomes `<route>/index.html`. Without this the export writes `<route>.html`, which
  // works only because Pages happens to try the `.html` extension — trailing slashes make the
  // mapping from URL to file explicit instead.
  trailingSlash: true,

  // The image optimiser needs a server.
  images: { unoptimized: true },

  // A type error must fail the build rather than ship.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
