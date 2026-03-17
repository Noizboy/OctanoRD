import { useEffect, useRef, useState, useCallback } from 'react'
import { View, Alert, ActivityIndicator } from 'react-native'
import MapView, { Marker, type Region } from 'react-native-maps'
import * as Location from 'expo-location'
import { useNearbyStations } from '@/lib/queries/useNearbyStations'
import { useMapStore } from '@/lib/stores/mapStore'
import StationMarker from '@/components/map/StationMarker'
import StationCard from '@/components/map/StationCard'
import MapFilters from '@/components/map/MapFilters'
import type { GasStation } from '@/lib/queries/types'

export default function MapScreen() {
  const mapRef = useRef<MapView>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const { setViewport } = useMapStore()

  const { data: stations = [], isLoading } = useNearbyStations(coords)

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

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        className="flex-1"
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
