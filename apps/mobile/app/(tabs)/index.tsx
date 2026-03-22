import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Platform,
} from 'react-native'
import MapView, { type Region } from 'react-native-maps'
import * as Location from 'expo-location'
import { MagnifyingGlass, XCircle, Funnel, X, SlidersHorizontal } from 'phosphor-react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useAllStations } from '@/lib/queries/useNearbyStations'
import { useMapStore } from '@/lib/stores/mapStore'
import { onRatingUpdated } from '@/lib/socket'
import StationMarker from '@/components/map/StationMarker'
import StationCard from '@/components/map/StationCard'
import MapFilters from '@/components/map/MapFilters'
import type { GasStation } from '@/lib/queries/types'
import { MAP_STYLE } from '@/lib/mapStyle'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const SANTO_DOMINGO = { latitude: 18.4861, longitude: -69.9312 }
const DR_BOUNDS = { minLat: 17.5, maxLat: 20.0, minLng: -72.5, maxLng: -68.0 }

function isInDR(lat: number, lng: number) {
  return lat >= DR_BOUNDS.minLat && lat <= DR_BOUNDS.maxLat &&
         lng >= DR_BOUNDS.minLng && lng <= DR_BOUNDS.maxLng
}

function filterStations(
  stations: GasStation[],
  search: string,
  brands: string[],
  minRating: number,
): GasStation[] {
  let result = stations

  if (search.length >= 2) {
    const q = search.toLowerCase()
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.brand && s.brand.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q)),
    )
  }

  if (brands.length > 0) {
    result = result.filter((s) => s.brand && brands.includes(s.brand))
  }

  if (minRating > 0) {
    result = result.filter((s) => parseFloat(s.avgRating) >= minRating)
  }

  return result
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null)
  const insets = useSafeAreaInsets()
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState('')
  const [showResults, setShowResults] = useState(false)
  const { filters, setFilters, setViewport } = useMapStore()
  const queryClient = useQueryClient()

  const { data: allStations = [], isLoading } = useAllStations()

  // Filtered stations shown on map
  const visibleStations = useMemo(
    () => filterStations(allStations, filters.search, filters.brands, filters.minRating),
    [allStations, filters.search, filters.brands, filters.minRating],
  )

  // Search dropdown results (from search bar, before applying)
  const searchResults = useMemo(() => {
    if (search.length < 2) return []
    const q = search.toLowerCase()
    return allStations
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.brand && s.brand.toLowerCase().includes(q)) ||
          (s.address && s.address.toLowerCase().includes(q)),
      )
      .slice(0, 8)
  }, [search, allStations])

  // Real-time rating updates
  useEffect(() => {
    const unsubscribe = onRatingUpdated((data) => {
      queryClient.setQueriesData<GasStation[]>(
        { queryKey: ['stations', 'all'] },
        (old) =>
          old?.map((s) =>
            s.id === data.stationId
              ? { ...s, avgRating: String(data.avgRating), reviewCount: data.reviewCount }
              : s,
          ),
      )
      setSelectedStation((prev) =>
        prev?.id === data.stationId
          ? { ...prev, avgRating: String(data.avgRating), reviewCount: data.reviewCount }
          : prev,
      )
    })
    return unsubscribe
  }, [queryClient])

  // Get location and center map
  useEffect(() => {
    async function requestLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permiso de Ubicacion',
          'OctanoRD necesita tu ubicacion para mostrarte gasolineras cercanas.',
        )
        return
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const { latitude, longitude } = location.coords
      if (isInDR(latitude, longitude)) {
        mapRef.current?.animateToRegion(
          { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
          500,
        )
      }
    }
    requestLocation()
  }, [])

  const handleRegionChange = useCallback(
    (region: Region) => setViewport(region),
    [setViewport],
  )

  const goToStation = (station: GasStation) => {
    setSearch('')
    setShowResults(false)
    Keyboard.dismiss()
    setSelectedStation(station)
    mapRef.current?.animateToRegion(
      {
        latitude: parseFloat(station.lat),
        longitude: parseFloat(station.lng),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500,
    )
  }

  // Apply search as a map filter (hides non-matching markers)
  const applySearch = () => {
    setFilters({ search })
    setShowResults(false)
    Keyboard.dismiss()
  }

  const clearSearch = () => {
    setSearch('')
    setShowResults(false)
    setFilters({ search: '' })
  }

  const activeFilterCount =
    filters.brands.length +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.search.length > 0 ? 1 : 0)

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          ...SANTO_DOMINGO,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }}
        onRegionChangeComplete={handleRegionChange}
        customMapStyle={MAP_STYLE}
        mapPadding={{ top: insets.top + 56, right: 0, bottom: 0, left: 0 }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onPress={() => {
          setShowResults(false)
          Keyboard.dismiss()
        }}
      >
        {visibleStations.map((station) => (
          <StationMarker
            key={station.id}
            station={station}
            onPress={() => setSelectedStation(station)}
          />
        ))}
      </MapView>

      {/* Search bar */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 12,
          right: 60,
          zIndex: 10,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#fff',
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 44,
            ...(Platform.OS === 'ios'
              ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }
              : { elevation: 4 }),
          }}
        >
          <MagnifyingGlass size={18} color="#9ca3af" />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 14,
              color: '#111827',
              paddingVertical: 0,
            }}
            placeholder="Buscar gasolinera o marca..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={(text) => {
              setSearch(text)
              setShowResults(text.length >= 2)
            }}
            onFocus={() => {
              if (search.length >= 2) setShowResults(true)
            }}
            onSubmitEditing={applySearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <XCircle size={18} color="#9ca3af" weight="fill" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <View
            style={{
              marginTop: 4,
              backgroundColor: '#fff',
              borderRadius: 12,
              overflow: 'hidden',
              maxHeight: 300,
              ...(Platform.OS === 'ios'
                ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }
                : { elevation: 4 }),
            }}
          >
            {/* "Filter map" button at top */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: '#eff6ff',
                borderBottomWidth: 1,
                borderBottomColor: '#dbeafe',
                gap: 6,
              }}
              onPress={applySearch}
            >
              <Funnel size={14} color="#1e40af" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e40af' }}>
                Filtrar mapa por "{search}" ({searchResults.length} resultados)
              </Text>
            </TouchableOpacity>

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f3f4f6',
                  }}
                  onPress={() => goToStation(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                      {item.name}
                    </Text>
                    {item.brand && (
                      <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
                        {item.brand}
                        {item.address ? ` · ${item.address}` : ''}
                      </Text>
                    )}
                  </View>
                  {item.reviewCount > 0 && (
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#111827' }}>
                      {parseFloat(item.avgRating).toFixed(1)} ★
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {showResults && search.length >= 2 && searchResults.length === 0 && (
          <View
            style={{
              marginTop: 4,
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              ...(Platform.OS === 'ios'
                ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }
                : { elevation: 4 }),
            }}
          >
            <Text style={{ fontSize: 13, color: '#9ca3af' }}>
              No se encontraron gasolineras
            </Text>
          </View>
        )}
      </View>

      {/* Active search filter pill */}
      {filters.search.length > 0 && (
        <View
          style={{
            position: 'absolute',
            top: insets.top + 60,
            left: 12,
            zIndex: 10,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#1e40af',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              gap: 6,
            }}
            onPress={clearSearch}
          >
            <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>
              "{filters.search}" · {visibleStations.length}
            </Text>
            <X size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Filter button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: insets.top + 8,
          right: 12,
          backgroundColor: activeFilterCount > 0 ? '#1e40af' : '#fff',
          borderRadius: 12,
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          ...(Platform.OS === 'ios'
            ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }
            : { elevation: 4 }),
        }}
        onPress={() => setShowFilters(true)}
      >
        <SlidersHorizontal
          size={20}
          color={activeFilterCount > 0 ? '#fff' : '#1e40af'}
        />
        {activeFilterCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              backgroundColor: '#fff',
              borderRadius: 8,
              width: 16,
              height: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#1e40af' }}>
              {activeFilterCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {isLoading && (
        <View
          style={{
            position: 'absolute',
            top: insets.top + 60,
            alignSelf: 'center',
            backgroundColor: '#fff',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            elevation: 3,
          }}
        >
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
        stationCount={visibleStations.length}
      />
    </View>
  )
}
