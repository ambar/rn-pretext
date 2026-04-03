import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#f0f0f0',
          borderTopColor: '#e0e0e0',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pretext',
          tabBarLabel: 'Pretext',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="test"
        options={{
          title: 'Test',
          tabBarLabel: 'Test',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="code-slash-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="selection"
        options={{
          title: 'Selection',
          tabBarLabel: 'Selection',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
