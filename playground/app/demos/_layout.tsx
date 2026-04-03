import { Stack } from 'expo-router'

export default function DemosLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerBackTitle: 'Back',
      }}
    />
  )
}
