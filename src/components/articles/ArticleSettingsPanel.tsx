"use client";

import { CheckCircle2, Circle, Lock, WandSparkles } from "lucide-react";
import {
  ARTICLE_CATEGORIES,
  ARTICLE_PUBLISH_FIELDS,
  type ArticleCategoryValue,
  type ArticlePublishField,
  type ArticleThumbnail,
} from "@/lib/article-types";
import { EXCERPT_MAX, excerptFromBody, type ArticleFormState } from "@/lib/article-form";
import type { ArticleFieldErrors } from "@/lib/article-errors";
import { ARTICLE_CATEGORY_LABELS, ARTICLE_PUBLISH_FIELD_LABELS } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThumbnailField } from "./ThumbnailField";

interface ArticleSettingsPanelProps {
  form: ArticleFormState;
  slugLocked: boolean;
  errors: ArticleFieldErrors;
  publishIssues: ArticlePublishField[];
  onSlugChange: (slug: string) => void;
  onCategoryChange: (category: ArticleCategoryValue) => void;
  onExcerptChange: (excerpt: string) => void;
  onThumbnailChange: (thumbnail: ArticleThumbnail | null) => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

/** Mirrors the backend's own Publish-readiness rule (`getArticlePublishIssues`) live, as-you-type. */
function PublishChecklist({ issues }: { issues: ArticlePublishField[] }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-xs font-medium text-foreground">Нийтлэхэд бэлэн байдал</p>
      <ul className="space-y-1.5">
        {ARTICLE_PUBLISH_FIELDS.map((field) => {
          const missing = issues.includes(field);
          return (
            <li
              key={field}
              className={cn("flex items-center gap-2 text-xs", missing ? "text-muted-foreground" : "text-foreground")}
            >
              {missing ? (
                <Circle className="size-3.5 shrink-0" />
              ) : (
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
              )}
              {ARTICLE_PUBLISH_FIELD_LABELS[field]}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ArticleSettingsPanel({
  form,
  slugLocked,
  errors,
  publishIssues,
  onSlugChange,
  onCategoryChange,
  onExcerptChange,
  onThumbnailChange,
}: ArticleSettingsPanelProps) {
  const firstParagraph = excerptFromBody(form.body);
  return (
    <aside className="space-y-5 rounded-xl border border-border bg-card p-4">
      <div className="space-y-2">
        <Label htmlFor="article-slug">
          URL (slug)
          {slugLocked && <Lock className="size-3 text-muted-foreground" aria-label="Түгжээтэй" />}
        </Label>
        <Input
          id="article-slug"
          value={form.slug}
          onChange={(e) => onSlugChange(e.target.value)}
          readOnly={slugLocked}
          aria-invalid={!!errors.slug}
          className={cn("font-mono text-xs", slugLocked && "bg-muted text-muted-foreground")}
          placeholder="garchig-avtomataar"
        />
        {slugLocked ? (
          <p className="text-xs text-muted-foreground">Нийтлэгдсэн нийтлэлийн URL-ыг өөрчлөх боломжгүй.</p>
        ) : (
          <p className="text-xs text-muted-foreground">Гарчгаас автоматаар үүснэ. Латин жижиг үсэг, тоо, зураас.</p>
        )}
        <FieldError message={errors.slug} />
      </div>

      <div className="space-y-2">
        <Label>Ангилал</Label>
        <Select value={form.category} onValueChange={(v) => onCategoryChange(v as ArticleCategoryValue)}>
          <SelectTrigger className="w-full" aria-invalid={!!errors.category}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ARTICLE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {ARTICLE_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.category} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="article-excerpt">Товч агуулга</Label>
          <span
            className={cn(
              "text-xs tabular-nums",
              form.excerpt.length >= EXCERPT_MAX ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {form.excerpt.length} / {EXCERPT_MAX}
          </span>
        </div>
        <Textarea
          id="article-excerpt"
          value={form.excerpt}
          onChange={(e) => onExcerptChange(e.target.value.slice(0, EXCERPT_MAX))}
          maxLength={EXCERPT_MAX}
          rows={4}
          aria-invalid={!!errors.excerpt}
          placeholder="Жагсаалт болон хуваалцахад харагдах товч тайлбар"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => firstParagraph && onExcerptChange(firstParagraph)}
          disabled={!firstParagraph}
          title={firstParagraph ? undefined : "Агуулгад догол мөр алга"}
        >
          <WandSparkles /> Эхний догол мөрөөс бөглөх
        </Button>
        <FieldError message={errors.excerpt} />
      </div>

      <ThumbnailField
        value={form.thumbnail}
        onChange={onThumbnailChange}
        error={errors.thumbnail}
        bodyImages={form.body.filter((b) => b.type === "image")}
      />

      <PublishChecklist issues={publishIssues} />
    </aside>
  );
}
