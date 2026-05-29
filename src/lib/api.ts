import axios from "axios";
import type {
  ContentStats,
  ReviewAction,
  TaskContent,
  TaskOptions,
  TaskVariant,
  TaskListResponse,
  TaskVariantResponse,
} from "./types";

const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const client = axios.create({
  baseURL: `${API_BASE}/api/admin/content`,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ADMIN_TOKEN}`,
  },
});

client.interceptors.response.use(
  (r) => r,
  (err) => {
    const data = err.response?.data as
      | { message?: string; error?: string | { message?: string } }
      | undefined;
    const msg =
      data?.message ??
      (typeof data?.error === "string"
        ? data.error
        : data?.error?.message) ??
      err.message;
    return Promise.reject(new Error(msg));
  },
);

export interface TaskFilters {
  stage?: string;
  grade?: string;
  type?: string;
  skill?: string;
}

export async function getContentStats(): Promise<ContentStats> {
  const { data } = await client.get<{ success: boolean; data: ContentStats }>("/stats");
  return data.data;
}

export async function getTaskVariants(
  filters?: TaskFilters,
): Promise<TaskVariant[]> {
  const { data } = await client.get<TaskListResponse>("/tasks", {
    params: filters,
  });
  return data.data.tasks;
}

export async function getTaskVariant(taskId: string): Promise<TaskVariant[]> {
  const { data } = await client.get<TaskVariantResponse>(`/tasks/${taskId}`);
  return data.data.variants;
}

export async function approveVariant(
  taskId: string,
  variantId: string,
  notes?: string,
): Promise<void> {
  await client.post("/approve", {
    task_id: taskId,
    variant_id: variantId,
    notes,
  });
}

export async function rejectVariant(
  taskId: string,
  variantId: string,
  reason: string,
): Promise<void> {
  await client.post("/reject", {
    task_id: taskId,
    variant_id: variantId,
    reason,
  });
}

export async function flagVariant(
  taskId: string,
  variantId: string,
  reason: string,
): Promise<void> {
  await client.post("/flag", {
    task_id: taskId,
    variant_id: variantId,
    reason,
  });
}

export async function reviseVariant(
  taskId: string,
  variantId: string,
  reason: string,
): Promise<void> {
  await client.post("/revise", {
    task_id: taskId,
    variant_id: variantId,
    reason,
  });
}

export async function editVariant(
  taskId: string,
  variantId: string,
  updates: Partial<TaskContent>,
  stage = 'stage2',
): Promise<void> {
  await client.post('/edit', {
    task_id: taskId,
    variant_id: variantId,
    stage,
    updates,
  });
}

export interface GenerateImageResult {
  temp_id: string;
  base64: string;
}

export interface GenerateAudioResult {
  temp_id: string;
  base64: string;
}

export async function generateImage(prompt: string): Promise<GenerateImageResult> {
  const { data } = await client.post<{ success: boolean; data: { temp_id: string; base64: string } }>(
    '/generate-image',
    { prompt },
  );
  return { temp_id: data.data.temp_id, base64: data.data.base64 };
}

export async function generateAudio(
  text: string,
  slot: 'dictation' | 'prompt',
  voice?: string,
): Promise<GenerateAudioResult> {
  const { data } = await client.post<{ success: boolean; data: { temp_id: string; base64: string } }>(
    '/generate-audio',
    { text, slot, ...(voice ? { voice } : {}) },
  );
  return { temp_id: data.data.temp_id, base64: data.data.base64 };
}

export async function acceptImage(
  tempId: string,
  taskId: string,
  variantId: string,
  stage?: string,
): Promise<void> {
  await client.post('/accept-image', {
    temp_id: tempId,
    task_id: taskId,
    variant_id: variantId,
    ...(stage ? { stage } : {}),
  });
}

export async function acceptAudio(
  tempId: string,
  taskId: string,
  variantId: string,
  slot: 'dictation' | 'prompt',
  stage?: string,
): Promise<void> {
  await client.post('/accept-audio', {
    temp_id: tempId,
    task_id: taskId,
    variant_id: variantId,
    slot,
    ...(stage ? { stage } : {}),
  });
}

// ─── Direct R2 upload functions ────────────────────────────────────────────

import { uploadImageToR2, uploadAudioToR2, base64ToBlob, type R2UploadResult } from './r2Upload';

export async function saveImageAndUpdateTask(
  base64: string,
  taskId: string,
  variantId: string,
  stage: string = 'validated',
): Promise<R2UploadResult> {
  try {
    // Convert base64 to blob and upload to R2
    const blob = await base64ToBlob(base64, 'image/jpeg');
    const result = await uploadImageToR2(blob);

    // Update the task variant with the new image URL
    await client.post('/update-image', {
      task_id: taskId,
      variant_id: variantId,
      image_url: result.url,
      stage,
    });

    return result;
  } catch (error) {
    throw new Error(`Failed to save image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function saveAudioAndUpdateTask(
  base64: string,
  taskId: string,
  variantId: string,
  slot: 'dictation' | 'prompt',
  stage: string = 'validated',
): Promise<R2UploadResult> {
  try {
    // Convert base64 to blob and upload to R2
    const blob = await base64ToBlob(base64, 'audio/mp4');
    const result = await uploadAudioToR2(blob);

    // Update the task variant with the new audio URL
    await client.post('/update-audio', {
      task_id: taskId,
      variant_id: variantId,
      audio_url: result.url,
      slot,
      stage,
    });

    return result;
  } catch (error) {
    throw new Error(`Failed to save audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export interface CreateTaskPayload {
  task_type: string;
  title: string;
  prompt_text: string;
  correct_answer: string;
  options: TaskOptions;
  primary_skill: string;
  secondary_skill: string | null;
  level_target: string;
  error_targets: string[];
  grade_band: string[];
  difficulty: number;
  estimated_time_seconds: number;
  lesson_slot_fit: string;
  feedback_text: string;
  feedback_correct?: string;
  feedback_wrong?: string;
  initial_text?: string;
  audio_url?: string | null;
  image_url?: string | null;
}

export interface CreateTaskResult {
  task_id: string;
  variant_id: string;
}

export async function createTask(payload: CreateTaskPayload): Promise<CreateTaskResult> {
  const { data } = await client.post<{ success: boolean; data: CreateTaskResult }>(
    '/tasks',
    payload,
  );
  return data.data;
}

// No backend bulk endpoint — callers should loop approveVariant
export { type ReviewAction, type TaskContent };

// ─── Live tasks (approved Task table) ────────────────────────────────────────

import type { LiveTask, LiveTaskListResponse } from './types';

export interface LiveTaskFilters {
  grade?: 'G12' | 'G24';
  type?: string;
  skill?: string;
}

function normalizeLiveTask(t: LiveTask & { id?: string }): LiveTask {
  // Backend returns Task.id as 'id'; map it to task_id for TaskContent compatibility
  return { ...t, task_id: t.task_id ?? (t.id as string) };
}

export async function getLiveTasks(filters?: LiveTaskFilters): Promise<LiveTask[]> {
  const { data } = await client.get<LiveTaskListResponse>('/live-tasks', { params: filters });
  return data.data.tasks.map(normalizeLiveTask);
}

export async function getLiveTask(id: string): Promise<LiveTask> {
  const { data } = await client.get<{ success: boolean; data: { task: LiveTask } }>(`/live-tasks/${id}`);
  return normalizeLiveTask(data.data.task);
}

export async function updateLiveTask(id: string, updates: Partial<TaskContent>): Promise<void> {
  await client.patch(`/live-tasks/${id}`, { updates });
}

export async function deleteLiveTask(id: string): Promise<void> {
  await client.delete(`/live-tasks/${id}`);
}

// ─── Generate tasks ───────────────────────────────────────────────────────────

export interface GenerateSpec {
  id: string;
  task_type: string;
  mongolian_name: string;
  grade_band: string[];
  primary_skill: string;
  difficulty: number;
  estimated_time_seconds: number;
  lesson_slot_fit: string;
}

export interface GenerateTaskResult {
  task_id: string;
  passed: number;
  rejected: number;
  drafts_created: number;
  ai_blocked: number;
  cost_usd: number;
}

export async function getGenerateSpecs(): Promise<GenerateSpec[]> {
  const { data } = await client.get<{ success: boolean; data: { specs: GenerateSpec[] } }>('/generate/specs');
  return data.data.specs;
}

export async function generateTasks(
  task_ids: string[],
  max_items: number,
  max_cost: number,
): Promise<{ results: GenerateTaskResult[]; total_cost_usd: number }> {
  const { data } = await client.post<{
    success: boolean;
    data: { results: GenerateTaskResult[]; total_cost_usd: number };
  }>('/generate', { task_ids, max_items, max_cost });
  return data.data;
}
