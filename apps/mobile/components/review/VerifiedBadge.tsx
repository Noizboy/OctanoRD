import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  style?: object
}

export default function VerifiedBadge({ style }: Props) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#dcfce7',
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 12,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Ionicons name="receipt" size={12} color="#16a34a" />
      <Text
        style={{ color: '#16a34a', fontSize: 11, fontWeight: '600', marginLeft: 4 }}
      >
        Factura verificada
      </Text>
    </View>
  )
}
