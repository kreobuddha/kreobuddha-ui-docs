/*
 * The social preview images, drawn at build time.
 *
 * A static export has no runtime to render one on request, so each page that wants an image gets a
 * file. They are laid out with satori and rasterised with resvg — the same two steps a serverless
 * OG endpoint would take, done once here instead of on every crawl.
 *
 * The type is Inter, the family the library itself bundles, loaded from a `.woff`: satori reads
 * ttf, otf and woff, and the copy inside the package is woff2, which it does not.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

const OUT = join(process.cwd(), 'out', 'og');
const FONTS = join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files');

const WIDTH = 1200;
const HEIGHT = 630;

const PAGES = {
  en: {
    title: 'Components for tools people work in',
    body: 'An accessible, themeable React component library for developer tools and data-dense interfaces.',
  },
  ru: {
    title: 'Компоненты для инструментов, в которых работают',
    body: 'Доступная и темизируемая библиотека React-компонентов для инструментов разработчика и плотных интерфейсов.',
  },
};

const text = (content, style) => ({ type: 'div', props: { style, children: content } });

function card({ title, body }) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '72px',
        backgroundColor: '#fbfbfc',
        // The accent, as a band down the leading edge rather than a wash behind the words.
        borderLeft: '16px solid #93357f',
        color: '#272c33',
        fontFamily: 'Inter, Inter Cyrillic',
      },
      children: [
        text('@kreobuddha/ui', {
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '-0.015em',
          color: '#93357f',
        }),
        text(title, {
          fontSize: 68,
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: '-0.015em',
          // satori has no text wrapping without a width, and no `text-wrap: balance` either.
          maxWidth: '900px',
        }),
        text(body, { fontSize: 28, lineHeight: 1.4, color: '#5c636d', maxWidth: '900px' }),
      ],
    },
  };
}

const fonts = [
  { name: 'Inter', weight: 400, style: 'normal', data: await readFile(join(FONTS, 'inter-latin-400-normal.woff')) },
  { name: 'Inter', weight: 600, style: 'normal', data: await readFile(join(FONTS, 'inter-latin-600-normal.woff')) },
  /*
   * The Cyrillic subset, under a family name of its own.
   *
   * Registering it as a second face of `Inter` does not work: satori takes the first face matching
   * the family and weight and renders every missing glyph as a `NO GLYPH` box rather than looking
   * further. Falling back is a font-family list, so that is what the styles below use. Its `lang`
   * option is no help either — it covers scripts that need a separate family, and rejects `ru`.
   */
  { name: 'Inter Cyrillic', weight: 400, style: 'normal', data: await readFile(join(FONTS, 'inter-cyrillic-400-normal.woff')) },
  { name: 'Inter Cyrillic', weight: 600, style: 'normal', data: await readFile(join(FONTS, 'inter-cyrillic-600-normal.woff')) },
];

await mkdir(OUT, { recursive: true });

for (const [locale, page] of Object.entries(PAGES)) {
  const svg = await satori(card(page), { width: WIDTH, height: HEIGHT, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
  await writeFile(join(OUT, `${locale}.png`), png);
  console.log(`Wrote out/og/${locale}.png`);
}
