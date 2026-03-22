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
  focusStationId: string | null
  setFilters: (filters: Partial<MapFilters>) => void
  setViewport: (viewport: MapViewport) => void
  resetFilters: () => void
  setFocusStationId: (id: string) => void
  clearFocusStation: () => void
}

const DEFAULT_FILTERS: MapFilters = {
  search: '',
  brands: [],
  minRating: 0,
}

export const useMapStore = create<MapStore>((set) => ({
  filters: DEFAULT_FILTERS,
  viewport: null,
  focusStationId: null,

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  setViewport: (viewport) => set({ viewport }),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  setFocusStationId: (id) => set({ focusStationId: id }),

  clearFocusStation: () => set({ focusStationId: null }),
}))
