'use client';

import { useEffect, useRef, useState } from 'react';

const REVEAL_ABOVE = 120;
const MIN_DELTA = 8;

export function AutoHideHeader({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const holdsFocus = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;
    let frame = 0;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (Math.abs(delta) >= MIN_DELTA) {
        lastY.current = y;
        setHidden(!holdsFocus.current && delta > 0 && y > REVEAL_ABOVE);
      } else if (y <= REVEAL_ABOVE) {
        setHidden(false);
      }
    };

    const onScroll = () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header
      className="site-header"
      data-hidden={hidden ? 'true' : 'false'}
      onFocusCapture={() => {
        holdsFocus.current = true;
        setHidden(false);
      }}
      onBlurCapture={() => {
        holdsFocus.current = false;
      }}
    >
      {children}
    </header>
  );
}
