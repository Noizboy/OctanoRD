export interface GasStation {
  id: string
  name: string
  brand: string | null
  lat: string
  lng: string
  address: string | null
  municipality: string | null
  province: string | null
  phone: string | null
  hours: Record<string, string> | null
  services: string[] | null
  fuelTypes: string[] | null
  avgRating: string
  reviewCount: number
  verified: boolean
  claimed: boolean
  osmId: string | null
  createdAt: string
  updatedAt: string
  // Extended from nearby query
  distance_meters?: number
}

export interface Review {
  id: string
  stationId: string
  stars: number
  comment: string | null
  fuelType: string
  receiptVerified: boolean
  ocrExtracted: Record<string, unknown> | null
  status: string
  helpfulCount: number
  spamCount: number
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}
