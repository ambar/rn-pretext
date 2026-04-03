import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { prepareWithSegments } from 'rn-pretext'
import { Stack } from 'expo-router'

const FONT = '12px monospace'
const CHARSET = ' .:-=+*#%@'

// Simple "smoke" simulation using sine waves
function generateField(cols: number, rows: number, t: number): number[][] {
  const field: number[][] = []
  for (let r = 0; r < rows; r++) {
    const row: number[] = []
    for (let c = 0; c < cols; c++) {
      const x = c / cols
      const y = r / rows
      const v =
        Math.sin(x * 6 + t * 0.8) * 0.3 +
        Math.sin(y * 4 - t * 0.6) * 0.3 +
        Math.sin((x + y) * 5 + t * 1.2) * 0.2 +
        Math.sin(Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2) * 8 - t) * 0.2
      row.push((v + 1) / 2) // normalize to 0-1
    }
    field.push(row)
  }
  return field
}

export default function FluidSmokeDemo() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const [t, setT] = useState(0)

  // Measure char widths to determine grid size
  const charWidth = useMemo(() => {
    const prepared = prepareWithSegments('M', FONT)
    return (prepared as any).widths[0] as number
  }, [])

  const cols = Math.floor((windowWidth - 32) / charWidth)
  const rows = Math.floor((windowHeight - 160) / 14)

  useEffect(() => {
    const id = setInterval(() => setT((prev) => prev + 0.1), 50)
    return () => clearInterval(id)
  }, [])

  const field = useMemo(() => generateField(cols, rows, t), [cols, rows, t])

  const lines = useMemo(() => {
    return field.map((row) =>
      row.map((v) => CHARSET[Math.floor(v * (CHARSET.length - 1))]).join(''),
    )
  }, [field])

  return (
    <>
      <Stack.Screen options={{ title: 'Fluid Smoke' }} />
      <View style={styles.container}>
        <Text style={styles.desc}>
          Fluid simulation rendered as proportional typographic ASCII.
          Character brightness mapped from sine wave field. Grid sized by pretext char measurement.
        </Text>
        <View style={styles.grid}>
          {lines.map((line, i) => (
            <Text key={i} style={styles.asciiLine} numberOfLines={1}>
              {line}
            </Text>
          ))}
        </View>
        <Text style={styles.meta}>
          {cols}x{rows} grid, char width: {charWidth.toFixed(1)}px
        </Text>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
  desc: { fontSize: 12, color: '#666', marginBottom: 12, lineHeight: 16 },
  grid: { flex: 1 },
  asciiLine: { fontFamily: 'monospace', fontSize: 12, lineHeight: 14, color: '#0f0', letterSpacing: 0 },
  meta: { fontSize: 10, color: '#555', marginTop: 8 },
})
