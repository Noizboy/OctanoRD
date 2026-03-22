import { Tabs } from 'expo-router'
import { View, Text, Platform } from 'react-native'
import { GasPump, List, Star, MagnifyingGlass } from 'phosphor-react-native'

const BG     = '#09090b'
const CARD   = '#18181b'
const ORANGE = '#f97316'
const MUTED  = '#52525b'

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
          paddingHorizontal: 16,
          paddingVertical: 5,
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
          color: focused ? ORANGE : MUTED,
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
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: {
          backgroundColor: CARD,
          borderTopWidth: 1,
          borderTopColor: '#27272a',
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: { backgroundColor: BG },
        headerTintColor: '#fafafa',
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
