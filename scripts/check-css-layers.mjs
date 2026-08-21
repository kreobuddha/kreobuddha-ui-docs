/*
 * Guards the one cascade fact the whole stylesheet architecture rests on, against the one way it
 * has already broken.
 *
 * The library declares no layers of its own, so it is imported into `library` from CSS. But a
 * bundler inlines an imported stylesheet at the top of the file that imports it, and layers are
 * ordered by first appearance — so an `@import` sharing a file with the order statement lifts
 * `@layer library { … }` above it, registers `library` first, and silently pushes `reset` behind
 * the library. Nothing fails, no rule looks wrong, and the reset simply stops resetting.
 *
 * The check reads the built CSS rather than the source, because the source is not where the
 * reordering happens.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = 'out';
const ORDER = /@layer\s+reset\s*,\s*library\s*,\s*site\s*,\s*overrides\s*;/;
const LIBRARY_BLOCK = /@layer\s+library\s*\{/;

/*
 * The search index ships stylesheets of its own into the export. They are not the site's, they
 * declare no layers, and counting them would only make the report say a bigger number.
 */
const NOT_OURS = new Set(['pagefind']);

async function cssFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (NOT_OURS.has(entry.name)) continue;

    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await cssFiles(path)));
    else if (entry.name.endsWith('.css')) found.push(path);
  }
  return found;
}

const files = await cssFiles(OUT);
if (files.length === 0) {
  console.error(`No CSS found under ${OUT}/. Run the build first.`);
  process.exit(1);
}

const problems = [];
let sawOrder = false;
let sawLibrary = false;

for (const file of files) {
  const css = await readFile(file, 'utf8');
  const order = css.match(ORDER);
  const library = css.match(LIBRARY_BLOCK);

  if (order) sawOrder = true;
  if (library) sawLibrary = true;

  if (library && !order) {
    problems.push(`${file}: the library layer is here but the layer order is not.`);
  } else if (order && library && order.index > library.index) {
    problems.push(
      `${file}: '@layer library' at ${library.index} comes before the order statement at ` +
        `${order.index}. 'library' registers itself first and 'reset' lands behind it.`,
    );
  }
}

if (!sawOrder) problems.push('The layer order statement is in no built stylesheet.');
if (!sawLibrary) {
  problems.push("No '@layer library' block: the library stylesheet is unlayered or absent.");
}

if (problems.length > 0) {
  console.error('Cascade layer check failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`Cascade layer order verified in ${files.length} built stylesheet(s).`);
