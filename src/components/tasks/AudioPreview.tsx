"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { generateAudio } from "@/lib/api";

type Status = "idle" | "generating" | "ready" | "error";

export interface AudioPreviewState {
  tempId: string;
  blobUrl: string;
  slot: "dictation" | "prompt";
}

interface AudioPreviewProps {
  text: string;
  slot?: "dictation" | "prompt";
  onGenerated: (state: AudioPreviewState) => void;
}

export function AudioPreview({ text, slot = "dictation", onGenerated }: AudioPreviewProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [blobUrl, setBlobUrl] = useState("");
  const [error, setError] = useState("");

  const generate = useCallback(async () => {
    if (!text.trim()) return;
    setError("");
    setStatus("generating");
    try {
      const res = await generateAudio(text, slot);
      const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(url);
      setStatus("ready");
      onGenerated({ tempId: res.temp_id, blobUrl: url, slot });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Аудио үүсгэхэд алдаа гарлаа");
      setStatus("error");
    }
  }, [text, slot, blobUrl, onGenerated]);

  const discard = useCallback(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl("");
    setStatus("idle");
    setError("");
    onGenerated({ tempId: "", blobUrl: "", slot });
  }, [blobUrl, slot, onGenerated]);

  return (
    <div className="rounded-lg border border-dashed p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Аудио урьдчилан сонсох</p>
        {status === "ready" && (
          <span className="text-[10px] text-green-600 font-medium">Бэлэн</span>
        )}
      </div>

      {status === "idle" || status === "error" ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            &ldquo;{text || "—"}&rdquo; гэсэн текстээр аудио үүсгэнэ
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={generate}
            disabled={!text.trim()}
            className="text-xs"
          >
            Аудио үүсгэх
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      ) : status === "generating" ? (
        <p className="text-xs text-muted-foreground animate-pulse">Үүсгэж байна…</p>
      ) : (
        <div className="space-y-2">
          <audio controls src={blobUrl} className="w-full h-9" />
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
