import { View, Text } from 'react-native'
import { CheckCircle } from 'phosphor-react-native'

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
          gap: 4,
          backgroundColor: '#10b98122',
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 20,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <CheckCircle size={11} color="#10b981" weight="fill" />
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981' }}>
        Verificada
      </Text>
    </View>
  )
}
