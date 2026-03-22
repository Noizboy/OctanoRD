import { View, Text, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { X, GasPump, Star, PencilSimple, CaretRight } from 'phosphor-react-native'
import type { GasStation } from '@/lib/queries/types'

const CARD   = '#18181b'
const CARD2  = '#27272a'
const BORDER = '#3f3f46'
const TEXT   = '#fafafa'
const MUTED  = '#a1a1aa'
const ORANGE = '#f97316'

interface Props {
  station: GasStation
  onClose: () => void
}

function getRatingColor(r: number) {
  if (r >= 4) return '#10b981'
  if (r >= 2.5) return '#f59e0b'
  return '#ef4444'
}

function getRatingLabel(r: number) {
  if (r >= 4.5) return 'Excelente'
  if (r >= 4)   return 'Muy bueno'
  if (r >= 3)   return 'Bueno'
  if (r >= 2)   return 'Regular'
  return 'Malo'
}

export default function StationCard({ station, onClose }: Props) {
  const router = useRouter()
  const rating = parseFloat(station.avgRating)
  const hasRating = station.reviewCount > 0
  const ratingColor = hasRating ? getRatingColor(rating) : '#52525b'

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 16,
        left: 12,
        right: 12,
        backgroundColor: CARD,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: 'hidden',
        ...(Platform.OS === 'ios'
          ? { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24 }
          : { elevation: 20 }),
      }}
    >
      {/* Accent bar */}
      <View style={{ height: 3, backgroundColor: ratingColor }} />

      <View style={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {/* Icon */}
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${ORANGE}20`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <GasPump size={22} color={ORANGE} weight="fill" />
          </View>

          {/* Name block */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT, letterSpacing: -0.3 }} numberOfLines={1}>
              {station.name}
            </Text>
            {station.brand && (
              <Text style={{ fontSize: 13, fontWeight: '600', color: ORANGE, marginTop: 1 }}>
                {station.brand}
              </Text>
            )}
            {station.address && (
              <Text style={{ fontSize: 12, color: MUTED, marginTop: 2 }} numberOfLines={1}>
                {station.address}
              </Text>
            )}
          </View>

          {/* Rating badge */}
          <View style={{ backgroundColor: `${ratingColor}20`, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 10 }}>
            <Star size={14} color={ratingColor} weight="fill" />
            <Text style={{ fontSize: 20, fontWeight: '800', color: ratingColor, lineHeight: 24 }}>
              {hasRating ? rating.toFixed(1) : '--'}
            </Text>
          </View>

          {/* Close */}
          <TouchableOpacity
            onPress={onClose}
            style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: CARD2, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}
          >
            <X size={14} color={MUTED} weight="bold" />
          </TouchableOpacity>
        </View>

        {hasRating && (
          <Text style={{ fontSize: 11, color: ratingColor, fontWeight: '600', marginTop: 8 }}>
            {getRatingLabel(rating)}
          </Text>
        )}

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: BORDER, marginVertical: 14 }} />

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={{ flex: 1, height: 46, backgroundColor: CARD2, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: BORDER }}
            activeOpacity={0.7}
            onPress={() => { onClose(); router.push(`/station/${station.id}`) }}
          >
            <Text style={{ color: TEXT, fontWeight: '700', fontSize: 14 }}>Ver detalles</Text>
            <CaretRight size={13} color={MUTED} weight="bold" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1, height: 46, backgroundColor: ORANGE, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            activeOpacity={0.75}
            onPress={() => { onClose(); router.push(`/review/new?stationId=${station.id}`) }}
          >
            <PencilSimple size={15} color="#fff" weight="bold" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Calificar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
