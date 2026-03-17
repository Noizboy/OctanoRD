import { View, FlatList, ActivityIndicator, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useStationReviews } from '@/lib/queries/useStationReviews'
import ReviewCard from '@/components/review/ReviewCard'
import type { Review } from '@/lib/queries/types'

export default function StationReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useStationReviews(id ?? null)

  const reviews: Review[] = data?.pages.flat() ?? []

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4 my-1.5">
            <ReviewCard review={item} />
          </View>
        )}
        ListHeaderComponent={
          <Text className="px-4 py-3 text-sm text-gray-500">
            {reviews.length} {reviews.length === 1 ? 'opinion' : 'opiniones'}
          </Text>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View className="items-center py-20">
              <Ionicons name="chatbubble-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-400 mt-4">Sin opiniones todavia</Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color="#1e40af" className="my-4" />
          ) : null
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage()
        }}
        onEndReachedThreshold={0.3}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
      {isLoading && (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      )}
    </View>
  )
}
