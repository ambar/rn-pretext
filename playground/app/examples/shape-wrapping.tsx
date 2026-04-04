import { useMemo, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import Slider from '@react-native-community/slider'
import {
  prepareWithSegments,
  layoutNextLine,
  type LayoutCursor,
} from 'rn-pretext'

// ============================================================
// Text Wrapping Around Shapes
// ============================================================
// Uses layoutNextLine() — the streaming/iterator API — to wrap
// text around geometric shapes. Each line can have a different
// available width, enabling text to flow around circles,
// diamonds, and custom polygons.
// ============================================================

const FONT = '14px System'
const LH = 20

type ShapeType = 'circle' | 'diamond' | 'steps' | 'hourglass'

const SHAPES: { id: ShapeType; label: string }[] = [
  { id: 'circle', label: 'Circle' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'steps', label: 'Steps' },
  { id: 'hourglass', label: 'Hourglass' },
]

const LONG_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra.'

function getShapeInset(
  shape: ShapeType,
  lineIdx: number,
  totalLines: number,
  containerWidth: number,
  shapeSize: number,
): { left: number; right: number } {
  const center = totalLines / 2
  const radius = shapeSize / 2

  switch (shape) {
    case 'circle': {
      const dy = Math.abs(lineIdx - center + 0.5) * LH
      if (dy > radius) return { left: 0, right: 0 }
      const dx = Math.sqrt(radius * radius - dy * dy)
      return { left: 0, right: dx * 2 }
    }

    case 'diamond': {
      const dy = Math.abs(lineIdx - center + 0.5) / center
      if (dy > 1) return { left: 0, right: 0 }
      const inset = (1 - dy) * shapeSize
      return { left: 0, right: inset }
    }

    case 'steps': {
      const step = Math.floor(lineIdx / 3) % 4
      const insets = [0, shapeSize * 0.3, shapeSize * 0.6, shapeSize * 0.9]
      return { left: 0, right: insets[step] }
    }

    case 'hourglass': {
      const dy = Math.abs(lineIdx - center + 0.5) / center
      const inset = dy * shapeSize
      return { left: 0, right: inset }
    }
  }
}

interface WrappedLine {
  text: string
  width: number
  availableWidth: number
  indent: number
}

function wrapAroundShape(
  text: string,
  containerWidth: number,
  shape: ShapeType,
  shapeSize: number,
): WrappedLine[] {
  const prepared = prepareWithSegments(text, FONT)
  const lines: WrappedLine[] = []
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  const estimatedLines = Math.ceil(text.length * 8 / containerWidth) + 5

  for (let i = 0; i < 100; i++) {
    const inset = getShapeInset(shape, i, estimatedLines, containerWidth, shapeSize)
    const availableWidth = Math.max(40, containerWidth - inset.right - inset.left)

    const line = layoutNextLine(prepared, cursor, availableWidth)
    if (!line) break

    lines.push({
      text: line.text,
      width: line.width,
      availableWidth,
      indent: inset.left,
    })
    cursor = line.end
  }
  return lines
}

function ShapePreview({ shape, size }: { shape: ShapeType; size: number }) {
  const points = useMemo(() => {
    const s = size * 0.4
    const cx = s / 2
    const cy = s / 2

    switch (shape) {
      case 'circle':
        return null // Use borderRadius
      case 'diamond':
        return `${cx},0 ${s},${cy} ${cx},${s} 0,${cy}`
      case 'steps':
        return `0,0 ${s * 0.3},0 ${s * 0.3},${s * 0.33} ${s * 0.6},${s * 0.33} ${s * 0.6},${s * 0.66} ${s},${s * 0.66} ${s},${s} 0,${s}`
      case 'hourglass':
        return `0,0 ${s},0 ${cx},${cy} ${s},${s} 0,${s} ${cx},${cy}`
    }
  }, [shape, size])

  const s = size * 0.4
  if (shape === 'circle') {
    return (
      <View style={[styles.shapePreview, { width: s, height: s, borderRadius: s / 2, backgroundColor: '#007AFF20', borderColor: '#007AFF', borderWidth: 1.5 }]} />
    )
  }
  return (
    <View style={[styles.shapePreview, { width: s, height: s, backgroundColor: '#007AFF10', borderColor: '#007AFF', borderWidth: 1.5, borderRadius: shape === 'hourglass' ? 0 : 4 }]} />
  )
}

export default function ShapeWrapping() {
  const { width: windowWidth } = useWindowDimensions()
  const containerWidth = windowWidth - 48 - 32
  const [shape, setShape] = useState<ShapeType>('circle')
  const [shapeSize, setShapeSize] = useState(120)

  const lines = useMemo(
    () => wrapAroundShape(LONG_TEXT, containerWidth, shape, shapeSize),
    [containerWidth, shape, shapeSize],
  )

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Shape Wrapping</Text>
      <Text style={styles.desc}>
        layoutNextLine() lays out one line at a time with variable widths,
        enabling text to flow around any geometric shape.
      </Text>

      <View style={styles.chipRow}>
        {SHAPES.map((s) => (
          <Pressable
            key={s.id}
            style={[styles.chip, shape === s.id && styles.chipActive]}
            onPress={() => setShape(s.id)}
          >
            <Text style={[styles.chipText, shape === s.id && styles.chipTextActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sliderRow}>
        <Text style={styles.sliderLabel}>Shape Size</Text>
        <Slider
          style={styles.slider}
          minimumValue={60}
          maximumValue={Math.min(200, containerWidth - 60)}
          value={shapeSize}
          onValueChange={(v) => setShapeSize(Math.round(v))}
          minimumTrackTintColor="#007AFF"
        />
        <Text style={styles.sliderVal}>{shapeSize}px</Text>
      </View>

      {/* Wrapped text display */}
      <View style={styles.textContainer}>
        {lines.map((line, i) => (
          <View
            key={i}
            style={[
              styles.wrappedLine,
              { paddingLeft: line.indent, maxWidth: line.availableWidth + line.indent },
            ]}
          >
            <Text style={styles.wrappedText}>{line.text}</Text>
          </View>
        ))}

        {/* Shape indicator on the right */}
        <View
          style={[
            styles.shapeIndicator,
            shape === 'circle' && {
              width: shapeSize,
              height: shapeSize,
              borderRadius: shapeSize / 2,
              top: Math.max(0, ((lines.length * LH) / 2) - shapeSize / 2),
            },
            shape === 'diamond' && {
              width: shapeSize,
              height: lines.length * LH,
              top: 0,
            },
            shape === 'steps' && {
              width: shapeSize,
              height: lines.length * LH,
              top: 0,
            },
            shape === 'hourglass' && {
              width: shapeSize,
              height: lines.length * LH,
              top: 0,
            },
          ]}
        />
      </View>

      {/* Width analysis */}
      <View style={styles.analysisCard}>
        <Text style={styles.analysisTitle}>Per-Line Width Analysis</Text>
        {lines.map((line, i) => (
          <View key={i} style={styles.analysisRow}>
            <Text style={styles.analysisNum}>{i + 1}</Text>
            <View style={styles.analysisBars}>
              <View
                style={[
                  styles.analysisUsed,
                  { width: `${(line.width / containerWidth) * 100}%` },
                ]}
              />
              <View
                style={[
                  styles.analysisAvail,
                  { width: `${(line.availableWidth / containerWidth) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.analysisText}>
              {Math.round(line.width)}/{Math.round(line.availableWidth)}
            </Text>
          </View>
        ))}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} />
            <Text style={styles.legendText}>Used</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#e5e5e5' }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
        </View>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeTitle}>How it works</Text>
        <Text style={styles.code}>
          {`let cursor = { segmentIndex: 0, graphemeIndex: 0 }
for (let i = 0; i < maxLines; i++) {
  // Each line gets a different width!
  const width = containerWidth - shapeInset(i)
  const line = layoutNextLine(prepared, cursor, width)
  if (!line) break
  cursor = line.end
}`}
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  desc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 16 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextActive: { color: '#fff' },

  sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  sliderLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  slider: { flex: 1, height: 36 },
  sliderVal: { fontSize: 12, color: '#888', width: 50, textAlign: 'right' },

  shapePreview: { alignSelf: 'center', marginBottom: 12 },

  textContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  wrappedLine: { height: LH, justifyContent: 'center' },
  wrappedText: { fontSize: 14, lineHeight: LH, color: '#333' },

  shapeIndicator: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#007AFF08',
    borderWidth: 1,
    borderColor: '#007AFF30',
    borderStyle: 'dashed',
  },

  analysisCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 16,
    marginBottom: 12,
  },
  analysisTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 10 },
  analysisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    marginBottom: 2,
  },
  analysisNum: { fontSize: 9, color: '#999', width: 16 },
  analysisBars: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  analysisUsed: {
    position: 'absolute',
    height: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  analysisAvail: {
    position: 'absolute',
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
  },
  analysisText: { fontSize: 8, color: '#999', width: 56, textAlign: 'right' },

  legendRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: '#888' },

  codeCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 16,
  },
  codeTitle: { fontSize: 12, fontWeight: '600', color: '#89b4fa', marginBottom: 8 },
  code: { fontSize: 11, fontFamily: 'monospace', color: '#cdd6f4', lineHeight: 16 },
})
