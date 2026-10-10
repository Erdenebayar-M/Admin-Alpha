import type { Editor } from "@tiptap/core";

/** What the Link dialog is opened for: `askText` = nothing selected and not on a Link, so it also asks for the link text. */
export interface LinkDialogRequest {
  askText: boolean;
  /** The Link's current href ("" for a new one). */
  href: string;
}

const STORAGE_KEY = "linkDialogAccess";

/**
 * Bridges "open the Link dialog" (toolbar 🔗, ⌘K, the `/` menu's «Текст холбоос»)
 * to the one `LinkDialog` the canvas renders — same subscribe/snapshot shape as
 * `media-dialog-store`.
 */
export function createLinkDialogStore() {
  let snapshot: LinkDialogRequest | null = null;
  const listeners = new Set<() => void>();
  const set = (next: LinkDialogRequest | null) => {
    snapshot = next;
    listeners.forEach((l) => l());
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    open(request: LinkDialogRequest) {
      set(request);
    },
    close() {
      set(null);
    },
  };
}

export type LinkDialogStore = ReturnType<typeof createLinkDialogStore>;

/** The store the canvas's `linkDialogAccess` extension was configured with, read off the editor. */
export function getLinkDialog(editor: Editor): LinkDialogStore | null {
  const storage = editor.storage as unknown as Record<string, { store?: LinkDialogStore | null } | undefined>;
  return storage[STORAGE_KEY]?.store ?? null;
}

export { STORAGE_KEY as LINK_DIALOG_STORAGE_KEY };
