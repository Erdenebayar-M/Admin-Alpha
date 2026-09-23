import type { Editor } from "@tiptap/core";

/**
 * `"all"` — the toolbar button: Text colour, Highlight and Background,
 * whichever apply to the current selection/Block.
 * `"background"` — the `/` menu's "Өнгө" command: Background only.
 */
export type ColorMenuScope = "all" | "background";

export interface ColorMenuRequest {
  scope: ColorMenuScope;
}

/** Same subscribe/snapshot shape as `media-dialog-store.ts` — the toolbar button and the `/` menu's "Өнгө" command both open the one menu the toolbar renders. */
export function createColorMenuStore() {
  let snapshot: ColorMenuRequest | null = null;
  const listeners = new Set<() => void>();
  const set = (next: ColorMenuRequest | null) => {
    snapshot = next;
    listeners.forEach((l) => l());
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    open(request: ColorMenuRequest) {
      set(request);
    },
    close() {
      set(null);
    },
  };
}

export type ColorMenuStore = ReturnType<typeof createColorMenuStore>;

const STORAGE_KEY = "colorMenuAccess";

/** The store the canvas's `colorMenuAccess` extension was configured with, read off the editor — lets `block-commands.ts`'s "Өнгө" command reach it without a prop-drilled reference. */
export function getColorMenu(editor: Editor): ColorMenuStore | null {
  const storage = editor.storage as unknown as Record<string, { store?: ColorMenuStore | null } | undefined>;
  return storage[STORAGE_KEY]?.store ?? null;
}

export { STORAGE_KEY as COLOR_MENU_STORAGE_KEY };
