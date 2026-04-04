import { useMemo, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import Slider from '@react-native-community/slider'
import { prepare, layout } from 'rn-pretext'

// ============================================================
// Responsive Typography
// ============================================================
// Automatically find the largest font size that fits a headline
// into a single line at the current container width. Uses binary
// search over prepare() + layout() — no DOM measurement needed.
// ============================================================

const HEADLINES = [
  'Breaking News',
  'The Quick Brown Fox Jumps',
  'Technology Reshapes Everything We Know About Communication',
  '科技改变生活',
  'Hello 世界 🌍',
]

function fitFontSize(
  text: string,
  maxWidth: number,
  minSize: number,
  maxSize: number,
): number {
  let lo = minSize
  let hi = maxSize
  while (lo < hi) {
    const mid = Math.ceil((lo + hi + 1) / 2)
    const font = `${mid}px System`
    const p = prepare(text, font)
    const { lineCount } = layout(p, maxWidth, mid * 1.2)
    if (lineCount <= 1) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }
  return lo
}

function HeadlineCard({
  text,
  containerWidth,
}: {
  text: string
  containerWidth: number
}) {
  const fontSize = useMemo(
    () => fitFontSize(text, containerWidth, 10, 72),
    [text, containerWidth],
  )
  const lineHeight = Math.round(fontSize * 1.2)

  return (
    <View style={styles.card}>
      <Text style={[styles.headline, { fontSize, lineHeight }]}>{text}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {fontSize}px / {containerWidth}px wide
        </Text>
        <View
          style={[
            styles.fitBadge,
            fontSize >= 40
              ? styles.fitLarge
              : fontSize >= 20
                ? styles.fitMedium
                : styles.fitSmall,
          ]}
        >
          <Text style={styles.fitText}>
            {fontSize >= 40 ? 'LARGE' : fontSize >= 20 ? 'MEDIUM' : 'SMALL'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default function ResponsiveTypography() {
  const { width: windowWidth } = useWindowDimensions()
  const maxContainerWidth = windowWidth - 48
  const [widthPct, setWidthPct] = useState(100)
  const containerWidth = Math.max(60, Math.round(maxContainerWidth * widthPct / 100))

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Responsive Typography</Text>
      <Text style={styles.desc}>
        Binary search over prepare() + layout() to find the largest font size
        that keeps each headline on a single line.
      </Text>

      <View style={styles.sliderRow}>
        <Text style={styles.sliderLabel}>Width</Text>
        <Slider
          style={styles.slider}
          minimumValue={20}
          maximumValue={100}
          value={widthPct}
          onValueChange={setWidthPct}
          minimumTrackTintColor="#007AFF"
        />
        <Text style={styles.sliderVal}>{containerWidth}px</Text>
      </View>

      {HEADLINES.map((text, i) => (
        <HeadlineCard key={i} text={text} containerWidth={containerWidth} />
      ))}

      <View style={styles.codeCard}>
        <Text style={styles.codeTitle}>How it works</Text>
        <Text style={styles.code}>
          {`// Binary search: O(log n) prepare() calls
let lo = minSize, hi = maxSize
while (lo < hi) {
  const mid = Math.ceil((lo + hi + 1) / 2)
  const p = prepare(text, mid + "px System")
  layout(p, width, mid * 1.2).lineCount <= 1
    ? (lo = mid) : (hi = mid - 1)
}
return lo  // largest size that fits`}
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  desc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 20 },

  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  sliderLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  slider: { flex: 1, height: 36 },
  sliderVal: { fontSize: 12, color: '#888', width: 50, textAlign: 'right' },

  card: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  headline: { fontWeight: '700', color: '#111', marginBottom: 8 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { fontSize: 11, color: '#999' },
  fitBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fitLarge: { backgroundColor: '#d4edda' },
  fitMedium: { backgroundColor: '#fff3cd' },
  fitSmall: { backgroundColor: '#f8d7da' },
  fitText: { fontSize: 9, fontWeight: '700' },

  codeCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  codeTitle: { fontSize: 12, fontWeight: '600', color: '#89b4fa', marginBottom: 8 },
  code: { fontSize: 11, fontFamily: 'monospace', color: '#cdd6f4', lineHeight: 16 },
})
