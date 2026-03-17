import { View, Text } from 'react-native'
import { Marker } from 'react-native-maps'
import { getRatingColor } from '@/lib/constants'
import type { GasStation } from '@/lib/queries/types'

interface Props {
  station: GasStation
  onPress: () => void
}

export default function StationMarker({ station, onPress }: Props) {
  const rating = parseFloat(station.avgRating)
  const color = getRatingColor(rating)
  const hasRating = station.reviewCount > 0

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
          backgroundColor: color,
          borderRadius: 20,
          paddingHorizontal: 8,
          paddingVertical: 5,
          borderWidth: 2,
          borderColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 4,
          alignItems: 'center',
          minWidth: 40,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
          {hasRating ? rating.toFixed(1) : '?'}
        </Text>
      </View>

      {/* Callout triangle */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 5,
          borderRightWidth: 5,
          borderTopWidth: 6,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          alignSelf: 'center',
        }}
      />
    </Marker>
  )
}
