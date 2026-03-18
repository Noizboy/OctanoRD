import { create } from 'zustand'

interface ReviewDraftState {
  receiptUploadId: string | null
  setReceiptUploadId: (id: string | null) => void
  clearDraft: () => void
}

export const useReviewDraftStore = create<ReviewDraftState>((set) => ({
  receiptUploadId: null,
  setReceiptUploadId: (id) => set({ receiptUploadId: id }),
  clearDraft: () => set({ receiptUploadId: null }),
}))
