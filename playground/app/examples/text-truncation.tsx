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
import { prepare, layout } from 'rn-pretext'

// ============================================================
// Text Truncation with Expand Button
// ============================================================
// Uses prepare() + layout() to compute the actual line count,
// then only shows an "expand" button when text is truly
// truncated — no onTextLayout, no DOM measurement needed.
// ============================================================

const FONT = '14px System'
const LH = 20

const SAMPLES = [
  {
    title: 'Short Text',
    text: 'This is a short sentence that fits in one line.',
  },
  {
    title: 'Medium Paragraph',
    text: 'Pretext computes text dimensions without the DOM. This makes resize extremely fast. The two-phase model separates measurement from layout, allowing instant reflow.',
  },
  {
    title: 'Long Article',
    text: 'React Native supports multiline text measurement through native modules. Using CoreText on iOS and Paint on Android ensures zero drift with the platform rendering engine. This is critical for virtual lists where height prediction must match rendered height exactly. Each card height is predicted by pretext. No DOM read needed for virtual lists. Binary search plus walkLineRanges equals tight-wrapped chat bubbles. Pure arithmetic after the initial measurement pass. The quick brown fox jumps over the lazy dog.',
  },
  {
    title: 'CJK Content',
    text: '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。闰余成岁，律吕调阳。云腾致雨，露结为霜。金生丽水，玉出昆冈。剑号巨阙，珠称夜光。果珍李柰，菜重芥姜。海咸河淡，鳞潜羽翔。',
  },
  {
    title: 'Mixed Scripts',
    text: 'Hello 世界！React Native 支持多语言排版。Japanese: こんにちは世界！Korean: 안녕하세요！Each script follows its own line-breaking rules. Pretext handles all of them correctly with a single prepare() call. Numbers like 12,345.67 and URLs like https://example.com/path are also handled.',
  },
]

function TruncatedCard({
  title,
  text,
  maxLines,
  containerWidth,
}: {
  title: string
  text: string
  maxLines: number
  containerWidth: number
}) {
  const [expanded, setExpanded] = useState(false)

  const { lineCount, isTruncated, fullHeight, truncatedHeight } = useMemo(() => {
    const prepared = prepare(text, FONT)
    const result = layout(prepared, containerWidth, LH)
    const isTruncated = result.lineCount > maxLines
    return {
      lineCount: result.lineCount,
      isTruncated,
      fullHeight: result.height,
      truncatedHeight: maxLines * LH,
    }
  }, [text, containerWidth, maxLines])

  const displayHeight = expanded ? fullHeight : truncatedHeight

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.linesBadge}>
          <Text style={styles.linesBadgeText}>
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </Text>
        </View>
      </View>

      <View style={[styles.textBox, { height: displayHeight }]}>
        <Text style={styles.textContent} numberOfLines={expanded ? undefined : maxLines}>
          {text}
        </Text>
      </View>

      {isTruncated && (
        <Pressable
          style={styles.expandBtn}
          onPress={() => setExpanded((e) => !e)}
        >
          <Text style={styles.expandText}>
            {expanded ? 'Collapse' : `Expand (${lineCount - maxLines} more lines)`}
          </Text>
        </Pressable>
      )}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {isTruncated ? (expanded ? 'Showing all' : 'Truncated') : 'Fits'} · {Math.round(fullHeight)}px full · {Math.round(truncatedHeight)}px limit
        </Text>
      </View>
    </View>
  )
}

export default function TextTruncation() {
  const { width: windowWidth } = useWindowDimensions()
  const maxContainerWidth = windowWidth - 48
  const [maxLines, setMaxLines] = useState(3)
  const [widthPct, setWidthPct] = useState(100)
  const containerWidth = Math.max(80, Math.round(maxContainerWidth * widthPct / 100))

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Text Truncation</Text>
      <Text style={styles.desc}>
        prepare() + layout() computes the actual line count. The expand button
        only appears when the text is truly truncated — zero guesswork.
      </Text>

      <View style={styles.controls}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Max Lines</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={maxLines}
            onValueChange={setMaxLines}
            minimumTrackTintColor="#007AFF"
          />
          <Text style={styles.sliderVal}>{maxLines}</Text>
        </View>

        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Width</Text>
          <Slider
            style={styles.slider}
            minimumValue={30}
            maximumValue={100}
            value={widthPct}
            onValueChange={setWidthPct}
            minimumTrackTintColor="#007AFF"
          />
          <Text style={styles.sliderVal}>{containerWidth}px</Text>
        </View>
      </View>

      {SAMPLES.map((sample, i) => (
        <TruncatedCard
          key={i}
          title={sample.title}
          text={sample.text}
          maxLines={maxLines}
          containerWidth={containerWidth}
        />
      ))}

      <View style={styles.codeCard}>
        <Text style={styles.codeTitle}>How it works</Text>
        <Text style={styles.code}>
          {`const prepared = prepare(text, font)
const { lineCount } = layout(prepared, width, LH)
const isTruncated = lineCount > maxLines

// Only render expand button when truly needed
{isTruncated && <ExpandButton />}`}
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

  controls: { marginBottom: 20 },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sliderLabel: { fontSize: 13, fontWeight: '600', color: '#333', width: 64 },
  slider: { flex: 1, height: 36 },
  sliderVal: { fontSize: 12, color: '#888', width: 50, textAlign: 'right' },

  card: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  linesBadge: {
    backgroundColor: '#e5e5e5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  linesBadgeText: { fontSize: 11, fontWeight: '600', color: '#666' },

  textBox: { overflow: 'hidden' },
  textContent: { fontSize: 14, lineHeight: LH, color: '#444' },

  expandBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF10',
    borderRadius: 6,
  },
  expandText: { fontSize: 13, fontWeight: '600', color: '#007AFF' },

  metaRow: { marginTop: 8 },
  metaText: { fontSize: 11, color: '#999' },

  codeCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  codeTitle: { fontSize: 12, fontWeight: '600', color: '#89b4fa', marginBottom: 8 },
  code: { fontSize: 11, fontFamily: 'monospace', color: '#cdd6f4', lineHeight: 16 },
})
