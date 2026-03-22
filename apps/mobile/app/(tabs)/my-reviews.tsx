import { useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { Star } from 'phosphor-react-native'
import { useAuthStore } from '@/lib/stores/authStore'
import { getDeviceFingerprint } from '@/lib/utils/fingerprint'
import { useMyReviews } from '@/lib/queries/useMyReviews'
import ReviewCard from '@/components/review/ReviewCard'

export default function MyReviewsScreen() {
  const { phoneHash } = useAuthStore()
  const [deviceHash, setDeviceHash] = useState<string | null>(null)

  useEffect(() => {
    getDeviceFingerprint().then(setDeviceHash)
  }, [])

  const { data: reviews = [], isLoading } = useMyReviews(deviceHash, phoneHash)

  if (!deviceHash) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#1e40af" />
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
            reviews.length > 0 ? (
              <Text className="px-4 py-3 text-sm text-gray-500">
                {reviews.length} {reviews.length === 1 ? 'calificacion' : 'calificaciones'}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center py-20 px-6">
              <Star size={56} color="#9ca3af" />
              <Text className="text-lg font-semibold text-gray-700 mt-4 text-center">
                Aun no has calificado ninguna gasolinera
              </Text>
              <Text className="text-sm text-gray-400 text-center mt-2">
                Tus calificaciones apareceran aqui
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  )
}
