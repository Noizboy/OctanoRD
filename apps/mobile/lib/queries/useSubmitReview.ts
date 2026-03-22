import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadApi as api } from '../api'
import type { Review } from './types'

interface SubmitReviewPayload {
  stationId: string
  stars: number
  fuelType: string
  comment?: string
  receiptUploadId?: string
  deviceHash: string
  turnstileToken: string
}

export function useSubmitReview() {
  const queryClient = useQueryClient()

  return useMutation<Review, Error, SubmitReviewPayload>({
    mutationFn: async (payload) => {
      const response = await api.post<Review>('/reviews', payload)
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate nearby stations and station reviews caches
      queryClient.invalidateQueries({ queryKey: ['stations', 'nearby'] })
      queryClient.invalidateQueries({ queryKey: ['reviews', 'station', data.stationId] })
    },
  })
}
