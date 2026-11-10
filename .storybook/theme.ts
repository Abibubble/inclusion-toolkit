import { useSyncExternalStore } from 'react';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import { addons } from 'storybook/preview-api';

const THEMES = ['light', 'dark', 'cream'] as const;
export type Theme = (typeof THEMES)[number];

let currentTheme: Theme = 'light';
const listeners = new Set<() => void>();

const isTheme = (value: unknown): value is Theme => THEMES.some((theme) => theme === value);

export function applyTheme(globals: Record<string, unknown>): Theme {
  const theme = isTheme(globals.theme) ? globals.theme : 'light';
  document.documentElement.dataset.theme = theme;

  if (theme === currentTheme) return theme;

  currentTheme = theme;
  listeners.forEach((listener) => {
    listener();
  });
  return currentTheme;
}

const channel = addons.getChannel();
const onGlobals = ({ globals }: { globals: Record<string, unknown> }) => applyTheme(globals);
channel.on(SET_GLOBALS, onGlobals);
channel.on(GLOBALS_UPDATED, onGlobals);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStorybookTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    () => currentTheme,
    () => currentTheme,
  );
}
