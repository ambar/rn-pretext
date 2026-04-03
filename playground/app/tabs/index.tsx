import { useMemo, useState } from 'react'
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
  useDerivedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import {
  prepare,
  prepareWithSegments,
  layout,
  walkLineRanges,
  type PreparedText,
} from 'rn-pretext'

const FONT = '14px System'
const LH = 20

// ============================================================
// Demo list — links to sub-pages
// ============================================================

const DEMO_LINKS = [
  {
    href: '/demos/editorial-engine',
    title: 'The Editorial Engine',
    tag: 'Layout',
    tagColor: '#FF9500',
    desc: 'Multi-column editorial layout with draggable orbs and real-time text reflow at 60fps.',
  },
  {
    href: '/demos/fluid-smoke',
    title: 'Fluid Smoke',
    tag: 'ASCII Art',
    tagColor: '#30B0C7',
    desc: 'Full-screen fluid simulation rendered as proportional typographic ASCII.',
  },
  {
    href: '/demos/justification-comparison',
    title: 'Justification Compared',
    tag: 'Layout',
    tagColor: '#FF9500',
    desc: 'Side-by-side CSS greedy, hyphenated, and Knuth-Plass optimal justification with river detection.',
  },
  {
    href: '/demos/variable-ascii',
    title: 'Variable Typographic ASCII',
    tag: 'ASCII Art',
    tagColor: '#30B0C7',
    desc: 'Particle system mapped to characters selected by brightness and width across 3 weights.',
  },
  {
    href: '/demos/shrinkwrap-showdown',
    title: 'Shrinkwrap Showdown',
    tag: 'Layout',
    tagColor: '#FF9500',
    desc: 'CSS fit-content vs pretext — finding the exact tightest width for multiline text.',
  },
] as const

function DemoList() {
  const router = useRouter()
  return (
    <View style={styles.card}>
      {DEMO_LINKS.map((demo, i) => (
        <Pressable
          key={i}
          style={[styles.demoLink, i < DEMO_LINKS.length - 1 && styles.demoLinkBorder]}
          onPress={() => router.push(demo.href)}
        >
          <View style={styles.demoLinkHeader}>
            <Text style={styles.demoLinkTitle}>{demo.title}</Text>
            <View style={[styles.demoTag, { backgroundColor: demo.tagColor + '18' }]}>
              <View style={[styles.demoTagDot, { backgroundColor: demo.tagColor }]} />
              <Text style={[styles.demoTagText, { color: demo.tagColor }]}>{demo.tag}</Text>
            </View>
          </View>
          <Text style={styles.demoLinkDesc}>{demo.desc}</Text>
        </Pressable>
      ))}
    </View>
  )
}

// ============================================================
// Accordion
// ============================================================

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

function AccordionDemo() {
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
  )
}

// ============================================================
// Bubbles
// ============================================================

const MESSAGES = [
  { from: 'them', text: 'Hey! How\'s the pretext integration going?' },
  { from: 'me', text: 'Pretty well! CJK measurement is now pixel-perfect with the native module.' },
  { from: 'them', text: '支持中文吗？' },
  { from: 'me', text: '当然！And emoji too 🎉' },
  { from: 'them', text: 'What about long URLs like https://example.com/reports/q3?lang=ar&mode=full — do they break properly?' },
  { from: 'me', text: 'Yep, pretext breaks at punctuation boundaries. layout() is pure arithmetic on cached widths.' },
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

function BubblesDemo() {
  const { width: windowWidth } = useWindowDimensions()
  const maxBubble = windowWidth - 48 - 40

  const bubbles = useMemo(() => {
    return MESSAGES.map((msg) => {
      const p = prepare(msg.text, FONT)
      const cssWidth = Math.min(maxBubble, 280)
      const tightWidth = findTightWidth(p, cssWidth)
      return { ...msg, tightWidth, saved: cssWidth - tightWidth }
    })
  }, [maxBubble])

  return (
    <View style={styles.card}>
      {bubbles.map((b, i) => {
        const isMe = b.from === 'me'
        return (
          <View key={i} style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
            <View
              style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem, { width: b.tightWidth + 24 }]}
            >
              <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{MESSAGES[i].text}</Text>
            </View>
            {b.saved > 2 && <Text style={styles.bubbleSaved}>-{b.saved}px</Text>}
          </View>
        )
      })}
    </View>
  )
}

// ============================================================
// Masonry
// ============================================================

const MASONRY_TEXTS = [
  'Pretext computes text dimensions without the DOM.',
  '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。',
  'Each card height is predicted by pretext. No DOM read needed.',
  '🚀 Rocket science isn\'t that hard — "go up and don\'t come down too fast" 🌍💨',
  'The prepare() function segments text via Intl.Segmenter, measures each segment, and caches widths.',
  '云对雨，雪对风，晚照对晴空。',
  'Binary search for tight container width: walkLineRanges() counts lines.',
  'Trans\u00ADatlantic ship\u00ADments of un\u00ADbreak\u00ADable mer\u00ADchan\u00ADdise.',
]

