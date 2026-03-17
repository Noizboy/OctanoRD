import * as SecureStore from 'expo-secure-store'
import { sha256 } from './hash'
import { Platform } from 'react-native'
import * as Application from 'expo-application'

const FINGERPRINT_KEY = 'device_fingerprint'

export async function getDeviceFingerprint(): Promise<string> {
  const stored = await SecureStore.getItemAsync(FINGERPRINT_KEY)
  if (stored) return stored

  const raw =
    Platform.OS === 'ios'
      ? ((await Application.getIosIdForVendorAsync()) ?? Math.random().toString())
      : (Application.androidId ?? Math.random().toString())

  const hash = await sha256(raw + 'octanord-device-salt')
  await SecureStore.setItemAsync(FINGERPRINT_KEY, hash)
  return hash
}
