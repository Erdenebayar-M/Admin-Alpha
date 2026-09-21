"use client";

import { useQuery } from "@tanstack/react-query";
import { getFeaturedArticle } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FeatureArticleDialogProps {
  article: { id: string; title: string } | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isFeaturing: boolean;
}

/**
 * Confirm-then-feature. Featuring is a single hand-picked slot (ADR 0002),
 * not a queue, so this names whichever other Article currently holds it —
 * featuring the one being confirmed here un-features that one as a side
 * effect the staff member should make knowingly, not discover afterward.
 */
export function FeatureArticleDialog({ article, onOpenChange, onConfirm, isFeaturing }: FeatureArticleDialogProps) {
  const { data: currentlyFeatured, isLoading } = useQuery({
    queryKey: ["featured-article"],
    queryFn: getFeaturedArticle,
    enabled: !!article,
    staleTime: 0,
  });

  const title = article?.title || "Гарчиггүй";

  return (
    <Dialog open={!!article} onOpenChange={(open) => !isFeaturing && onOpenChange(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Нийтлэлийг онцлох уу?</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 px-6 py-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Шалгаж байна…</p>
          ) : currentlyFeatured ? (
            <p className="text-sm text-foreground">
              Одоогоор «{currentlyFeatured.title}» нийтлэл онцлогдсон байна. «{title}»-г онцолвол «
              {currentlyFeatured.title}» онцлолгүй болно.
            </p>
          ) : (
            <p className="text-sm text-foreground">«{title}» нийтлэлийг онцлох уу?</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isFeaturing}>
              Болих
            </Button>
            <Button onClick={onConfirm} disabled={isFeaturing || isLoading}>
              {isFeaturing ? "Онцолж байна…" : "Онцлох"}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
