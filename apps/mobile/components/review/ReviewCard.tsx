import { View, Text } from 'react-native'
import { Receipt, GasPump, Star, CheckCircle } from 'phosphor-react-native'
import type { Review } from '@/lib/queries/types'

const CARD   = '#18181b'
const CARD2  = '#27272a'
const BORDER = '#3f3f46'
const TEXT   = '#fafafa'
const MUTED  = '#a1a1aa'
const DIM    = '#71717a'
const ORANGE = '#f97316'
const GREEN  = '#10b981'

const FUEL_LABELS: Record<string, string> = {
  regular:        'Regular',
  premium:        'Premium',
  gasoil_optimo:  'Gasoil Óptimo',
  gasoil_regular: 'Gasoil Regular',
}

const FUEL_COLORS: Record<string, string> = {
  regular:        '#3b82f6',
  premium:        ORANGE,
  gasoil_optimo:  GREEN,
  gasoil_regular: '#a78bfa',
}

const STAR_LABELS: Record<number, string> = {
  1: 'Malo',
  2: 'Regular',
  3: 'Bueno',
  4: 'Muy bueno',
  5: 'Excelente',
}

interface Props {
  review: Review
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  const months = Math.floor(days / 30)
  return `hace ${months} mes${months > 1 ? 'es' : ''}`
}

function getAvatarColor(stars: number): string {
  if (stars >= 4) return GREEN
  if (stars >= 3) return '#f59e0b'
  return '#ef4444'
}

export default function ReviewCard({ review }: Props) {
  const fuelColor = FUEL_COLORS[review.fuelType] ?? DIM
  const ratingColor = review.stars >= 4 ? GREEN : review.stars >= 3 ? '#f59e0b' : '#ef4444'
  const avatarColor = getAvatarColor(review.stars)
  const initials = review.stars >= 4 ? '★' : review.stars >= 3 ? '◆' : '●'

  return (
    <View
      style={{
        backgroundColor: CARD,
        borderRadius: 20,
        marginHorizontal: 16,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: 'hidden',
      }}
    >
      {/* Top color accent bar */}
      <View style={{ height: 2.5, backgroundColor: ratingColor }} />

      <View style={{ padding: 16 }}>
        {/* Header row: avatar + rating badge + time */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {/* Anonymous avatar */}
          <View style={{
            width: 42, height: 42, borderRadius: 14,
            backgroundColor: `${avatarColor}20`,
            borderWidth: 1.5, borderColor: `${avatarColor}40`,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 16, color: avatarColor }}>{initials}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: MUTED }}>Usuario anónimo</Text>
            <Text style={{ fontSize: 11, color: DIM, marginTop: 1 }}>{timeAgo(review.createdAt)}</Text>
          </View>

          {/* Rating badge */}
          <View style={{
            backgroundColor: `${ratingColor}18`,
            borderRadius: 12, borderWidth: 1, borderColor: `${ratingColor}30`,
            paddingHorizontal: 10, paddingVertical: 6,
            alignItems: 'center',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Star size={12} color={ratingColor} weight="fill" />
              <Text style={{ fontSize: 20, fontWeight: '900', color: ratingColor, lineHeight: 24 }}>
                {review.stars}
              </Text>
            </View>
            <Text style={{ fontSize: 9, fontWeight: '700', color: ratingColor, marginTop: 1, letterSpacing: 0.3 }}>
              {STAR_LABELS[review.stars] ?? ''}
            </Text>
          </View>
        </View>

        {/* Stars row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={15}
              color={i <= review.stars ? ratingColor : '#52525b'}
              weight={i <= review.stars ? 'fill' : 'regular'}
            />
          ))}
        </View>

        {/* Fuel type + verified badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: `${fuelColor}18`,
            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
            borderWidth: 1, borderColor: `${fuelColor}30`,
          }}>
            <GasPump size={12} color={fuelColor} weight="fill" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: fuelColor }}>
              {FUEL_LABELS[review.fuelType] ?? review.fuelType}
            </Text>
          </View>
          {review.receiptVerified && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: `${GREEN}15`,
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
              borderWidth: 1, borderColor: `${GREEN}30`,
            }}>
              <CheckCircle size={12} color={GREEN} weight="fill" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: GREEN }}>Verificada</Text>
            </View>
          )}
        </View>

        {/* Comment */}
        {review.comment ? (
          <Text style={{ fontSize: 14, color: TEXT, lineHeight: 21, marginBottom: 12 }}>
            {review.comment}
          </Text>
        ) : (
          <Text style={{ fontSize: 13, color: DIM, fontStyle: 'italic', marginBottom: 12 }}>
            Sin comentario adicional
          </Text>
        )}

        {/* OCR receipt data */}
        {review.ocrExtracted && (review.ocrExtracted as { amount?: string }).amount && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: CARD2, borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 10,
            borderWidth: 1, borderColor: BORDER,
            marginBottom: 12,
          }}>
            <Receipt size={14} color={DIM} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: DIM, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>
                Factura verificada
              </Text>
              <Text style={{ fontSize: 13, color: MUTED }}>
                <Text style={{ fontWeight: '800', color: TEXT }}>
                  RD${(review.ocrExtracted as { amount: string }).amount}
                </Text>
                {(review.ocrExtracted as { liters?: string }).liters && (
                  <Text style={{ color: DIM }}>
                    {' '}· {(review.ocrExtracted as { liters: string }).liters}L
                  </Text>
                )}
              </Text>
            </View>
          </View>
        )}

      </View>
    </View>
  )
}
