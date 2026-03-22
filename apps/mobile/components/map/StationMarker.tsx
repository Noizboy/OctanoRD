import { View, Text } from 'react-native'
import { Marker, Callout } from 'react-native-maps'
import type { GasStation } from '@/lib/queries/types'

interface Props {
  station: GasStation
  onPress: () => void
}

function getPinColor(rating: number, hasRating: boolean) {
  if (!hasRating) return '#94a3b8'
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
      <View
        style={{
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: pinColor,
            borderRadius: 20,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderWidth: 2,
            borderColor: '#fff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            minWidth: 36,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
            {hasRating ? `⛽ ${rating.toFixed(1)}` : '⛽'}
          </Text>
        </View>
        {/* Pin tail */}
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 5,
            borderRightWidth: 5,
            borderTopWidth: 6,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: pinColor,
          }}
        />
      </View>
    </Marker>
  )
}
