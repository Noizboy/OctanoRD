import { View, TouchableOpacity } from 'react-native'
import { Star } from 'phosphor-react-native'

interface Props {
  rating: number
  readonly?: boolean
  size?: number
  onRate?: (stars: number) => void
}

export default function RatingStars({ rating, readonly = true, size = 24, onRate }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(rating)
        const color = filled ? '#f59e0b' : '#e2e8f0'

        if (readonly) {
          return <Star key={star} size={size} color={color} weight={filled ? 'fill' : 'regular'} />
        }

        return (
          <TouchableOpacity
            key={star}
            onPress={() => onRate?.(star)}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          >
            <Star
              size={size}
              color={star <= rating ? '#f59e0b' : '#e2e8f0'}
              weight={star <= rating ? 'fill' : 'regular'}
            />
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
