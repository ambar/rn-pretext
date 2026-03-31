import { StyleSheet, Text, View } from 'react-native'

export default function TestTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test route</Text>
      <Text style={styles.body}>
        Minimal screen used to try stack and tab navigation. Open this tab from the bar
        below.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
})
