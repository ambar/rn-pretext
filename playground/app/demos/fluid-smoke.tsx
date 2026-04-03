import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Slider from '@react-native-community/slider'
import { Stack } from 'expo-router'

const FONT_SIZE = 9
const LINE_HEIGHT = 10
const CHARSET = ' .:-=+*#%@'

// Sine wave smoke field
function generateField(
  cols: number,
  rows: number,
  t: number,
  complexity: number,
  speed: number,
): number[][] {
  const field: number[][] = []
  for (let r = 0; r < rows; r++) {
    const row: number[] = []
    for (let c = 0; c < cols; c++) {
      const x = c / cols
      const y = r / rows
      const s = speed * t
      let v =
        Math.sin(x * 6 + s * 0.8) * 0.3 +
        Math.sin(y * 4 - s * 0.6) * 0.3 +
        Math.sin((x + y) * 5 + s * 1.2) * 0.2 +
        Math.sin(Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2) * 8 - s) * 0.2
      if (complexity > 1) {
        v += Math.sin(x * 12 - s * 1.5) * 0.15 +
             Math.sin(y * 10 + s * 0.9) * 0.15
      }
      if (complexity > 2) {
        v += Math.sin((x * 2 - y * 3) * 8 + s * 1.8) * 0.1 +
             Math.cos(x * 15 + y * 8 - s * 1.1) * 0.1
      }
      row.push((v + 1) / 2)
    }
    field.push(row)
  }
  return field
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onValueChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onValueChange: (v: number) => void
}) {
  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>
        {label}: {step < 1 ? value.toFixed(1) : value}
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#0f0"
        maximumTrackTintColor="#333"
        thumbTintColor="#0f0"
      />
    </View>
  )
}

export default function FluidSmokeDemo() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const [showControls, setShowControls] = useState(false)
  const [t, setT] = useState(0)
  const [complexity, setComplexity] = useState(2)
  const [speed, setSpeed] = useState(1.0)
  const [interval, setInterval_] = useState(50)

  const cols = Math.floor((windowWidth - 32) / (FONT_SIZE * 0.6))
  const rows = Math.floor((windowHeight - (showControls ? 320 : 160)) / LINE_HEIGHT)

  useEffect(() => {
    const id = setInterval(() => setT((prev) => prev + 0.1), interval)
    return () => clearInterval(id)
  }, [interval])

  const field = useMemo(() => generateField(cols, rows, t, complexity, speed), [cols, rows, t, complexity, speed])

  const lines = useMemo(() => {
    return field.map((row) =>
      row.map((v) => CHARSET[Math.floor(v * (CHARSET.length - 1))]).join(''),
    )
  }, [field])

  return (
    <>
      <Stack.Screen options={{ title: 'Fluid Smoke' }} />
      <View style={styles.container}>
        <Pressable onPress={() => setShowControls((v) => !v)}>
          <Text style={styles.desc}>
            Sine wave smoke field — character brightness mapped from layered waves.
            {cols}x{rows} grid.
          </Text>
        </Pressable>
        {showControls && (
          <View style={styles.controls}>
            <SliderRow label="Complexity" value={complexity} min={1} max={3} step={1} onValueChange={setComplexity} />
            <SliderRow label="Speed" value={speed} min={0.2} max={3} step={0.1} onValueChange={setSpeed} />
            <SliderRow label="Interval (ms)" value={interval} min={16} max={100} step={1} onValueChange={setInterval_} />
          </View>
        )}
        <View style={styles.grid}>
          {lines.map((line, i) => (
            <Text key={i} style={styles.asciiLine} numberOfLines={1}>
              {line}
            </Text>
          ))}
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 16 },
  desc: { fontSize: 11, color: '#555', marginBottom: 12, lineHeight: 15 },
  controls: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  sliderRow: { marginBottom: 8 },
  sliderLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  slider: { width: '100%', height: 28 },
  grid: { flex: 1 },
  asciiLine: { fontFamily: 'monospace', fontSize: FONT_SIZE, lineHeight: LINE_HEIGHT, color: '#0f0', letterSpacing: 0 },
})
