import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

interface TabConfig {
  name: string
  title: string
  icon: IoniconName
  iconFocused: IoniconName
}

const tabs: TabConfig[] = [
  { name: 'index', title: 'Mapa', icon: 'map-outline', iconFocused: 'map' },
  { name: 'list', title: 'Lista', icon: 'list-outline', iconFocused: 'list' },
  {
    name: 'my-reviews',
    title: 'Mis Calificaciones',
    icon: 'star-outline',
    iconFocused: 'star',
  },
]

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1e40af',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb' },
        headerStyle: { backgroundColor: '#1e40af' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            headerShown: tab.name !== 'index',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
      {/* Hide search tab from navbar but keep the route */}
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  )
}
