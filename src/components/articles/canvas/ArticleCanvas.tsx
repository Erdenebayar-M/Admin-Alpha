"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Info } from "lucide-react";
import { blocksToDoc, docToBlocks, DOC_MARK } from "@/lib/article-body";
import { cleanPastedContent } from "@/lib/article-paste";
import type { ArticleBlock } from "@/lib/article-types";
import { articleCanvasExtensions, blockErrorsKey } from "./extensions";
import { CanvasToolbar } from "./CanvasToolbar";
import { LinkDialog } from "./LinkDialog";
import { SlashMenu } from "./SlashMenu";
import { createSlashMenuStore } from "./slash-menu-store";

const PASTE_NOTICE_MS = 6000;

interface ArticleCanvasProps {
  /** Read once on mount — remount (via `key`) to load a different Body. */
  initialBody: ArticleBlock[];
  onChange: (body: ArticleBlock[]) => void;
  /** Server messages keyed by Block id, outlined on the matching Block. */
  blockErrors: Record<string, string>;
}

/** The continuous writing surface for an Article's Body: toolbar, `/` menu and paste clean-up around a Tiptap editor. */
export function ArticleCanvas({ initialBody, onChange, blockErrors }: ArticleCanvasProps) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const [slashMenu] = useState(createSlashMenuStore);
  const [pasteNotice, setPasteNotice] = useState(false);
  const [linkHref, setLinkHref] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: articleCanvasExtensions(slashMenu),
    content: blocksToDoc(initialBody),
    editorProps: {
      attributes: {
        class: "article-canvas min-h-80 px-6 py-5 outline-none",
        "aria-label": "Нийтлэлийн агуулга",
      },
      transformPastedHTML: (html) => {
        const cleaned = cleanPastedContent(html);
        if (cleaned.changed) setPasteNotice(true);
        return cleaned.html;
      },
    },
    onUpdate: ({ editor: e }) => onChangeRef.current(docToBlocks({ ...e.getJSON(), type: "doc" })),
  });

  useEffect(() => {
    if (!pasteNotice) return;
    const timer = setTimeout(() => setPasteNotice(false), PASTE_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [pasteNotice]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dispatch(editor.state.tr.setMeta(blockErrorsKey, blockErrors));
    if (Object.keys(blockErrors).length > 0) {
      editor.view.dom.querySelector("[data-block-error]")?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [editor, blockErrors]);

  function openLinkDialog() {
    if (!editor) return;
    const href = editor.getAttributes(DOC_MARK.link).href;
    setLinkHref(typeof href === "string" ? href : "");
  }

  function applyLink(href: string) {
    if (!editor) return;
    setLinkHref(null);
    const chain = editor.chain().focus().extendMarkRange(DOC_MARK.link);
    if (editor.state.selection.empty && !editor.isActive(DOC_MARK.link)) {
      // Nothing selected: insert the URL itself as the link text. The link mark is
      // inclusive (autolink), so drop it from the stored marks — text typed next isn't part of the link.
      chain
        .insertContent({ type: "text", text: href, marks: [{ type: DOC_MARK.link, attrs: { href } }] })
        .unsetMark(DOC_MARK.link)
        .run();
    } else {
      chain.setLink({ href }).run();
    }
  }

  function removeLink() {
    setLinkHref(null);
    editor?.chain().focus().extendMarkRange(DOC_MARK.link).unsetLink().run();
  }

  return (
    <div className="relative rounded-xl border border-border bg-card">
      {editor && <CanvasToolbar editor={editor} onLink={openLinkDialog} />}
      {pasteNotice && (
        <div
          role="status"
          className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-800 dark:text-sky-200"
        >
          <Info className="size-3.5 shrink-0" />
          Зарим формат хасагдлаа
        </div>
      )}
      <EditorContent editor={editor} />
      <SlashMenu store={slashMenu} />
      <LinkDialog
        initialHref={linkHref}
        onOpenChange={(open) => !open && setLinkHref(null)}
        onSubmit={applyLink}
        onRemove={removeLink}
      />
    </div>
  );
}
