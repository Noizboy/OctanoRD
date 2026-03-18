import type { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'OctanoRD',
  slug: 'octanord',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'octanord',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1e40af',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.octanord.app',
    buildNumber: '1',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'OctanoRD necesita tu ubicacion para mostrarte gasolineras cercanas.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'OctanoRD necesita tu ubicacion para mostrarte gasolineras cercanas.',
      NSCameraUsageDescription:
        'OctanoRD necesita la camara para fotografiar tu factura de combustible.',
      NSPhotoLibraryUsageDescription:
        'OctanoRD necesita acceso a tu galeria para seleccionar una factura.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1e40af',
    },
    package: 'com.octanord.app',
    versionCode: 1,
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
    ],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'react-native-maps',
      {
        androidApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
        iosApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'OctanoRD necesita tu ubicacion para mostrarte gasolineras cercanas.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'OctanoRD necesita la camara para fotografiar tu factura.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'OctanoRD necesita acceso a tu galeria para seleccionar una factura.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
    wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3000',
  },
})
