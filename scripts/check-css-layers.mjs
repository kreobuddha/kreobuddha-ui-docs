import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = 'dist';
const EXPECTED = ['reset', 'library', 'site', 'overrides'];
const DECLARATION = /@layer\s+([\w\s,]+?)\s*[;{]/g;

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
let checked = 0;

for (const file of files) {
  const css = await readFile(file, 'utf8');

  const appearances = [];
  for (const [, names] of css.matchAll(DECLARATION)) {
    for (const name of names.split(',').map((part) => part.trim())) {
      if (name !== '' && !appearances.includes(name)) appearances.push(name);
    }
  }

  if (appearances.length === 0) continue;
  checked += 1;

  const ours = appearances.filter((name) => EXPECTED.includes(name));
  if (ours.join(',') !== EXPECTED.join(',')) {
    problems.push(
      `${file}: layers first appear as [${ours.join(', ')}], not [${EXPECTED.join(', ')}]. ` +
        'Order is decided by first appearance, so this is the cascade, not cosmetics.',
    );
  }

  if (!/@layer\s+library\s*\{/.test(css)) {
    problems.push(`${file}: no '@layer library' block - the library stylesheet is unlayered.`);
  }
}

if (checked === 0) problems.push('No built stylesheet declares any layer.');

if (problems.length > 0) {
  console.error('Cascade layer check failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`Cascade layer order verified in ${checked} built stylesheet(s).`);
