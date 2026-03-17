import { useState } from 'react'
import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'

interface UploadResponse {
  path: string
  uploadId: string
}

interface Props {
  onUploaded: (path: string) => void
}

export default function ReceiptUploader({ onUploaded }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: async (uri: string) => {
      const formData = new FormData()
      const filename = uri.split('/').pop() ?? 'receipt.jpg'
      const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg'
      formData.append('receipt', { uri, name: filename, type: mimeType } as unknown as Blob)
      const res = await api.post<UploadResponse>(
        '/storage/receipt/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return res.data
    },
    onSuccess: (data) => {
      onUploaded(data.path)
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo subir la imagen')
    },
  })

  const pick = async (source: 'camera' | 'gallery') => {
    const picker =
      source === 'camera'
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync

    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (perm.status !== 'granted') {
      Alert.alert('Permiso requerido', 'Activa el permiso en Configuracion.')
      return
    }

    const result = await picker({ quality: 0.85, allowsEditing: true })
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri
      setImageUri(uri)
      uploadMutation.mutate(uri)
    }
  }

  return (
    <View>
      {imageUri ? (
        <View className="relative rounded-xl overflow-hidden">
          <Image source={{ uri: imageUri }} className="w-full h-48" resizeMode="cover" />
          {uploadMutation.isPending && (
            <View className="absolute inset-0 bg-black/40 items-center justify-center">
              <ActivityIndicator color="#fff" />
            </View>
          )}
          {!uploadMutation.isPending && (
            <TouchableOpacity
              className="absolute top-2 right-2 bg-white rounded-full p-1"
              onPress={() => setImageUri(null)}
            >
              <Ionicons name="close" size={18} color="#374151" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 border-2 border-dashed border-gray-200 rounded-xl py-5 items-center bg-white"
            onPress={() => pick('camera')}
          >
            <Ionicons name="camera-outline" size={28} color="#6b7280" />
            <Text className="text-sm text-gray-500 mt-1">Camara</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 border-2 border-dashed border-gray-200 rounded-xl py-5 items-center bg-white"
            onPress={() => pick('gallery')}
          >
            <Ionicons name="images-outline" size={28} color="#6b7280" />
            <Text className="text-sm text-gray-500 mt-1">Galeria</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
