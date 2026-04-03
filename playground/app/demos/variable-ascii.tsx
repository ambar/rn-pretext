import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { prepareWithSegments } from 'rn-pretext'
import { Stack } from 'expo-router'

const FONT_SIZE = 13
const LINE_HEIGHT = 15
const FONT_FAMILY = 'Georgia'
const FONT = `${FONT_SIZE}px ${FONT_FAMILY}`
const COLS = 50

const CHARSET = " .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// Approximate ink density for each character (0 = empty, 1 = most dense)
const BRIGHTNESS_MAP: Record<string, number> = {
  ' ': 0, '.': 0.05, ',': 0.07, ':': 0.10, ';': 0.12, '!': 0.15, '+': 0.20, '-': 0.08,
  '=': 0.18, '*': 0.25, '#': 0.55, '@': 0.65, '%': 0.60, '&': 0.55,
  a: 0.35, b: 0.38, c: 0.28, d: 0.38, e: 0.32, f: 0.22, g: 0.38,
  h: 0.35, i: 0.15, j: 0.18, k: 0.30, l: 0.15, m: 0.45, n: 0.35,
  o: 0.35, p: 0.38, q: 0.38, r: 0.22, s: 0.30, t: 0.22, u: 0.32,
  v: 0.25, w: 0.40, x: 0.28, y: 0.25, z: 0.28,
  A: 0.40, B: 0.48, C: 0.35, D: 0.45, E: 0.38, F: 0.35, G: 0.42,
  H: 0.45, I: 0.22, J: 0.25, K: 0.38, L: 0.28, M: 0.52, N: 0.45,
  O: 0.45, P: 0.38, Q: 0.48, R: 0.42, S: 0.35, T: 0.30, U: 0.40,
  V: 0.32, W: 0.52, X: 0.38, Y: 0.30, Z: 0.38,
  '0': 0.45, '1': 0.20, '2': 0.35, '3': 0.35, '4': 0.32, '5': 0.35,
  '6': 0.40, '7': 0.25, '8': 0.48, '9': 0.40,
}

type PaletteEntry = { char: string; width: number; brightness: number }

function buildPalette(font: string): PaletteEntry[] {
  const entries: PaletteEntry[] = []
  for (const ch of CHARSET) {
    if (ch === ' ') continue
    const p = prepareWithSegments(ch, font)
    const width = (p as any).widths[0] as number
    if (width <= 0) continue
    entries.push({ char: ch, width, brightness: BRIGHTNESS_MAP[ch] ?? 0.3 })
  }
  const maxB = Math.max(...entries.map((e) => e.brightness))
  if (maxB > 0) for (const e of entries) e.brightness /= maxB
  entries.sort((a, b) => a.brightness - b.brightness)
  return entries
}

function findBest(palette: PaletteEntry[], targetB: number, targetCellW: number): PaletteEntry {
  let lo = 0,
    hi = palette.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (palette[mid].brightness < targetB) lo = mid + 1
    else hi = mid
  }
  let bestScore = Infinity,
    best = palette[lo]
  const s = Math.max(0, lo - 15),
    e = Math.min(palette.length, lo + 15)
  for (let i = s; i < e; i++) {
    const p = palette[i]
    const bErr = Math.abs(p.brightness - targetB) * 2.5
    const wErr = Math.abs(p.width - targetCellW) / targetCellW
    const score = bErr + wErr
    if (score < bestScore) {
      bestScore = score
      best = p
    }
  }
  return best
}

// Particle system
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

function renderField(
  particles: Particle[],
  cols: number,
  rows: number,
  palette: PaletteEntry[],
  targetCellW: number,
): string[] {
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

  return field.map((row) => {
    let line = ''
    for (let c = 0; c < cols; c++) {
      const brightness = Math.min(1, row[c])
      if (brightness < 0.03) {
        line += ' '
      } else {
        line += findBest(palette, brightness, targetCellW).char
      }
    }
    return line
  })
}

export default function VariableAsciiDemo() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()

  const { palette, targetCellW } = useMemo(() => {
    const p = buildPalette(FONT)
    const targetW = windowWidth - 32
    return { palette: p, targetCellW: targetW / COLS }
  }, [windowWidth])

  const rows = Math.floor((windowHeight - 160) / LINE_HEIGHT)
  const numParticles = 100

  const [particles, setParticles] = useState<Particle[]>(() =>
    Array.from({ length: numParticles }, () => createParticle(COLS, rows)),
  )

  useEffect(() => {
    const id = setInterval(() => {
      setParticles((prev) => stepParticles(prev, COLS, rows))
    }, 50)
    return () => clearInterval(id)
  }, [rows])

  const lines = useMemo(
    () => renderField(particles, COLS, rows, palette, targetCellW),
    [particles, rows, palette, targetCellW],
  )

  return (
    <>
      <Stack.Screen options={{ title: 'Variable Typographic ASCII' }} />
      <View style={styles.container}>
        <Text style={styles.desc}>
          Proportional font ({FONT_FAMILY}) — characters selected by brightness AND width via
          pretext. {numParticles} particles, {COLS}x{rows} grid.
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
  grid: { flex: 1, alignItems: 'center' },
  asciiLine: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    color: '#c4a35a',
  },
})