function MasonryDemo() {
  const { width: windowWidth } = useWindowDimensions()
  const gap = 8, cols = 2
  const colWidth = (windowWidth - 48 - gap * (cols - 1)) / cols
  const textWidth = colWidth - 16

  const cards = useMemo(() => {
    return MASONRY_TEXTS.map((text) => {
      const p = prepare(text, FONT)
      return { text, height: layout(p, textWidth, LH).height + 24 }
    })
  }, [textWidth])

  const colHeights = Array(cols).fill(0)
  const positioned = cards.map((card) => {
    const shortest = colHeights.indexOf(Math.min(...colHeights))
    const pos = { x: shortest * (colWidth + gap), y: colHeights[shortest], ...card }
    colHeights[shortest] += card.height + gap
    return pos
  })

  return (
    <View style={[styles.card, { height: Math.max(...colHeights) }]}>
      {positioned.map((card, i) => (
        <View key={i} style={[styles.masonryCard, { left: card.x, top: card.y, width: colWidth, height: card.height }]}>
          <Text style={styles.masonryText}>{card.text}</Text>
        </View>
      ))}
    </View>
  )
}

// ============================================================
// Segments
// ============================================================

const SEGMENT_EXAMPLES = [
  { label: 'English', text: 'Hello, world! How are you?' },
  { label: 'CJK', text: '中文，测试。日本語テスト' },
  { label: 'Mixed', text: 'Hello 世界 مرحبا 🌍' },
  { label: 'URL', text: 'see https://example.com/reports/q3?lang=ar now' },
  { label: 'Soft hyphen', text: 'trans\u00ADatlantic ship\u00ADments' },
  { label: 'Numeric', text: 'window 7:00-9:00 only SSN 420-69-8008' },
]

function SegmentsDemo() {
  const [active, setActive] = useState(0)
  const example = SEGMENT_EXAMPLES[active]
  const prepared = useMemo(() => prepareWithSegments(example.text, FONT), [example.text])
  const segs = (prepared as any).segments as string[]
  const kinds = (prepared as any).kinds as string[]

  return (
    <View style={styles.card}>
      <View style={styles.chipRow}>
        {SEGMENT_EXAMPLES.map((ex, i) => (
          <Pressable
            key={i}
            style={[styles.miniChip, active === i && styles.miniChipActive]}
            onPress={() => setActive(i)}
          >
            <Text style={[styles.miniChipText, active === i && styles.miniChipTextActive]}>{ex.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.segInput}>"{example.text}"</Text>
      <View style={styles.segRow}>
        {segs.map((seg, i) => (
          <View key={i} style={[styles.segChip, kinds[i] === 'space' && styles.segSpace]}>
            <Text style={styles.segText}>{seg.replace(/ /g, '\u00B7').replace(/\u00AD/g, '\u00B7')}</Text>
            <Text style={styles.segKind}>{kinds[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ============================================================
// Main
// ============================================================

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDesc}>{desc}</Text>
      {children}
    </View>
  )
}

export default function IndexTab() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pretext Demos</Text>
      <Text style={styles.subtitle}>
        @chenglou/pretext on React Native — text measurement without the DOM
      </Text>

      <DemoList />

      <Section
        title="Accordion"
        desc="Expand/collapse with pretext-measured heights. Pure arithmetic, no DOM read."
      >
        <AccordionDemo />
      </Section>

      <Section
        title="Bubbles"
        desc="Chat bubbles tight-wrapped to minimum width. Green = saved pixels."
      >
        <BubblesDemo />
      </Section>

      <Section
        title="Masonry"
        desc="Text-card grid with pretext height prediction. Cards placed into shortest column."
      >
        <MasonryDemo />
      </Section>

      <Section
        title="Segmentation"
        desc="How Intl.Segmenter + pretext breaks text into segments."
      >
        <SegmentsDemo />
      </Section>
    </ScrollView>
  )
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 },

  // Demo list
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 12,
    overflow: 'hidden',
  },
  demoLink: { paddingVertical: 12 },
  demoLinkBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e0e0e0' },
  demoLinkHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  demoLinkTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  demoTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  demoTagDot: { width: 6, height: 6, borderRadius: 3 },
  demoTagText: { fontSize: 10, fontWeight: '600' },
  demoLinkDesc: { fontSize: 12, color: '#888', lineHeight: 16 },

  // Sections
  section: { marginTop: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 18 },
  meta: { fontSize: 10, color: '#aaa', marginTop: 4 },

  // Accordion
  accordionItem: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e0e0e0', paddingVertical: 8 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accordionTitle: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1 },
  accordionArrow: { fontSize: 18, color: '#999', width: 24, textAlign: 'center' },
  accordionBody: { fontSize: 14, lineHeight: 20, color: '#555', paddingTop: 8 },

  // Bubbles
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleThem: { backgroundColor: '#e8e8e8' },
  bubbleMe: { backgroundColor: '#007AFF' },
  bubbleText: { fontSize: 14, lineHeight: 20, color: '#333' },
  bubbleTextMe: { color: '#fff' },
  bubbleSaved: { fontSize: 9, color: '#999', marginLeft: 4, marginBottom: 2 },

  // Masonry
  masonryCard: { position: 'absolute', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', padding: 8 },
  masonryText: { fontSize: 14, lineHeight: 20, color: '#444' },

  // Segments
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  miniChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#ccc' },
  miniChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  miniChipText: { fontSize: 11, color: '#333' },
  miniChipTextActive: { color: '#fff' },
  segInput: { fontSize: 12, fontFamily: 'monospace', color: '#666', marginBottom: 8 },
  segRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  segChip: { backgroundColor: '#e8f0fe', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  segSpace: { backgroundColor: '#fff3cd' },
  segText: { fontSize: 11, fontFamily: 'monospace', color: '#333' },
  segKind: { fontSize: 8, color: '#888', textAlign: 'center' },
})
