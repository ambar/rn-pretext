import { useEffect, useMemo, useRef, useState } from 'react'
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
  withDelay,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { prepareWithSegments, layoutWithLines } from 'rn-pretext'

// ============================================================
// Character-by-Character Entrance Animation
// ============================================================
// Uses prepareWithSegments() + layoutWithLines() to get the
// exact position of every character, then animates each one
// independently with staggered delays.
// ============================================================

const FONT = '16px System'
const FONT_SIZE = 16
const LH = 24

type AnimStyle = 'typewriter' | 'fadeUp' | 'bounce' | 'wave'

const ANIM_STYLES: { id: AnimStyle; label: string }[] = [
  { id: 'typewriter', label: 'Typewriter' },
  { id: 'fadeUp', label: 'Fade Up' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'wave', label: 'Wave' },
]

const SAMPLE_TEXT =
  'Pretext measures text without the DOM. This animation places each character at its exact computed position.'

interface CharInfo {
  char: string
  x: number
  y: number
  lineIdx: number
  globalIdx: number
}

function getCharPositions(text: string, maxWidth: number): CharInfo[] {
  const prepared = prepareWithSegments(text, FONT)
  const result = layoutWithLines(prepared, maxWidth, LH)
  const chars: CharInfo[] = []
  let globalIdx = 0

  for (let lineIdx = 0; lineIdx < result.lines.length; lineIdx++) {
    const lineText = result.lines[lineIdx].text
    // Approximate x positions by measuring cumulative widths
    let x = 0
    for (let ci = 0; ci < lineText.length; ci++) {
      const ch = lineText[ci]
      chars.push({ char: ch, x, y: lineIdx * LH, lineIdx, globalIdx })
      // Measure single char width
      const cp = prepareWithSegments(ch, FONT)
      const w = cp.widths
        ? (cp.widths as number[]).reduce((a: number, b: number) => a + b, 0)
        : FONT_SIZE * 0.6
      x += w
      globalIdx++
    }
  }
  return chars
}

function AnimatedChar({
  char,
  x,
  y,
  index,
  style,
  trigger,
}: {
  char: string
  x: number
  y: number
  index: number
  style: AnimStyle
  trigger: number
}) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)

  useEffect(() => {
    const delay = index * 30

    switch (style) {
      case 'typewriter':
        opacity.value = 0
        opacity.value = withDelay(delay, withTiming(1, { duration: 50 }))
        break

      case 'fadeUp':
        opacity.value = 0
        translateY.value = 12
        opacity.value = withDelay(
          delay,
          withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
        )
        translateY.value = withDelay(
          delay,
          withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }),
        )
        break

      case 'bounce':
        opacity.value = 0
        scale.value = 0
        opacity.value = withDelay(delay, withTiming(1, { duration: 100 }))
        scale.value = withDelay(
          delay,
          withSpring(1, { damping: 6, stiffness: 200 }),
        )
        break

      case 'wave':
        opacity.value = 1
        translateY.value = withDelay(
          delay,
          withSequence(
            withTiming(-8, { duration: 200, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 300, easing: Easing.inOut(Easing.quad) }),
          ),
        )
        break
    }
  }, [trigger, style])

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          fontSize: FONT_SIZE,
          lineHeight: LH,
          color: '#cdd6f4',
        },
        animStyle,
      ]}
    >
      {char}
    </Animated.Text>
  )
}

export default function CharAnimation() {
  const { width: windowWidth } = useWindowDimensions()
  const maxWidth = windowWidth - 48 - 32
  const [animStyle, setAnimStyle] = useState<AnimStyle>('typewriter')
  const [trigger, setTrigger] = useState(0)

  const chars = useMemo(
    () => getCharPositions(SAMPLE_TEXT, maxWidth),
    [maxWidth],
  )
  const totalLines = chars.length > 0 ? chars[chars.length - 1].lineIdx + 1 : 1

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Character Animation</Text>
      <Text style={styles.desc}>
        Each character is positioned using prepareWithSegments() + layoutWithLines(),
        then animated independently with staggered delays.
      </Text>

      <View style={styles.chipRow}>
        {ANIM_STYLES.map((s) => (
          <Pressable
            key={s.id}
            style={[styles.chip, animStyle === s.id && styles.chipActive]}
            onPress={() => setAnimStyle(s.id)}
          >
            <Text style={[styles.chipText, animStyle === s.id && styles.chipTextActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.replayBtn}
        onPress={() => setTrigger((t) => t + 1)}
      >
        <Text style={styles.replayText}>Replay Animation</Text>
      </Pressable>

      {/* Animation canvas */}
      <View style={styles.canvas}>
        <View style={{ height: totalLines * LH, position: 'relative' }}>
          {chars.map((c, i) => (
            <AnimatedChar
              key={`${i}-${trigger}`}
              char={c.char}
              x={c.x}
              y={c.y}
              index={c.globalIdx}
              style={animStyle}
              trigger={trigger}
            />
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Characters</Text>
          <Text style={styles.statValue}>{chars.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Lines</Text>
          <Text style={styles.statValue}>{totalLines}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Stagger delay</Text>
          <Text style={styles.statValue}>30ms/char</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total duration</Text>
          <Text style={styles.statValue}>{chars.length * 30}ms</Text>
        </View>
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

  replayBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  replayText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  canvas: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    minHeight: 120,
  },

  statsCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  statLabel: { fontSize: 13, color: '#666' },
  statValue: { fontSize: 13, fontWeight: '600', color: '#333', fontFamily: 'monospace' },
})
