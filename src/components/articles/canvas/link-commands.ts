import type { Editor } from "@tiptap/core";
import { DOC_MARK } from "@/lib/article-body";
import { getLinkDialog } from "./link-dialog-store";

/** Opens the Link dialog for the current selection: text + url, url only (words selected), or the Link under the cursor. */
export function openLinkDialog(editor: Editor) {
  const store = getLinkDialog(editor);
  if (!store) return;
  const onLink = editor.isActive(DOC_MARK.link);
  const href = editor.getAttributes(DOC_MARK.link).href;
  store.open({
    askText: editor.state.selection.empty && !onLink,
    href: typeof href === "string" ? href : "",
  });
}

/** `text` is only used when nothing is selected and the cursor isn't on a Link. */
export function applyLink(editor: Editor, { href, text }: { href: string; text?: string }) {
  const chain = editor.chain().focus().extendMarkRange(DOC_MARK.link);
  if (editor.state.selection.empty && !editor.isActive(DOC_MARK.link)) {
    chain.insertContent({ type: "text", text: text?.trim() || href, marks: [{ type: DOC_MARK.link, attrs: { href } }] }).run();
    // The link mark is inclusive (autolink), so the cursor would carry it into whatever is typed
    // next. Reset the stored marks (minus the link) in their own transaction — plugins' appended transactions
    // within the insert drop them — so text typed next isn't part of the link.
    const { state } = editor;
    editor.view.dispatch(state.tr.setStoredMarks(state.selection.$head.marks().filter((m) => m.type.name !== DOC_MARK.link)));
  } else {
    // A link is never coloured (the converter sends a link span uncoloured regardless) —
    // strip any colour/highlight already on the selection so the canvas doesn't keep
    // showing a colour the next save would drop.
    chain.unsetMark(DOC_MARK.color).unsetMark(DOC_MARK.highlight).setLink({ href }).run();
  }
}

export function removeLink(editor: Editor) {
  editor.chain().focus().extendMarkRange(DOC_MARK.link).unsetLink().run();
}
