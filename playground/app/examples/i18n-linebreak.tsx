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
import { prepareWithSegments, layoutWithLines } from 'rn-pretext'

// ============================================================
// I18n Line-Breaking Visualization
// ============================================================
// Shows how pretext breaks text in different scripts, with
// visual indicators for break points, segment boundaries,
// and line-by-line analysis.
// ============================================================

const FONT = '16px System'
const LH = 24

interface LanguageExample {
  id: string
  label: string
  flag: string
  text: string
  notes: string
}

const EXAMPLES: LanguageExample[] = [
  {
    id: 'en',
    label: 'English',
    flag: 'EN',
    text: 'The quick brown fox jumps over the lazy dog. Pretext handles word boundaries, soft hyphens, and URL-like sequences correctly.',
    notes: 'Breaks at word boundaries (spaces). Punctuation attaches to preceding word.',
  },
  {
    id: 'cjk',
    label: 'Chinese',
    flag: 'ZH',
    text: '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。闰余成岁，律吕调阳。云腾致雨，露结为霜。',
    notes: 'Character-by-character breaking. Kinsoku rules prevent commas/periods at line start.',
  },
  {
    id: 'ja',
    label: 'Japanese',
    flag: 'JA',
    text: '吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。',
    notes: 'Mixed kanji/hiragana. Kinsoku prevents starting lines with small kana or closing brackets.',
  },
  {
    id: 'ko',
    label: 'Korean',
    flag: 'KO',
    text: '모든 인간은 태어날 때부터 자유로우며 그 존엄과 권리에 있어 동등하다. 인간은 천부적으로 이성과 양심을 부여받았으며 서로 형제애의 정신으로 행동하여야 한다.',
    notes: 'Breaks at syllable boundaries. Postpositions attach to their preceding word.',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    flag: 'MX',
    text: 'React Native支持多语言文本排版。Japanese: こんにちは世界! Korean: 안녕하세요! Numbers: 12,345.67 and URLs: https://example.com/path',
    notes: 'Script transitions create natural break opportunities. Each script follows its own rules.',
  },
  {
    id: 'hyphen',
    label: 'Soft Hyphens',
    flag: 'SH',
    text: 'Su\u00ADper\u00ADca\u00ADli\u00ADfra\u00ADgi\u00ADlis\u00ADtic\u00ADex\u00ADpi\u00ADa\u00ADli\u00ADdo\u00ADcious and trans\u00ADat\u00ADlan\u00ADtic ship\u00ADments of un\u00ADbreak\u00ADa\u00ADble mer\u00ADchan\u00ADdise.',
    notes: 'Soft hyphens (\\u00AD) are invisible until the line breaks there, then shown as "-".',
  },
  {
    id: 'emoji',
    label: 'Emoji',
    flag: 'EM',
    text: '👨‍👩‍👧‍👦 Family emoji 🏳️‍🌈 Flag sequences 👋🏽 Skin tones 🧑‍💻🧑‍🎨🧑‍🚀 ZWJ sequences and 1️⃣2️⃣3️⃣ keycaps!',
    notes: 'Multi-codepoint sequences (ZWJ, modifiers) are kept together as single graphemes.',
  },
]

