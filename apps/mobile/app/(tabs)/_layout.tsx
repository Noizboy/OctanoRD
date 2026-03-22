import { Tabs } from 'expo-router'
import { View, Text, Platform } from 'react-native'
import { GasPump, List, Star, MagnifyingGlass } from 'phosphor-react-native'

const NAVY = '#0a2342'
const ORANGE = '#f97316'
const INACTIVE = '#64748b'

interface TabIconProps {
  icon: React.ReactNode
  label: string
  focused: boolean
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 4,
          borderRadius: 20,
          backgroundColor: focused ? `${ORANGE}22` : 'transparent',
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? '700' : '500',
          color: focused ? ORANGE : INACTIVE,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: ORANGE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: NAVY,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          elevation: 20,
          shadowColor: NAVY,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
        },
        headerStyle: { backgroundColor: NAVY },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 17, letterSpacing: 0.3 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'OctanoRD',
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              icon={<GasPump size={size} color={color} weight={focused ? 'fill' : 'regular'} />}
              label="Mapa"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'Gasolineras',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              icon={<List size={size} color={color} weight={focused ? 'fill' : 'regular'} />}
              label="Lista"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              icon={<MagnifyingGlass size={size} color={color} weight={focused ? 'bold' : 'regular'} />}
              label="Buscar"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-reviews"
        options={{
          title: 'Mis Calificaciones',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              icon={<Star size={size} color={color} weight={focused ? 'fill' : 'regular'} />}
              label="Mis Cal."
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  )
}
