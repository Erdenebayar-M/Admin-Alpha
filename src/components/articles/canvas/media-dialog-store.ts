import type { Editor } from "@tiptap/core";
import { DOC_NODE, type PreservedBlock } from "@/lib/article-body";
import type { ImageBlock, LinkCardBlock, VideoBlock } from "@/lib/article-types";

export type MediaBlockKind = PreservedBlock["type"];

export type MediaDialogRequest =
  | { kind: "image"; initial: ImageBlock | null; onSubmit: (block: ImageBlock) => void }
  | { kind: "video"; initial: VideoBlock | null; onSubmit: (block: VideoBlock) => void }
  | { kind: "link_card"; initial: LinkCardBlock | null; onSubmit: (block: LinkCardBlock) => void };

/**
 * Bridges "insert" (the toolbar/`/` menu's image, video and link card
 * commands) and "edit" (clicking an existing one of those Blocks in the
 * canvas) to the one dialog per kind `MediaDialogs` renders — the same
 * subscribe/snapshot shape as `slash-menu-store`. `initial: null` means
 * inserting a new Block; a Block means editing that one in place.
 */
export function createMediaDialogStore() {
  let snapshot: MediaDialogRequest | null = null;
  const listeners = new Set<() => void>();
  const set = (next: MediaDialogRequest | null) => {
    snapshot = next;
    listeners.forEach((l) => l());
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    open(request: MediaDialogRequest) {
      set(request);
    },
    close() {
      set(null);
    },
  };
}

export type MediaDialogStore = ReturnType<typeof createMediaDialogStore>;

/** The store `PreservedBlockNode` was configured with, read off the editor once it exists. */
export function getMediaDialog(editor: Editor): MediaDialogStore | null {
  const storage = editor.storage as unknown as Record<string, { mediaDialog?: MediaDialogStore | null } | undefined>;
  return storage[DOC_NODE.preserved]?.mediaDialog ?? null;
}
