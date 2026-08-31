import './CodeBlock.css';

import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

const SETTLE = 2000;

const CodeBlock = ({
  children,
  'data-language': language,
  ...rest
}: ComponentPropsWithoutRef<'pre'> & { 'data-language'?: string }) => {
  const { t } = useTranslation();

  const source = useRef<HTMLPreElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async () => {
    const block = source.current;

    // The rendered block is the only place the exact source survives: Shiki has already split it
    // into coloured spans, and re-serialising those would be a second, lossier copy of it.
    const text = block?.textContent;
    if (block === null || text === null || text === undefined) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Denied clipboard, an http:// origin, an old browser. Select the code instead of leaving a
      // button that answers nothing: the keystroke the reader already knows then finishes the job.
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(block);
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }

    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), SETTLE);
  }, []);

  return (
    <figure className="code-block">
      <div className="code-block__bar" data-pagefind-ignore>
        {language === undefined ? null : (
          <span className="code-block__language" aria-hidden="true">
            {language}
          </span>
        )}

        {/* The label is the confirmation. A live region beside it would say the same thing a
            second time, and a stable name over changing text is the one combination WCAG 2.5.3
            rules out. */}
        <button type="button" className="code-block__copy" onClick={copy} data-copied={copied}>
          {t(copied ? 'codeCopied' : 'codeCopy')}
        </button>
      </div>

      <pre {...rest} ref={source}>
        {children}
      </pre>
    </figure>
  );
};

export default CodeBlock;
