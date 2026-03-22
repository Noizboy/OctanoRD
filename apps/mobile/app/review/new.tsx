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
  GasPump,
  PaperPlaneTilt,
} from 'phosphor-react-native'
import { useSubmitReview } from '@/lib/queries/useSubmitReview'
import { useUploadReceipt } from '@/lib/queries/useUploadReceipt'
import { getDeviceFingerprint } from '@/lib/utils/fingerprint'
import { FUEL_TYPES } from '@/lib/constants'
import RatingStars from '@/components/review/RatingStars'

const BG     = '#09090b'
const CARD   = '#18181b'
const CARD2  = '#27272a'
const BORDER = '#3f3f46'
const TEXT   = '#fafafa'
const MUTED  = '#a1a1aa'
const DIM    = '#71717a'
const ORANGE = '#f97316'
const GREEN  = '#10b981'

const schema = z.object({
  stars: z.number().int().min(1, 'Selecciona una calificacion').max(5),
  fuelType: z.enum(['regular', 'premium', 'gasoil_optimo', 'gasoil_regular'], {
    required_error: 'Selecciona un tipo de combustible',
  }),
  comment: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

const STAR_LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente']
const STAR_COLORS = ['', '#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981']

export default function NewReviewScreen() {
  const { stationId } = useLocalSearchParams<{ stationId: string }>()
  const router = useRouter()
  const { mutateAsync, isPending } = useSubmitReview()
  const { receiptUri, uploadId, location, uploading, pickImage, removeReceipt } = useUploadReceipt()

  const scrollRef = useRef<ScrollView>(null)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { stars: 0, fuelType: undefined },
  })

  const stars = watch('stars')
  const fuelType = watch('fuelType')

  const step1Done = !!uploadId && !uploading
  const step2Done = stars > 0
  const step3Done = !!fuelType
  const autoStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : 4
  const activeStep = expandedStep ?? autoStep
  const canSubmit = step1Done && !uploading
  const fuelLabel = FUEL_TYPES.find((ft) => ft.key === fuelType)?.label ?? fuelType

  const onSubmit = async (values: FormValues) => {
    if (!uploadId) {
      Alert.alert('Factura requerida', 'Debes adjuntar una foto de tu factura para enviar tu calificacion.')
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
        receiptUploadId: uploadId,
        deviceHash,
        turnstileToken: 'dev-bypass',
      })
      Alert.alert('¡Gracias!', 'Tu calificacion fue enviada y sera verificada con tu factura.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch {
      Alert.alert('Error', 'No se pudo enviar tu calificacion. Intenta de nuevo.')
    }
  }

  // Step indicator dot
  function StepDot({ n, done, active }: { n: number; done: boolean; active: boolean }) {
    const bg = done ? GREEN : active ? ORANGE : CARD2
    const border = done ? GREEN : active ? ORANGE : BORDER
    return (
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: bg, borderWidth: 1.5, borderColor: border, alignItems: 'center', justifyContent: 'center' }}>
        {done ? (
          <Check size={13} color="#fff" weight="bold" />
        ) : (
          <Text style={{ fontSize: 12, fontWeight: '800', color: active ? '#fff' : DIM }}>{n}</Text>
        )}
      </View>
    )
  }

  function StepCard({ n, title, badge, done, children }: { n: number; title: string; badge?: string; done: boolean; children: React.ReactNode }) {
    const isActive = activeStep === n
    const enabled = n === 1 || step1Done
    return (
      <View style={{ backgroundColor: CARD, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: isActive ? ORANGE + '60' : BORDER, overflow: 'hidden' }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}
          onPress={() => enabled && setExpandedStep(isActive ? null : n)}
          activeOpacity={enabled ? 0.7 : 1}
        >
          <StepDot n={n} done={done} active={isActive && !done} />
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: enabled ? TEXT : DIM }}>
            {title}
          </Text>
          {badge && !isActive && (
            <Text style={{ fontSize: 12, color: GREEN, fontWeight: '600', marginRight: 4 }}>{badge}</Text>
          )}
          {enabled && (
            <CaretDown size={15} color={DIM} style={{ transform: [{ rotate: isActive ? '180deg' : '0deg' }] }} />
          )}
        </TouchableOpacity>
        {isActive && enabled && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {children}
          </View>
        )}
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: `${ORANGE}20`, alignItems: 'center', justifyContent: 'center' }}>
            <GasPump size={20} color={ORANGE} weight="fill" />
          </View>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT, letterSpacing: -0.3 }}>
              Nueva calificación
            </Text>
            <Text style={{ fontSize: 12, color: DIM, marginTop: 1 }}>
              Completa los 4 pasos para enviar
            </Text>
          </View>
        </View>

        {/* Step 1 — Receipt */}
        <StepCard n={1} title="Foto de la factura" badge={step1Done ? 'Subida ✓' : undefined} done={step1Done}>
          <Text style={{ fontSize: 12, color: DIM, marginBottom: 12 }}>
            Se verificará el nombre de la gasolinera y tu ubicación
          </Text>

          {receiptUri ? (
            <View style={{ borderRadius: 14, overflow: 'hidden' }}>
              <Image source={{ uri: receiptUri }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
              {uploading && (
                <View style={{ position: 'absolute', inset: 0, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color="#fff" size="large" />
                  <Text style={{ color: '#fff', marginTop: 8, fontWeight: '600' }}>Subiendo factura...</Text>
                </View>
              )}
              {uploadId && !uploading && (
                <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: GREEN, borderRadius: 20, padding: 6 }}>
                  <Check size={16} color="#fff" weight="bold" />
                </View>
              )}
              {!uploading && (
                <TouchableOpacity
                  style={{ position: 'absolute', top: 10, left: 10, backgroundColor: '#000000aa', borderRadius: 20, padding: 6 }}
                  onPress={removeReceipt}
                >
                  <X size={15} color="#fff" weight="bold" />
                </TouchableOpacity>
              )}
              {location && !uploading && (
                <View style={{ position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#000000aa', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <MapPin size={11} color={GREEN} weight="fill" />
                  <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>Ubicación capturada</Text>
                </View>
              )}
            </View>
          ) : (
            <View>
              <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: BORDER, borderRadius: 14, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: CARD2 }}>
                <Receipt size={36} color={DIM} />
                <Text style={{ fontSize: 13, color: MUTED, marginTop: 8, fontWeight: '500' }}>
                  Toma o selecciona tu factura
                </Text>
                <Text style={{ fontSize: 11, color: DIM, marginTop: 3 }}>
                  Se leerán automáticamente los datos
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, height: 46, backgroundColor: ORANGE, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  activeOpacity={0.8}
                  onPress={() => pickImage('camera')}
                >
                  <Camera size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Cámara</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, height: 46, backgroundColor: CARD2, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: BORDER }}
                  activeOpacity={0.8}
                  onPress={() => pickImage('gallery')}
                >
                  <Images size={18} color={MUTED} />
                  <Text style={{ color: MUTED, fontWeight: '700', fontSize: 14 }}>Galería</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, backgroundColor: '#f59e0b10', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f59e0b25' }}>
            <Warning size={15} color="#f59e0b" weight="fill" style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 11, color: '#f59e0b', flex: 1, lineHeight: 16 }}>
              La factura será procesada para extraer fecha, monto y nombre de la gasolinera. Tu ubicación se usa solo para verificar.
            </Text>
          </View>
        </StepCard>

        {/* Step 2 — Stars */}
        <StepCard
          n={2}
          title="Calificación general"
          badge={step2Done ? `${stars} ${stars === 1 ? 'estrella' : 'estrellas'}` : undefined}
          done={step2Done}
        >
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Controller
              control={control}
              name="stars"
              render={({ field: { onChange } }) => (
                <RatingStars
                  rating={stars}
                  readonly={false}
                  size={44}
                  onRate={(v) => {
                    onChange(v)
                    setValue('stars', v)
                    setTimeout(() => setExpandedStep(null), 350)
                  }}
                />
              )}
            />
            {stars > 0 && (
              <Text style={{ marginTop: 10, fontSize: 14, fontWeight: '700', color: STAR_COLORS[stars] }}>
                {STAR_LABELS[stars]}
              </Text>
            )}
            {errors.stars && (
              <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>Selecciona una calificacion</Text>
            )}
          </View>
        </StepCard>

        {/* Step 3 — Fuel type */}
        <StepCard
          n={3}
          title="Tipo de combustible"
          badge={step3Done ? fuelLabel : undefined}
          done={step3Done}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {FUEL_TYPES.map((ft) => {
              const active = fuelType === ft.key
              return (
                <TouchableOpacity
                  key={ft.key}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: active ? ORANGE : CARD2,
                    borderWidth: 1,
                    borderColor: active ? ORANGE : BORDER,
                  }}
                  activeOpacity={0.8}
                  onPress={() => {
                    setValue('fuelType', ft.key)
                    setTimeout(() => setExpandedStep(null), 300)
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : MUTED }}>
                    {ft.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </StepCard>

        {/* Step 4 — Comment */}
        <StepCard n={4} title="Comentario" done={false}>
          <Text style={{ fontSize: 11, color: DIM, marginBottom: 10 }}>Opcional · máximo 500 caracteres</Text>
          <Controller
            control={control}
            name="comment"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={{
                  backgroundColor: CARD2,
                  borderWidth: 1,
                  borderColor: BORDER,
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 14,
                  color: TEXT,
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
                multiline
                placeholder="Comparte tu experiencia con el combustible..."
                placeholderTextColor={DIM}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
                maxLength={500}
              />
            )}
          />
        </StepCard>

        {/* Submit */}
        <TouchableOpacity
          style={{
            height: 54,
            borderRadius: 16,
            backgroundColor: canSubmit ? ORANGE : CARD2,
            borderWidth: canSubmit ? 0 : 1,
            borderColor: BORDER,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginTop: 6,
            opacity: isPending ? 0.7 : 1,
          }}
          activeOpacity={0.8}
          onPress={handleSubmit(onSubmit)}
          disabled={isPending || !canSubmit}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <PaperPlaneTilt size={20} color={canSubmit ? '#fff' : DIM} weight="bold" />
              <Text style={{ fontSize: 16, fontWeight: '800', color: canSubmit ? '#fff' : DIM }}>
                {!uploadId ? 'Sube tu factura para continuar' : 'Enviar calificación'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={{ fontSize: 11, color: DIM, textAlign: 'center', marginTop: 12, lineHeight: 16 }}>
          Tu factura será procesada por OCR para verificar la compra.{'\n'}No almacenamos datos personales.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
