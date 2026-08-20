'use client';

/*
 * The client boundary for the library.
 *
 * `@kreobuddha/ui` ships no `'use client'` directive, and several of its components — Button among
 * them — call hooks. Imported straight into a server component they fail the build. This module is
 * the one place that marks them as client code, so the rest of the site can keep importing them
 * without every page becoming a client component.
 *
 * It is a workaround, not a design: the directive belongs in the library's own build. Raised
 * separately in the library repository. Re-export a component here only when a page actually uses
 * it, so the client bundle stays the size of what is on screen.
 */
export { Button } from '@kreobuddha/ui';
