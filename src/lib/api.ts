import axios from "axios";
import type {
  ContentStats,
  ReviewAction,
  TaskContent,
  TaskVariant,
  TaskListResponse,
  TaskVariantResponse,
} from "./types";

const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";

const client = axios.create({
  baseURL: "http://localhost:3000/api/admin/content",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ADMIN_TOKEN}`,
  },
});

client.interceptors.response.use(
  (r) => r,
  (err) =>
    Promise.reject(
      new Error(
        (err.response?.data as { message?: string } | undefined)?.message ??
          err.message,
      ),
    ),
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

// No backend bulk endpoint — callers should loop approveVariant
export { type ReviewAction, type TaskContent };
