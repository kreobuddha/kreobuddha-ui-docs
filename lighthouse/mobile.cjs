/*
 * The mobile profile — Lighthouse's own default: a mid-range phone, a throttled 4G connection and
 * a 4× CPU slowdown. It is the harder of the two by a wide margin and the one the budget is really
 * about; a static site that cannot clear 95 here is not fast, it is being measured on a desktop.
 */
module.exports = require('./base.cjs')({
  name: 'mobile',
  settings: {
    preset: undefined,
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 360,
      height: 640,
      deviceScaleFactor: 2.625,
      disabled: false,
    },
  },
});
