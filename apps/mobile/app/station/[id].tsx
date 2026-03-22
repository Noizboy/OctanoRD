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
import { MapPin, Phone, ShieldCheck, Star, GasPump, PencilSimple, CaretRight } from 'phosphor-react-native'
import api from '@/lib/api'
import { onRatingUpdated } from '@/lib/socket'
import { getRatingColor, getFuelTypeLabel } from '@/lib/constants'
import RatingStars from '@/components/review/RatingStars'
import ReviewCard from '@/components/review/ReviewCard'
import { useStationReviews } from '@/lib/queries/useStationReviews'
import type { GasStation, Review } from '@/lib/queries/types'

const BG     = '#09090b'
const CARD   = '#18181b'
const CARD2  = '#27272a'
const BORDER = '#3f3f46'
const TEXT   = '#fafafa'
const MUTED  = '#a1a1aa'
const DIM    = '#71717a'
const ORANGE = '#f97316'

function getRatingLabel(r: number, count: number) {
  if (count === 0) return 'Sin calificaciones aún'
  if (r >= 4.5) return 'Excelente'
  if (r >= 4)   return 'Muy bueno'
  if (r >= 3)   return 'Bueno'
  if (r >= 2)   return 'Regular'
  return 'Malo'
}

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
      navigation.setOptions({
        title: station.name,
        headerStyle: { backgroundColor: BG },
        headerTintColor: TEXT,
        headerShadowVisible: false,
      })
    }
  }, [station, navigation])

  useEffect(() => {
    if (!id) return
    const unsubscribe = onRatingUpdated((data) => {
      if (data.stationId !== id) return
      queryClient.setQueryData<GasStation>(['station', id], (old) =>
        old ? { ...old, avgRating: String(data.avgRating), reviewCount: data.reviewCount } : old,
      )
    })
    return unsubscribe
  }, [id, queryClient])

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    )
  }

  if (!station) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
        <Text style={{ color: MUTED }}>Gasolinera no encontrada</Text>
      </View>
    )
  }

  const rating = parseFloat(station.avgRating)
  const hasRating = station.reviewCount > 0
  const ratingColor = hasRating ? getRatingColor(rating) : DIM

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ paddingBottom: 32 }}>

      {/* Hero card */}
      <View style={{ backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER, padding: 20 }}>
        {/* Top accent bar */}
        <View style={{ height: 3, backgroundColor: ratingColor, borderRadius: 2, marginBottom: 18 }} />

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
          {/* Gas pump icon */}
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: `${ORANGE}20`, alignItems: 'center', justifyContent: 'center' }}>
            <GasPump size={28} color={ORANGE} weight="fill" />
          </View>

          {/* Name & info */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT, letterSpacing: -0.5 }}>
              {station.name}
            </Text>
            {station.brand && (
              <Text style={{ fontSize: 14, fontWeight: '700', color: ORANGE, marginTop: 2 }}>
                {station.brand}
              </Text>
            )}
            {station.address && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                <MapPin size={13} color={DIM} />
                <Text style={{ fontSize: 12, color: MUTED, flex: 1 }} numberOfLines={2}>
                  {station.address}
                </Text>
              </View>
            )}
            {station.province && (
              <Text style={{ fontSize: 11, color: DIM, marginTop: 2 }}>
                {[station.municipality, station.province].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
        </View>

        {/* Rating row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18, padding: 14, backgroundColor: CARD2, borderRadius: 16, borderWidth: 1, borderColor: BORDER }}>
          <View style={{ alignItems: 'center', minWidth: 52 }}>
            <Text style={{ fontSize: 36, fontWeight: '900', color: ratingColor, lineHeight: 40 }}>
              {hasRating ? rating.toFixed(1) : '--'}
            </Text>
            <Text style={{ fontSize: 10, color: ratingColor, fontWeight: '700', marginTop: 2 }}>
              {getRatingLabel(rating, station.reviewCount)}
            </Text>
          </View>
          <View style={{ width: 1, height: 44, backgroundColor: BORDER }} />
          <View style={{ flex: 1, gap: 6 }}>
            <RatingStars rating={rating} readonly size={20} />
            <Text style={{ fontSize: 12, color: DIM }}>
              {station.reviewCount} {station.reviewCount === 1 ? 'calificación' : 'calificaciones'}
            </Text>
          </View>
        </View>

        {/* Phone & verified */}
        <View style={{ gap: 8, marginTop: 14 }}>
          {station.phone && (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              onPress={() => Linking.openURL(`tel:${station.phone}`)}
            >
              <Phone size={15} color={ORANGE} />
              <Text style={{ fontSize: 13, color: ORANGE, fontWeight: '600' }}>{station.phone}</Text>
            </TouchableOpacity>
          )}
          {station.verified && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={15} color="#10b981" weight="fill" />
              <Text style={{ fontSize: 13, color: '#10b981', fontWeight: '600' }}>Gasolinera verificada</Text>
            </View>
          )}
        </View>
      </View>

      {/* Fuel types */}
      {station.fuelTypes && station.fuelTypes.length > 0 && (
        <View style={{ backgroundColor: CARD, marginTop: 8, padding: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: DIM, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
            Combustibles disponibles
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {station.fuelTypes.map((ft) => (
              <View key={ft} style={{ backgroundColor: `${ORANGE}18`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: `${ORANGE}30` }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: ORANGE }}>{getFuelTypeLabel(ft)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* CTA */}
      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <TouchableOpacity
          style={{ backgroundColor: ORANGE, height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          activeOpacity={0.8}
          onPress={() => router.push(`/review/new?stationId=${id}`)}
        >
          <PencilSimple size={20} color="#fff" weight="bold" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Calificar esta gasolinera</Text>
        </TouchableOpacity>
      </View>

      {/* Recent reviews */}
      {recentReviews.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: DIM, letterSpacing: 0.6, textTransform: 'uppercase' }}>
              Últimas calificaciones
            </Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
              onPress={() => router.push(`/station/${id}/reviews`)}
            >
              <Text style={{ fontSize: 13, color: ORANGE, fontWeight: '600' }}>Ver todas</Text>
              <CaretRight size={12} color={ORANGE} weight="bold" />
            </TouchableOpacity>
          </View>
          {recentReviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </View>
      )}

      {recentReviews.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32, marginTop: 16 }}>
          <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: `${ORANGE}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Star size={28} color={ORANGE} weight="fill" />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: TEXT, textAlign: 'center' }}>
            Sé el primero en calificar
          </Text>
          <Text style={{ fontSize: 13, color: DIM, textAlign: 'center', marginTop: 6 }}>
            Ayuda a la comunidad compartiendo tu experiencia
          </Text>
        </View>
      )}
    </ScrollView>
  )
}
