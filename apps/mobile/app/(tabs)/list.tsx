import { useEffect, useState, useMemo } from 'react'
import {
  FlatList,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { MagnifyingGlass, XCircle, MapPin, SlidersHorizontal } from 'phosphor-react-native'
import { useAllStations } from '@/lib/queries/useNearbyStations'
import { useMapStore } from '@/lib/stores/mapStore'
import { getRatingColor, getFuelTypeLabel } from '@/lib/constants'
import MapFilters from '@/components/map/MapFilters'
import type { GasStation } from '@/lib/queries/types'

function distanceLabel(meters?: number): string {
  if (meters == null) return ''
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function StationListItem({ station }: { station: GasStation }) {
  const router = useRouter()
  const ratingColor = getRatingColor(parseFloat(station.avgRating))

  return (
    <TouchableOpacity
      className="bg-white mx-4 my-2 p-4 rounded-xl shadow-sm border border-gray-100"
      onPress={() => router.push(`/station/${station.id}`)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-base font-semibold text-gray-900">{station.name}</Text>
          {station.brand ? (
            <Text className="text-sm text-gray-500 mt-0.5">{station.brand}</Text>
          ) : null}
          {station.address ? (
            <Text className="text-xs text-gray-400 mt-1" numberOfLines={1}>
              {station.address}
            </Text>
          ) : null}
        </View>
        <View className="items-end">
          <View
            className="rounded-full w-10 h-10 items-center justify-center"
            style={{ backgroundColor: ratingColor + '20' }}
          >
            <Text className="text-sm font-bold" style={{ color: ratingColor }}>
              {station.reviewCount > 0 ? parseFloat(station.avgRating).toFixed(1) : '--'}
            </Text>
          </View>
          {(station as GasStation & { distance_meters?: number }).distance_meters != null ? (
            <Text className="text-xs text-gray-400 mt-1">
              {distanceLabel((station as GasStation & { distance_meters?: number }).distance_meters)}
            </Text>
          ) : null}
        </View>
      </View>
      {station.fuelTypes && station.fuelTypes.length > 0 ? (
        <View className="flex-row flex-wrap mt-2 gap-1">
          {station.fuelTypes.map((ft) => (
            <View key={ft} className="bg-blue-50 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-blue-700">{getFuelTypeLabel(ft)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function ListScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const { data: allStations = [], isLoading, refetch } = useAllStations()
  const { filters } = useMapStore()
  const activeFilterCount = filters.brands.length + (filters.minRating > 0 ? 1 : 0)

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(async ({ status }) => {
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({})
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude })
      } else {
        setCoords({ lat: 18.4861, lng: -69.9312 })
      }
    })
  }, [])

  const stations = useMemo(() => {
    let list = allStations
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.brand?.toLowerCase().includes(q),
      )
    }
    if (filters.brands.length > 0) {
      list = list.filter((s) => s.brand && filters.brands.includes(s.brand))
    }
    if (filters.minRating > 0) {
      list = list.filter((s) => parseFloat(s.avgRating) >= filters.minRating)
    }
    if (!coords) return list
    return list
      .map((s) => ({
        ...s,
        distance_meters: getDistance(coords.lat, coords.lng, parseFloat(s.lat), parseFloat(s.lng)),
      }))
      .sort((a, b) => a.distance_meters - b.distance_meters)
  }, [allStations, coords, searchQuery, filters.brands, filters.minRating])

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-4 pb-3 shadow-sm">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
            <MagnifyingGlass size={20} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-base text-gray-900"
              placeholder="Buscar por nombre o marca..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <XCircle size={20} color="#9ca3af" weight="fill" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            className={`w-11 h-11 rounded-xl items-center justify-center ${
              activeFilterCount > 0 ? 'bg-blue-700' : 'bg-gray-100'
            }`}
            onPress={() => setShowFilters(true)}
          >
            <SlidersHorizontal
              size={20}
              color={activeFilterCount > 0 ? '#fff' : '#1e40af'}
            />
            {activeFilterCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-white rounded-full w-4 h-4 items-center justify-center">
                <Text className="text-[10px] font-extrabold text-blue-700">
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={stations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StationListItem station={item} />}
        ListHeaderComponent={
          <Text className="text-sm text-gray-500 px-4 py-3">
            {stations.length} gasolineras cercanas
          </Text>
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#1e40af" />
              <Text className="text-gray-500 mt-4">Buscando gasolineras...</Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <MapPin size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-4">No se encontraron gasolineras</Text>
            </View>
          )
        }
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
      <MapFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        stationCount={stations.length}
      />
    </View>
  )
}
