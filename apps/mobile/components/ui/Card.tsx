import { View, type ViewProps } from 'react-native'

interface Props extends ViewProps {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className = '', style, ...props }: Props) {
  return (
    <View
      className={`bg-white rounded-xl shadow-sm p-4 ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  )
}
