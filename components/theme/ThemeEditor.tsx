'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button, Select, Switch, TextField } from '@/components/ui';
import { contrastLevel, contrastRatio, parseHex } from '@/lib/contrast';
import {
  changedTokens,
  contrastPairs,
  decodeTheme,
  editableTokens,
  encodeTheme,
  exportCss,
  presets,
} from '@/lib/theme';

export interface ThemeEditorLabels {
  presets: string;
  reset: string;
  copyCss: string;
  copyLink: string;
  copied: string;
  contrast: string;
  preview: string;
  exportTitle: string;
  previewHeading: string;
  previewBody: string;
}

export function ThemeEditor({
  defaults,
  labels,
}: {
  defaults: Record<string, string>;
  labels: ThemeEditorLabels;
}) {
  const [values, setValues] = useState<Record<string, string>>(defaults);
  const [copied, setCopied] = useState<string | null>(null);

  /*
   * A theme arrives in the fragment, so a link is the whole sharing mechanism: a static site has no
   * server to shorten one with, and the fragment never reaches a server anyway. Read once, after
   * mount — the server has no way to know what it says.
   */
  useEffect(() => {
    const shared = decodeTheme(window.location.hash);
    if (Object.keys(shared).length > 0) setValues((current) => ({ ...current, ...shared }));
  }, []);

  const changed = useMemo(() => changedTokens(values, defaults), [values, defaults]);
  const css = useMemo(() => exportCss(changed), [changed]);

  const verdicts = useMemo(
    () =>
      contrastPairs.map((pair) => {
        const foreground = parseHex(values[pair.foreground] ?? '');
        const background = parseHex(values[pair.background] ?? '');
        if (!foreground || !background) return { ...pair, ratio: null, level: 'fail' as const };

        const ratio = contrastRatio(foreground, background);
        return { ...pair, ratio, level: contrastLevel(ratio, pair.nonText) };
      }),
    [values],
  );

  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      // Clipboard access can be refused. The text is on the page either way.
      setCopied(null);
    }
  };

  const share = () => {
    const fragment = encodeTheme(changed);
    const url = `${window.location.origin}${window.location.pathname}${fragment === '' ? '' : `#${fragment}`}`;
    window.history.replaceState(null, '', url);
    void copy('link', url);
  };

  /*
   * Every editable token is written onto the scope, not only the changed ones.
   *
   * Writing only the changes would leave the rest inherited from whatever theme the site happens
   * to be in — so a reader in the dark theme would see a dark preview while the contrast figures
   * beside it described the light values being edited. The editor edits one theme; the preview
   * shows that theme; the numbers are about what is on screen.
   */
  const scopeStyle = Object.fromEntries(Object.entries(values)) as React.CSSProperties;

  return (
    <div className="theme-editor">
      <div className="theme-editor__controls">
        <fieldset>
          <legend>{labels.presets}</legend>
          <div className="theme-editor__actions">
            {presets.map((preset) => (
              <Button
                key={preset.id}
                variant="outlined"
                size="sm"
                onClick={() => setValues((current) => ({ ...current, ...preset.values }))}
              >
                {preset.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setValues(defaults)}>
              {labels.reset}
            </Button>
          </div>
        </fieldset>

        {editableTokens.map((token) => (
          <label className="theme-editor__token" key={token.name}>
            <input
              type="color"
              value={values[token.name] ?? '#000000'}
              onChange={(event) =>
                setValues((current) => ({ ...current, [token.name]: event.currentTarget.value }))
              }
            />
            <span>
              <strong>{token.label}</strong>
              <code>{token.name}</code>
            </span>
          </label>
        ))}

        <div className="theme-editor__actions">
          <Button size="sm" onClick={() => void copy('css', css)}>
            {copied === 'css' ? labels.copied : labels.copyCss}
          </Button>
          <Button size="sm" variant="outlined" onClick={share}>
            {copied === 'link' ? labels.copied : labels.copyLink}
          </Button>
        </div>
      </div>

      <div>
        {/*
          Everything the editor changes is written here and nowhere else. The library reads its
          tokens as inherited custom properties, so a value set on this element reaches every
          component inside it — and nothing outside it. That is what keeps an unreadable theme from
          costing the reader the controls they need to undo it.
        */}
        <div className="theme-preview preview-scope" style={scopeStyle}>
          <h2>{labels.previewHeading}</h2>
          <p>{labels.previewBody}</p>

          <div className="theme-preview__card">
            <TextField label="Project name" defaultValue="atlas-gateway" />
            <Select label="Environment" defaultValue="staging">
              <option value="production">Production</option>
              <option value="staging">Staging</option>
            </Select>
            <Switch label="Deploy on merge" defaultChecked />
            <div className="theme-editor__actions">
              <Button>Deploy</Button>
              <Button variant="outlined">Cancel</Button>
              <Button variant="ghost" danger>
                Delete
              </Button>
            </div>
          </div>
        </div>

        <h2>{labels.contrast}</h2>
        <ul className="contrast-list">
          {verdicts.map((verdict) => (
            <li key={verdict.label}>
              <span>{verdict.label}</span>
              <span>
                {verdict.ratio === null ? '—' : `${verdict.ratio.toFixed(2)}:1`}{' '}
                <span className="contrast-list__verdict" data-level={verdict.level}>
                  {verdict.level}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <h2>{labels.exportTitle}</h2>
        <pre>
          <code>{css}</code>
        </pre>
      </div>
    </div>
  );
}
