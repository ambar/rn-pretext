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
        tightWidth,
        savedVsCss: cssWidth - tightWidth,
      }
    })
  }, [cssWidth])

  const totalSaved = rows.reduce((s, r) => s + r.savedVsCss, 0)

  return (
    <>
      <Stack.Screen options={{ title: 'Shrinkwrap Showdown' }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.desc}>
          Chat bubbles: CSS fit-content width vs pretext shrinkwrap.
        </Text>

        <Text style={styles.label}>Max width: {cssWidth}px</Text>
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

        <View style={styles.savedBadge}>
          <Text style={styles.savedText}>Total saved: {totalSaved}px across {rows.length} bubbles</Text>
        </View>

        {rows.map((r, i) => (
          <View key={i} style={styles.pair}>
            {/* CSS width bubble */}
            <View style={styles.bubbleRow}>
              <View style={[styles.bubble, styles.bubbleCss, { maxWidth: r.cssWidth }]}>
                <Text style={styles.bubbleText}>{r.text}</Text>
              </View>
            </View>
            <Text style={styles.bubbleTag}>
              CSS {r.cssWidth}px
            </Text>

            {/* Tight width bubble */}
            <View style={[styles.bubbleRow, styles.bubbleRowRight]}>
              <View style={[styles.bubble, styles.bubbleTight, { maxWidth: r.tightWidth }]}>
                <Text style={[styles.bubbleText, styles.bubbleTextTight]}>{r.text}</Text>
              </View>
            </View>
            <Text style={[styles.bubbleTag, { alignSelf: 'flex-end' }]}>
              Pretext {r.tightWidth}px{' '}
              <Text style={styles.savedInline}>-{r.savedVsCss}px</Text>
            </Text>
          </View>
        ))}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f2f2f7' },
  content: { padding: 16, paddingBottom: 60 },
  desc: { fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4 },
  slider: { width: '100%', height: 36, marginBottom: 12 },
  savedBadge: {
    alignSelf: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 20,
  },
  savedText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  pair: { marginBottom: 20 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 2,
  },
  bubbleCss: {
    backgroundColor: '#e5e5ea',
    borderBottomLeftRadius: 4,
  },
  bubbleTight: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20, color: '#000' },
  bubbleTextTight: { color: '#fff' },
  bubbleTag: { fontSize: 10, color: '#999', marginBottom: 6 },
  savedInline: { color: '#059669', fontWeight: '600' },
})
