import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native'
import { X, Star } from 'phosphor-react-native'
import { useMapStore } from '@/lib/stores/mapStore'
import { FUEL_BRANDS } from '@/lib/constants'

const BG     = '#09090b'
const CARD   = '#18181b'
const CARD2  = '#27272a'
const BORDER = '#3f3f46'
const TEXT   = '#fafafa'
const MUTED  = '#a1a1aa'
const DIM    = '#71717a'
const ORANGE = '#f97316'

interface Props {
  visible: boolean
  onClose: () => void
  stationCount: number
}

const RATING_OPTIONS = [
  { label: 'Todas', value: 0 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '5 ★', value: 5 },
]

export default function MapFilters({ visible, onClose, stationCount }: Props) {
  const { filters, setFilters, resetFilters } = useMapStore()

  const toggleBrand = (brand: string) => {
    const current = filters.brands
    setFilters({
      brands: current.includes(brand)
        ? current.filter((b) => b !== brand)
        : [...current, brand],
    })
  }

  const hasFilters = filters.brands.length > 0 || filters.minRating > 0

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: BG }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: TEXT, letterSpacing: -0.3 }}>Filtros</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {hasFilters && (
              <TouchableOpacity onPress={resetFilters}>
                <Text style={{ color: ORANGE, fontSize: 14, fontWeight: '600' }}>Limpiar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: CARD2, alignItems: 'center', justifyContent: 'center' }}
              onPress={onClose}
            >
              <X size={16} color={MUTED} weight="bold" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {/* Rating */}
          <Text style={{ fontSize: 12, fontWeight: '700', color: DIM, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
            Calificación mínima
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {RATING_OPTIONS.map((opt) => {
              const active = filters.minRating === opt.value
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: active ? ORANGE : CARD2,
                    borderWidth: 1,
                    borderColor: active ? ORANGE : BORDER,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  onPress={() => setFilters({ minRating: opt.value })}
                >
                  {opt.value > 0 && !opt.label.includes('★') && (
                    <Star size={12} color={active ? '#fff' : DIM} weight="fill" />
                  )}
                  <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : MUTED }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Brand */}
          <Text style={{ fontSize: 12, fontWeight: '700', color: DIM, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
            Marca
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {FUEL_BRANDS.map((brand) => {
              const active = filters.brands.includes(brand)
              return (
                <TouchableOpacity
                  key={brand}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: active ? ORANGE : CARD2,
                    borderWidth: 1,
                    borderColor: active ? ORANGE : BORDER,
                  }}
                  onPress={() => toggleBrand(brand)}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : MUTED }}>
                    {brand}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>

        {/* Apply */}
        <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: BORDER }}>
          <TouchableOpacity
            style={{ height: 52, backgroundColor: ORANGE, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
              Mostrar {stationCount} gasolineras
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}
