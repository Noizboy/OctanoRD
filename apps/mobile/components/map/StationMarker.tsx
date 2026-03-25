import { View, Text } from 'react-native'
import { Marker } from 'react-native-maps'
import { useState } from 'react'
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
  const [ready, setReady] = useState(false)
  const rating = parseFloat(station.avgRating)
  const hasRating = station.reviewCount > 0
  const pinColor = getPinColor(rating, hasRating)
  const label = hasRating ? rating.toFixed(1) : '-'

  return (
    <Marker
      coordinate={{
        latitude: parseFloat(station.lat),
        longitude: parseFloat(station.lng),
      }}
      onPress={onPress}
      tracksViewChanges={!ready}
    >
      <View
        style={{ alignItems: 'center', width: 56 }}
        onLayout={() => setReady(true)}
      >
        <View
          style={{
            backgroundColor: pinColor,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: '#ffffff',
            paddingHorizontal: 6,
            paddingVertical: 4,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 3,
            elevation: 8,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold', marginRight: 2 }}>
            {'★'}
          </Text>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>
            {label}
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
