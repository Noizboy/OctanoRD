import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  phoneHash: string | null
  isVerified: boolean
  isLoading: boolean
}

interface AuthActions {
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>
  clearTokens: () => Promise<void>
  setPhoneHash: (hash: string) => void
  initialize: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  refreshToken: null,
  phoneHash: null,
  isVerified: false,
  isLoading: true,

  setTokens: async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('refreshToken', refreshToken)
    set({ accessToken, refreshToken, isVerified: true })
  },

  clearTokens: async () => {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
    set({ accessToken: null, refreshToken: null, phoneHash: null, isVerified: false })
  },

  setPhoneHash: (phoneHash) => {
    set({ phoneHash })
  },

  initialize: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken')
      const refreshToken = await SecureStore.getItemAsync('refreshToken')
      set({
        accessToken,
        refreshToken,
        isVerified: !!accessToken,
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },
}))
