import { useRef, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { Alert } from 'react-native'
import { uploadApi } from '@/lib/api'

interface UploadResponse {
  path: string
  uploadId: string
}

interface ReceiptLocation {
  latitude: number
  longitude: number
}

interface UseUploadReceiptReturn {
  receiptUri: string | null
  uploadId: string | null
  location: ReceiptLocation | null
  uploading: boolean
  pickImage: (source: 'camera' | 'gallery') => Promise<void>
  retryUpload: () => Promise<void>
  removeReceipt: () => void
}

async function uploadFile(
  uri: string,
  location: ReceiptLocation | null,
): Promise<UploadResponse> {
  const formData = new FormData()
  const filename = uri.split('/').pop() ?? 'receipt.jpg'
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'

  formData.append('receipt', {
    uri,
    name: filename,
    type: mimeType,
  } as unknown as Blob)

  if (location) {
    formData.append('latitude', String(location.latitude))
    formData.append('longitude', String(location.longitude))
  }

  const response = await uploadApi.post<UploadResponse>(
    '/storage/receipt/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (data: unknown) => data,
    },
  )
  return response.data
}

export function useUploadReceipt(): UseUploadReceiptReturn {
  const [receiptUri, setReceiptUri] = useState<string | null>(null)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [location, setLocation] = useState<ReceiptLocation | null>(null)
  const [uploading, setUploading] = useState(false)
  const locationRef = useRef<ReceiptLocation | null>(null)

  const doUpload = async (uri: string, loc: ReceiptLocation | null) => {
    setUploading(true)
    setUploadId(null)

    try {
      const data = await uploadFile(uri, loc)
      setUploadId(data.uploadId)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      Alert.alert('Error al subir imagen', msg, [
        { text: 'Reintentar', onPress: () => doUpload(uri, loc) },
        { text: 'Cancelar', style: 'cancel', onPress: () => {
          setReceiptUri(null)
          setLocation(null)
        }},
      ])
    } finally {
      setUploading(false)
    }
  }

  const pickImage = async (source: 'camera' | 'gallery') => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (perm.status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        `Necesitamos acceso a tu ${source === 'camera' ? 'camara' : 'galeria'}.`,
      )
      return
    }

    // Open picker immediately — don't block on location
    const picker =
      source === 'camera'
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync

    const result = await picker({
      quality: 0.7,
      allowsEditing: true,
      exif: false,
    })

    if (result.canceled || !result.assets[0]) return

    const uri = result.assets[0].uri
    setReceiptUri(uri)

    // Capture location in parallel with upload
    const locationPromise = Location.getForegroundPermissionsAsync()
      .then(({ status }) =>
        status === 'granted'
          ? Location.getLastKnownPositionAsync()
          : null,
      )
      .then((pos) =>
        pos ? { latitude: pos.coords.latitude, longitude: pos.coords.longitude } : null,
      )
      .catch(() => null)

    const loc = await locationPromise
    locationRef.current = loc
    if (loc) setLocation(loc)

    await doUpload(uri, loc)
  }

  const retryUpload = async () => {
    if (!receiptUri) return
    await doUpload(receiptUri, locationRef.current)
  }

  const removeReceipt = () => {
    setReceiptUri(null)
    setUploadId(null)
    setLocation(null)
    locationRef.current = null
  }

  return { receiptUri, uploadId, location, uploading, pickImage, retryUpload, removeReceipt }
}
