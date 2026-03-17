import { useEffect, useState } from 'react'
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { useNearbyStations } from '@/lib/queries/useNearbyStations'
import { getRatingColor } from '@/lib/constants'
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
              <Text className="text-xs text-blue-700">{ft}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

export default function ListScreen() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const { data: stations = [], isLoading, refetch } = useNearbyStations(coords)

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

  return (
    <View className="flex-1 bg-gray-50">
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
              <Ionicons name="location-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-4">No se encontraron gasolineras</Text>
            </View>
          )
        }
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  )
}
