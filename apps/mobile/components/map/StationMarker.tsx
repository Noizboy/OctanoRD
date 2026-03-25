import { View, Text } from 'react-native'
import { Marker } from 'react-native-maps'
import type { GasStation } from '@/lib/queries/types'

interface Props {
  station: GasStation
  onPress: () => void
}

function getPinColor(rating: number, hasRating: boolean) {
  if (!hasRating) return '#71717a'
  if (rating >= 4) return '#10b981'
  if (rating >= 2.5) return '#f59e0b'
  return '#ef4444'
}

export default function StationMarker({ station, onPress }: Props) {
  const rating = parseFloat(station.avgRating)
  const hasRating = station.reviewCount > 0
  const pinColor = getPinColor(rating, hasRating)

  return (
    <Marker
      coordinate={{
        latitude: parseFloat(station.lat),
        longitude: parseFloat(station.lng),
      }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            backgroundColor: pinColor,
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 5,
            borderWidth: 2,
            borderColor: '#fff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            elevation: 6,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            minWidth: 44,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11, lineHeight: 13 }}>★</Text>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', lineHeight: 14 }}>
            {hasRating ? rating.toFixed(1) : '—'}
          </Text>
        </View>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 5,
            borderRightWidth: 5,
            borderTopWidth: 7,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: pinColor,
          }}
        />
      </View>
    </Marker>
  )
}
