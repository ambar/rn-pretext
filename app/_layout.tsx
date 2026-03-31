import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Pretext' }} />
        <Stack.Screen name="test" options={{ title: 'Test' }} />
        <Stack.Screen name="selection" options={{ title: 'Selection' }} />
        <Stack.Screen name="tabs" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  )
}
