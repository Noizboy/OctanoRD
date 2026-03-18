import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useMutation } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import api from '@/lib/api'
import { useReviewDraftStore } from '@/lib/stores/reviewDraftStore'

interface UploadResponse {
  path: string
  uploadId: string
}

export default function UploadReceiptScreen() {
  const router = useRouter()
  const { setReceiptUploadId } = useReviewDraftStore()
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [uploadedId, setUploadedId] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: async (uri: string) => {
      const formData = new FormData()
      const filename = uri.split('/').pop() ?? 'receipt.jpg'
      const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'

      formData.append('receipt', {
        uri,
        name: filename,
        type: mimeType,
      } as unknown as Blob)

      const response = await api.post<UploadResponse>(
        '/storage/receipt/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return response.data
    },
    onSuccess: (data) => {
      setUploadedId(data.uploadId)
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo subir la imagen. Intenta de nuevo.')
    },
  })

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galeria.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    })

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri
      setImageUri(uri)
      uploadMutation.mutate(uri)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu camara.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
    })

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri
      setImageUri(uri)
      uploadMutation.mutate(uri)
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-base text-gray-600 mb-6">
          Fotografía tu factura de combustible para que tu calificación tenga el badge de
          "Verificado con factura".
        </Text>

        {/* Image Preview */}
        {imageUri ? (
          <View className="mb-4 rounded-2xl overflow-hidden shadow">
            <Image
              source={{ uri: imageUri }}
              className="w-full h-64"
              resizeMode="cover"
            />
            {uploadMutation.isPending && (
              <View className="absolute inset-0 bg-black/40 items-center justify-center">
                <ActivityIndicator color="#fff" size="large" />
                <Text className="text-white mt-2">Subiendo...</Text>
              </View>
            )}
            {uploadedId && !uploadMutation.isPending && (
              <View className="absolute top-3 right-3 bg-green-500 rounded-full p-1.5">
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>
        ) : (
          <View className="border-2 border-dashed border-gray-300 rounded-2xl h-48 items-center justify-center mb-4 bg-white">
            <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-400 mt-2">Vista previa de la factura</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            className="flex-1 bg-white border border-gray-200 py-4 rounded-xl items-center shadow-sm"
            onPress={takePhoto}
            disabled={uploadMutation.isPending}
          >
            <Ionicons name="camera" size={24} color="#1e40af" />
            <Text className="text-blue-700 font-medium mt-1 text-sm">Tomar foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-white border border-gray-200 py-4 rounded-xl items-center shadow-sm"
            onPress={pickFromGallery}
            disabled={uploadMutation.isPending}
          >
            <Ionicons name="images" size={24} color="#1e40af" />
            <Text className="text-blue-700 font-medium mt-1 text-sm">Galeria</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View className="bg-blue-50 rounded-xl p-4 mb-6">
          <Text className="text-sm font-semibold text-blue-800 mb-2">Consejos</Text>
          {[
            'Asegúrate de que el texto sea legible',
            'Incluye fecha, monto y tipo de combustible',
            'La foto debe ser de tu factura más reciente',
          ].map((tip) => (
            <View key={tip} className="flex-row items-start mb-1">
              <Text className="text-blue-600 mr-1">•</Text>
              <Text className="text-sm text-blue-700 flex-1">{tip}</Text>
            </View>
          ))}
        </View>

        {/* Confirm */}
        <TouchableOpacity
          className={`py-4 rounded-xl items-center ${
            uploadedId ? 'bg-blue-700' : 'bg-gray-200'
          }`}
          onPress={() => {
            if (uploadedId) {
              setReceiptUploadId(uploadedId)
              router.back()
            }
          }}
          disabled={!uploadedId}
        >
          <Text
            className={`font-bold text-base ${
              uploadedId ? 'text-white' : 'text-gray-400'
            }`}
          >
            {uploadedId ? 'Confirmar factura' : 'Sube una imagen primero'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
