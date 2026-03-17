import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/lib/stores/authStore'
import { useSubmitReview } from '@/lib/queries/useSubmitReview'
import { getDeviceFingerprint } from '@/lib/utils/fingerprint'
import { FUEL_TYPES } from '@/lib/constants'
import RatingStars from '@/components/review/RatingStars'

const schema = z.object({
  stars: z.number().int().min(1).max(5),
  fuelType: z.enum(['regular', 'premium', 'gasoil_optimo', 'gasoil_regular']),
  comment: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

export default function NewReviewScreen() {
  const { stationId } = useLocalSearchParams<{ stationId: string }>()
  const router = useRouter()
  const { isVerified } = useAuthStore()
  const { mutateAsync, isPending } = useSubmitReview()

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { stars: 0, fuelType: 'regular' },
  })

  const stars = watch('stars')
  const fuelType = watch('fuelType')

  const onSubmit = async (values: FormValues) => {
    if (!isVerified) {
      router.push(`/review/verify-otp?stationId=${stationId}`)
      return
    }

    if (!stationId) {
      Alert.alert('Error', 'ID de gasolinera no encontrado')
      return
    }

    try {
      const deviceHash = await getDeviceFingerprint()
      await mutateAsync({
        stationId,
        stars: values.stars,
        fuelType: values.fuelType,
        comment: values.comment,
        deviceHash,
        turnstileToken: 'dev-bypass',
      })

      Alert.alert(
        'Gracias!',
        'Tu calificacion fue enviada y sera revisada pronto.',
        [{ text: 'OK', onPress: () => router.back() }],
      )
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar tu calificacion. Intenta de nuevo.')
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" keyboardShouldPersistTaps="handled">
      <View className="p-4">
        {/* Stars */}
        <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Calificacion general
          </Text>
          <Controller
            control={control}
            name="stars"
            render={({ field: { onChange } }) => (
              <RatingStars
                rating={stars}
                readonly={false}
                size={40}
                onRate={(v) => { onChange(v); setValue('stars', v) }}
              />
            )}
          />
          {errors.stars && (
            <Text className="text-red-500 text-xs mt-1">
              Selecciona una calificacion
            </Text>
          )}
        </View>

        {/* Fuel Type */}
        <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Tipo de combustible
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {FUEL_TYPES.map((ft) => (
              <TouchableOpacity
                key={ft.key}
                className={`px-4 py-2 rounded-full border ${
                  fuelType === ft.key
                    ? 'bg-blue-700 border-blue-700'
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => setValue('fuelType', ft.key)}
              >
                <Text
                  className={`text-sm font-medium ${
                    fuelType === ft.key ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {ft.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comment */}
        <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Comentario (opcional)
          </Text>
          <Controller
            control={control}
            name="comment"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="text-base text-gray-800 min-h-24"
                multiline
                textAlignVertical="top"
                placeholder="Comparte tu experiencia con el combustible..."
                placeholderTextColor="#9ca3af"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                maxLength={500}
              />
            )}
          />
          {errors.comment && (
            <Text className="text-red-500 text-xs mt-1">{errors.comment.message}</Text>
          )}
        </View>

        {/* Receipt */}
        <TouchableOpacity
          className="bg-white rounded-xl p-4 shadow-sm mb-6 flex-row items-center"
          onPress={() => router.push(`/review/upload-receipt?stationId=${stationId}`)}
        >
          <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
            <Text className="text-xl">🧾</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-gray-800">
              Adjuntar factura (opcional)
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Las reviews con factura tienen mayor credibilidad
            </Text>
          </View>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          className="bg-blue-700 py-4 rounded-xl items-center"
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">
              {isVerified ? 'Enviar Calificacion' : 'Continuar y Verificar'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
