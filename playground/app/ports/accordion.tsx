import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View, Pressable, useWindowDimensions } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Stack } from 'expo-router'
import { prepare, layout } from 'rn-pretext'

const FONT = '14px System'
const LH = 20

const ACCORDION_ITEMS = [
  {
    title: 'What is pretext?',
    text: 'A pure JavaScript library for multiline text measurement and layout. It computes text dimensions without touching the DOM — avoiding expensive layout reflow operations like getBoundingClientRect or offsetHeight.',
  },
  {
    title: 'How does it work?',
    text: 'prepare() does a one-time measurement pass using measureText, then layout() does pure arithmetic to compute height and line count at any given width. This makes resize operations extremely fast — about 0.09ms for a batch of 500 texts.',
  },
  {
    title: 'What about CJK and emoji?',
    text: '支持所有语言，包括中文、日文、韩文。Emoji sequences like 👨‍👩‍👧‍👦 and 🏳️‍🌈 are measured correctly. Per-character breaking for CJK with kinsoku punctuation attachment rules.',
  },
  {
    title: 'Does it handle RTL?',
    text: 'Mixed LTR/RTL is handled with simplified bidi metadata. According to محمد الأحمد, the results improved significantly with proper Arabic punctuation attachment.',
  },
]

const TIMING_CONFIG = { duration: 300, easing: Easing.bezier(0.4, 0, 0.2, 1) }

function AccordionItem({
  title,
  text,
  height,
  lineCount,
  isOpen,
  onPress,
}: {
  title: string
  text: string
  height: number
  lineCount: number
  isOpen: boolean
  onPress: () => void
}) {
  const progress = useDerivedValue(() => withTiming(isOpen ? 1 : 0, TIMING_CONFIG))
  const bodyStyle = useAnimatedStyle(() => ({
    height: progress.value * height,
    opacity: progress.value,
  }))
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 45}deg` }],
  }))

  return (
    <View style={styles.accordionItem}>
      <Pressable onPress={onPress} style={styles.accordionHeader}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Animated.Text style={[styles.accordionArrow, arrowStyle]}>+</Animated.Text>
      </Pressable>
      <Animated.View style={[{ overflow: 'hidden' }, bodyStyle]}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <Text style={styles.accordionBody}>{text}</Text>
        </View>
      </Animated.View>
      <Text style={styles.meta}>
        {lineCount} lines, {height - 16}px
      </Text>
    </View>
  )
}

export default function AccordionScreen() {
  const { width: windowWidth } = useWindowDimensions()
  const contentWidth = windowWidth - 48 - 32
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const prepared = useMemo(
    () => ACCORDION_ITEMS.map((item) => prepare(item.text, FONT)),
    [],
  )
  const heights = useMemo(
    () => prepared.map((p) => layout(p, contentWidth, LH).height + 16),
    [prepared, contentWidth],
  )

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Accordion' }} />
      <Text style={styles.desc}>
        Expand/collapse with pretext-measured heights. Pure arithmetic, no DOM read.
      </Text>
      <View style={styles.card}>
        {ACCORDION_ITEMS.map((item, i) => (
          <AccordionItem
            key={i}
            title={item.title}
            text={item.text}
            height={heights[i]}
            lineCount={layout(prepared[i], contentWidth, LH).lineCount}
            isOpen={openIndex === i}
            onPress={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  desc: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 18 },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 12,
    overflow: 'hidden',
  },
  accordionItem: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e0e0e0', paddingVertical: 8 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accordionTitle: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1 },
  accordionArrow: { fontSize: 18, color: '#999', width: 24, textAlign: 'center' },
  accordionBody: { fontSize: 14, lineHeight: 20, color: '#555', paddingTop: 8 },
  meta: { fontSize: 10, color: '#aaa', marginTop: 4 },
})
