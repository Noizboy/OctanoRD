import { useInfiniteQuery } from '@tanstack/react-query'
import api from '../api'
import type { Review } from './types'

const PAGE_SIZE = 10

export function useStationReviews(stationId: string | null) {
  return useInfiniteQuery<Review[]>({
    queryKey: ['reviews', 'station', stationId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!stationId) return []
      const response = await api.get<Review[]>(`/stations/${stationId}/reviews`, {
        params: { limit: PAGE_SIZE, offset: pageParam },
      })
      return response.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return allPages.length * PAGE_SIZE
    },
    enabled: !!stationId,
    staleTime: 30 * 1000,
  })
}
