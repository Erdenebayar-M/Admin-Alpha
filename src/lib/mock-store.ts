import type { ReviewItem, TaskContent } from './types';
import { mockReviewItems } from './mock-data';

// Mutable copy so mutations persist across React Query refetches during the session
let items: ReviewItem[] = structuredClone(mockReviewItems);

export const mockStore = {
  getAll(): ReviewItem[] {
    return items;
  },
  getById(id: string): ReviewItem | undefined {
    return items.find((i) => i.id === id);
  },
  updateItem(id: string, patch: Partial<ReviewItem>): void {
    items = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
  },
  updateTaskContent(id: string, taskPatch: Partial<TaskContent>): void {
    items = items.map((i) =>
      i.id === id ? { ...i, task: { ...i.task, ...taskPatch } } : i,
    );
  },
};
