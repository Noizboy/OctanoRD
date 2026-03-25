import { View, Text } from 'react-native'
import { Marker } from 'react-native-maps'
import { useState, useEffect } from 'react'
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

const W = 58
const H = 30
const TAIL = 8

export default function StationMarker({ station, onPress }: Props) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setTracksViewChanges(false), 300)
    return () => clearTimeout(t)
  }, [])

  const rating = parseFloat(station.avgRating ?? '0')
  const hasRating = station.reviewCount > 0
  const color = getPinColor(rating, hasRating)
  const label = hasRating ? `★ ${rating.toFixed(1)}` : '★ --'

  return (
    <Marker
      coordinate={{
        latitude: parseFloat(station.lat),
        longitude: parseFloat(station.lng),
      }}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View
        collapsable={false}
        style={{ width: W, height: H + TAIL, alignItems: 'center' }}
      >
        <View
          collapsable={false}
          style={{
            width: W,
            height: H,
            backgroundColor: color,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 5,
          }}
        >
          <Text
            style={{
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 'bold',
              includeFontPadding: false,
              textAlignVertical: 'center',
            }}
          >
            {label}
          </Text>
        </View>
        <View
          collapsable={false}
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 6,
            borderRightWidth: 6,
            borderTopWidth: TAIL,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: color,
          }}
        />
      </View>
    </Marker>
  )
}
