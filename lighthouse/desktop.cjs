/*
 * The desktop profile: 1350×940, a fast connection and no CPU slowdown. It is the softer run of
 * the two, and it is kept because the two profiles do not measure the same page — the desktop
 * layout renders the rail and the table of contents that the narrow one folds away.
 */
module.exports = require('./base.cjs')({
  name: 'desktop',
  settings: { preset: 'desktop' },
});
