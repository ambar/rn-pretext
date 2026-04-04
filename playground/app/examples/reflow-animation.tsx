import { useEffect, useMemo, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import Slider from '@react-native-community/slider'
import { prepareWithSegments, layoutWithLines } from 'rn-pretext'

// ============================================================
// Reflow Morph Animation
// ============================================================
// When container width changes, characters reflow to new lines.
// This demo computes character positions at two widths and
// smoothly animates each character from old to new position.
// ============================================================

const FONT = '16px System'
const FONT_SIZE = 16
const LH = 24

const SAMPLE_TEXT =
  'Pretext computes text dimensions without the DOM. Each character can be tracked across reflows.'

interface CharPos {
  char: string
  x: number
  y: number
}

function getCharPositions(text: string, maxWidth: number): CharPos[] {
  const prepared = prepareWithSegments(text, FONT)
  const result = layoutWithLines(prepared, maxWidth, LH)
  const chars: CharPos[] = []

  for (let lineIdx = 0; lineIdx < result.lines.length; lineIdx++) {
    const lineText = result.lines[lineIdx].text
    let x = 0
    for (let ci = 0; ci < lineText.length; ci++) {
      const ch = lineText[ci]
      chars.push({ char: ch, x, y: lineIdx * LH })
      const cp = prepareWithSegments(ch, FONT)
      const w = cp.widths
        ? (cp.widths as number[]).reduce((a: number, b: number) => a + b, 0)
        : FONT_SIZE * 0.6
      x += w
    }
  }
  return chars
}

function MorphChar({
  char,
  fromX,
  fromY,
  toX,
  toY,
  trigger,
}: {
  char: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  trigger: number
}) {
  const x = useSharedValue(fromX)
  const y = useSharedValue(fromY)

  useEffect(() => {
    x.value = fromX
    y.value = fromY
    x.value = withTiming(toX, { duration: 600, easing: Easing.inOut(Easing.cubic) })
    y.value = withTiming(toY, { duration: 600, easing: Easing.inOut(Easing.cubic) })
  }, [trigger, toX, toY])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }))

  return (
    <Animated.Text
      style={[styles.morphChar, animStyle]}
    >
      {char}
    </Animated.Text>
  )
}

