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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReviewCard review={item} />}
          ListHeaderComponent={
            reviews.length > 0 ? (
              <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {reviews.length} {reviews.length === 1 ? 'calificacion' : 'calificaciones'}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
              <View style={{ width: 80, height: 80, borderRadius: 28, backgroundColor: '#f9731622', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Star size={40} color="#f97316" weight="fill" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#fafafa', textAlign: 'center' }}>
                Aún no has calificado ninguna gasolinera
              </Text>
              <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                Tus calificaciones aparecerán aquí para que puedas llevar un historial
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  )
}
