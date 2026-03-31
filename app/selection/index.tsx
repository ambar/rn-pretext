import { StyleSheet, Text, View } from 'react-native'

export default function SelectionDemo() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Web-only demo</Text>
      <Text style={styles.body}>
        Cross-paragraph selection uses DOM APIs. Open this screen in the web build (
        <Text style={styles.mono}>npx expo start --web</Text>).
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#0066cc',
  },
})
