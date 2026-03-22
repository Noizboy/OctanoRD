import { useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Camera,
  Images,
  Receipt,
  Check,
  MapPin,
  Warning,
  X,
  CaretDown,
} from 'phosphor-react-native'
import { useSubmitReview } from '@/lib/queries/useSubmitReview'
import { useUploadReceipt } from '@/lib/queries/useUploadReceipt'
import { getDeviceFingerprint } from '@/lib/utils/fingerprint'
import { FUEL_TYPES } from '@/lib/constants'
import RatingStars from '@/components/review/RatingStars'

const schema = z.object({
  stars: z.number().int().min(1, 'Selecciona una calificacion').max(5),
  fuelType: z.enum(['regular', 'premium', 'gasoil_optimo', 'gasoil_regular'], {
    required_error: 'Selecciona un tipo de combustible',
  }),
  comment: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

export default function NewReviewScreen() {
  const { stationId } = useLocalSearchParams<{ stationId: string }>()
  const router = useRouter()
  const { mutateAsync, isPending } = useSubmitReview()
  const { receiptUri, uploadId, location, uploading, pickImage, removeReceipt } =
    useUploadReceipt()

  const scrollRef = useRef<ScrollView>(null)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { stars: 0, fuelType: undefined },
  })

  const stars = watch('stars')
  const fuelType = watch('fuelType')

  const step1Done = !!uploadId && !uploading
  const step2Done = stars > 0
  const step3Done = !!fuelType && fuelType.length > 0
  const autoStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : 4
  const activeStep = expandedStep ?? autoStep
  const canSubmit = step1Done && !uploading
  const fuelLabel = FUEL_TYPES.find((ft) => ft.key === fuelType)?.label ?? fuelType

  const onSubmit = async (values: FormValues) => {
    if (!uploadId) {
      Alert.alert(
        'Factura requerida',
        'Debes adjuntar una foto de tu factura de combustible para enviar tu calificacion.',
      )
      return
    }

    // TODO: re-enable OTP verification before production
    // if (!isVerified) {
    //   router.push(`/review/verify-otp?stationId=${stationId}`)
    //   return
    // }

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
        receiptUploadId: uploadId,
        deviceHash,
        turnstileToken: 'dev-bypass',
      })

      Alert.alert(
        'Gracias!',
        'Tu calificacion fue enviada y sera verificada con tu factura.',
        [{ text: 'OK', onPress: () => router.back() }],
      )
    } catch {
      Alert.alert('Error', 'No se pudo enviar tu calificacion. Intenta de nuevo.')
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        className="flex-1 bg-gray-50"
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-4">

          {/* Step 1: Receipt */}
          <View className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={() => setExpandedStep(activeStep === 1 ? null : 1)}
              activeOpacity={0.7}
            >
              <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${step1Done ? 'bg-green-500' : 'bg-blue-700'}`}>
                {step1Done ? (
                  <Check size={14} color="#fff" weight="bold" />
                ) : (
                  <Text className="text-white text-xs font-bold">1</Text>
                )}
              </View>
              <Text className="text-sm font-semibold text-gray-700 flex-1">
                Foto de la factura
              </Text>
              {!step1Done && (
                <View className="bg-red-50 px-2 py-0.5 rounded-full mr-2">
                  <Text className="text-xs font-semibold text-red-600">Obligatorio</Text>
                </View>
              )}
              {step1Done && activeStep !== 1 && (
                <Text className="text-xs text-green-600 font-medium mr-2">Subida</Text>
              )}
              <CaretDown
                size={16}
                color="#9ca3af"
                style={{ transform: [{ rotate: activeStep === 1 ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {activeStep === 1 && (
              <View className="px-4 pb-4">
                <Text className="text-xs text-gray-400 mb-3">
                  Se verificara el nombre de la gasolinera y tu ubicacion
                </Text>

                {receiptUri ? (
                  <View className="rounded-xl overflow-hidden">
                    <Image
                      source={{ uri: receiptUri }}
                      className="w-full h-48"
                      resizeMode="cover"
                    />
                    {uploading && (
                      <View className="absolute inset-0 bg-black/40 items-center justify-center">
                        <ActivityIndicator color="#fff" size="large" />
                        <Text className="text-white mt-2 font-medium">Subiendo factura...</Text>
                      </View>
                    )}
                    {uploadId && !uploading && (
                      <View className="absolute top-3 right-3 bg-green-500 rounded-full p-1.5">
                        <Check size={16} color="#fff" weight="bold" />
                      </View>
                    )}
                    {!uploading && (
                      <TouchableOpacity
                        className="absolute top-3 left-3 bg-white/90 rounded-full p-1.5"
                        onPress={removeReceipt}
                      >
                        <X size={16} color="#374151" />
                      </TouchableOpacity>
                    )}
                    {location && !uploading && (
                      <View className="absolute bottom-3 left-3 flex-row items-center bg-white/90 rounded-full px-2.5 py-1">
                        <MapPin size={12} color="#22c55e" weight="fill" />
                        <Text className="text-xs text-gray-700 ml-1 font-medium">
                          Ubicacion capturada
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View>
                    <View className="border-2 border-dashed border-blue-200 rounded-xl h-36 items-center justify-center mb-3 bg-blue-50/30">
                      <Receipt size={40} color="#93c5fd" />
                      <Text className="text-sm text-blue-400 mt-2">
                        Toma o selecciona tu factura
                      </Text>
                      <Text className="text-xs text-blue-300 mt-0.5">
                        Se leera automaticamente el nombre y datos
                      </Text>
                    </View>
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        className="flex-1 bg-blue-700 py-3.5 rounded-xl flex-row items-center justify-center"
                        onPress={() => pickImage('camera')}
                      >
                        <Camera size={20} color="#fff" />
                        <Text className="text-white font-semibold text-sm ml-2">Camara</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 border border-blue-700 py-3.5 rounded-xl flex-row items-center justify-center"
                        onPress={() => pickImage('gallery')}
                      >
                        <Images size={20} color="#1e40af" />
                        <Text className="text-blue-700 font-semibold text-sm ml-2">Galeria</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View className="flex-row items-start mt-3 bg-amber-50 rounded-lg px-3 py-2.5">
                  <Warning size={16} color="#d97706" weight="fill" style={{ marginTop: 1 }} />
                  <Text className="text-xs text-amber-700 ml-2 flex-1">
                    La factura sera procesada para extraer fecha, monto y nombre de la gasolinera.
                    Tu ubicacion se usa para verificar que estas en el lugar.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Step 2: Rating */}
          <View className={`bg-white rounded-xl shadow-sm mb-4 overflow-hidden ${!step1Done ? 'opacity-40' : ''}`}>
            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={() => step1Done && setExpandedStep(activeStep === 2 ? null : 2)}
              activeOpacity={step1Done ? 0.7 : 1}
            >
              <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${step2Done ? 'bg-green-500' : step1Done ? 'bg-blue-700' : 'bg-gray-300'}`}>
                {step2Done ? (
                  <Check size={14} color="#fff" weight="bold" />
                ) : (
                  <Text className="text-white text-xs font-bold">2</Text>
                )}
              </View>
              <Text className="text-sm font-semibold text-gray-700 flex-1">
                Calificacion general
              </Text>
              {step2Done && activeStep !== 2 && (
                <Text className="text-xs text-green-600 font-medium mr-2">
                  {stars} estrella{stars > 1 ? 's' : ''}
                </Text>
              )}
              {step1Done && (
                <CaretDown
                  size={16}
                  color="#9ca3af"
                  style={{ transform: [{ rotate: activeStep === 2 ? '180deg' : '0deg' }] }}
                />
              )}
            </TouchableOpacity>

            {activeStep === 2 && step1Done && (
              <View className="px-4 pb-4">
                <Controller
                  control={control}
                  name="stars"
                  render={({ field: { onChange } }) => (
                    <RatingStars
                      rating={stars}
                      readonly={false}
                      size={40}
                      onRate={(v) => {
                        onChange(v)
                        setValue('stars', v)
                        setTimeout(() => setExpandedStep(null), 300)
                      }}
                    />
                  )}
                />
                {errors.stars && (
                  <Text className="text-red-500 text-xs mt-1">
                    Selecciona una calificacion
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Step 3: Fuel Type */}
          <View className={`bg-white rounded-xl shadow-sm mb-4 overflow-hidden ${!step1Done ? 'opacity-40' : ''}`}>
            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={() => step1Done && setExpandedStep(activeStep === 3 ? null : 3)}
              activeOpacity={step1Done ? 0.7 : 1}
            >
              <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${step3Done && step2Done ? 'bg-green-500' : step1Done ? 'bg-blue-700' : 'bg-gray-300'}`}>
                {step3Done && step2Done ? (
                  <Check size={14} color="#fff" weight="bold" />
                ) : (
                  <Text className="text-white text-xs font-bold">3</Text>
                )}
              </View>
              <Text className="text-sm font-semibold text-gray-700 flex-1">
                Tipo de combustible
              </Text>
              {step3Done && activeStep !== 3 && (
                <Text className="text-xs text-green-600 font-medium mr-2">
                  {fuelLabel}
                </Text>
              )}
              {step1Done && (
                <CaretDown
                  size={16}
                  color="#9ca3af"
                  style={{ transform: [{ rotate: activeStep === 3 ? '180deg' : '0deg' }] }}
                />
              )}
            </TouchableOpacity>

            {activeStep === 3 && step1Done && (
              <View className="px-4 pb-4">
                <View className="flex-row flex-wrap gap-2">
                  {FUEL_TYPES.map((ft) => (
                    <TouchableOpacity
                      key={ft.key}
                      className={`px-4 py-2 rounded-full border ${
                        fuelType === ft.key
                          ? 'bg-blue-700 border-blue-700'
                          : 'border-gray-200 bg-white'
                      }`}
                      onPress={() => {
                        setValue('fuelType', ft.key)
                        setTimeout(() => setExpandedStep(null), 300)
                      }}
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
            )}
          </View>

          {/* Step 4: Comment */}
          <View className={`bg-white rounded-xl shadow-sm mb-4 overflow-hidden ${!step1Done ? 'opacity-40' : ''}`}>
            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={() => {
                if (!step1Done) return
                setExpandedStep(activeStep === 4 ? null : 4)
                if (activeStep !== 4) {
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)
                }
              }}
              activeOpacity={step1Done ? 0.7 : 1}
            >
              <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${step1Done ? 'bg-blue-700' : 'bg-gray-300'}`}>
                <Text className="text-white text-xs font-bold">4</Text>
              </View>
              <Text className="text-sm font-semibold text-gray-700 flex-1">
                Comentario
              </Text>
              <Text className="text-xs text-gray-400 mr-2">(opcional)</Text>
              {step1Done && (
                <CaretDown
                  size={16}
                  color="#9ca3af"
                  style={{ transform: [{ rotate: activeStep === 4 ? '180deg' : '0deg' }] }}
                />
              )}
            </TouchableOpacity>

            {activeStep === 4 && step1Done && (
              <View className="px-4 pb-4">
                <Controller
                  control={control}
                  name="comment"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="text-base text-gray-800 min-h-24 border border-gray-200 rounded-xl p-3"
                      multiline
                      textAlignVertical="top"
                      placeholder="Comparte tu experiencia con el combustible..."
                      placeholderTextColor="#9ca3af"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      onFocus={() => {
                        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)
                      }}
                      maxLength={500}
                    />
                  )}
                />
                {errors.comment && (
                  <Text className="text-red-500 text-xs mt-1">{errors.comment.message}</Text>
                )}
              </View>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            className={`py-4 rounded-xl items-center ${canSubmit ? 'bg-blue-700' : 'bg-gray-300'}`}
            onPress={handleSubmit(onSubmit)}
            disabled={isPending || !canSubmit}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className={`font-bold text-base ${canSubmit ? 'text-white' : 'text-gray-500'}`}>
                {!uploadId
                  ? 'Sube tu factura para continuar'
                  : 'Enviar Calificacion'}
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-gray-400 text-center mt-3 px-4">
            Tu factura sera procesada por OCR para verificar la compra.
            No almacenamos datos personales.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
