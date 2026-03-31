import { Tabs } from 'expo-router'

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
        options={{ title: 'Pretext', tabBarLabel: 'Pretext' }}
      />
      <Tabs.Screen
        name="test"
        options={{ title: 'Test route', tabBarLabel: 'Test' }}
      />
      <Tabs.Screen
        name="selection"
        options={{ title: 'Selection', tabBarLabel: 'Selection' }}
      />
    </Tabs>
  )
}
