"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, RotateCcw, Save, Trash2 } from "lucide-react";
import { useArticleEditor } from "@/hooks/useArticleEditor";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { ARTICLE_STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Lozenge } from "@/components/ui/lozenge";
import { PageHeader } from "@/components/ui/page-header";
import { ArticleSettingsPanel } from "./ArticleSettingsPanel";
import { ArticleCanvas } from "./canvas/ArticleCanvas";
import { DeleteArticleDialog } from "./DeleteArticleDialog";

const UNSAVED_MESSAGE = "Хадгалаагүй өөрчлөлт байна. Хуудсаас гарвал алга болно. Үргэлжлүүлэх үү?";

/** Create/edit page for one Article: title + Body canvas on the left, metadata settings on the right. */
export function ArticleEditor({ articleId }: { articleId?: string }) {
  const router = useRouter();
  const editor = useArticleEditor(articleId);
  const { form, article, fieldErrors } = editor;
  const [deleteOpen, setDeleteOpen] = useState(false);

  useUnsavedChangesGuard(editor.dirty, UNSAVED_MESSAGE);

  // Ctrl/⌘+S saves from anywhere on the page — including while typing in a field.
  const saveRef = useRef(editor.save);
  useEffect(() => {
    saveRef.current = editor.save;
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
            <Button size="sm" onClick={editor.save} disabled={editor.isSaving || (!!article && !editor.dirty)} title="Ctrl+S">
              {editor.isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              Хадгалах
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
          <ArticleCanvas
            key={editor.bodyRevision}
            initialBody={form.body}
            onChange={editor.setBody}
            blockErrors={editor.blockErrors}
          />
        </main>

        <ArticleSettingsPanel
          form={form}
          slugLocked={editor.slugLocked}
          errors={fieldErrors}
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
    </div>
  );
}
