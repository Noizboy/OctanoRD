import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { getDeviceFingerprint } from '@/lib/utils/fingerprint'
import RatingStars from './RatingStars'
import VerifiedBadge from './VerifiedBadge'
import type { Review } from '@/lib/queries/types'

const FUEL_LABELS: Record<string, string> = {
  regular: 'Regular',
  premium: 'Premium',
  gasoil_optimo: 'Gasoil Optimo',
  gasoil_regular: 'Gasoil Regular',
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
    <View className="bg-white rounded-xl p-4 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <RatingStars rating={review.stars} readonly size={14} />
          <Text className="text-xs text-gray-400 ml-1">
            {FUEL_LABELS[review.fuelType] ?? review.fuelType}
          </Text>
        </View>
        <Text className="text-xs text-gray-400">{timeAgo(review.createdAt)}</Text>
      </View>

      {/* Verified badge */}
      {review.receiptVerified && <VerifiedBadge style={{ marginBottom: 8 }} />}

      {/* Comment */}
      {review.comment ? (
        <Text className="text-sm text-gray-700 leading-relaxed">{review.comment}</Text>
      ) : (
        <Text className="text-sm text-gray-400 italic">Sin comentario</Text>
      )}

      {/* OCR data */}
      {review.ocrExtracted &&
        (review.ocrExtracted as { amount?: string; date?: string; liters?: string }).amount && (
          <View className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
            <Text className="text-xs text-gray-500">
              Monto:{' '}
              <Text className="font-medium text-gray-700">
                RD${(review.ocrExtracted as { amount: string }).amount}
              </Text>
              {(review.ocrExtracted as { liters?: string }).liters && (
                <>
                  {' '}· {(review.ocrExtracted as { liters: string }).liters}L
                </>
              )}
            </Text>
          </View>
        )}

      {/* Votes */}
      <View className="flex-row gap-4 mt-3 pt-3 border-t border-gray-50">
        <TouchableOpacity
          className="flex-row items-center gap-1"
          onPress={() => voteMutation.mutate('helpful')}
          disabled={!deviceHash}
        >
          <Ionicons name="thumbs-up-outline" size={15} color="#6b7280" />
          <Text className="text-xs text-gray-500">{review.helpfulCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center gap-1"
          onPress={() => voteMutation.mutate('spam')}
          disabled={!deviceHash}
        >
          <Ionicons name="flag-outline" size={15} color="#6b7280" />
          <Text className="text-xs text-gray-500">Reportar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
