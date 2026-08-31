import './PackageManager.css';

import { useCallback, useSyncExternalStore } from 'react';

import { Tabs } from '@components/ui';

const STORAGE_KEY = 'kb-docs-package-manager';

const managers = ['npm', 'pnpm', 'yarn', 'bun'] as const;

type Manager = (typeof managers)[number];

const command: Record<Manager, (name: string) => string> = {
  npm: (name) => `npm install ${name}`,
  pnpm: (name) => `pnpm add ${name}`,
  yarn: (name) => `yarn add ${name}`,
  bun: (name) => `bun add ${name}`,
};

function isManager(value: string | null): value is Manager {
  return value !== null && (managers as readonly string[]).includes(value);
}

// One choice for the whole site rather than one per block: a reader who picks pnpm has said which
// package manager they use, not which paragraph they were looking at.
const listeners = new Set<() => void>();
let chosen: Manager | null = null;

function read(): Manager {
  if (chosen !== null) return chosen;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    chosen = isManager(stored) ? stored : 'npm';
  } catch {
    chosen = 'npm';
  }

  return chosen;
}

function choose(next: Manager): void {
  chosen = next;

  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage can be blocked outright. The choice still applies to this page.
  }

  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const PackageManager = ({ name }: { name: string }) => {
  const manager = useSyncExternalStore(
    subscribe,
    read,
    // Rendered at build time, where there is no storage to read and npm is the safe assumption.
    () => 'npm' as Manager,
  );

  const onChange = useCallback((value: string) => {
    if (isManager(value)) choose(value);
  }, []);

  return (
    <div className="package-manager">
      <Tabs
        value={manager}
        onChange={onChange}
        items={managers.map((id) => ({
          id,
          label: id,
          content: (
            <pre className="package-manager__command">
              <code>{command[id](name)}</code>
            </pre>
          ),
        }))}
      />
    </div>
  );
};

export default PackageManager;
