import { create } from "zustand";

export interface PageToast {
  message: string;
  type: "success" | "error";
}

interface ModalStore {
  openGenerate: boolean;
  openCreate: boolean;
  reviewDetailId: string | null;
  taskDetailId: string | null;
  pageToast: PageToast | null;
  setOpenGenerate: (open: boolean) => void;
  setOpenCreate: (open: boolean) => void;
  openReviewDetail: (id: string) => void;
  closeReviewDetail: () => void;
  openTaskDetail: (id: string) => void;
  closeTaskDetail: () => void;
  showPageToast: (toast: PageToast) => void;
  clearPageToast: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  openGenerate: false,
  openCreate: false,
  reviewDetailId: null,
  taskDetailId: null,
  pageToast: null,
  setOpenGenerate: (open) => set({ openGenerate: open }),
  setOpenCreate: (open) => set({ openCreate: open }),
  openReviewDetail: (id) => set({ reviewDetailId: id }),
  closeReviewDetail: () => set({ reviewDetailId: null }),
  openTaskDetail: (id) => set({ taskDetailId: id }),
  closeTaskDetail: () => set({ taskDetailId: null }),
  showPageToast: (toast) => set({ pageToast: toast }),
  clearPageToast: () => set({ pageToast: null }),
}));
