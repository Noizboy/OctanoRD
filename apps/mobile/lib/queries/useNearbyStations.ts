import { useQuery } from '@tanstack/react-query'
import api from '../api'
import type { GasStation } from './types'

function mapStation(s: any): GasStation {
  return {
    id: s.id,
    name: s.name,
    brand: s.brand,
    lat: s.lat,
    lng: s.lng,
    address: s.address,
    municipality: s.municipality,
    province: s.province,
    phone: s.phone,
    hours: s.hours,
    services: s.services,
    fuelTypes: s.fuel_types ?? s.fuelTypes,
    avgRating: s.avg_rating ?? s.avgRating ?? '0',
    reviewCount: s.review_count ?? s.reviewCount ?? 0,
    verified: s.verified,
    claimed: s.claimed,
    osmId: s.osm_id ?? s.osmId,
    createdAt: s.created_at ?? s.createdAt,
    updatedAt: s.updated_at ?? s.updatedAt,
    distance_meters: s.distance_meters,
  }
}

export function useAllStations() {
  return useQuery<GasStation[]>({
    queryKey: ['stations', 'all'],
    queryFn: async () => {
      const response = await api.get<any[]>('/stations/all')
      return response.data.map(mapStation)
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
