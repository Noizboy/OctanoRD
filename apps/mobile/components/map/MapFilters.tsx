import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useMapStore } from '@/lib/stores/mapStore'
import { FUEL_BRANDS } from '@/lib/constants'

interface Props {
  visible: boolean
  onClose: () => void
  stationCount: number
}

const RATING_OPTIONS = [
  { label: 'Todas', value: 0 },
  { label: '2.5+', value: 2.5 },
  { label: '3.5+', value: 3.5 },
  { label: '4.0+', value: 4.0 },
]

export default function MapFilters({ visible, onClose, stationCount }: Props) {
  const { filters, setFilters, resetFilters } = useMapStore()

  const toggleBrand = (brand: string) => {
    const current = filters.brands
    if (current.includes(brand)) {
      setFilters({ brands: current.filter((b) => b !== brand) })
    } else {
      setFilters({ brands: [...current, brand] })
    }
  }

  const hasFilters = filters.brands.length > 0 || filters.minRating > 0

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
          <Text className="text-lg font-bold text-gray-900">Filtros</Text>
          <View className="flex-row items-center gap-4">
            {hasFilters && (
              <TouchableOpacity onPress={resetFilters}>
                <Text className="text-blue-700 text-sm font-medium">Limpiar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-5">
          {/* Rating filter */}
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Calificacion minima
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {RATING_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`px-4 py-2 rounded-full border ${
                  filters.minRating === opt.value
                    ? 'bg-blue-700 border-blue-700'
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => setFilters({ minRating: opt.value })}
              >
                <Text
                  className={`text-sm font-medium ${
                    filters.minRating === opt.value ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Brand filter */}
          <Text className="text-sm font-semibold text-gray-700 mb-3">Marca</Text>
          <View className="flex-row flex-wrap gap-2">
            {FUEL_BRANDS.map((brand) => (
              <TouchableOpacity
                key={brand}
                className={`px-4 py-2 rounded-full border ${
                  filters.brands.includes(brand)
                    ? 'bg-blue-700 border-blue-700'
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => toggleBrand(brand)}
              >
                <Text
                  className={`text-sm font-medium ${
                    filters.brands.includes(brand) ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {brand}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Apply */}
        <View className="p-5 bg-white border-t border-gray-100">
          <TouchableOpacity
            className="bg-blue-700 py-4 rounded-xl items-center"
            onPress={onClose}
          >
            <Text className="text-white font-bold text-base">
              Mostrar {stationCount} gasolineras
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}
