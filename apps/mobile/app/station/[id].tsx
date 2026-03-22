import { useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Phone, ShieldCheck, Star } from 'phosphor-react-native'
import api from '@/lib/api'
import { onRatingUpdated } from '@/lib/socket'
import { getRatingColor, getFuelTypeLabel, RATING_COLORS } from '@/lib/constants'
import RatingStars from '@/components/review/RatingStars'
import ReviewCard from '@/components/review/ReviewCard'
import { useStationReviews } from '@/lib/queries/useStationReviews'
import type { GasStation, Review } from '@/lib/queries/types'

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const navigation = useNavigation()
  const queryClient = useQueryClient()

  const { data: station, isLoading } = useQuery<GasStation>({
    queryKey: ['station', id],
    queryFn: async () => {
      const response = await api.get<GasStation>(`/stations/${id}`)
      return response.data
    },
    enabled: !!id,
  })

  const { data: reviewPages } = useStationReviews(id ?? null)
  const recentReviews: Review[] = reviewPages?.pages.flat().slice(0, 3) ?? []

  useEffect(() => {
    if (station?.name) {
      navigation.setOptions({ title: station.name })
    }
  }, [station, navigation])

  // Subscribe to real-time rating updates for this station
  useEffect(() => {
    if (!id) return
    const unsubscribe = onRatingUpdated((data) => {
      if (data.stationId !== id) return
      queryClient.setQueryData<GasStation>(['station', id], (old) =>
        old
          ? { ...old, avgRating: String(data.avgRating), reviewCount: data.reviewCount }
          : old,
      )
    })
    return unsubscribe
  }, [id, queryClient])

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    )
  }

  if (!station) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Gasolinera no encontrada</Text>
      </View>
    )
  }

  const rating = parseFloat(station.avgRating)
  const ratingColor = getRatingColor(rating)

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header Card */}
      <View className="bg-white p-5 shadow-sm">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-xl font-bold text-gray-900">{station.name}</Text>
            {station.brand ? (
              <Text className="text-base text-blue-700 mt-0.5">{station.brand}</Text>
            ) : null}
            {station.address ? (
              <View className="flex-row items-center mt-2">
                <MapPin size={14} color="#6b7280" />
                <Text className="text-sm text-gray-500 ml-1">{station.address}</Text>
              </View>
            ) : null}
            {station.province ? (
              <Text className="text-sm text-gray-400 mt-0.5">
                {[station.municipality, station.province].filter(Boolean).join(', ')}
              </Text>
            ) : null}
          </View>

          {/* Rating badge */}
          <View className="items-center">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{ backgroundColor: ratingColor + '18' }}
            >
              <Text className="text-2xl font-bold" style={{ color: ratingColor }}>
                {station.reviewCount > 0 ? rating.toFixed(1) : '--'}
              </Text>
            </View>
            <Text className="text-xs text-gray-400 mt-1">
              {station.reviewCount} {station.reviewCount === 1 ? 'opinion' : 'opiniones'}
            </Text>
          </View>
        </View>

        {station.reviewCount > 0 && (
          <View className="mt-3">
            <RatingStars rating={rating} readonly size={20} />
          </View>
        )}

        {/* Phone */}
        {station.phone ? (
          <TouchableOpacity
            className="flex-row items-center mt-3"
            onPress={() => Linking.openURL(`tel:${station.phone}`)}
          >
            <Phone size={16} color="#2563eb" />
            <Text className="text-sm text-blue-600 ml-1">{station.phone}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Verified badge */}
        {station.verified && (
          <View className="flex-row items-center mt-3">
            <ShieldCheck size={16} color="#22c55e" weight="fill" />
            <Text className="text-sm text-green-600 ml-1">Gasolinera verificada</Text>
          </View>
        )}
      </View>

      {/* Fuel Types */}
      {station.fuelTypes && station.fuelTypes.length > 0 ? (
        <View className="bg-white mt-3 p-4 shadow-sm">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Combustibles</Text>
          <View className="flex-row flex-wrap gap-2">
            {station.fuelTypes.map((ft) => (
              <View key={ft} className="bg-blue-50 px-3 py-1 rounded-full">
                <Text className="text-sm text-blue-700">{getFuelTypeLabel(ft)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* CTA */}
      <View className="px-4 mt-4">
        <TouchableOpacity
          className="bg-blue-700 py-4 rounded-xl flex-row items-center justify-center"
          onPress={() => router.push(`/review/new?stationId=${id}`)}
        >
          <Star size={20} color="#fff" weight="fill" />
          <Text className="text-white font-semibold text-base ml-2">
            Calificar esta gasolinera
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <View className="mt-4 px-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-semibold text-gray-800">Ultimas opiniones</Text>
            <TouchableOpacity onPress={() => router.push(`/station/${id}/reviews`)}>
              <Text className="text-sm text-blue-600">Ver todas</Text>
            </TouchableOpacity>
          </View>
          {recentReviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </View>
      )}

      <View className="h-8" />
    </ScrollView>
  )
}
