/*
 * What Lighthouse CI runs against, shared by the two profiles.
 *
 * The run is against the built export served by `scripts/serve-export.mjs` — the same server the
 * end-to-end suite uses, under the same project sub-path. Measuring a dev server would measure a
 * different site: unminified, unbundled, and served from the root.
 *
 * Three pages, one of each kind the site has. The landing page is the one a stranger arrives on,
 * the guide page is the heaviest reading page (syntax highlighting, a table of contents,
 * scroll-spy), and the component page is the one that ships an interactive playground. Every other
 * page is a variation on one of those three.
 */
const BASE_PATH = '/kreobuddha-ui-docs';
const PORT = 4174;

const paths = ['/en/', '/en/docs/theming/', '/en/components/button/'];

/**
 * @param {{ name: string, settings: object }} profile
 */
module.exports = function config(profile) {
  return {
    ci: {
      collect: {
        // A second port, so a Playwright run left serving on 4173 does not get measured instead.
        startServerCommand: `NEXT_PUBLIC_BASE_PATH=${BASE_PATH} PORT=${PORT} node scripts/serve-export.mjs`,
        startServerReadyPattern: 'Serving out/',
        url: paths.map((path) => `http://localhost:${PORT}${BASE_PATH}${path}`),

        /*
         * Three runs per URL, and the assertions below take the median. A single Lighthouse run on
         * a shared machine swings by several points on the timing-based metrics; gating on one
         * sample turns a budget into a coin toss.
         */
        numberOfRuns: 3,

        settings: profile.settings,
      },

      assert: {
        assertions: {
          /*
           * The two the project committed to, and nothing else promoted to a gate. `best-practices`
           * and `seo` are collected and reported — they are useful to read — but a budget is a
           * promise, and this repository only made two.
           */
          'categories:performance': ['error', { minScore: 0.95, aggregationMethod: 'median' }],
          'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'median' }],
        },
      },

      upload: {
        // No server to upload to, and no wish for one. The reports stay in the working directory
        // and CI keeps them as an artefact.
        target: 'filesystem',
        outputDir: `.lighthouseci/${profile.name}`,
      },
    },
  };
};
