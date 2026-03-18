import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Review } from './types'

export function useMyReviews(deviceHash: string | null, phoneHash: string | null) {
  return useQuery<Review[]>({
    queryKey: ['reviews', 'mine', deviceHash, phoneHash],
    queryFn: async () => {
      if (!deviceHash) return []
      const params: Record<string, string> = { deviceHash }
      if (phoneHash) params.phoneHash = phoneHash
      const { data } = await api.get<Review[]>('/reviews/mine', { params })
      return data
    },
    enabled: !!deviceHash,
    staleTime: 60 * 1000,
  })
}
