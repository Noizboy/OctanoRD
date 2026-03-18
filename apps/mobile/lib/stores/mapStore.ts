import { create } from 'zustand'

export interface MapFilters {
  search: string
  brands: string[]
  minRating: number
}

export interface MapViewport {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

interface MapStore {
  filters: MapFilters
  viewport: MapViewport | null
  setFilters: (filters: Partial<MapFilters>) => void
  setViewport: (viewport: MapViewport) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: MapFilters = {
  search: '',
  brands: [],
  minRating: 0,
}

export const useMapStore = create<MapStore>((set) => ({
  filters: DEFAULT_FILTERS,
  viewport: null,

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  setViewport: (viewport) => set({ viewport }),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}))
