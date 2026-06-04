import type { ReviewItem } from "@/lib/types";
import type { PipelineStage } from "@/components/admin/StatusTrackBar";

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
