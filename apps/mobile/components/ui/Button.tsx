import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native'

type Variant = 'primary' | 'secondary' | 'ghost'

interface Props extends TouchableOpacityProps {
  variant?: Variant
  label: string
  isLoading?: boolean
}

const STYLES: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-blue-700 py-4 rounded-xl items-center',
    text: 'text-white font-bold text-base',
  },
  secondary: {
    container: 'border border-blue-700 py-4 rounded-xl items-center bg-white',
    text: 'text-blue-700 font-bold text-base',
  },
  ghost: {
    container: 'py-4 rounded-xl items-center',
    text: 'text-gray-600 font-medium text-base',
  },
}

export default function Button({
  variant = 'primary',
  label,
  isLoading = false,
  disabled,
  ...props
}: Props) {
  const styles = STYLES[variant]
  const isDisabled = disabled || isLoading

  return (
    <TouchableOpacity
      className={`${styles.container} ${isDisabled ? 'opacity-50' : ''}`}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#1e40af'} />
      ) : (
        <Text className={styles.text}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}
