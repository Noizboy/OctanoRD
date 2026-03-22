import { useEffect } from 'react'
import { View, FlatList, ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ChatCircle, Star, PencilSimple, FunnelSimple } from 'phosphor-react-native'
import api from '@/lib/api'
import { useStationReviews } from '@/lib/queries/useStationReviews'
import ReviewCard from '@/components/review/ReviewCard'
import type { GasStation, Review } from '@/lib/queries/types'

const BG     = '#09090b'
const CARD   = '#18181b'
const CARD2  = '#27272a'
const BORDER = '#3f3f46'
const TEXT   = '#fafafa'
const MUTED  = '#a1a1aa'
const DIM    = '#71717a'
const ORANGE = '#f97316'
const GREEN  = '#10b981'

function getRatingColor(r: number) {
  if (r >= 4) return GREEN
  if (r >= 2.5) return '#f59e0b'
  return '#ef4444'
}

export default function StationReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const router = useRouter()

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
      navigation.setOptions({
        title: 'Calificaciones',
        headerStyle: { backgroundColor: BG },
        headerTintColor: TEXT,
        headerShadowVisible: false,
      })
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
  const rating = station ? parseFloat(station.avgRating) : 0
  const hasRating = (station?.reviewCount ?? 0) > 0
  const ratingColor = hasRating ? getRatingColor(rating) : DIM

  const ListHeader = (
    <View>
      {/* Station summary card */}
      {station && (
        <View style={{ backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER, padding: 20 }}>
          <View style={{ height: 3, backgroundColor: ratingColor, borderRadius: 2, marginBottom: 16 }} />

          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT, letterSpacing: -0.3 }} numberOfLines={1}>
            {station.name}
          </Text>
          {station.brand && (
            <Text style={{ fontSize: 13, fontWeight: '600', color: ORANGE, marginTop: 2 }}>{station.brand}</Text>
          )}

          {/* Rating summary row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16, padding: 14, backgroundColor: CARD2, borderRadius: 16, borderWidth: 1, borderColor: BORDER }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 40, fontWeight: '900', color: ratingColor, lineHeight: 44 }}>
                {hasRating ? rating.toFixed(1) : '--'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    color={i <= Math.round(rating) && hasRating ? ratingColor : BORDER}
                    weight={i <= Math.round(rating) && hasRating ? 'fill' : 'regular'}
                  />
                ))}
              </View>
            </View>
            <View style={{ width: 1, height: 50, backgroundColor: BORDER }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: TEXT }}>
                {station.reviewCount} {station.reviewCount === 1 ? 'calificación' : 'calificaciones'}
              </Text>
              <Text style={{ fontSize: 12, color: DIM, marginTop: 3 }}>
                Basado en compras verificadas con factura
              </Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={{ marginTop: 14, height: 48, backgroundColor: ORANGE, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            activeOpacity={0.8}
            onPress={() => router.push(`/review/new?stationId=${id}`)}
          >
            <PencilSimple size={18} color="#fff" weight="bold" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Calificar esta gasolinera</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Section label */}
      {reviews.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: DIM, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {reviews.length} {reviews.length === 1 ? 'calificación' : 'calificaciones'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <FunnelSimple size={13} color={DIM} />
            <Text style={{ fontSize: 11, color: DIM, fontWeight: '600' }}>Más recientes</Text>
          </View>
        </View>
      )}
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewCard review={item} />}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 }}>
              <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: `${ORANGE}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <ChatCircle size={34} color={ORANGE} weight="duotone" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT, textAlign: 'center' }}>
                Aún no hay calificaciones
              </Text>
              <Text style={{ fontSize: 13, color: DIM, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                Sé el primero en compartir tu experiencia con el combustible
              </Text>
              <TouchableOpacity
                style={{ marginTop: 20, paddingHorizontal: 24, height: 46, backgroundColor: ORANGE, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                activeOpacity={0.8}
                onPress={() => router.push(`/review/new?stationId=${id}`)}
              >
                <PencilSimple size={16} color="#fff" weight="bold" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Calificar ahora</Text>
              </TouchableOpacity>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={ORANGE} style={{ marginVertical: 16 }} />
          ) : null
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage()
        }}
        onEndReachedThreshold={0.3}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
      {isLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={{ color: MUTED, marginTop: 12, fontWeight: '500' }}>Cargando calificaciones...</Text>
        </View>
      )}
    </View>
  )
}
