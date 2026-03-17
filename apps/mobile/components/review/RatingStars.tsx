import { View, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  rating: number
  readonly?: boolean
  size?: number
  onRate?: (stars: number) => void
}

export default function RatingStars({
  rating,
  readonly = true,
  size = 24,
  onRate,
}: Props) {
  const stars = [1, 2, 3, 4, 5]

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {stars.map((star) => {
        const filled = star <= Math.round(rating)
        const icon = filled ? 'star' : 'star-outline'
        const color = filled ? '#eab308' : '#d1d5db'

        if (readonly) {
          return (
            <Ionicons key={star} name={icon} size={size} color={color} />
          )
        }

        return (
          <TouchableOpacity
            key={star}
            onPress={() => onRate?.(star)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color={star <= rating ? '#eab308' : '#d1d5db'}
            />
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
