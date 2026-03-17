import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getRatingColor } from '@/lib/constants'
import RatingStars from '@/components/review/RatingStars'
import type { GasStation } from '@/lib/queries/types'

interface Props {
  station: GasStation
  onClose: () => void
}

export default function StationCard({ station, onClose }: Props) {
  const router = useRouter()
  const rating = parseFloat(station.avgRating)
  const ratingColor = getRatingColor(rating)

  return (
    <View className="absolute bottom-6 left-4 right-4 bg-white rounded-2xl shadow-lg p-4">
      {/* Close button */}
      <TouchableOpacity
        className="absolute top-3 right-3 w-8 h-8 items-center justify-center rounded-full bg-gray-100"
        onPress={onClose}
      >
        <Ionicons name="close" size={18} color="#6b7280" />
      </TouchableOpacity>

      <View className="flex-row items-start pr-10">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
            {station.name}
          </Text>
          {station.brand && (
            <Text className="text-sm text-blue-700">{station.brand}</Text>
          )}
          {station.address && (
            <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
              {station.address}
            </Text>
          )}
        </View>

        <View className="items-center ml-3">
          <Text className="text-lg font-bold" style={{ color: ratingColor }}>
            {station.reviewCount > 0 ? rating.toFixed(1) : '--'}
          </Text>
          <Text className="text-xs text-gray-400">
            {station.reviewCount} {station.reviewCount === 1 ? 'opinion' : 'opiniones'}
          </Text>
        </View>
      </View>

      {station.reviewCount > 0 && (
        <View className="mt-2">
          <RatingStars rating={rating} readonly size={16} />
        </View>
      )}

      {/* Fuel types */}
      {station.fuelTypes && station.fuelTypes.length > 0 && (
        <View className="flex-row flex-wrap mt-2 gap-1">
          {station.fuelTypes.slice(0, 3).map((ft) => (
            <View key={ft} className="bg-gray-100 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-gray-600">{ft}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View className="flex-row gap-3 mt-3">
        <TouchableOpacity
          className="flex-1 bg-blue-700 py-2.5 rounded-xl items-center"
          onPress={() => {
            onClose()
            router.push(`/station/${station.id}`)
          }}
        >
          <Text className="text-white font-semibold text-sm">Ver detalles</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 border border-blue-700 py-2.5 rounded-xl items-center"
          onPress={() => {
            onClose()
            router.push(`/review/new?stationId=${station.id}`)
          }}
        >
          <Text className="text-blue-700 font-semibold text-sm">Calificar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
