import { View, Text, TouchableOpacity } from 'react-native'
import { ThumbsUp, Flag, Receipt, GasPump } from 'phosphor-react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { getDeviceFingerprint } from '@/lib/utils/fingerprint'
import RatingStars from './RatingStars'
import VerifiedBadge from './VerifiedBadge'
import type { Review } from '@/lib/queries/types'

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
  gasoil_regular: '#6366f1',
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

function StarsBadge({ stars }: { stars: number }) {
  const color = stars >= 4 ? '#10b981' : stars >= 3 ? '#f59e0b' : '#ef4444'
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <RatingStars rating={stars} readonly size={13} />
      <Text style={{ fontSize: 13, fontWeight: '700', color }}>{stars.toFixed(1)}</Text>
    </View>
  )
}

export default function ReviewCard({ review }: Props) {
  const queryClient = useQueryClient()
  const [deviceHash, setDeviceHash] = useState<string | null>(null)
  const fuelColor = FUEL_COLORS[review.fuelType] ?? '#64748b'

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
        backgroundColor: '#fff',
        borderRadius: 18,
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        shadowColor: '#0a2342',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <StarsBadge stars={review.stars} />
        <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500' }}>
          {timeAgo(review.createdAt)}
        </Text>
      </View>

      {/* Fuel type tag */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: fuelColor + '15',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 20,
          }}
        >
          <GasPump size={11} color={fuelColor} weight="fill" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: fuelColor }}>
            {FUEL_LABELS[review.fuelType] ?? review.fuelType}
          </Text>
        </View>
        {review.receiptVerified && <VerifiedBadge />}
      </View>

      {/* Comment */}
      {review.comment ? (
        <Text style={{ fontSize: 14, color: '#334155', lineHeight: 20 }}>
          {review.comment}
        </Text>
      ) : (
        <Text style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
          Sin comentario
        </Text>
      )}

      {/* OCR extracted data */}
      {review.ocrExtracted &&
        (review.ocrExtracted as { amount?: string }).amount && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 10,
              backgroundColor: '#f8fafc',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Receipt size={14} color="#64748b" />
            <Text style={{ fontSize: 12, color: '#64748b' }}>
              RD$<Text style={{ fontWeight: '700', color: '#334155' }}>
                {(review.ocrExtracted as { amount: string }).amount}
              </Text>
              {(review.ocrExtracted as { liters?: string }).liters && (
                <Text> · {(review.ocrExtracted as { liters: string }).liters}L</Text>
              )}
            </Text>
          </View>
        )}

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: '#f1f5f9', marginTop: 12, marginBottom: 10 }} />

      {/* Votes */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: review.helpfulCount > 0 ? '#10b98115' : '#f8fafc',
            borderRadius: 20,
          }}
          onPress={() => voteMutation.mutate('helpful')}
          disabled={!deviceHash}
        >
          <ThumbsUp size={13} color={review.helpfulCount > 0 ? '#10b981' : '#94a3b8'} weight="fill" />
          <Text style={{ fontSize: 12, fontWeight: '600', color: review.helpfulCount > 0 ? '#10b981' : '#94a3b8' }}>
            Útil {review.helpfulCount > 0 ? `(${review.helpfulCount})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: '#f8fafc',
            borderRadius: 20,
          }}
          onPress={() => voteMutation.mutate('spam')}
          disabled={!deviceHash}
        >
          <Flag size={13} color="#94a3b8" />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8' }}>Reportar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
