import { View, ActivityIndicator, Text } from 'react-native'

interface Props {
  message?: string
  size?: 'small' | 'large'
  color?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({
  message,
  size = 'large',
  color = '#1e40af',
  fullScreen = false,
}: Props) {
  return (
    <View
      className={`items-center justify-center ${fullScreen ? 'flex-1' : 'py-8'}`}
    >
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="text-gray-500 text-sm mt-3">{message}</Text>
      )}
    </View>
  )
}
