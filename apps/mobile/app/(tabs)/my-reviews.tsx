import { useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/lib/stores/authStore'
import { getDeviceFingerprint } from '@/lib/utils/fingerprint'
import ReviewCard from '@/components/review/ReviewCard'
import type { Review } from '@/lib/queries/types'

// Local type that extends Review with station info
interface ReviewWithStation extends Review {
  stationName?: string
}

export default function MyReviewsScreen() {
  const { phoneHash } = useAuthStore()
  const [deviceHash, setDeviceHash] = useState<string | null>(null)

  useEffect(() => {
    getDeviceFingerprint().then(setDeviceHash)
  }, [])

  const { data: reviews = [], isLoading } = useQuery<ReviewWithStation[]>({
    queryKey: ['reviews', 'my', phoneHash, deviceHash],
    queryFn: async () => {
      // In production you'd have a dedicated endpoint; here we use device/phone filter
      // For now return empty - this endpoint would need to be implemented on the API
      return []
    },
    enabled: !!(phoneHash || deviceHash),
  })

  if (!phoneHash && !deviceHash) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Ionicons name="star-outline" size={56} color="#9ca3af" />
        <Text className="text-lg font-semibold text-gray-700 mt-4">
          Tus Calificaciones
        </Text>
        <Text className="text-sm text-gray-500 text-center mt-2">
          Califica una gasolinera para ver tu historial aqui.
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReviewCard review={item} />}
          ListHeaderComponent={
            <Text className="px-4 py-3 text-sm text-gray-500">
              {reviews.length} {reviews.length === 1 ? 'calificacion' : 'calificaciones'}
            </Text>
          }
          ListEmptyComponent={
            <View className="items-center py-20">
              <Ionicons name="star-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-400 mt-4">
                Aun no has calificado ninguna gasolinera
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  )
}
