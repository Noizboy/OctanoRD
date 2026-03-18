import { useEffect, useRef, useState, useCallback } from 'react'
import { View, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { useNearbyStations } from '@/lib/queries/useNearbyStations'
import { useMapStore } from '@/lib/stores/mapStore'
import { onRatingUpdated } from '@/lib/socket'
import StationMarker from '@/components/map/StationMarker'
import StationCard from '@/components/map/StationCard'
import MapFilters from '@/components/map/MapFilters'
import type { GasStation } from '@/lib/queries/types'

export default function MapScreen() {
  const mapRef = useRef<MapView>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const { setViewport, filters } = useMapStore()
  const queryClient = useQueryClient()

  const { data: stations = [], isLoading } = useNearbyStations(coords)

  // Subscribe to real-time rating updates
  useEffect(() => {
    const unsubscribe = onRatingUpdated((data) => {
      // Update the specific station in all nearby queries
      queryClient.setQueriesData<GasStation[]>(
        { queryKey: ['stations', 'nearby'] },
        (old) =>
          old?.map((s) =>
            s.id === data.stationId
              ? { ...s, avgRating: String(data.avgRating), reviewCount: data.reviewCount }
              : s,
          ),
      )
      // Also update individual station cache
      queryClient.setQueryData<GasStation>(
        ['station', data.stationId],
        (old) =>
          old
            ? { ...old, avgRating: String(data.avgRating), reviewCount: data.reviewCount }
            : old,
      )
      // Update selected station card if it's the one updated
      setSelectedStation((prev) =>
        prev?.id === data.stationId
          ? { ...prev, avgRating: String(data.avgRating), reviewCount: data.reviewCount }
          : prev,
      )
    })
    return unsubscribe
  }, [queryClient])

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null

    async function requestLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permiso de Ubicacion',
          'OctanoRD necesita tu ubicacion para mostrarte gasolineras cercanas.',
        )
        // Default to Santo Domingo
        setCoords({ lat: 18.4861, lng: -69.9312 })
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const { latitude, longitude } = location.coords
      setCoords({ lat: latitude, lng: longitude })
      setViewport({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      })

      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      })
    }

    requestLocation()
    return () => {
      subscription?.remove()
    }
  }, [setViewport])

  const handleRegionChange = useCallback(
    (region: Region) => {
      setViewport(region)
    },
    [setViewport],
  )

  const activeFilterCount =
    filters.brands.length + (filters.minRating > 0 ? 1 : 0)

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 18.4861,
          longitude: -69.9312,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation
        showsMyLocationButton
      >
        {stations.map((station) => (
          <StationMarker
            key={station.id}
            station={station}
            onPress={() => setSelectedStation(station)}
          />
        ))}
      </MapView>

      {/* Filter button */}
      <TouchableOpacity
        className="absolute top-4 right-4 bg-white rounded-full p-3 shadow"
        onPress={() => setShowFilters(true)}
      >
        <View className="relative">
          <Ionicons name="options-outline" size={22} color="#1e40af" />
          {activeFilterCount > 0 && (
            <View className="absolute -top-1 -right-1 w-4 h-4 bg-blue-700 rounded-full items-center justify-center">
              <Ionicons name="ellipse" size={8} color="#fff" />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {isLoading && (
        <View className="absolute top-4 self-center bg-white rounded-full px-4 py-2 shadow">
          <ActivityIndicator color="#1e40af" />
        </View>
      )}

      {selectedStation && (
        <StationCard
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
        />
      )}

      <MapFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
      />
    </View>
  )
}
