import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useAuthStore } from '@/lib/stores/authStore'
import { connectSocket } from '@/lib/socket'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30 * 1000,
    },
  },
})

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
    connectSocket()
  }, [initialize])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#1e40af' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="station/[id]"
            options={{ title: 'Gasolinera' }}
          />
          <Stack.Screen
            name="review/new"
            options={{ title: 'Nueva Calificacion' }}
          />
          <Stack.Screen
            name="review/verify-otp"
            options={{ title: 'Verificar Telefono' }}
          />
          <Stack.Screen
            name="review/upload-receipt"
            options={{ title: 'Subir Factura' }}
          />
        </Stack>
        <StatusBar style="light" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
