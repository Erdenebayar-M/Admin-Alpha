import type { SuggestionFloatingUiConfig } from "@tiptap/suggestion";
import type { BlockCommand } from "./block-commands";

export interface SlashMenuSnapshot {
  items: BlockCommand[];
  select: (item: BlockCommand) => void;
  /** Re-read on every position pass — Tiptap recomputes this from the live `/` position, not a frozen snapshot. */
  getRect: () => DOMRect | null;
  /** The editor's DOM node — lets Floating UI find scrollable ancestors around a virtual (rect-only) reference. */
  contextElement: Element | null;
  /** Placement/strategy/middleware resolved by `@tiptap/suggestion` from the extension's `flip`/`offset`/`floatingUi` options. */
  floatingUi: SuggestionFloatingUiConfig;
  selected: number;
}

/**
 * State of the `/` menu, shared between the editor's suggestion plugin (which
 * opens, updates and closes it, and forwards key presses) and the React menu
 * (which reads it via `useSyncExternalStore`).
 */
export function createSlashMenuStore() {
  let snapshot: SlashMenuSnapshot | null = null;
  const listeners = new Set<() => void>();
  const set = (next: SlashMenuSnapshot | null) => {
    snapshot = next;
    listeners.forEach((l) => l());
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    open(menu: Omit<SlashMenuSnapshot, "selected">) {
      set({ ...menu, selected: 0 });
    },
    close() {
      set(null);
    },
    highlight(index: number) {
      if (snapshot) set({ ...snapshot, selected: index });
    },
    /** Arrow keys move the highlight, Enter/Tab picks it. Returns whether the key was handled. */
    keyDown(event: KeyboardEvent): boolean {
      if (!snapshot || snapshot.items.length === 0) return false;
      const { items, selected } = snapshot;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const step = event.key === "ArrowDown" ? 1 : -1;
        set({ ...snapshot, selected: (selected + step + items.length) % items.length });
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        snapshot.select(items[selected]);
        return true;
      }
      return false;
    },
  };
}

export type SlashMenuStore = ReturnType<typeof createSlashMenuStore>;
