import { useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'

// ============================================================
// Demo list — links to sub-pages
// ============================================================

const DEMO_LINKS = [
  {
    href: '/ports/editorial-engine',
    title: 'The Editorial Engine',
    tag: 'Layout',
    tagColor: '#FF9500',
    desc: 'Multi-column editorial layout with draggable orbs and real-time text reflow at 60fps.',
  },
  {
    href: '/ports/fluid-smoke',
    title: 'Fluid Smoke',
    tag: 'ASCII Art',
    tagColor: '#30B0C7',
    desc: 'Full-screen fluid simulation rendered as proportional typographic ASCII.',
  },
  {
    href: '/ports/justification-comparison',
    title: 'Justification Compared',
    tag: 'Layout',
    tagColor: '#FF9500',
    desc: 'Side-by-side CSS greedy, hyphenated, and Knuth-Plass optimal justification with river detection.',
  },
  {
    href: '/ports/variable-ascii',
    title: 'Variable Typographic ASCII',
    tag: 'ASCII Art',
    tagColor: '#30B0C7',
    desc: 'Particle system mapped to characters selected by brightness and width across 3 weights.',
  },
  {
    href: '/ports/shrinkwrap-showdown',
    title: 'Shrinkwrap Showdown',
    tag: 'Layout',
    tagColor: '#FF9500',
    desc: 'CSS fit-content vs pretext — finding the exact tightest width for multiline text.',
  },
  {
    href: '/ports/accordion',
    title: 'Accordion',
    tag: 'Layout',
    tagColor: '#FF9500',
    desc: 'Expand/collapse with pretext-measured heights. Pure arithmetic, no DOM read.',
  },
  {
    href: '/ports/masonry',
    title: 'Masonry',
    tag: 'Layout',
    tagColor: '#FF9500',
    desc: 'Text-card grid with pretext height prediction. Cards placed into shortest column.',
  },
] as const

const EXAMPLE_LINKS = [
  {
    href: '/examples/responsive-typography',
    title: 'Responsive Typography',
    tag: 'Typography',
    tagColor: '#AF52DE',
    desc: 'Binary search for the largest font size that fits a headline on one line.',
  },
  {
    href: '/examples/text-cursor',
    title: 'Text Cursor & Caret',
    tag: 'Editor',
    tagColor: '#FF2D55',
    desc: 'Pixel-accurate cursor positioning using layoutWithLines() per-line data.',
  },
  {
    href: '/examples/char-animation',
    title: 'Character Animation',
    tag: 'Animation',
    tagColor: '#5856D6',
    desc: 'Per-character entrance animations with positions from prepareWithSegments().',
  },
  {
    href: '/examples/perf-benchmark',
    title: 'Performance Benchmark',
    tag: 'Perf',
    tagColor: '#34C759',
    desc: 'Measure and visualize the two-phase performance model: prepare() vs layout().',
  },
  {
    href: '/examples/i18n-linebreak',
    title: 'I18n Line Breaking',
    tag: 'I18n',
    tagColor: '#FF9500',
    desc: 'Visualize line-breaking rules across CJK, Latin, emoji, and mixed scripts.',
  },
  {
    href: '/examples/shape-wrapping',
    title: 'Shape Wrapping',
    tag: 'Layout',
    tagColor: '#007AFF',
    desc: 'Text flowing around circles, diamonds, and custom shapes via layoutNextLine().',
  },
  {
    href: '/examples/virtual-scroll',
    title: 'Virtual Scroll',
    tag: 'Perf',
    tagColor: '#34C759',
    desc: '1000-item virtual list with pixel-perfect height prediction. No DOM reads.',
  },
  {
    href: '/examples/reflow-animation',
    title: 'Reflow Animation',
    tag: 'Animation',
    tagColor: '#5856D6',
    desc: 'Characters morph smoothly between two container widths during reflow.',
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

function ExampleList() {
  const router = useRouter()
  return (
    <View style={styles.card}>
      {EXAMPLE_LINKS.map((ex, i) => (
        <Pressable
          key={i}
          style={[styles.demoLink, i < EXAMPLE_LINKS.length - 1 && styles.demoLinkBorder]}
          onPress={() => router.push(ex.href)}
        >
          <View style={styles.demoLinkHeader}>
            <Text style={styles.demoLinkTitle}>{ex.title}</Text>
            <View style={[styles.demoTag, { backgroundColor: ex.tagColor + '18' }]}>
              <View style={[styles.demoTagDot, { backgroundColor: ex.tagColor }]} />
              <Text style={[styles.demoTagText, { color: ex.tagColor }]}>{ex.tag}</Text>
            </View>
          </View>
          <Text style={styles.demoLinkDesc}>{ex.desc}</Text>
        </Pressable>
      ))}
    </View>
  )
}

// ============================================================
// Main
// ============================================================

const TABS = ['Ports', 'Examples'] as const

export default function IndexTab() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Ports')

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pretext Demos</Text>
      <Text style={styles.subtitle}>
        @chenglou/pretext on React Native — text measurement without the DOM
      </Text>

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'Ports' ? (
        <DemoList />
      ) : (
        <ExampleList />
      )}
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
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 20 },

  // Tab bar
  tabBar: { flexDirection: 'row', gap: 0, marginBottom: 16, borderRadius: 8, backgroundColor: '#f0f0f0', padding: 3 },
  tab: { flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  tabText: { fontSize: 13, fontWeight: '600', color: '#999' },
  tabTextActive: { color: '#333' },

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


})
