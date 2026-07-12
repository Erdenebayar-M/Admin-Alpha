"use client";

import { useCallback, useRef, useState } from "react";
import { Mic, Square, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blobToBase64 } from "@/lib/r2Upload";

type Status = "idle" | "ready" | "error";

export interface AudioPreviewState {
  tempId: string;
  base64: string;
  blobUrl: string;
  slot: "dictation" | "prompt";
}

interface AudioPreviewProps {
  text: string;
  slot?: "dictation" | "prompt";
  onGenerated: (state: AudioPreviewState) => void;
}

/** Record via mic (primary) or pick a file (fallback); TTS generation lands later. */
export function AudioPreview({ text, slot = "dictation", onGenerated }: AudioPreviewProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [blobUrl, setBlobUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const acceptBlob = useCallback(async (blob: Blob) => {
    setBusy(true);
    setError("");
    try {
      const base64 = await blobToBase64(blob);
      const url = URL.createObjectURL(blob);
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setStatus("ready");
      onGenerated({ tempId: "", base64, blobUrl: url, slot });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Аудио уншихад алдаа гарлаа");
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }, [slot, onGenerated]);

  const startRecording = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void acceptBlob(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Микрофон уруу хандах эрх өгөгдсөнгүй");
    }
  }, [acceptBlob]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setRecording(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void acceptBlob(file);
  }, [acceptBlob]);

  const discard = useCallback(() => {
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setStatus("idle");
    setError("");
    onGenerated({ tempId: "", base64: "", blobUrl: "", slot });
  }, [slot, onGenerated]);

  return (
    <div className="rounded-lg border border-dashed p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Аудио</p>
        {status === "ready" && (
          <span className="text-[10px] text-green-600 font-medium">Бэлэн</span>
        )}
      </div>

      {recording ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={stopRecording}
            className="text-xs flex items-center gap-1.5"
          >
            <Square className="size-3.5" />
            Зогсоох
          </Button>
          <span className="text-xs text-muted-foreground animate-pulse">Бичиж байна…</span>
        </div>
      ) : status === "ready" ? (
        <div className="space-y-2">
          <audio controls src={blobUrl} className="w-full h-9" />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={startRecording}>
              Дахин бичих
            </Button>
            <Button type="button" size="sm" variant="ghost" className="text-xs text-destructive" onClick={discard}>
              Устгах
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            &ldquo;{text || "—"}&rdquo; гэсэн текстийг уншиж бичих
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={startRecording}
              disabled={busy}
              className="text-xs flex items-center gap-1.5"
            >
              <Mic className="size-3.5" />
              Бичих
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs flex items-center gap-1.5"
            >
              <Upload className="size-3.5" />
              Файл сонгох
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
