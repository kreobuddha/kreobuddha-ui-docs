'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { NavTree, type NavGroupData } from './NavTree';

const SWIPE_THRESHOLD = 60;

export function NavDrawer({
  groups,
  label,
  openLabel,
  closeLabel,
  theme,
  language,
}: {
  groups: NavGroupData[];
  label: string;
  openLabel: string;
  closeLabel: string;
  theme?: React.ReactNode;
  language?: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dragStart = useRef<number | null>(null);
  const scrollAtOpen = useRef(0);
  const swiped = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const close = useCallback(() => {
    dialog.current?.close();
  }, []);

  const open = useCallback(() => {
    scrollAtOpen.current = window.scrollY;
    dialog.current?.showModal();
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const y = scrollAtOpen.current;
    const { style } = document.body;
    const previous = { position: style.position, top: style.top, insetInline: style.insetInline };

    style.position = 'fixed';
    style.top = `-${y}px`;
    style.insetInline = '0';

    return () => {
      style.position = previous.position;
      style.top = previous.top;
      style.insetInline = previous.insetInline;
      window.scrollTo(0, y);
    };
  }, [isOpen]);

  useEffect(() => {
    close();
  }, [pathname, close]);

  const onClose = useCallback(() => {
    setIsOpen(false);
    trigger.current?.focus();
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDialogElement>) => {
    dragStart.current = event.clientX;
  };

  const onPointerCancel = () => {
    dragStart.current = null;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDialogElement>) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (start !== null && start - event.clientX > SWIPE_THRESHOLD) {
      swiped.current = true;
      close();
    }
  };

  const onClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (swiped.current) {
      swiped.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (event.target === dialog.current) close();
  };

  return (
    <>
      <button
        type="button"
        className="nav-drawer__trigger"
        ref={trigger}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={open}
      >
        <span className="nav-drawer__bars" aria-hidden="true" />
        <span className="nav-drawer__trigger-label">{openLabel}</span>
      </button>

      <dialog
        className="nav-drawer"
        ref={dialog}
        aria-label={label}
        onClose={onClose}
        onClickCapture={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div className="nav-drawer__panel nav-tree">
          <button type="button" className="nav-drawer__close" onClick={close}>
            {closeLabel}
          </button>

          <nav aria-label={label}>
            <NavTree groups={groups} onNavigate={close} />
          </nav>

          {theme === undefined && language === undefined ? null : (
            <div className="nav-drawer__settings">
              {language}
              {theme}
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
