import { Marker } from 'react-native-maps'
import { getRatingColor, RATING_COLORS } from '@/lib/constants'
import type { GasStation } from '@/lib/queries/types'

interface Props {
  station: GasStation
  onPress: () => void
}

export default function StationMarker({ station, onPress }: Props) {
  const rating = parseFloat(station.avgRating)
  const hasRating = station.reviewCount > 0

  return (
    <Marker
      coordinate={{
        latitude: parseFloat(station.lat),
        longitude: parseFloat(station.lng),
      }}
      title={`⛽ ${station.name}${station.brand ? ' · ' + station.brand : ''}`}
      description={hasRating ? `${rating.toFixed(1)} ★ · ${station.reviewCount} opiniones` : 'Sin calificaciones'}
      pinColor={hasRating ? getRatingColor(rating) : RATING_COLORS.none}
      onPress={onPress}
    />
  )
}
