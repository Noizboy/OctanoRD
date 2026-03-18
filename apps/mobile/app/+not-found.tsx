import { View, Text } from 'react-native'
import { Link, Stack } from 'expo-router'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Pagina no encontrada' }} />
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-2xl font-bold text-gray-900">404</Text>
        <Text className="text-gray-500 mt-2 text-center">Esta pantalla no existe.</Text>
        <Link href="/" className="mt-6">
          <Text className="text-blue-700 font-semibold">Volver al inicio</Text>
        </Link>
      </View>
    </>
  )
}
