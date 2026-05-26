"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  generateImage,
  generateAudio,
  acceptImage,
  acceptAudio,
} from "@/lib/api";
import type { FormState } from "@/hooks/useTaskForm";
import type { OptionGroup } from "@/lib/task-defaults";
import type { AudioPreviewState } from "./AudioPreview";
import type { ImagePreviewState } from "./ImagePreview";

type GenStatus = "idle" | "generating" | "preview" | "accepting" | "accepted";

interface MediaStepProps {
  form: FormState;
  groups: OptionGroup[];
  taskId: string;
  variantId: string;
  audioAlreadyAccepted: boolean;
  imageAlreadyAccepted: boolean;
  onDone: () => void;
}

export function MediaStep({ form, groups, taskId, variantId, audioAlreadyAccepted, imageAlreadyAccepted, onDone }: MediaStepProps) {
  const showAudio = groups.includes("dictation") || !!form.audio_text;
  const showImage = groups.includes("dictation") || form.task_type === "TT5" || form.task_type === "TT12";

  // Audio state
  const [audioText, setAudioText] = useState(form.correct_answer || form.prompt_text);
  const [audioSlot, setAudioSlot] = useState<"dictation" | "prompt">("dictation");
  const [audioVoice, setAudioVoice] = useState("");
  const [audioStatus, setAudioStatus] = useState<GenStatus>(audioAlreadyAccepted ? "accepted" : "idle");
  const [audioTempId, setAudioTempId] = useState("");
  const [audioBlobUrl, setAudioBlobUrl] = useState("");
  const [audioError, setAudioError] = useState("");

  // Image state
  const [imgPrompt, setImgPrompt] = useState(form.correct_answer || form.title);
  const [imgStatus, setImgStatus] = useState<GenStatus>(imageAlreadyAccepted ? "accepted" : "idle");
  const [imgTempId, setImgTempId] = useState("");
  const [imgBase64, setImgBase64] = useState("");
  const [imgError, setImgError] = useState("");

  async function handleGenerateAudio() {
    setAudioError("");
    setAudioStatus("generating");
    try {
      const res = await generateAudio(audioText, audioSlot, audioVoice || undefined);
      const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
      if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
      setAudioTempId(res.temp_id);
      setAudioBlobUrl(url);
      setAudioStatus("preview");
    } catch (e) {
      setAudioError(e instanceof Error ? e.message : "Аудио үүсгэхэд алдаа гарлаа");
      setAudioStatus("idle");
    }
  }

  async function handleAcceptAudio() {
    setAudioStatus("accepting");
    try {
      await acceptAudio(audioTempId, taskId, variantId, audioSlot);
      setAudioStatus("accepted");
      setAudioError("");
    } catch (e) {
      setAudioError(e instanceof Error ? e.message : "Хадгалахад алдаа гарлаа");
      setAudioStatus("preview");
    }
  }

  function handleDiscardAudio() {
    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    setAudioBlobUrl("");
    setAudioTempId("");
    setAudioStatus("idle");
    setAudioError("");
  }

  async function handleGenerateImage() {
    setImgError("");
    setImgStatus("generating");
    try {
      const res = await generateImage(imgPrompt);
      setImgTempId(res.temp_id);
      setImgBase64(res.base64);
      setImgStatus("preview");
    } catch (e) {
      setImgError(e instanceof Error ? e.message : "Зураг үүсгэхэд алдаа гарлаа");
      setImgStatus("idle");
    }
  }

  async function handleAcceptImage() {
    setImgStatus("accepting");
    try {
      await acceptImage(imgTempId, taskId, variantId);
      setImgStatus("accepted");
      setImgError("");
    } catch (e) {
      setImgError(e instanceof Error ? e.message : "Хадгалахад алдаа гарлаа");
      setImgStatus("preview");
    }
  }

  function handleDiscardImage() {
    setImgBase64("");
    setImgTempId("");
    setImgStatus("idle");
    setImgError("");
  }

  const audioAccepted = audioStatus === "accepted";
  const imageAccepted = imgStatus === "accepted";

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="rounded-lg border border-green-500/30 bg-green-50 p-4 dark:bg-green-950/20">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-xs">✓</span>
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
              Даалгавар амжилттай үүсгэгдлээ
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              ID: {taskId} / Variant: {variantId}
            </p>
          </div>
        </div>
      </div>

      {/* Audio generation */}
      {showAudio && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Аудио үүсгэх</p>
              {audioAccepted && <Badge variant="default" className="bg-green-600 text-xs">Хадгалагдсан</Badge>}
            </div>
          </div>

          {!audioAccepted && (
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Уншигдах текст</label>
                <Textarea
                  rows={2}
                  value={audioText}
                  onChange={(e) => setAudioText(e.target.value)}
                  disabled={audioStatus !== "idle"}
                  className="resize-y text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Төрөл</label>
                  <div className="flex gap-3">
                    {(["dictation", "prompt"] as const).map((s) => (
                      <label key={s} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="audio-slot"
                          value={s}
                          checked={audioSlot === s}
                          onChange={() => setAudioSlot(s)}
                          disabled={audioStatus !== "idle"}
                          className="accent-primary"
                        />
                        {s === "dictation" ? "Диктант" : "Даалгавар"}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Дуу хоолой (заавал биш)</label>
                  <Input
                    className="h-7 w-28 text-xs"
                    placeholder="Kore"
                    value={audioVoice}
                    onChange={(e) => setAudioVoice(e.target.value)}
                    disabled={audioStatus !== "idle"}
                  />
                </div>
              </div>

              {audioStatus === "idle" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGenerateAudio}
                  disabled={!audioText.trim()}
                >
                  Аудио үүсгэх
                </Button>
              )}

              {audioStatus === "generating" && (
                <p className="text-xs text-muted-foreground animate-pulse">Үүсгэж байна…</p>
              )}

              {(audioStatus === "preview" || audioStatus === "accepting") && audioBlobUrl && (
                <div className="space-y-3">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <audio controls src={audioBlobUrl} className="w-full h-10" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAcceptAudio}
                      disabled={audioStatus === "accepting"}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {audioStatus === "accepting" ? "Хадгалж байна…" : "Зөвшөөрөх"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleDiscardAudio}
                      disabled={audioStatus === "accepting"}
                    >
                      Устгах
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleGenerateAudio}
                      disabled={audioStatus === "accepting"}
                    >
                      Дахин үүсгэх
                    </Button>
                  </div>
                </div>
              )}

              {audioError && <p className="text-xs text-destructive">{audioError}</p>}
            </div>
          )}

          {audioAccepted && audioBlobUrl && (
            <div className="rounded-md border bg-muted/30 p-3">
              <audio controls src={audioBlobUrl} className="w-full h-10" />
            </div>
          )}
        </div>
      )}

      {/* Image generation */}
      {showImage && (
        <>
          {showAudio && <Separator />}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Зураг үүсгэх</p>
              {imageAccepted && <Badge variant="default" className="bg-green-600 text-xs">Хадгалагдсан</Badge>}
            </div>

            {!imageAccepted && (
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Prompt</label>
                  <Textarea
                    rows={2}
                    value={imgPrompt}
                    onChange={(e) => setImgPrompt(e.target.value)}
                    disabled={imgStatus !== "idle"}
                    className="resize-y text-sm"
                  />
                </div>

                {imgStatus === "idle" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateImage}
                    disabled={!imgPrompt.trim()}
                  >
                    Зураг үүсгэх
                  </Button>
                )}

                {imgStatus === "generating" && (
                  <p className="text-xs text-muted-foreground animate-pulse">Үүсгэж байна…</p>
                )}

                {(imgStatus === "preview" || imgStatus === "accepting") && imgBase64 && (
                  <div className="space-y-3">
                    <div className="rounded-md border bg-muted/30 p-3">
                      <img
                        src={`data:image/png;base64,${imgBase64}`}
                        alt="Үүсгэсэн зураг"
                        className="rounded-md max-h-64 object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAcceptImage}
                        disabled={imgStatus === "accepting"}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {imgStatus === "accepting" ? "Хадгалж байна…" : "Зөвшөөрөх"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleDiscardImage}
                        disabled={imgStatus === "accepting"}
                      >
                        Устгах
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleGenerateImage}
                        disabled={imgStatus === "accepting"}
                      >
                        Дахин үүсгэх
                      </Button>
                    </div>
                  </div>
                )}

                {imgError && <p className="text-xs text-destructive">{imgError}</p>}
              </div>
            )}

            {imageAccepted && imgBase64 && (
              <div className="rounded-md border bg-muted/30 p-3">
                <img
                  src={`data:image/png;base64,${imgBase64}`}
                  alt="Хадгалагдсан зураг"
                  className="rounded-md max-h-64 object-contain"
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* No media needed */}
      {!showAudio && !showImage && (
        <p className="text-sm text-muted-foreground">
          Энэ даалгаврын төрөлд аудио/зураг шаардлагагүй.
        </p>
      )}
    </div>
  );
}
