import { useEffect } from 'react'
import { View, FlatList, ActivityIndicator, Text } from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ChatCircle } from 'phosphor-react-native'
import api from '@/lib/api'
import { useStationReviews } from '@/lib/queries/useStationReviews'
import ReviewCard from '@/components/review/ReviewCard'
import type { GasStation, Review } from '@/lib/queries/types'

export default function StationReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()

  const { data: station } = useQuery<GasStation>({
    queryKey: ['station', id],
    queryFn: async () => {
      const response = await api.get<GasStation>(`/stations/${id}`)
      return response.data
    },
    enabled: !!id,
  })

  useEffect(() => {
    if (station?.name) {
      navigation.setOptions({ title: `Opiniones — ${station.name}` })
    }
  }, [station, navigation])

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
              <ChatCircle size={48} color="#9ca3af" />
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