function BreakPointViz({
  text,
  maxWidth,
}: {
  text: string
  maxWidth: number
}) {
  const prepared = useMemo(
    () => prepareWithSegments(text, FONT),
    [text],
  )
  const result = useMemo(
    () => layoutWithLines(prepared, maxWidth, LH),
    [prepared, maxWidth],
  )

  const segs = (prepared as any).segments as string[]
  const kinds = (prepared as any).kinds as string[]

  return (
    <View>
      {/* Line-by-line visualization */}
      <View style={styles.linesContainer}>
        {result.lines.map((line, i) => (
          <View key={i} style={styles.lineViz}>
            <View style={styles.lineHeader}>
              <Text style={styles.lineNum}>L{i + 1}</Text>
              <View
                style={[
                  styles.lineWidthBar,
                  { width: `${(line.width / maxWidth) * 100}%` },
                ]}
              />
              <Text style={styles.lineWidthText}>
                {Math.round(line.width)}px ({Math.round((line.width / maxWidth) * 100)}%)
              </Text>
            </View>
            <View style={[styles.lineTextBox, { maxWidth }]}>
              <Text style={styles.lineText}>{line.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Segment visualization */}
      <Text style={styles.segLabel}>Segments</Text>
      <View style={styles.segRow}>
        {segs.map((seg, i) => {
          const kind = kinds[i]
          const bgColor =
            kind === 'space'
              ? '#fff3cd'
              : kind === 'cjk'
                ? '#d1ecf1'
                : kind === 'emoji'
                  ? '#f8d7da'
                  : kind === 'punctuation'
                    ? '#e2e3e5'
                    : kind === 'url'
                      ? '#cce5ff'
                      : '#d4edda'
          return (
            <View key={i} style={[styles.segChip, { backgroundColor: bgColor }]}>
              <Text style={styles.segText}>
                {seg
                  .replace(/ /g, '\u00B7')
                  .replace(/\u00AD/g, '\u00B7')
                  .replace(/\n/g, '\u21B5')}
              </Text>
              <Text style={styles.segKind}>{kind}</Text>
            </View>
          )
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        {[
          { kind: 'word', color: '#d4edda' },
          { kind: 'space', color: '#fff3cd' },
          { kind: 'cjk', color: '#d1ecf1' },
          { kind: 'emoji', color: '#f8d7da' },
          { kind: 'punct', color: '#e2e3e5' },
          { kind: 'url', color: '#cce5ff' },
        ].map(({ kind, color }) => (
          <View key={kind} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{kind}</Text>
          </View>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {result.lines.length} lines | {segs.length} segments | {result.height}px height
        </Text>
      </View>
    </View>
  )
}

export default function I18nLineBreak() {
  const { width: windowWidth } = useWindowDimensions()
  const maxContainerWidth = windowWidth - 48
  const [activeIdx, setActiveIdx] = useState(0)
  const [widthPct, setWidthPct] = useState(80)
  const maxWidth = Math.max(80, Math.round(maxContainerWidth * widthPct / 100))

  const example = EXAMPLES[activeIdx]

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>I18n Line Breaking</Text>
      <Text style={styles.desc}>
        Visualize how pretext breaks text across different scripts and languages.
        Each script has unique rules for where lines can break.
      </Text>

      <View style={styles.chipRow}>
        {EXAMPLES.map((ex, i) => (
          <Pressable
            key={ex.id}
            style={[styles.chip, activeIdx === i && styles.chipActive]}
            onPress={() => setActiveIdx(i)}
          >
            <Text style={[styles.chipFlag, activeIdx === i && styles.chipFlagActive]}>
              {ex.flag}
            </Text>
            <Text style={[styles.chipText, activeIdx === i && styles.chipTextActive]}>
              {ex.label}
            </Text>
          </Pressable>
        ))}
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
        <Text style={styles.sliderVal}>{maxWidth}px</Text>
      </View>

      <View style={styles.notesCard}>
        <Text style={styles.notesText}>{example.notes}</Text>
      </View>

      <BreakPointViz text={example.text} maxWidth={maxWidth} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  desc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 16 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipFlag: { fontSize: 10, fontWeight: '800', color: '#666' },
  chipFlagActive: { color: '#fff' },
  chipText: { fontSize: 12, color: '#333' },
  chipTextActive: { color: '#fff' },

  sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sliderLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  slider: { flex: 1, height: 36 },
  sliderVal: { fontSize: 12, color: '#888', width: 50, textAlign: 'right' },

  notesCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  notesText: { fontSize: 12, color: '#1e40af', lineHeight: 16 },

  linesContainer: { marginBottom: 16 },
  lineViz: { marginBottom: 8 },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  lineNum: { fontSize: 10, fontWeight: '700', color: '#999', width: 22 },
  lineWidthBar: {
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
    flex: 1,
  },
  lineWidthText: { fontSize: 9, color: '#999', width: 80, textAlign: 'right' },
  lineTextBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 28,
  },
  lineText: { fontSize: 14, lineHeight: 20, color: '#333' },

  segLabel: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 6 },
  segRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10 },
  segChip: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  segText: { fontSize: 11, fontFamily: 'monospace', color: '#333' },
  segKind: { fontSize: 8, color: '#666', textAlign: 'center' },

  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 9, color: '#888' },

  statsRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 8,
  },
  statsText: { fontSize: 11, color: '#999', textAlign: 'center' },
})
