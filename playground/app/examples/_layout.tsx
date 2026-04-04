import { Stack } from 'expo-router'

export default function ExamplesLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerBackTitle: 'Back',
      }}
    />
  )
}
