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
import { MagnifyingGlass, XCircle, MapPin, SlidersHorizontal, GasPump } from 'phosphor-react-native'
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
  const rating = parseFloat(station.avgRating)
  const hasRating = station.reviewCount > 0
  const ratingColor = getRatingColor(rating)
  const dist = (station as GasStation & { distance_meters?: number }).distance_meters

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={{
        backgroundColor: '#18181b',
        marginHorizontal: 16,
        marginVertical: 5,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#3f3f46',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
      onPress={() => router.push(`/station/${station.id}`)}
    >
      {/* Gas pump icon */}
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          backgroundColor: '#f97316' + '15',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <GasPump size={22} color="#f97316" weight="fill" />
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#fafafa' }} numberOfLines={1}>
          {station.name}
        </Text>
        {station.brand && (
          <Text style={{ fontSize: 12, color: '#f97316', fontWeight: '600', marginTop: 1 }}>
            {station.brand}
          </Text>
        )}
        {station.address && (
          <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>
            {station.address}
          </Text>
        )}
        {station.fuelTypes && station.fuelTypes.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {station.fuelTypes.slice(0, 3).map((ft) => (
              <View
                key={ft}
                style={{ backgroundColor: '#27272a', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 }}
              >
                <Text style={{ fontSize: 10, color: '#71717a', fontWeight: '600' }}>
                  {getFuelTypeLabel(ft)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Rating + distance */}
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View
          style={{
            backgroundColor: hasRating ? ratingColor + '25' : '#27272a',
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 4,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '800', color: hasRating ? ratingColor : '#94a3b8' }}>
            {hasRating ? rating.toFixed(1) : '--'}
          </Text>
          <Text style={{ fontSize: 9, color: hasRating ? ratingColor : '#94a3b8', fontWeight: '600' }}>
            {station.reviewCount} ops
          </Text>
        </View>
        {dist != null && (
          <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500' }}>
            {distanceLabel(dist)}
          </Text>
        )}
      </View>
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
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      {/* Search bar */}
      <View style={{ backgroundColor: '#18181b', borderBottomWidth: 1, borderBottomColor: '#3f3f46', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#27272a',
              borderRadius: 14,
              paddingHorizontal: 12,
              height: 44,
              borderWidth: 1,
              borderColor: '#3f3f46',
            }}
          >
            <MagnifyingGlass size={18} color="#71717a" />
            <TextInput
              style={{ flex: 1, marginLeft: 8, fontSize: 14, color: '#fafafa' }}
              placeholder="Buscar por nombre o marca..."
              placeholderTextColor="#71717a"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <XCircle size={18} color="#94a3b8" weight="fill" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: activeFilterCount > 0 ? '#f97316' : '#ffffff22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={20} color="#fff" />
            {activeFilterCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  width: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#f97316' }}>
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
          <Text style={{ fontSize: 11, color: '#52525b', fontWeight: '700', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {stations.length} gasolineras
          </Text>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <ActivityIndicator size="large" color="#f97316" />
              <Text style={{ color: '#94a3b8', marginTop: 16, fontWeight: '500' }}>Buscando gasolineras...</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
              <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: '#f9731622', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <MapPin size={36} color="#f97316" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fafafa', textAlign: 'center' }}>
                No se encontraron gasolineras
              </Text>
              <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 6 }}>
                Intenta con otro nombre o marca
              </Text>
            </View>
          )
        }
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
      <MapFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        stationCount={stations.length}
      />
    </View>
  )
}
