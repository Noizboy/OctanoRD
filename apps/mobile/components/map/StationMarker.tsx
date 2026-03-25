import { View, Text } from 'react-native'
import { Marker } from 'react-native-maps'
import type { GasStation } from '@/lib/queries/types'

interface Props {
  station: GasStation
  onPress: () => void
}

function getPinColor(rating: number, hasRating: boolean) {
  if (!hasRating) return '#52525b'
  if (rating >= 4) return '#10b981'
  if (rating >= 2.5) return '#f59e0b'
  return '#ef4444'
}

export default function StationMarker({ station, onPress }: Props) {
  const rating = parseFloat(station.avgRating ?? '0')
  const hasRating = station.reviewCount > 0
  const pinColor = getPinColor(rating, hasRating)
  const label = hasRating ? rating.toFixed(1) : '--'

  return (
    <Marker
      coordinate={{
        latitude: parseFloat(station.lat),
        longitude: parseFloat(station.lng),
      }}
      onPress={onPress}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View collapsable={false} style={{ alignItems: 'center' }}>
        <View
          collapsable={false}
          style={{
            backgroundColor: pinColor,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: '#fff',
            paddingHorizontal: 8,
            paddingVertical: 3,
            alignItems: 'center',
            elevation: 4,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 11,
              fontWeight: 'bold',
              includeFontPadding: false,
            }}
          >
            {'★ ' + label}
          </Text>
        </View>
        <View
          collapsable={false}
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
