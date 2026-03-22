import { create } from 'zustand'

interface ReviewDraftState {
  receiptUploadId: string | null
  receiptUri: string | null
  receiptLocation: { latitude: number; longitude: number } | null
  setReceiptUploadId: (id: string | null) => void
  setReceiptUri: (uri: string | null) => void
  setReceiptLocation: (loc: { latitude: number; longitude: number } | null) => void
  clearDraft: () => void
}

export const useReviewDraftStore = create<ReviewDraftState>((set) => ({
  receiptUploadId: null,
  receiptUri: null,
  receiptLocation: null,
  setReceiptUploadId: (id) => set({ receiptUploadId: id }),
  setReceiptUri: (uri) => set({ receiptUri: uri }),
  setReceiptLocation: (loc) => set({ receiptLocation: loc }),
  clearDraft: () => set({ receiptUploadId: null, receiptUri: null, receiptLocation: null }),
}))
