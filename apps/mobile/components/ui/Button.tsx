import { TouchableOpacity, Text, ActivityIndicator, View, type TouchableOpacityProps } from 'react-native'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends TouchableOpacityProps {
  variant?: Variant
  size?: Size
  label: string
  isLoading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

const VARIANTS: Record<Variant, { bg: string; border: string; text: string; loaderColor: string }> = {
  primary:   { bg: '#f97316', border: 'transparent', text: '#fff',     loaderColor: '#fff' },
  secondary: { bg: '#fff',    border: '#0a2342',     text: '#0a2342',  loaderColor: '#0a2342' },
  ghost:     { bg: 'transparent', border: 'transparent', text: '#64748b', loaderColor: '#64748b' },
  danger:    { bg: '#ef4444', border: 'transparent', text: '#fff',     loaderColor: '#fff' },
}

const SIZES: Record<Size, { height: number; px: number; fontSize: number; radius: number }> = {
  sm: { height: 36, px: 14, fontSize: 13, radius: 10 },
  md: { height: 48, px: 20, fontSize: 15, radius: 14 },
  lg: { height: 56, px: 24, fontSize: 16, radius: 16 },
}

export default function Button({
  variant = 'primary',
  size = 'md',
  label,
  isLoading = false,
  icon,
  fullWidth = true,
  disabled,
  ...props
}: Props) {
  const v = VARIANTS[variant]
  const s = SIZES[size]
  const isDisabled = disabled || isLoading

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={{
        height: s.height,
        paddingHorizontal: s.px,
        borderRadius: s.radius,
        backgroundColor: v.bg,
        borderWidth: v.border !== 'transparent' ? 1.5 : 0,
        borderColor: v.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        opacity: isDisabled ? 0.45 : 1,
        alignSelf: fullWidth ? 'stretch' : 'auto',
      }}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={v.loaderColor} size="small" />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text style={{ color: v.text, fontSize: s.fontSize, fontWeight: '700', letterSpacing: 0.2 }}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  )
}
