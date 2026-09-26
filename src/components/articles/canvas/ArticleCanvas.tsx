"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { Info } from "lucide-react";
import { uploadArticleImage } from "@/lib/api";
import { blocksToDoc, docToBlocks, DOC_MARK, DOC_NODE, generateBlockId } from "@/lib/article-body";
import { usedCustomColors } from "@/lib/article-colors";
import { cleanPastedContent } from "@/lib/article-paste";
import type { ArticleBlock, ImageBlock } from "@/lib/article-types";
import { cn } from "@/lib/utils";
import { SITE_CARD_CLASS, SITE_CLASS, SITE_FONT_CLASS, SITE_SURFACE_STYLE } from "../site-look";
import { articleCanvasExtensions, blockErrorsKey } from "./extensions";
import { CanvasToolbar } from "./CanvasToolbar";
import { createColorMenuStore } from "./color/color-menu-store";
import { LinkDialog } from "./LinkDialog";
import { createMediaDialogStore } from "./media-dialog-store";
import { MediaDialogs } from "./MediaDialogs";
import { SlashMenu } from "./SlashMenu";
import { createSlashMenuStore } from "./slash-menu-store";

const PASTE_NOTICE_MS = 6000;
const MEDIA_ERROR_MS = 6000;

interface ArticleCanvasProps {
  /** Read once on mount — remount (via `key`) to load a different Body. */
  initialBody: ArticleBlock[];
  onChange: (body: ArticleBlock[]) => void;
  /** Server messages keyed by Block id, outlined on the matching Block. */
  blockErrors: Record<string, string>;
  /** The Article's title — bound to the Article, never a Block. */
  title: string;
  onTitleChange: (title: string) => void;
  titleError?: string;
  autoFocusTitle?: boolean;
}

/** The continuous writing surface for an Article's Body: toolbar, `/` menu and paste clean-up around a Tiptap editor. */
export function ArticleCanvas({ initialBody, onChange, blockErrors, title, onTitleChange, titleError, autoFocusTitle }: ArticleCanvasProps) {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const [slashMenu] = useState(createSlashMenuStore);
  const [mediaDialog] = useState(createMediaDialogStore);
  const [colorMenu] = useState(createColorMenuStore);
  const [pasteNotice, setPasteNotice] = useState(false);
  const [linkHref, setLinkHref] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [usedColors, setUsedColors] = useState<string[]>(() => usedCustomColors(initialBody));
  const editorRef = useRef<Editor | null>(null);

  /** Uploads immediately and inserts an image Block with empty alt (flagged in the canvas until described) — the paste/drag-drop path never opens a dialog first. */
  function insertUploadedImage(file: File, pos?: number) {
    uploadArticleImage(file)
      .then((result) => {
        const editor = editorRef.current;
        if (!editor || editor.isDestroyed) return;
        const block: ImageBlock = {
          id: generateBlockId(),
          type: "image",
          source: "upload",
          url: result.url,
          alt: "",
          width: result.width,
          height: result.height,
        };
        // `insertContentAt`, not `insertContent`: a plain insert at a position, never a
        // replacement of whatever's currently selected (which could be another media Block atom).
        const at = pos ?? editor.state.selection.to;
        editor.chain().focus().insertContentAt(at, { type: DOC_NODE.preserved, attrs: { block } }).run();
      })
      .catch((err: unknown) => setMediaError(err instanceof Error ? err.message : "Зураг байршуулж чадсангүй"));
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: articleCanvasExtensions(slashMenu, mediaDialog, colorMenu),
    content: blocksToDoc(initialBody),
    editorProps: {
      attributes: {
        class: "article-canvas min-h-80 outline-none",
        "aria-label": "Нийтлэлийн агуулга",
      },
      transformPastedHTML: (html) => {
        const cleaned = cleanPastedContent(html);
        if (cleaned.changed) setPasteNotice(true);
        return cleaned.html;
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach((file) => insertUploadedImage(file));
        return true;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.from;
        files.forEach((file) => insertUploadedImage(file, pos));
        return true;
      },
    },
    onUpdate: ({ editor: e }) => {
      const blocks = docToBlocks({ ...e.getJSON(), type: "doc" });
      onChangeRef.current(blocks);
      setUsedColors(usedCustomColors(blocks));
    },
  });

  // Grow the title field to fit its wrapped lines (also on first render and remount).
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  useEffect(() => {
    editorRef.current = editor ?? null;
  }, [editor]);

  useEffect(() => {
    if (!pasteNotice) return;
    const timer = setTimeout(() => setPasteNotice(false), PASTE_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [pasteNotice]);

  useEffect(() => {
    if (!mediaError) return;
    const timer = setTimeout(() => setMediaError(null), MEDIA_ERROR_MS);
    return () => clearTimeout(timer);
  }, [mediaError]);

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
      // A link is never coloured (the converter sends a link span uncoloured regardless) —
      // strip any colour/highlight already on the selection so the canvas doesn't keep
      // showing a colour the next save would drop.
      chain.unsetMark(DOC_MARK.color).unsetMark(DOC_MARK.highlight).setLink({ href }).run();
    }
  }

  function removeLink() {
    setLinkHref(null);
    editor?.chain().focus().extendMarkRange(DOC_MARK.link).unsetLink().run();
  }

  return (
    <div className="relative">
      {editor && <CanvasToolbar editor={editor} onLink={openLinkDialog} colorMenu={colorMenu} usedColors={usedColors} />}
      <div className="space-y-2 empty:hidden">
        {pasteNotice && (
          <div
            role="status"
            className="mt-3 flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-800 dark:text-sky-200"
          >
            <Info className="size-3.5 shrink-0" />
            Зарим формат хасагдлаа
          </div>
        )}
        {mediaError && (
          <div
            role="alert"
            className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <Info className="size-3.5 shrink-0" />
            {mediaError}
          </div>
        )}
      </div>
      {/* The site reading card: light in the admin's dark mode, capped and centered like the Preview's. */}
      <div
        className={cn(SITE_FONT_CLASS, "site-light mt-3 min-h-80 rounded-xl border border-border bg-[color:var(--site-surface)] p-4")}
        style={SITE_SURFACE_STYLE}
      >
        <div className={SITE_CARD_CLASS}>
          <div className="mb-6">
            <textarea
              ref={titleRef}
              rows={1}
              value={title}
              onChange={(e) => onTitleChange(e.target.value.replace(/\n/g, " "))}
              onKeyDown={(e) => {
                // Enter is "done with the title" — never a line break; hand focus to the Body.
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  editor?.commands.focus("start");
                }
              }}
              placeholder="Гарчиг"
              aria-label="Гарчиг"
              aria-invalid={!!titleError}
              autoFocus={autoFocusTitle}
              className={cn(SITE_CLASS.title, "block w-full resize-none overflow-hidden border-0 bg-transparent outline-none placeholder:text-[color:var(--site-heading)]/30")}
            />
            {titleError && <p className="mt-1 text-center text-xs text-destructive">{titleError}</p>}
          </div>
          <EditorContent editor={editor} />
        </div>
      </div>
      <SlashMenu store={slashMenu} />
      <LinkDialog
        initialHref={linkHref}
        onOpenChange={(open) => !open && setLinkHref(null)}
        onSubmit={applyLink}
        onRemove={removeLink}
      />
      <MediaDialogs store={mediaDialog} />
    </div>
  );
}
