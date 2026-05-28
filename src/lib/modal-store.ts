import { create } from "zustand";

interface ModalStore {
  openGenerate: boolean;
  openCreate: boolean;
  reviewDetailId: string | null;
  setOpenGenerate: (open: boolean) => void;
  setOpenCreate: (open: boolean) => void;
  openReviewDetail: (id: string) => void;
  closeReviewDetail: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  openGenerate: false,
  openCreate: false,
  reviewDetailId: null,
  setOpenGenerate: (open) => set({ openGenerate: open }),
  setOpenCreate: (open) => set({ openCreate: open }),
  openReviewDetail: (id) => set({ reviewDetailId: id }),
  closeReviewDetail: () => set({ reviewDetailId: null }),
}));
