"use client";

import { useState } from "react";
import { isAllowedHref } from "@/lib/article-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkDialogProps {
  /** `null` = closed; otherwise the href to start from ("" for a new link). */
  initialHref: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (href: string) => void;
  onRemove: () => void;
}

/** Insert or edit an inline link. Only hrefs the backend's `inlineHrefSchema` accepts can be submitted. */
export function LinkDialog({ initialHref, onOpenChange, onSubmit, onRemove }: LinkDialogProps) {
  return (
    <Dialog open={initialHref !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Холбоос</DialogTitle>
        </DialogHeader>
        {/* Keyed so the field resets to the link being edited each time the dialog opens. */}
        {initialHref !== null && (
          <LinkForm
            key={initialHref}
            initialHref={initialHref}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
            onRemove={onRemove}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function LinkForm({
  initialHref,
  onCancel,
  onSubmit,
  onRemove,
}: {
  initialHref: string;
  onCancel: () => void;
  onSubmit: (href: string) => void;
  onRemove: () => void;
}) {
  const [href, setHref] = useState(initialHref);
  const [touched, setTouched] = useState(false);
  const value = href.trim();
  const valid = isAllowedHref(value);

  return (
    <DialogBody className="px-6 py-5">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (valid) onSubmit(value);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="article-link-href">URL</Label>
          <Input
            id="article-link-href"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="https://…"
            aria-invalid={touched && !valid}
            autoFocus
          />
          {touched && !valid ? (
            <p className="text-xs text-destructive">
              https://, http://, mailto: эсвэл «/»-ээр эхэлсэн сайтын доторх зам байх ёстой.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">https://, http://, mailto: эсвэл /articles/… гэх мэт дотоод зам.</p>
          )}
        </div>
        <div className="flex justify-between gap-2">
          {initialHref ? (
            <Button type="button" variant="destructive" onClick={onRemove}>
              Холбоос арилгах
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Болих
            </Button>
            <Button type="submit">Хадгалах</Button>
          </div>
        </div>
      </form>
    </DialogBody>
  );
}
