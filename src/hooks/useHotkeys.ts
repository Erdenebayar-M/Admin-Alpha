'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

export type HotkeyMap = Record<string, () => void>;

// SSR-safe: useLayoutEffect on client, useEffect on server
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

const SKIP_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Registers document-level keyboard shortcuts.
 * Shortcuts are automatically suppressed when any input/textarea/select or
 * a contenteditable element has focus.
 *
 * Key format examples: 'a', 'shift+r', 'escape', 'arrowleft', '?'
 * Shift is only prepended for alpha keys; for symbol keys (?, /, etc.) the
 * resolved e.key value is used directly so the mapping is layout-agnostic.
 */
export function useHotkeys(keymap: HotkeyMap, enabled = true): void {
  // Always-fresh refs so the event listener never becomes stale
  const keymapRef = useRef(keymap);
  const enabledRef = useRef(enabled);

  useIsomorphicLayoutEffect(() => {
    keymapRef.current = keymap;
    enabledRef.current = enabled;
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!enabledRef.current) return;

      const target = e.target as HTMLElement;
      if (SKIP_TAGS.has(target.tagName) || target.isContentEditable) return;

      const key = e.key;

      // Prepend 'shift+' only for alpha characters; symbol keys (?, !, etc.)
      // already encode the shifted variant in e.key itself.
      const isAlpha = key.length === 1 && /[a-zA-Z]/.test(key);
      const combo = isAlpha && e.shiftKey
        ? `shift+${key.toLowerCase()}`
        : key.toLowerCase();

      const handler = keymapRef.current[combo];
      if (handler) {
        e.preventDefault();
        handler();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []); // intentionally empty — all state accessed via refs
}
