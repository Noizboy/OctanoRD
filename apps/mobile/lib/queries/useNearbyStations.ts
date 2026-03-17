import { useQuery } from '@tanstack/react-query'
import api from '../api'
import { useMapStore } from '../stores/mapStore'
import type { GasStation } from './types'

interface NearbyParams {
  lat: number
  lng: number
}

export function useNearbyStations(coords: NearbyParams | null) {
  const { filters } = useMapStore()

  return useQuery<GasStation[]>({
    queryKey: ['stations', 'nearby', coords, filters],
    queryFn: async () => {
      if (!coords) return []
      const params: Record<string, unknown> = {
        lat: coords.lat,
        lng: coords.lng,
        radius: 10,
      }
      if (filters.minRating > 0) params.minRating = filters.minRating
      if (filters.brands.length === 1) params.brand = filters.brands[0]

      const response = await api.get<GasStation[]>('/stations/nearby', { params })
      return response.data
    },
    enabled: !!coords,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}
