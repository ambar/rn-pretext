import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Slider from '@react-native-community/slider'
import { prepare, prepareWithSegments, layout, walkLineRanges, type PreparedText } from 'rn-pretext'
import { Stack } from 'expo-router'

const FONT = '14px System'
const LH = 20

const SAMPLE_TEXTS = [
  'Hello, how are you doing today?',
  'This is a somewhat longer message that will wrap to multiple lines at narrow widths.',
  '这是一条测试消息，用来对比 CSS fit-content 和 pretext 的宽度计算。',
  'Short msg',
  'The quick brown fox jumps over the lazy dog near the riverbank on a sunny afternoon.',
  '🚀 Launch sequence initiated! All systems go 🎯 Countdown begins now.',
  'https://example.com/very/long/path/to/resource?with=query&params=true',
  'Trans\u00ADatlantic ship\u00ADments of un\u00ADbreak\u00ADable goods arrived.',
]

function findTightWidth(prepared: PreparedText, maxWidth: number): number {
  const target = layout(prepared, maxWidth, LH).lineCount
  let lo = 1, hi = Math.ceil(maxWidth)
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    layout(prepared, mid, LH).lineCount <= target ? (hi = mid) : (lo = mid + 1)
  }
  return lo
}

export default function ShrinkwrapShowdownDemo() {
  const { width: windowWidth } = useWindowDimensions()
  const maxW = windowWidth - 32
  const [cssWidth, setCssWidth] = useState(Math.min(300, maxW))

  const rows = useMemo(() => {
    return SAMPLE_TEXTS.map((text) => {
      const p = prepare(text, FONT)
      const ps = prepareWithSegments(text, FONT)
      const result = layout(p, cssWidth, LH)
      const tightWidth = findTightWidth(p, cssWidth)

      let maxLineW = 0
      walkLineRanges(ps, cssWidth, (line) => {
        if (line.width > maxLineW) maxLineW = line.width
      })

      return {
        text,
        lineCount: result.lineCount,
        cssWidth,
        maxLineW: Math.ceil(maxLineW),
        tightWidth,
        wastedCss: Math.ceil(cssWidth - maxLineW),
        wastedTight: Math.ceil(tightWidth - maxLineW) || 0,
        savedVsCss: cssWidth - tightWidth,
      }
    })
  }, [cssWidth])

  const totalWastedCss = rows.reduce((s, r) => s + Math.max(0, r.wastedCss), 0)
  const totalSaved = rows.reduce((s, r) => s + r.savedVsCss, 0)

  return (
    <>
      <Stack.Screen options={{ title: 'Shrinkwrap Showdown' }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.desc}>
          CSS fit-content vs pretext — finding the exact tightest width for multiline text.
          Pretext uses binary search on layout() to find the minimum container width that
          preserves line count.
        </Text>

        <Text style={styles.label}>Container width: {cssWidth}px</Text>
        <Slider
          style={styles.slider}
          minimumValue={100}
          maximumValue={maxW}
          value={cssWidth}
          step={1}
          onValueChange={(v) => setCssWidth(Math.round(v))}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#ddd"
          thumbTintColor="#007AFF"
        />

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total wasted (CSS)</Text>
            <Text style={[styles.summaryVal, { color: '#dc2626' }]}>{totalWastedCss}px</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total saved (tight)</Text>
            <Text style={[styles.summaryVal, { color: '#059669' }]}>{totalSaved}px</Text>
          </View>
        </View>

        {rows.map((r, i) => (
          <View key={i} style={styles.itemCard}>
            <Text style={styles.itemText} numberOfLines={2}>{r.text}</Text>
            <View style={styles.barRow}>
              <View style={styles.barLabels}>
                <Text style={styles.barLabel}>CSS ({cssWidth}px)</Text>
                <Text style={styles.barLabel}>Tight ({r.tightWidth}px)</Text>
              </View>
              <View style={styles.bars}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(r.maxLineW / cssWidth) * 100}%` }]} />
                  <View style={[styles.barWaste, { width: `${(r.wastedCss / cssWidth) * 100}%` }]} />
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, styles.barFillTight, { width: `${(r.maxLineW / r.tightWidth) * 100}%` }]} />
                </View>
              </View>
            </View>
            <Text style={styles.itemMeta}>
              {r.lineCount} lines | max line: {r.maxLineW}px | saved: {r.savedVsCss}px
            </Text>
          </View>
        ))}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 60 },
  desc: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4 },
  slider: { width: '100%', height: 36, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryBox: { flex: 1, backgroundColor: '#f8f8f8', borderRadius: 8, padding: 12, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#888' },
  summaryVal: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  itemCard: { backgroundColor: '#fafafa', borderRadius: 8, borderWidth: 1, borderColor: '#e5e5e5', padding: 12, marginBottom: 12 },
  itemText: { fontSize: 13, color: '#444', marginBottom: 8, lineHeight: 18 },
  barRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  barLabels: { width: 80, gap: 6 },
  barLabel: { fontSize: 10, color: '#888', height: 12, lineHeight: 12 },
  bars: { flex: 1, gap: 6 },
  barTrack: { height: 12, backgroundColor: '#f0f0f0', borderRadius: 3, flexDirection: 'row', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 3 },
  barFillTight: { backgroundColor: '#059669' },
  barWaste: { height: '100%', backgroundColor: '#fecaca' },
  itemMeta: { fontSize: 10, color: '#aaa' },
})
