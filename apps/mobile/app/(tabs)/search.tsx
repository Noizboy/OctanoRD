import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import api from '@/lib/api'
import { DR_PROVINCES, getRatingColor } from '@/lib/constants'
import type { GasStation } from '@/lib/queries/types'

export default function SearchScreen() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [showProvinces, setShowProvinces] = useState(false)

  const { data: results = [], isLoading } = useQuery<GasStation[]>({
    queryKey: ['stations', 'search', query, selectedProvince],
    queryFn: async () => {
      if (!query && !selectedProvince) return []
      const response = await api.get<GasStation[]>('/stations/search', {
        params: {
          q: query || undefined,
          province: selectedProvince || undefined,
          limit: 30,
        },
      })
      return response.data
    },
    enabled: query.length >= 2 || !!selectedProvince,
  })

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-4 pb-3 shadow-sm">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-900"
            placeholder="Buscar gasolinera..."
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          className="flex-row items-center mt-3"
          onPress={() => setShowProvinces(!showProvinces)}
        >
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1">
            {selectedProvince ?? 'Filtrar por provincia'}
          </Text>
          <Ionicons
            name={showProvinces ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#6b7280"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        {showProvinces && (
          <View className="mt-2 max-h-40">
            <FlatList
              data={['Todas', ...DR_PROVINCES]}
              keyExtractor={(item) => item}
              horizontal={false}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`m-1 px-3 py-1.5 rounded-full border ${
                    (item === 'Todas' ? null : item) === selectedProvince
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => {
                    setSelectedProvince(item === 'Todas' ? null : item)
                    setShowProvinces(false)
                  }}
                >
                  <Text
                    className={`text-xs ${
                      (item === 'Todas' ? null : item) === selectedProvince
                        ? 'text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const ratingColor = getRatingColor(parseFloat(item.avgRating))
            return (
              <TouchableOpacity
                className="bg-white mx-4 my-1.5 p-4 rounded-xl shadow-sm"
                onPress={() => router.push(`/station/${item.id}`)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-2">
                    <Text className="text-base font-medium text-gray-900">{item.name}</Text>
                    <Text className="text-sm text-gray-500">
                      {[item.brand, item.municipality, item.province]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <Text className="text-sm font-bold" style={{ color: ratingColor }}>
                    {item.reviewCount > 0 ? parseFloat(item.avgRating).toFixed(1) : '--'}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          }}
          ListEmptyComponent={
            query.length >= 2 || selectedProvince ? (
              <View className="items-center py-16">
                <Ionicons name="search-outline" size={48} color="#9ca3af" />
                <Text className="text-gray-400 mt-3">Sin resultados</Text>
              </View>
            ) : (
              <View className="items-center py-16">
                <Ionicons name="search-outline" size={48} color="#9ca3af" />
                <Text className="text-gray-400 mt-3">
                  Escribe al menos 2 caracteres para buscar
                </Text>
              </View>
            )
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
        />
      )}
    </View>
  )
}
