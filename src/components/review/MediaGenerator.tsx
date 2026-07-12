'use client';

import { useRef, useState } from 'react';
import { Mic, Square, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskContent } from '@/lib/types';
import { TASK_TYPE_INFO } from '@/lib/task-defaults';
import {
  generateImage,
  saveImageAndUpdateTask,
  saveAudioBlobAndUpdateTask,
} from '@/lib/api';
import { buildImagePrompt } from '@/lib/imagePromptTemplate';

interface Props {
  task: TaskContent;
  variantId: string;
  stage?: string;
  onMediaAccepted: () => void;
}

type Tab = 'image' | 'audio';
type GenStatus = 'idle' | 'generating' | 'preview' | 'accepting' | 'accepted';

const btnBase =
  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none';

const AUDIO_TASK_TYPES = new Set([
  'TT_1_1', 'TT_1_4', 'TT_1_5',
  'TT_2_4',
  'TT_3_1', 'TT_3_2', 'TT_3_3',
  'TT_4_1', 'TT_4_2', 'TT_4_4',
  'TT_7_3', 'TT_7_4', 'TT_7_5', 'TT_7_6', 'TT_7_7',
]);

const IMAGE_TASK_TYPES = new Set([
  'TT_1_2', 'TT_1_3',
  'TT_2_1', 'TT_2_2', 'TT_2_3',
]);

function needsAudio(task: TaskContent): boolean {
  return (
    !!task.audio_url ||
    !!task.options.audio_text ||
    AUDIO_TASK_TYPES.has(task.task_type) ||
    (TASK_TYPE_INFO[task.task_type]?.groups.some((g) => g === 'dictation' || g === 'mini_text' || g === 'sentence_fill') ?? false)
  );
}

function needsImage(task: TaskContent): boolean {
  return !!task.image_url || IMAGE_TASK_TYPES.has(task.task_type);
}

