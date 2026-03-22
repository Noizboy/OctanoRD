import { View, Text, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { X, GasPump, Star, PencilSimple, CaretRight } from 'phosphor-react-native'
import type { GasStation } from '@/lib/queries/types'

interface Props {
  station: GasStation
  onClose: () => void
}

function getRatingColor(r: number) {
  if (r >= 4) return '#10b981'
  if (r >= 2.5) return '#f59e0b'
  return '#ef4444'
}

function getRatingLabel(r: number, count: number) {
  if (count === 0) return 'Sin calificaciones'
  if (r >= 4.5) return 'Excelente'
  if (r >= 4) return 'Muy bueno'
  if (r >= 3) return 'Bueno'
  if (r >= 2) return 'Regular'
  return 'Malo'
}

export default function StationCard({ station, onClose }: Props) {
  const router = useRouter()
  const rating = parseFloat(station.avgRating)
  const hasRating = station.reviewCount > 0
  const ratingColor = hasRating ? getRatingColor(rating) : '#94a3b8'

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 16,
        left: 12,
        right: 12,
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        ...(Platform.OS === 'ios'
          ? { shadowColor: '#0a2342', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20 }
          : { elevation: 16 }),
      }}
    >
      {/* Top accent bar */}
      <View style={{ height: 4, backgroundColor: ratingColor }} />

      <View style={{ padding: 16 }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {/* Gas pump icon */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: '#f97316' + '18',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <GasPump size={22} color="#f97316" weight="fill" />
          </View>

          {/* Name + brand + address */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 }} numberOfLines={1}>
              {station.name}
            </Text>
            {station.brand && (
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#f97316', marginTop: 1 }}>
                {station.brand}
              </Text>
            )}
            {station.address && (
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>
                {station.address}
              </Text>
            )}
          </View>

          {/* Rating badge */}
          <View style={{ alignItems: 'center', marginLeft: 12 }}>
            <View
              style={{
                backgroundColor: ratingColor + '18',
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 6,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '800', color: ratingColor, lineHeight: 24 }}>
                {hasRating ? rating.toFixed(1) : '--'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 }}>
                <Star size={9} color={ratingColor} weight="fill" />
                <Text style={{ fontSize: 9, color: ratingColor, fontWeight: '700' }}>
                  {station.reviewCount} ops.
                </Text>
              </View>
            </View>
          </View>

          {/* Close */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
            }}
          >
            <X size={15} color="#64748b" weight="bold" />
          </TouchableOpacity>
        </View>

        {/* Rating label */}
        {hasRating && (
          <Text style={{ fontSize: 11, color: ratingColor, fontWeight: '600', marginTop: 8 }}>
            {getRatingLabel(rating, station.reviewCount)}
          </Text>
        )}

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 }} />

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              height: 46,
              backgroundColor: '#0a2342',
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            activeOpacity={0.8}
            onPress={() => {
              onClose()
              router.push(`/station/${station.id}`)
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Ver detalles</Text>
            <CaretRight size={14} color="#fff" weight="bold" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              height: 46,
              backgroundColor: '#f97316',
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            activeOpacity={0.8}
            onPress={() => {
              onClose()
              router.push(`/review/new?stationId=${station.id}`)
            }}
          >
            <PencilSimple size={15} color="#fff" weight="bold" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Calificar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
