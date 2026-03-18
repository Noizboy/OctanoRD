export const FUEL_BRANDS = [
  'Shell',
  'Texaco',
  'Total',
  'Isla',
  'Esso',
  'Propagas',
  'Sigma',
  'Petronan',
  'Credigas',
  'Nativa',
  'Sin Marca',
] as const

export type FuelBrand = (typeof FUEL_BRANDS)[number]

export const FUEL_TYPES = [
  { key: 'regular', label: 'Gasolina Regular' },
  { key: 'premium', label: 'Gasolina Premium' },
  { key: 'gasoil_optimo', label: 'Gasoil Optimo' },
  { key: 'gasoil_regular', label: 'Gasoil Regular' },
] as const

export type FuelTypeKey = (typeof FUEL_TYPES)[number]['key']

export const DR_PROVINCES = [
  'Azua',
  'Bahoruco',
  'Barahona',
  'Dajabon',
  'Distrito Nacional',
  'Duarte',
  'El Seibo',
  'Elias Pina',
  'Espaillat',
  'Hato Mayor',
  'Hermanas Mirabal',
  'Independencia',
  'La Altagracia',
  'La Romana',
  'La Vega',
  'Maria Trinidad Sanchez',
  'Monsenor Nouel',
  'Monte Cristi',
  'Monte Plata',
  'Pedernales',
  'Peravia',
  'Puerto Plata',
  'Samana',
  'San Cristobal',
  'San Jose de Ocoa',
  'San Juan',
  'San Pedro de Macoris',
  'Sanchez Ramirez',
  'Santiago',
  'Santiago Rodriguez',
  'Santo Domingo',
  'Valverde',
] as const

export type DRProvince = (typeof DR_PROVINCES)[number]

export const FRAUD_LIMITS = {
  maxReviewsPerDevicePerStation: 1,
  maxReviewsPerPhonePerStation: 1,
  reviewCooldownDays: 30,
  spamFlagThreshold: 5,
} as const

export const RATING_COLORS = {
  good: '#22c55e',
  medium: '#eab308',
  bad: '#ef4444',
  none: '#6b7280',
} as const

export const RATING_THRESHOLDS = {
  good: 4.0,
  medium: 2.5,
} as const

export function getRatingColor(rating: number | null | undefined): string {
  if (rating == null || rating === 0) return RATING_COLORS.none
  if (rating >= RATING_THRESHOLDS.good) return RATING_COLORS.good
  if (rating >= RATING_THRESHOLDS.medium) return RATING_COLORS.medium
  return RATING_COLORS.bad
}
