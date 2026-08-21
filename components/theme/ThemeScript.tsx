import { THEME_STORAGE_KEY } from '@/lib/theme';

// Blocks rendering on purpose: a theme applied from React is applied after the first paint.
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
