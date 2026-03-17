import { create } from 'zustand'

export interface MapFilters {
  brands: string[]
  minRating: number
  fuelTypes: string[]
}

export interface MapViewport {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

interface MapState {
  filters: MapFilters
  viewport: MapViewport | null
}

interface MapActions {
  setFilters: (filters: Partial<MapFilters>) => void
  setViewport: (viewport: MapViewport) => void
  resetFilters: () => void
}

type MapStore = MapState & MapActions

const DEFAULT_FILTERS: MapFilters = {
  brands: [],
  minRating: 0,
  fuelTypes: [],
}

// Default to Santo Domingo, RD
const DEFAULT_VIEWPORT: MapViewport = {
  latitude: 18.4861,
  longitude: -69.9312,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

export const useMapStore = create<MapStore>((set) => ({
  filters: DEFAULT_FILTERS,
  viewport: DEFAULT_VIEWPORT,

  setFilters: (partialFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...partialFilters },
    })),

  setViewport: (viewport) => set({ viewport }),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}))
