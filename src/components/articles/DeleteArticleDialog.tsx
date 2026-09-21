"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteArticle } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DeleteArticleDialogProps {
  article: { id: string; title: string } | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/**
 * Confirm-then-delete for a Draft. Callers only offer it when
 * `status === 'DRAFT'`; if the Article was Published in the meantime the
 * backend answers 422 and its message is shown here instead of a generic failure.
 */
export function DeleteArticleDialog({ article, onOpenChange, onDeleted }: DeleteArticleDialogProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => deleteArticle(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ["article", id] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      onOpenChange(false);
      onDeleted?.();
    },
  });

  function handleOpenChange(open: boolean) {
    if (!open) mutation.reset();
    onOpenChange(open);
  }

  return (
    <Dialog open={!!article} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ноорог устгах</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 px-6 py-5">
          <p className="text-sm text-foreground">
            «{article?.title || "Гарчиггүй"}» ноорогийг бүр мөсөн устгах уу? Энэ үйлдлийг буцаах боломжгүй.
          </p>
          {mutation.error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {mutation.error.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending}>
              Болих
            </Button>
            <Button
              variant="destructive"
              onClick={() => article && mutation.mutate(article.id)}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Устгаж байна…" : "Устгах"}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
