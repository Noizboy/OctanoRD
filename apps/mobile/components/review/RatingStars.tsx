import { View, TouchableOpacity } from 'react-native'
import { Star } from 'phosphor-react-native'

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
        const color = filled ? '#eab308' : '#d1d5db'

        if (readonly) {
          return (
            <Star key={star} size={size} color={color} weight={filled ? 'fill' : 'regular'} />
          )
        }

        return (
          <TouchableOpacity
            key={star}
            onPress={() => onRate?.(star)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Star
              size={size}
              color={star <= rating ? '#eab308' : '#d1d5db'}
              weight={star <= rating ? 'fill' : 'regular'}
            />
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
