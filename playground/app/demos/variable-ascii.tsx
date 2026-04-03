import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { prepareWithSegments } from 'rn-pretext'
import { Stack } from 'expo-router'

const FONT = '11px monospace'

// Charset sorted roughly by visual "brightness" (dark to light)
const DARK_TO_LIGHT = '@%#*+=:-.  '

// Simple particle system
type Particle = { x: number; y: number; vx: number; vy: number; life: number }

function createParticle(cols: number, rows: number): Particle {
  return {
    x: Math.random() * cols,
    y: Math.random() * rows,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    life: 0.5 + Math.random() * 0.5,
  }
}

function stepParticles(particles: Particle[], cols: number, rows: number): Particle[] {
  return particles.map((p) => {
    let { x, y, vx, vy, life } = p
    x += vx
    y += vy
    life -= 0.008

    // Bounce off edges
    if (x < 0 || x >= cols) vx = -vx
    if (y < 0 || y >= rows) vy = -vy
    x = Math.max(0, Math.min(cols - 1, x))
    y = Math.max(0, Math.min(rows - 1, y))

    if (life <= 0) return createParticle(cols, rows)
    return { x, y, vx, vy, life }
  })
}

function renderField(particles: Particle[], cols: number, rows: number): string[] {
  // Build brightness field from particles
  const field = Array.from({ length: rows }, () => new Float32Array(cols))

  for (const p of particles) {
    const radius = 3
    const cx = Math.round(p.x)
    const cy = Math.round(p.y)
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const r = cy + dy
        const c = cx + dx
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist <= radius) {
          field[r][c] += p.life * (1 - dist / radius) * 0.6
        }
      }
    }
  }

  // Map brightness to characters
  return field.map((row) => {
    let line = ''
    for (let c = 0; c < cols; c++) {
      const brightness = Math.min(1, row[c])
      const idx = Math.floor(brightness * (DARK_TO_LIGHT.length - 1))
      line += DARK_TO_LIGHT[idx]
    }
    return line
  })
}

export default function VariableAsciiDemo() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()

  const charWidth = useMemo(() => {
    const prepared = prepareWithSegments('M', FONT)
    return (prepared as any).widths[0] as number
  }, [])

  const cols = Math.floor((windowWidth - 32) / charWidth)
  const rows = Math.floor((windowHeight - 160) / 13)
  const numParticles = 30

  const [particles, setParticles] = useState<Particle[]>(() =>
    Array.from({ length: numParticles }, () => createParticle(cols, rows)),
  )

  useEffect(() => {
    const id = setInterval(() => {
      setParticles((prev) => stepParticles(prev, cols, rows))
    }, 50)
    return () => clearInterval(id)
  }, [cols, rows])

  const lines = useMemo(() => renderField(particles, cols, rows), [particles, cols, rows])

  return (
    <>
      <Stack.Screen options={{ title: 'Variable Typographic ASCII' }} />
      <View style={styles.container}>
        <Text style={styles.desc}>
          Particle system mapped to characters by brightness.
          Grid sized by pretext character measurement ({charWidth.toFixed(1)}px/char).
          {numParticles} particles, {cols}x{rows} grid.
        </Text>
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
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  desc: { fontSize: 11, color: '#555', marginBottom: 12, lineHeight: 15 },
  grid: { flex: 1 },
  asciiLine: { fontFamily: 'monospace', fontSize: 11, lineHeight: 13, color: '#e0e0e0' },
})
