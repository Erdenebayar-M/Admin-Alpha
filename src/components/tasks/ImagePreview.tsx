"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateImage } from "@/lib/api";
import { buildImagePrompt } from "@/lib/imagePromptTemplate";

type Status = "idle" | "generating" | "ready" | "error";

export interface ImagePreviewState {
  tempId: string;
  base64: string;
  /** Set instead of base64 when reusing an existing Word's image_url —
   * no generation/upload needed, saved directly at task-creation time. */
  url?: string;
}

interface ImagePreviewProps {
  correctAnswer: string;
  imageDescription: string;
  onDescriptionChange: (desc: string) => void;
  onGenerated: (state: ImagePreviewState) => void;
  gradeBand?: string[];
}

export function ImagePreview({ correctAnswer, imageDescription, onDescriptionChange, onGenerated, gradeBand }: ImagePreviewProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [base64, setBase64] = useState("");
  const [error, setError] = useState("");

  const generate = useCallback(async () => {
    const text = imageDescription.trim() || correctAnswer.trim();
    if (!text) return;
    setError("");
    setStatus("generating");
    try {
      const res = await generateImage(buildImagePrompt(text), gradeBand);
      setBase64(res.base64);
      setStatus("ready");
      onGenerated({ tempId: res.temp_id, base64: res.base64 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Зураг үүсгэхэд алдаа гарлаа");
      setStatus("error");
    }
  }, [imageDescription, correctAnswer, onGenerated]);

  const discard = useCallback(() => {
    setBase64("");
    setStatus("idle");
    setError("");
    onGenerated({ tempId: "", base64: "" });
  }, [onGenerated]);

  const currentDescription = imageDescription.trim() || correctAnswer.trim();

  return (
    <div className="rounded-lg border border-dashed p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Зураг үүсгэх</p>
        {status === "ready" && (
          <span className="text-[10px] text-green-600 font-medium">Бэлэн</span>
        )}
      </div>

      {(status === "idle" || status === "error") && (
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground">Зурагт юу дүрслэх вэ?</p>
            <Input
              value={imageDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder={correctAnswer || "Жнэ: алим, нар, нохой, малгайтай хүн..."}
              className="text-xs h-8"
            />
            <p className="text-[10px] text-muted-foreground">Зөв хариулт: {correctAnswer || "—"}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={generate}
            disabled={!currentDescription}
            className="text-xs"
          >
            Зураг үүсгэх
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}

      {status === "generating" && (
        <p className="text-xs text-muted-foreground animate-pulse">Орчуулж, зураг үүсгэж байна…</p>
      )}

      {status === "ready" && base64 && (
        <div className="space-y-2">
          <img
            src={`data:image/png;base64,${base64}`}
            alt="Үүсгэсэн зураг"
            className="rounded-md border max-h-48 object-contain"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={() => setStatus("idle")}>
              Дахин үүсгэх
            </Button>
            <Button type="button" size="sm" variant="ghost" className="text-xs text-destructive" onClick={discard}>
              Устгах
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
