'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { TaskContent } from '@/lib/types';
import { TASK_TYPE_INFO } from '@/lib/task-defaults';
import {
  generateImage,
  generateAudio,
  saveImageAndUpdateTask,
  saveAudioAndUpdateTask,
} from '@/lib/api';

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
  'TT_LISTEN_CHOOSE',
  // dictation/mini_text/sentence_fill groups are already covered by the groups check in needsAudio()
]);

const IMAGE_TASK_TYPES = new Set([
  'TT_IMAGE_WORD_MATCH',
  'TT_MATCH_PAIRS',
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
  const [imgPrompt, setImgPrompt] = useState(task.prompt_text);
  const [imgStatus, setImgStatus] = useState<GenStatus>('idle');
  const [imgTempId, setImgTempId] = useState('');
  const [imgBase64, setImgBase64] = useState('');
  const [imgError, setImgError] = useState('');

  // Audio state
  const [audioText, setAudioText] = useState(task.options.audio_text || task.prompt_text);
  const [audioSlot, setAudioSlot] = useState<'dictation' | 'prompt'>('dictation');
  const [audioVoice, setAudioVoice] = useState('');
  const [audioStatus, setAudioStatus] = useState<GenStatus>('idle');
  const [audioBase64, setAudioBase64] = useState('');
  const [audioBlobUrl, setAudioBlobUrl] = useState('');
  const [audioError, setAudioError] = useState('');

  if (!showAudio && !showImage) return null;

  const taskId = task.task_id;

  async function handleGenerateImage() {
    setImgError('');
    setImgStatus('generating');
    try {
      const res = await generateImage(imgPrompt, task.grade_band);
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
      await saveImageAndUpdateTask(imgBase64, taskId, variantId, stage);
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

  async function handleGenerateAudio() {
    setAudioError('');
    setAudioStatus('generating');
    try {
      const res = await generateAudio(audioText, audioSlot, audioVoice || undefined);
      const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
      if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
      setAudioBase64(res.base64);
      setAudioBlobUrl(url);
      setAudioStatus('preview');
    } catch (e) {
      setAudioError(e instanceof Error ? e.message : 'Generation failed');
      setAudioStatus('idle');
    }
  }

  async function handleAcceptAudio() {
    setAudioStatus('accepting');
    try {
      await saveAudioAndUpdateTask(audioBase64, taskId, variantId, audioSlot, stage);
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl('');
      setAudioBase64('');
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
    setAudioBase64('');
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
                <label className="mb-1 block text-xs text-muted-foreground">Prompt</label>
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

          {/* Audio tab */}
          {showAudio && tab === 'audio' && (
            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Text</label>
                <textarea
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  value={audioText}
                  onChange={(e) => setAudioText(e.target.value)}
                  disabled={audioStatus !== 'idle' && audioStatus !== 'accepted'}
                />
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
                          disabled={audioStatus !== 'idle' && audioStatus !== 'accepted'}
                          className="accent-foreground"
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Voice (optional)</label>
                  <input
                    type="text"
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs w-28 focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Kore"
                    value={audioVoice}
                    onChange={(e) => setAudioVoice(e.target.value)}
                    disabled={audioStatus !== 'idle' && audioStatus !== 'accepted'}
                  />
                </div>
              </div>

              {(audioStatus === 'idle' || audioStatus === 'accepted') && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateAudio}
                    disabled={!audioText.trim()}
                    className={cn(btnBase, 'bg-primary text-primary-foreground hover:bg-primary/90')}
                  >
                    Generate audio
                  </button>
                  {audioStatus === 'accepted' && (
                    <span className="text-xs font-medium text-green-600">Saved</span>
                  )}
                </div>
              )}

              {audioStatus === 'generating' && (
                <p className="text-xs text-muted-foreground animate-pulse">Generating…</p>
              )}

              {(audioStatus === 'preview' || audioStatus === 'accepting') && audioBlobUrl && (
                <div className="space-y-2">
                  <audio
                    controls
                    src={audioBlobUrl}
                    className="w-full h-8"
                  />
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
