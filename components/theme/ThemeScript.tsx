import { THEME_STORAGE_KEY } from '@/lib/theme';

/*
 * The one script on this site that blocks rendering, and it earns it.
 *
 * A theme read after hydration is a theme applied after the first paint: the reader sees the light
 * page for a frame and then the dark one. There is no way to avoid that from React, because React
 * runs too late by definition. So this runs in the document head, synchronously, before anything
 * is painted.
 *
 * It is written as a string because it cannot be imported: it has to execute before any module
 * does. The colours are passed in rather than written here — they come from the library's own
 * stylesheet at build time, so the browser's UI ends up the same colour as the page it frames.
 */
export function ThemeScript({ light, dark }: { light: string; dark: string }) {
  const source = `(function(){try{
var m=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
if(m!=='light'&&m!=='dark'&&m!=='system')m='system';
var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
var r=document.documentElement;
if(d)r.setAttribute('data-kreo-theme','dark');else r.removeAttribute('data-kreo-theme');
r.style.colorScheme=d?'dark':'light';
r.setAttribute('data-theme-mode',m);
var t=document.querySelector('meta[name="theme-color"]');
if(t)t.setAttribute('content',d?${JSON.stringify(dark)}:${JSON.stringify(light)});
}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: source }} />;
}