export function MediaGenerator({ task, variantId, stage = 'validated', onMediaAccepted }: Props) {
  const showAudio = needsAudio(task);
  const showImage = needsImage(task);

  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>(() => (showAudio ? 'audio' : 'image'));

  // Image state
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgStatus, setImgStatus] = useState<GenStatus>('idle');
  const [imgTempId, setImgTempId] = useState('');
  const [imgBase64, setImgBase64] = useState('');
  const [imgError, setImgError] = useState('');

  // Audio state — recorded via mic or picked as a file; TTS comes later
  const [audioSlot, setAudioSlot] = useState<'dictation' | 'prompt'>('dictation');
  const [audioStatus, setAudioStatus] = useState<GenStatus>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState('');
  const [audioError, setAudioError] = useState('');
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!showAudio && !showImage) return null;

  async function handleGenerateImage() {
    setImgError('');
    setImgStatus('generating');
    try {
      const res = await generateImage(buildImagePrompt(imgPrompt), task.grade_band);
      setImgTempId(res.temp_id);
      setImgBase64(res.base64);
      setImgStatus('preview');
    } catch (e) {
      setImgError(e instanceof Error ? e.message : 'Generation failed');
      setImgStatus('idle');
    }
  }

  async function handleAcceptImage() {
    setImgStatus('accepting');
    try {
      await saveImageAndUpdateTask(imgBase64, variantId, stage);
      setImgBase64('');
      setImgTempId('');
      setImgError('');
      setImgStatus('accepted');
      onMediaAccepted();
    } catch (e) {
      setImgError(e instanceof Error ? e.message : 'Accept failed');
      setImgStatus('preview');
    }
  }

  function handleDiscardImage() {
    setImgBase64('');
    setImgTempId('');
    setImgStatus('idle');
    setImgError('');
  }

  function handleLocalAudio(blob: Blob) {
    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    const url = URL.createObjectURL(blob);
    setAudioBlob(blob);
    setAudioBlobUrl(url);
    setAudioError('');
    setAudioStatus('preview');
  }

  async function startRecording() {
    setAudioError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        handleLocalAudio(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setAudioError('Микрофон уруу хандах эрх өгөгдсөнгүй');
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  function handleAudioFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handleLocalAudio(file);
  }

  async function handleAcceptAudio() {
    if (!audioBlob) return;
    setAudioStatus('accepting');
    try {
      await saveAudioBlobAndUpdateTask(audioBlob, variantId, audioSlot, stage);
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl('');
      setAudioBlob(null);
      setAudioError('');
      setAudioStatus('accepted');
      onMediaAccepted();
    } catch (e) {
      setAudioError(e instanceof Error ? e.message : 'Accept failed');
      setAudioStatus('preview');
    }
  }

  function handleDiscardAudio() {
    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    setAudioBlobUrl('');
    setAudioBlob(null);
    setAudioStatus('idle');
    setAudioError('');
  }


  return (
    <div className="rounded-md border border-dashed border-border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>Generate media</span>
        <span className="tabular-nums">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {/* Tabs — only render tabs that apply */}
          {showAudio && showImage && (
            <div className="flex gap-1 rounded-md bg-muted p-0.5 w-fit">
              {(['audio', 'image'] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'rounded px-3 py-1 text-xs font-medium transition-colors capitalize',
                    tab === t
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Image tab */}
          {showImage && tab === 'image' && (
            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Дүрслэх зүйл</label>
                <textarea
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  value={imgPrompt}
                  onChange={(e) => setImgPrompt(e.target.value)}
                  disabled={imgStatus !== 'idle' && imgStatus !== 'accepted'}
                />
              </div>

              {(imgStatus === 'idle' || imgStatus === 'accepted') && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={!imgPrompt.trim()}
                    className={cn(btnBase, 'bg-primary text-primary-foreground hover:bg-primary/90')}
                  >
                    Generate image
                  </button>
                  {imgStatus === 'accepted' && (
                    <span className="text-xs font-medium text-green-600">Saved</span>
                  )}
                </div>
              )}

              {imgStatus === 'generating' && (
                <p className="text-xs text-muted-foreground animate-pulse">Generating…</p>
              )}

              {(imgStatus === 'preview' || imgStatus === 'accepting') && imgBase64 && (
                <div className="space-y-2">
                  <img
                    src={`data:image/png;base64,${imgBase64}`}
                    alt="Generated preview"
                    className="rounded-md border border-border max-h-52 object-contain"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAcceptImage}
                      disabled={imgStatus === 'accepting'}
                      className={cn(btnBase, 'bg-green-600 text-white hover:bg-green-700')}
                    >
                      {imgStatus === 'accepting' ? 'Saving…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardImage}
                      disabled={imgStatus === 'accepting'}
                      className={cn(btnBase, 'border border-border text-muted-foreground hover:text-foreground')}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {imgError && (
                <p className="text-xs text-red-600">{imgError}</p>
              )}
            </div>
          )}

          {/* Audio tab — record via mic or upload a file; TTS generation lands later */}
          {showAudio && tab === 'audio' && (
            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Уншиж бичих текст</label>
                <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  &ldquo;{task.options.audio_text as string ?? task.prompt_text}&rdquo;
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Slot</label>
                  <div className="flex gap-2">
                    {(['dictation', 'prompt'] as const).map((s) => (
                      <label key={s} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="audio-slot"
                          value={s}
                          checked={audioSlot === s}
                          onChange={() => setAudioSlot(s)}
                          disabled={recording || (audioStatus !== 'idle' && audioStatus !== 'accepted')}
                          className="accent-foreground"
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              {(audioStatus === 'idle' || audioStatus === 'accepted') && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={recording ? stopRecording : startRecording}
                    className={cn(
                      btnBase,
                      'flex items-center gap-1.5',
                      recording
                        ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90',
                    )}
                  >
                    {recording ? <Square className="size-3.5" /> : <Mic className="size-3.5" />}
                    {recording ? 'Зогсоох' : 'Бичих'}
                  </button>
                  <button
                    type="button"
                    disabled={recording}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(btnBase, 'flex items-center gap-1.5 border border-border text-muted-foreground hover:text-foreground')}
                  >
                    <Upload className="size-3.5" />
                    Файл сонгох
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleAudioFileChange}
                  />
                  {audioStatus === 'accepted' && (
                    <span className="text-xs font-medium text-green-600">Saved</span>
                  )}
                </div>
              )}

              {(audioStatus === 'preview' || audioStatus === 'accepting') && audioBlobUrl && (
                <div className="space-y-2">
                  <audio controls src={audioBlobUrl} className="w-full h-8" />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAcceptAudio}
                      disabled={audioStatus === 'accepting'}
                      className={cn(btnBase, 'bg-green-600 text-white hover:bg-green-700')}
                    >
                      {audioStatus === 'accepting' ? 'Saving…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardAudio}
                      disabled={audioStatus === 'accepting'}
                      className={cn(btnBase, 'border border-border text-muted-foreground hover:text-foreground')}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {audioError && (
                <p className="text-xs text-red-600">{audioError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
