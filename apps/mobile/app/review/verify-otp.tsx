import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/stores/authStore'
import { sha256 } from '@/lib/utils/hash'

const RESEND_COUNTDOWN = 60

export default function VerifyOtpScreen() {
  const router = useRouter()
  const { setTokens, setPhoneHash } = useAuthStore()

  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startCountdown = () => {
    setCountdown(RESEND_COUNTDOWN)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const requestOtp = useMutation({
    mutationFn: async (phoneNumber: string) => {
      await api.post('/auth/otp/request', { phone: phoneNumber })
    },
    onSuccess: () => {
      setStep('code')
      startCountdown()
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo enviar el codigo. Verifica el numero e intenta de nuevo.')
    },
  })

  const verifyOtp = useMutation({
    mutationFn: async ({ phoneNumber, otpCode }: { phoneNumber: string; otpCode: string }) => {
      const response = await api.post<{ accessToken: string; refreshToken: string }>(
        '/auth/otp/verify',
        { phone: phoneNumber, code: otpCode },
      )
      return response.data
    },
    onSuccess: async (data) => {
      await setTokens(data.accessToken, data.refreshToken)
      const salt = 'octanord-phone-salt'
      const hash = await sha256(phone + salt)
      setPhoneHash(hash)
      router.back()
    },
    onError: () => {
      Alert.alert('Codigo incorrecto', 'El codigo ingresado no es valido o expiro.')
      setCode('')
    },
  })

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 p-6">
        <View className="mb-8 mt-4">
          <Text className="text-2xl font-bold text-gray-900">
            {step === 'phone' ? 'Tu numero de telefono' : 'Codigo de verificacion'}
          </Text>
          <Text className="text-base text-gray-500 mt-2">
            {step === 'phone'
              ? 'Ingresa tu numero de WhatsApp para recibir el codigo de verificacion.'
              : `Ingresamos un codigo de 6 digitos al numero ${phone}. Tiene validez por 10 minutos.`}
          </Text>
        </View>

        {step === 'phone' ? (
          <>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-lg text-gray-900"
              placeholder="+1 809 000 0000"
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="done"
              onSubmitEditing={() => {
                if (phone.length >= 7) requestOtp.mutate(phone)
              }}
            />

            <TouchableOpacity
              className={`mt-6 py-4 rounded-xl items-center ${
                phone.length < 7 ? 'bg-gray-200' : 'bg-blue-700'
              }`}
              onPress={() => requestOtp.mutate(phone)}
              disabled={phone.length < 7 || requestOtp.isPending}
            >
              {requestOtp.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  className={`font-bold text-base ${
                    phone.length < 7 ? 'text-gray-400' : 'text-white'
                  }`}
                >
                  Enviar codigo por WhatsApp
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-3xl text-gray-900 text-center tracking-widest"
              placeholder="000000"
              placeholderTextColor="#9ca3af"
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <TouchableOpacity
              className={`mt-6 py-4 rounded-xl items-center ${
                code.length !== 6 ? 'bg-gray-200' : 'bg-blue-700'
              }`}
              onPress={() => verifyOtp.mutate({ phoneNumber: phone, otpCode: code })}
              disabled={code.length !== 6 || verifyOtp.isPending}
            >
              {verifyOtp.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  className={`font-bold text-base ${
                    code.length !== 6 ? 'text-gray-400' : 'text-white'
                  }`}
                >
                  Verificar
                </Text>
              )}
            </TouchableOpacity>

            <View className="mt-6 items-center">
              {countdown > 0 ? (
                <Text className="text-gray-400 text-sm">
                  Reenviar codigo en {countdown}s
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setCode('')
                    requestOtp.mutate(phone)
                  }}
                >
                  <Text className="text-blue-600 text-sm font-medium">
                    Reenviar codigo
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="mt-3"
                onPress={() => {
                  setStep('phone')
                  setCode('')
                }}
              >
                <Text className="text-gray-500 text-sm">Cambiar numero</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}
