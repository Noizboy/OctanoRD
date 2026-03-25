import { View, Text } from 'react-native'
import { Marker } from 'react-native-maps'
import { useState } from 'react'
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
  const [tracked, setTracked] = useState(true)
  const rating = parseFloat(station.avgRating ?? '0')
  const hasRating = station.reviewCount > 0
  const pinColor = getPinColor(rating, hasRating)

  return (
    <Marker
      coordinate={{
        latitude: parseFloat(station.lat),
        longitude: parseFloat(station.lng),
      }}
      onPress={onPress}
      tracksViewChanges={tracked}
    >
      <View
        style={{ alignItems: 'center' }}
        onLayout={() => setTracked(false)}
      >
        <View
          style={{
            backgroundColor: pinColor,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: '#ffffff',
            paddingHorizontal: 7,
            paddingVertical: 4,
            flexDirection: 'row',
            alignItems: 'center',
            elevation: 6,
          }}
        >
          <Text style={{ color: '#facc15', fontSize: 10, marginRight: 2 }}>★</Text>
          <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>
            {hasRating ? rating.toFixed(1) : '--'}
          </Text>
        </View>
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
