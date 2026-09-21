import type { ReviewItem } from "@/lib/types";
import type { PipelineStage } from "@/components/admin/StatusTrackBar";
import type { ArticleCategoryValue, ArticlePublishField, ArticleStatusValue } from "@/lib/article-types";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

interface StatusMeta {
  label: string;
  tone: Tone;
}

export const REVIEW_STATUS_META: Record<ReviewItem["status"], StatusMeta> = {
  pending:        { label: "Хүлээгдэж буй",      tone: "neutral"  },
  ai_passed:      { label: "AI дамжсан",           tone: "info"     },
  ai_flagged:     { label: "AI тэмдэглэсэн",       tone: "danger"   },
  human_approved: { label: "Батлагдсан",            tone: "success"  },
  human_rejected: { label: "Татгалзсан",            tone: "danger"   },
  needs_revision: { label: "Засах шаардлагатай",    tone: "warning"  },
};

export const PIPELINE_STAGE_META: Record<PipelineStage, StatusMeta> = {
  ai:       { label: "AI үүсгэсэн",         tone: "neutral"  },
  manual:   { label: "Гараар үүсгэсэн",     tone: "info"     },
  pending:  { label: "Хянахыг хүлээж буй",  tone: "warning"  },
  reviewed: { label: "Хянасан",             tone: "danger"   },
  approved: { label: "Баталгаажсан",        tone: "success"  },
};

export const ARTICLE_STATUS_META: Record<ArticleStatusValue, StatusMeta> = {
  DRAFT:     { label: "Ноорог",     tone: "neutral" },
  PUBLISHED: { label: "Нийтэлсэн",  tone: "success" },
};

export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategoryValue, string> = {
  READING:     "Унших",
  ORTHOGRAPHY: "Зөв бичих",
  SPELLING:    "Үсэглэх",
};

/** Same field names/order as `ARTICLE_PUBLISH_FIELDS` — the Publish checklist and its labels. */
export const ARTICLE_PUBLISH_FIELD_LABELS: Record<ArticlePublishField, string> = {
  title:     "Гарчиг",
  slug:      "URL (slug)",
  excerpt:   "Товч агуулга",
  thumbnail: "Нүүр зураг",
  body:      "Агуулга (дор хаяж нэг блок)",
};
