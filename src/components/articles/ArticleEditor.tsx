"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Eye, Globe, Loader2, Pencil, RotateCcw, Save, Star, StarOff, Trash2, Undo2 } from "lucide-react";
import { useArticleEditor } from "@/hooks/useArticleEditor";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { ARTICLE_PUBLISH_FIELD_LABELS, ARTICLE_STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lozenge } from "@/components/ui/lozenge";
import { PageHeader } from "@/components/ui/page-header";
import { ArticleSettingsPanel } from "./ArticleSettingsPanel";
import { ArticleCanvas } from "./canvas/ArticleCanvas";
import { DeleteArticleDialog } from "./DeleteArticleDialog";
import { FeatureArticleDialog } from "./FeatureArticleDialog";
import { ArticlePreview } from "./preview/ArticlePreview";

const UNSAVED_MESSAGE = "Хадгалаагүй өөрчлөлт байна. Хуудсаас гарвал алга болно. Үргэлжлүүлэх үү?";

/** Create/edit page for one Article: title + Body canvas on the left, metadata settings on the right. */
export function ArticleEditor({ articleId }: { articleId?: string }) {
  const router = useRouter();
  const editor = useArticleEditor(articleId);
  const { form, article, fieldErrors } = editor;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [featureOpen, setFeatureOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const isPublished = article?.status === "PUBLISHED";
  // Publish, Unpublish, Feature and Unfeature all write `status`/`is_featured` on the
  // same row, and Save can flip status's dependent fields too — only one may be in
  // flight at a time, or two racing writes could each overwrite what the other set
  // (e.g. an Unpublish landing after a Feature would leave a Featured Draft, breaking
  // ADR 0002's Published-only invariant).
  const busy = editor.isSaving || editor.isPublishing || editor.isUnpublishing || editor.isFeaturing || editor.isUnfeaturing;
  // Saving a Published Article goes live immediately — confirm first instead of firing on click/Ctrl+S.
  function requestSave() {
    if (isPublished) setConfirmSaveOpen(true);
    else editor.save();
  }
  // A block-level save error is only ever shown inside the canvas (the outline on the
  // offending Block) — jump back to Write the moment one appears, so it's never silently
  // invisible behind Preview. Adjusted during render (not an effect) per the same
  // previous-value-comparison pattern useArticleEditor.ts's own `applyServer` call uses.
  const [seenBlockErrors, setSeenBlockErrors] = useState(editor.blockErrors);
  if (editor.blockErrors !== seenBlockErrors) {
    setSeenBlockErrors(editor.blockErrors);
    if (Object.keys(editor.blockErrors).length > 0) setPreview(false);
  }

  useUnsavedChangesGuard(editor.dirty, UNSAVED_MESSAGE);

  // Ctrl/⌘+S saves from anywhere on the page — including while typing in a field.
  const saveRef = useRef(requestSave);
  useEffect(() => {
    saveRef.current = requestSave;
  });
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (editor.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Ачаалж байна…
      </div>
    );
  }

  if (articleId && !article && editor.loadError) {
    return (
      <div className="px-4 py-12 text-center text-sm text-destructive sm:px-6">
        Нийтлэл ачаалж чадсангүй: {editor.loadError.message}
      </div>
    );
  }

  const status = article ? ARTICLE_STATUS_META[article.status] : null;

  return (
    <div>
      <PageHeader
        title={form.title.trim() || (article ? "Гарчиггүй нийтлэл" : "Шинэ нийтлэл")}
        breadcrumbs={[{ label: "Нийтлэл", href: "/admin/articles" }, { label: article ? "Засах" : "Шинэ" }]}
        actions={
          <>
            {status && <Lozenge tone={status.tone}>{status.label}</Lozenge>}
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {editor.isSaving ? "Хадгалж байна…" : editor.dirty ? "Хадгалаагүй өөрчлөлттэй" : article ? "Хадгалсан" : ""}
            </span>
            {article?.status === "DRAFT" && (
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 /> Устгах
              </Button>
            )}
            {isPublished ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnpublishOpen(true)}
                disabled={busy}
              >
                {editor.isUnpublishing ? <Loader2 className="animate-spin" /> : <Undo2 />}
                Ноорог болгох
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={editor.publish}
                disabled={!article || editor.dirty || editor.publishIssues.length > 0 || busy}
                title={
                  // Publish flips status on the last-*saved* row — an unsaved edit must be
                  // saved first, or Publish would go live on stale content.
                  editor.dirty
                    ? "Эхлээд хадгална уу"
                    : editor.publishIssues.length > 0
                      ? `Дутуу байгаа: ${editor.publishIssues.map((f) => ARTICLE_PUBLISH_FIELD_LABELS[f]).join(", ")}`
                      : undefined
                }
              >
                {editor.isPublishing ? <Loader2 className="animate-spin" /> : <Globe />}
                Нийтлэх
              </Button>
            )}
            {isPublished &&
              (article?.is_featured ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={editor.unfeature}
                  disabled={busy}
                >
                  {editor.isUnfeaturing ? <Loader2 className="animate-spin" /> : <StarOff />}
                  Онцлолыг цуцлах
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFeatureOpen(true)}
                  disabled={busy}
                >
                  {editor.isFeaturing ? <Loader2 className="animate-spin" /> : <Star />}
                  Онцлох
                </Button>
              ))}
            <Button
              size="sm"
              onClick={requestSave}
              disabled={busy || (!!article && !editor.dirty)}
              title="Ctrl+S"
            >
              {editor.isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              {isPublished ? "Шинэчлэх (шууд харагдана)" : "Хадгалах"}
            </Button>
          </>
        }
      />

      <div className="space-y-3 px-4 pt-4 sm:px-6">
        {editor.conflict && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            <p className="min-w-0 flex-1">
              Таныг засаж байх хооронд өөр хэн нэгэн энэ нийтлэлийг хадгалсан тул таны хадгалалт хүлээн авагдсангүй.
              Хамгийн сүүлийн хувилбарыг ачаалбал таны хадгалаагүй өөрчлөлт устана.
            </p>
            <Button size="sm" variant="outline" onClick={editor.reloadLatest} disabled={editor.isReloading}>
              <RotateCcw className={cn(editor.isReloading && "animate-spin")} />
              Сүүлийн хувилбарыг ачаалах
            </Button>
          </div>
        )}
        {editor.errorBanner && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p className="font-medium">Хадгалж чадсангүй: {editor.errorBanner.message}</p>
            {editor.errorBanner.details.length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {editor.errorBanner.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="min-w-0 space-y-4">
          <div className="space-y-1">
            <input
              value={form.title}
              onChange={(e) => editor.setTitle(e.target.value)}
              placeholder="Гарчиг"
              aria-label="Гарчиг"
              aria-invalid={!!fieldErrors.title}
              className="w-full border-0 bg-transparent text-3xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50"
              autoFocus={!articleId}
            />
            {fieldErrors.title && <p className="text-xs text-destructive">{fieldErrors.title}</p>}
          </div>

          <div role="tablist" aria-label="Горим" className="inline-flex w-fit gap-0.5 rounded-lg bg-muted p-0.5">
            <Button
              type="button"
              role="tab"
              aria-selected={!preview}
              variant="ghost"
              size="sm"
              onClick={() => setPreview(false)}
              className={cn(!preview && "bg-card text-foreground shadow-sm")}
            >
              <Pencil /> Бичих
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={preview}
              variant="ghost"
              size="sm"
              onClick={() => setPreview(true)}
              className={cn(preview && "bg-card text-foreground shadow-sm")}
            >
              <Eye /> Урьдчилан харах
            </Button>
          </div>

          {/* Both stay mounted — toggling only hides one — so an in-flight image upload
              (paste/drop) still lands, and switching back to Write keeps the Tiptap
              editor's own undo history, cursor and scroll position intact. */}
          <div className={cn(preview && "hidden")}>
            <ArticleCanvas
              key={editor.bodyRevision}
              initialBody={form.body}
              onChange={editor.setBody}
              blockErrors={editor.blockErrors}
            />
          </div>
          <div className={cn(!preview && "hidden")}>
            <ArticlePreview blocks={form.body} />
          </div>
        </main>

        <ArticleSettingsPanel
          form={form}
          slugLocked={editor.slugLocked}
          errors={fieldErrors}
          publishIssues={editor.publishIssues}
          onSlugChange={editor.setSlug}
          onCategoryChange={(v) => editor.update("category", v)}
          onExcerptChange={(v) => editor.update("excerpt", v)}
          onThumbnailChange={(v) => editor.update("thumbnail", v)}
        />
      </div>

      <DeleteArticleDialog
        article={deleteOpen && article ? { id: article.id, title: article.title } : null}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.replace("/admin/articles")}
      />

      <FeatureArticleDialog
        article={featureOpen && article ? { id: article.id, title: article.title } : null}
        onOpenChange={setFeatureOpen}
        onConfirm={() => {
          setFeatureOpen(false);
          editor.feature();
        }}
        isFeaturing={editor.isFeaturing}
      />

      <Dialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Нийтэлсэн нийтлэлийг шинэчлэх үү?</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4 px-6 py-5">
            <p className="text-sm text-foreground">
              Энэ нийтлэл нийтлэгдсэн тул хадгалсны дараа өөрчлөлт сайт дээр шууд харагдана.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmSaveOpen(false)}>
                Болих
              </Button>
              <Button
                onClick={() => {
                  setConfirmSaveOpen(false);
                  editor.save();
                }}
              >
                Шинэчлэх
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={unpublishOpen} onOpenChange={setUnpublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Нийтлэлийг ноорог болгох уу?</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4 px-6 py-5">
            <p className="text-sm text-foreground">
              «{article?.title || "Гарчиггүй"}» нийтлэл сайтаас шууд арилна. Дараа нь дахин нийтлэх боломжтой хэвээр
              байна.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUnpublishOpen(false)} disabled={editor.isUnpublishing}>
                Болих
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  editor.unpublish();
                  setUnpublishOpen(false);
                }}
                disabled={editor.isUnpublishing}
              >
                Ноорог болгох
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
