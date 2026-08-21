'use client';

import { useEffect, useState } from 'react';

import { isThemeMode, THEME_STORAGE_KEY, themeModes, type ThemeMode } from '@/lib/theme';

/*
 * Applies a mode to the document. It repeats what the blocking script in the head does, and the
 * repetition is deliberate: that script cannot be imported, because it has to run before any
 * module is evaluated. Keep the two in step — this one is the reason the page can change without
 * reloading, and that one is the reason it never flashes.
 */
function applyMode(mode: ThemeMode, colours: { light: string; dark: string }): void {
  const dark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const root = document.documentElement;
  if (dark) root.setAttribute('data-kreo-theme', 'dark');
  else root.removeAttribute('data-kreo-theme');

  root.style.colorScheme = dark ? 'dark' : 'light';
  root.setAttribute('data-theme-mode', mode);

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? colours.dark : colours.light);

  // There is more than one of these on the page — the header has one and the drawer another,
  // because neither place has room for it at every width. They stay in step through the document
  // rather than through a store: the mode already lives on the root element.
  window.dispatchEvent(new CustomEvent(THEME_EVENT));
}

const THEME_EVENT = 'kb-theme-change';

export function ThemeToggle({
  name,
  className,
  label,
  labels,
  colours,
}: {
  /** Radio groups need distinct names, and there is one in the header and one in the drawer. */
  name: string;
  className?: string;
  label: string;
  labels: Record<ThemeMode, string>;
  colours: { light: string; dark: string };
}) {
  /*
   * `system` on the server and on the first client render, then whatever was stored. Rendering the
   * stored value directly would make the markup depend on the reader's machine, and the page it
   * hydrates into would not match the one that was sent.
   */
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    const read = () => {
      const current = document.documentElement.getAttribute('data-theme-mode') ?? 'system';
      if (isThemeMode(current)) setMode(current);
    };

    read();
    window.addEventListener(THEME_EVENT, read);
    return () => window.removeEventListener(THEME_EVENT, read);
  }, []);

  // Following the system means following it as it changes, not as it was when the page loaded.
  useEffect(() => {
    if (mode !== 'system') return;

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyMode('system', colours);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [mode, colours]);

  const choose = (next: ThemeMode) => {
    setMode(next);
    applyMode(next, colours);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // A reader with storage blocked gets the theme they asked for, for this visit.
    }
  };

  return (
    <fieldset className={className === undefined ? 'theme-toggle' : `theme-toggle ${className}`}>
      <legend>{label}</legend>
      {themeModes.map((candidate) => (
        <label key={candidate}>
          <input
            type="radio"
            name={name}
            value={candidate}
            checked={mode === candidate}
            onChange={() => choose(candidate)}
          />
          <span>{labels[candidate]}</span>
        </label>
      ))}
    </fieldset>
  );
}
