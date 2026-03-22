import { View, Text, TouchableOpacity } from 'react-native'
import { ThumbsUp, Flag, Receipt, GasPump } from 'phosphor-react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { getDeviceFingerprint } from '@/lib/utils/fingerprint'
import RatingStars from './RatingStars'
import VerifiedBadge from './VerifiedBadge'
import type { Review } from '@/lib/queries/types'

const CARD   = '#18181b'
const CARD2  = '#27272a'
const BORDER = '#3f3f46'
const TEXT   = '#fafafa'
const MUTED  = '#a1a1aa'
const DIM    = '#71717a'

const FUEL_LABELS: Record<string, string> = {
  regular:        'Regular',
  premium:        'Premium',
  gasoil_optimo:  'Gasoil Óptimo',
  gasoil_regular: 'Gasoil Regular',
}

const FUEL_COLORS: Record<string, string> = {
  regular:        '#3b82f6',
  premium:        '#f97316',
  gasoil_optimo:  '#10b981',
  gasoil_regular: '#a78bfa',
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

export default function ReviewCard({ review }: Props) {
  const queryClient = useQueryClient()
  const [deviceHash, setDeviceHash] = useState<string | null>(null)
  const fuelColor = FUEL_COLORS[review.fuelType] ?? DIM
  const ratingColor = review.stars >= 4 ? '#10b981' : review.stars >= 3 ? '#f59e0b' : '#ef4444'

  useEffect(() => {
    getDeviceFingerprint().then(setDeviceHash)
  }, [])

  const voteMutation = useMutation({
    mutationFn: async (vote: 'helpful' | 'spam') => {
      if (!deviceHash) return
      await api.post(`/reviews/${review.id}/vote`, { vote, deviceHash })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })

  return (
    <View
      style={{
        backgroundColor: CARD,
        borderRadius: 18,
        marginHorizontal: 16,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: 'hidden',
      }}
    >
      {/* Thin rating bar */}
      <View style={{ height: 2, backgroundColor: ratingColor }} />

      <View style={{ padding: 14 }}>
        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RatingStars rating={review.stars} readonly size={13} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: ratingColor }}>
              {review.stars.toFixed(1)}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: DIM, fontWeight: '500' }}>
            {timeAgo(review.createdAt)}
          </Text>
        </View>

        {/* Fuel + verified */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${fuelColor}18`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <GasPump size={11} color={fuelColor} weight="fill" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: fuelColor }}>
              {FUEL_LABELS[review.fuelType] ?? review.fuelType}
            </Text>
          </View>
          {review.receiptVerified && <VerifiedBadge />}
        </View>

        {/* Comment */}
        {review.comment ? (
          <Text style={{ fontSize: 14, color: TEXT, lineHeight: 20 }}>{review.comment}</Text>
        ) : (
          <Text style={{ fontSize: 13, color: DIM, fontStyle: 'italic' }}>Sin comentario</Text>
        )}

        {/* OCR */}
        {review.ocrExtracted && (review.ocrExtracted as { amount?: string }).amount && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: CARD2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Receipt size={13} color={DIM} />
            <Text style={{ fontSize: 12, color: MUTED }}>
              RD$<Text style={{ fontWeight: '700', color: TEXT }}>{(review.ocrExtracted as { amount: string }).amount}</Text>
              {(review.ocrExtracted as { liters?: string }).liters && (
                <Text> · {(review.ocrExtracted as { liters: string }).liters}L</Text>
              )}
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: BORDER, marginTop: 12, marginBottom: 10 }} />

        {/* Votes */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: CARD2, borderRadius: 20, borderWidth: 1, borderColor: BORDER }}
            onPress={() => voteMutation.mutate('helpful')}
            disabled={!deviceHash}
          >
            <ThumbsUp size={13} color={review.helpfulCount > 0 ? '#10b981' : DIM} weight="fill" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: review.helpfulCount > 0 ? '#10b981' : DIM }}>
              Útil {review.helpfulCount > 0 ? `(${review.helpfulCount})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: CARD2, borderRadius: 20, borderWidth: 1, borderColor: BORDER }}
            onPress={() => voteMutation.mutate('spam')}
            disabled={!deviceHash}
          >
            <Flag size={13} color={DIM} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: DIM }}>Reportar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
