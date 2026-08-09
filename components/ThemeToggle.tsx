'use client';

import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

function subscribe(callback: () => void) {
  window.addEventListener('al-theme-change', callback);
  return () => window.removeEventListener('al-theme-change', callback);
}

function getSnapshot(): Theme {
  const stored = localStorage.getItem('al-theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Arbitrary — real value takes over client-side right after hydration via
// useSyncExternalStore, same mechanism that avoids the flash of wrong theme.
function getServerSnapshot(): Theme {
  return 'dark';
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('al-theme', next);
    window.dispatchEvent(new Event('al-theme-change'));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-al-label hover:text-al-silver underline underline-offset-2"
    >
      {theme === 'dark' ? '라이트 모드로 보기' : '다크 모드로 보기'}
    </button>
  );
}