export default function ReflowAnimation() {
  const { width: windowWidth } = useWindowDimensions()
  const maxWidth = windowWidth - 48 - 32
  const [widthA, setWidthA] = useState(Math.round(maxWidth * 0.9))
  const [widthB, setWidthB] = useState(Math.round(maxWidth * 0.5))
  const [showingA, setShowingA] = useState(true)
  const [trigger, setTrigger] = useState(0)

  const charsA = useMemo(() => getCharPositions(SAMPLE_TEXT, widthA), [widthA])
  const charsB = useMemo(() => getCharPositions(SAMPLE_TEXT, widthB), [widthB])

  const fromChars = showingA ? charsB : charsA
  const toChars = showingA ? charsA : charsB
  const currentWidth = showingA ? widthA : widthB

  const maxLen = Math.min(fromChars.length, toChars.length)
  const totalLines = toChars.length > 0
    ? Math.max(...toChars.map((c) => c.y)) / LH + 1
    : 1

  const handleToggle = () => {
    setShowingA(!showingA)
    setTrigger((t) => t + 1)
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Reflow Animation</Text>
      <Text style={styles.desc}>
        Characters smoothly morph between two container widths. Positions
        computed by layoutWithLines() at each width.
      </Text>

      <View style={styles.sliderGroup}>
        <View style={styles.sliderRow}>
          <Text style={[styles.sliderLabel, { color: '#007AFF' }]}>Width A</Text>
          <Slider
            style={styles.slider}
            minimumValue={100}
            maximumValue={maxWidth}
            value={widthA}
            onValueChange={(v) => setWidthA(Math.round(v))}
            minimumTrackTintColor="#007AFF"
          />
          <Text style={styles.sliderVal}>{widthA}px</Text>
        </View>
        <View style={styles.sliderRow}>
          <Text style={[styles.sliderLabel, { color: '#FF9500' }]}>Width B</Text>
          <Slider
            style={styles.slider}
            minimumValue={100}
            maximumValue={maxWidth}
            value={widthB}
            onValueChange={(v) => setWidthB(Math.round(v))}
            minimumTrackTintColor="#FF9500"
          />
          <Text style={styles.sliderVal}>{widthB}px</Text>
        </View>
      </View>

      <Pressable style={styles.toggleBtn} onPress={handleToggle}>
        <Text style={styles.toggleText}>
          {showingA ? 'Morph to Width B' : 'Morph to Width A'}
        </Text>
      </Pressable>

      {/* Animation canvas */}
      <View
        style={[
          styles.canvas,
          { height: totalLines * LH + 32 },
        ]}
      >
        {/* Width indicator */}
        <View style={[styles.widthIndicator, { width: currentWidth }]}>
          <Text style={styles.widthIndicatorText}>{currentWidth}px</Text>
        </View>

        {/* Animated characters */}
        <View style={{ height: totalLines * LH, marginTop: 16 }}>
          {Array.from({ length: maxLen }).map((_, i) => (
            <MorphChar
              key={i}
              char={toChars[i].char}
              fromX={fromChars[i]?.x ?? toChars[i].x}
              fromY={fromChars[i]?.y ?? toChars[i].y}
              toX={toChars[i].x}
              toY={toChars[i].y}
              trigger={trigger}
            />
          ))}
        </View>
      </View>

      {/* Comparison */}
      <View style={styles.comparisonCard}>
        <Text style={styles.compTitle}>Layout Comparison</Text>

        <View style={styles.compRow}>
          <View style={styles.compCol}>
            <Text style={[styles.compLabel, { color: '#007AFF' }]}>
              Width A ({widthA}px)
            </Text>
            <Text style={styles.compStat}>
              {charsA.length > 0 ? Math.max(...charsA.map((c) => c.y)) / LH + 1 : 0} lines
            </Text>
          </View>
          <View style={styles.compDivider} />
          <View style={styles.compCol}>
            <Text style={[styles.compLabel, { color: '#FF9500' }]}>
              Width B ({widthB}px)
            </Text>
            <Text style={styles.compStat}>
              {charsB.length > 0 ? Math.max(...charsB.map((c) => c.y)) / LH + 1 : 0} lines
            </Text>
          </View>
        </View>

        <View style={styles.compRow}>
          <View style={styles.compCol}>
            <Text style={styles.compDetail}>{charsA.length} chars positioned</Text>
          </View>
          <View style={styles.compDivider} />
          <View style={styles.compCol}>
            <Text style={styles.compDetail}>{charsB.length} chars positioned</Text>
          </View>
        </View>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeTitle}>How it works</Text>
        <Text style={styles.code}>
          {`// Compute positions at both widths
const posA = layoutWithLines(prep, widthA, LH)
const posB = layoutWithLines(prep, widthB, LH)

// Animate each character from A → B
chars.forEach((char, i) => {
  animateXY(posA[i], posB[i], { duration: 600 })
})`}
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

  sliderGroup: { marginBottom: 12 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sliderLabel: { fontSize: 12, fontWeight: '700', width: 52 },
  slider: { flex: 1, height: 36 },
  sliderVal: { fontSize: 12, color: '#888', width: 48, textAlign: 'right' },

  toggleBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  canvas: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  widthIndicator: {
    height: 2,
    backgroundColor: '#89b4fa40',
    borderRadius: 1,
  },
  widthIndicatorText: {
    fontSize: 9,
    color: '#89b4fa',
    position: 'absolute',
    right: 0,
    top: 4,
  },
  morphChar: {
    position: 'absolute',
    fontSize: FONT_SIZE,
    lineHeight: LH,
    color: '#cdd6f4',
  },

  comparisonCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 16,
    marginBottom: 12,
  },
  compTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  compRow: { flexDirection: 'row', marginBottom: 8 },
  compCol: { flex: 1, alignItems: 'center' },
  compDivider: { width: 1, backgroundColor: '#e5e5e5' },
  compLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  compStat: { fontSize: 18, fontWeight: '800', color: '#333' },
  compDetail: { fontSize: 11, color: '#999' },

  codeCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 16,
  },
  codeTitle: { fontSize: 12, fontWeight: '600', color: '#89b4fa', marginBottom: 8 },
  code: { fontSize: 11, fontFamily: 'monospace', color: '#cdd6f4', lineHeight: 16 },
})
