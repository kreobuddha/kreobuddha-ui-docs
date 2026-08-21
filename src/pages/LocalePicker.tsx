import { Head } from 'vite-react-ssg';

const SCRIPT = `(function () {
  var supported = ['en', 'ru'];
  var stored = null;
  try {
    stored = localStorage.getItem('kb-docs-locale');
  } catch (error) {}

  var chosen =
    supported.indexOf(stored) !== -1
      ? stored
      : (navigator.languages || [navigator.language || 'en'])
          .map(function (tag) {
            return String(tag).toLowerCase().split('-')[0];
          })
          .filter(function (tag) {
            return supported.indexOf(tag) !== -1;
          })[0] || 'en';

  location.replace('./' + chosen + '/');
})();`;

export function LocalePicker() {
  return (
    <>
      <Head>
        <title>@kreobuddha/ui — documentation</title>
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="./en/" />
        <script>{SCRIPT}</script>
      </Head>

      <noscript>
        <p>
          <a href="./en/">English</a> · <a href="./ru/">Русский</a>
        </p>
      </noscript>
    </>
  );
}
