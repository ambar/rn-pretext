import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import Slider from '@react-native-community/slider'
import { prepareWithSegments, layout, walkLineRanges, type PreparedTextWithSegments } from 'rn-pretext'
import { Stack } from 'expo-router'

const FONT = '14px System'
const LH = 20
const TIMING = { duration: 50 }
const PADDING_H = 14
const PADDING_V = 10
const BUBBLE_MAX_RATIO = 0.8

const MESSAGES = [
  { from: 'them', text: 'Yo did you see the new Pretext library?' },
  { from: 'me', text: 'yeah! It measures text without the DOM. Pure JavaScript arithmetic' },
  { from: 'them', text: "That shrinkwrap demo is wild it finds the exact minimum width for multiline text. CSS can't do that." },
  { from: 'me', text: '성능 최적화가 정말 많이 되었더라고요 🎉' },
  { from: 'them', text: 'Does it handle soft hyphens and URLs too?' },
  { from: 'me', text: 'Yep — pretext breaks at punctuation boundaries. layout() is pure arithmetic on cached widths.' },
]

function collectWrapMetrics(prepared: PreparedTextWithSegments, maxWidth: number) {
  let maxLineWidth = 0
  const lineCount = walkLineRanges(prepared, maxWidth, (line) => {
    if (line.width > maxLineWidth) maxLineWidth = line.width
  })
  return { lineCount, height: lineCount * LH, maxLineWidth }
}

function findTightWrapMetrics(prepared: PreparedTextWithSegments, maxWidth: number) {
  const initial = collectWrapMetrics(prepared, maxWidth)
  let lo = 1, hi = Math.max(1, Math.ceil(maxWidth))
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    layout(prepared, mid, LH).lineCount <= initial.lineCount ? (hi = mid) : (lo = mid + 1)
  }
  return collectWrapMetrics(prepared, lo)
}

function AnimatedBubble({
  text,
  width,
  isMe,
}: {
  text: string
  width: number
  isMe: boolean
}) {
  const animStyle = useAnimatedStyle(() => ({
    maxWidth: withTiming(width, TIMING),
  }))
  return (
    <Animated.View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem, animStyle]}>
      <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{text}</Text>
    </Animated.View>
  )
}

export default function ShrinkwrapShowdownDemo() {
  const { width: windowWidth } = useWindowDimensions()
  const maxW = windowWidth - 32
  const [cssWidth, setCssWidth] = useState(Math.min(300, maxW))

  const bubbleMaxWidth = Math.floor(cssWidth * BUBBLE_MAX_RATIO)

  const data = useMemo(() => {
    const contentMaxWidth = bubbleMaxWidth - PADDING_H * 2
    return MESSAGES.map((msg) => {
      const p = prepareWithSegments(msg.text, FONT)
      const cssMetrics = collectWrapMetrics(p, contentMaxWidth)
      const tightMetrics = findTightWrapMetrics(p, contentMaxWidth)
      const fitWidth = Math.ceil(cssMetrics.maxLineWidth) + PADDING_H * 2
      const tightWidth = Math.ceil(tightMetrics.maxLineWidth) + PADDING_H * 2
      const cssHeight = cssMetrics.height + PADDING_V * 2
      return { ...msg, fitWidth, tightWidth, cssHeight }
    })
  }, [bubbleMaxWidth])

  const totalWasted = data.reduce((s, d) => s + Math.max(0, d.fitWidth - d.tightWidth) * d.cssHeight, 0)
  const totalSaved = data.reduce((s, d) => s + (d.fitWidth - d.tightWidth), 0)

  return (
    <>
      <Stack.Screen options={{ title: 'Shrinkwrap Showdown' }} />
      <View style={styles.sliderCard}>
        <Text style={styles.sliderLabel}>Container width:</Text>
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
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {/* CSS fit-content section */}
          <View style={[styles.section, { flexBasis: cssWidth + 32, flexGrow: 1 }]}>
            <Text style={styles.sectionTitle}>CSS fit-content</Text>
            <Text style={styles.sectionDesc}>
              Uses <Text style={styles.code}>width: fit-content; max-width: 80%</Text>. The browser wraps the text, then sizes the bubble to the longest wrapped line. Shorter lines leave empty bubble area behind.
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Wasted pixels: {totalWasted.toLocaleString()}</Text>
            </View>
            <View style={[styles.chatContainer, { width: cssWidth }]}>
              {data.map((d, i) => (
                <AnimatedBubble key={i} text={d.text} width={bubbleMaxWidth} isMe={d.from === 'me'} />
              ))}
            </View>
          </View>

          {/* Pretext shrinkwrap section */}
          <View style={[styles.section, { flexBasis: cssWidth + 32, flexGrow: 1 }]}>
            <Text style={styles.sectionTitle}>Pretext shrinkwrap</Text>
            <Text style={styles.sectionDesc}>
              Uses <Text style={styles.code}>walkLineRanges()</Text> to binary-search the tightest width that produces the same line count. Zero wasted pixels.
            </Text>
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text style={styles.badgeText}>Saved: {totalSaved}px total</Text>
            </View>
            <View style={[styles.chatContainer, { width: cssWidth }]}>
              {data.map((d, i) => (
                <AnimatedBubble key={i} text={d.text} width={d.tightWidth} isMe={d.from === 'me'} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f2f2f7' },
  content: { padding: 16, paddingBottom: 60 },
  sliderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  sliderLabel: { fontSize: 13, fontFamily: 'monospace', color: '#666', marginRight: 8 },
  slider: { flex: 1, height: 36 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 8 },
  sectionDesc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 12 },
  code: { fontFamily: 'monospace', fontSize: 12, color: '#444', backgroundColor: '#f0f0f0' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f0e8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  badgeGreen: { backgroundColor: '#ecfdf5' },
  badgeText: { fontSize: 13, fontFamily: 'monospace', fontWeight: '600', color: '#333' },
  chatContainer: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleThem: {
    backgroundColor: '#3a3a3c',
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  bubbleMe: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  bubbleText: { fontSize: 14, lineHeight: 20, color: '#fff' },
  bubbleTextMe: { color: '#fff' },
})
