"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateImage } from "@/lib/api";

type Status = "idle" | "generating" | "ready" | "error";

export interface ImagePreviewState {
  tempId: string;
  base64: string;
}

interface ImagePreviewProps {
  defaultPrompt: string;
  onGenerated: (state: ImagePreviewState) => void;
}

export function ImagePreview({ defaultPrompt, onGenerated }: ImagePreviewProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [base64, setBase64] = useState("");
  const [error, setError] = useState("");

  const generate = useCallback(async () => {
    const text = prompt.trim();
    if (!text) return;
    setError("");
    setStatus("generating");
    try {
      const res = await generateImage(text);
      setBase64(res.base64);
      setStatus("ready");
      onGenerated({ tempId: res.temp_id, base64: res.base64 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Зураг үүсгэхэд алдаа гарлаа");
      setStatus("error");
    }
  }, [prompt, onGenerated]);

  const discard = useCallback(() => {
    setBase64("");
    setStatus("idle");
    setError("");
    onGenerated({ tempId: "", base64: "" });
  }, [onGenerated]);

  return (
    <div className="rounded-lg border border-dashed p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Зураг урьдчилан харах</p>
        {status === "ready" && (
          <span className="text-[10px] text-green-600 font-medium">Бэлэн</span>
        )}
      </div>

      {(status === "idle" || status === "error") && (
        <div className="space-y-2">
          <Textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Зурагны тодорхойлолт бичнэ..."
            className="resize-y text-xs"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={generate}
            disabled={!prompt.trim()}
            className="text-xs"
          >
            Зураг үүсгэх
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}

      {status === "generating" && (
        <p className="text-xs text-muted-foreground animate-pulse">Үүсгэж байна…</p>
      )}

      {status === "ready" && base64 && (
        <div className="space-y-2">
          <img
            src={`data:image/png;base64,${base64}`}
            alt="Үүсгэсэн зураг"
            className="rounded-md border max-h-48 object-contain"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={generate}>
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
