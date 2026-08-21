import { pageColours } from '@/lib/tokens';
import { useEffect, useState } from 'react';

import { isThemeMode, THEME_STORAGE_KEY, themeModes, type ThemeMode } from '@/lib/theme';

function applyMode(mode: ThemeMode): void {
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
    ?.setAttribute('content', dark ? pageColours.dark : pageColours.light);

  window.dispatchEvent(new CustomEvent(THEME_EVENT));
}

const THEME_EVENT = 'kb-theme-change';

export function ThemeToggle({
  name,
  className,
  label,
  labels,
}: {
  name: string;
  className?: string;
  label: string;
  labels: Record<ThemeMode, string>;
}) {
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

  useEffect(() => {
    if (mode !== 'system') return;

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyMode('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [mode]);

  const choose = (next: ThemeMode) => {
    setMode(next);
    applyMode(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
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
