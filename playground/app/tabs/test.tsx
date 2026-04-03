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
import {
  prepare,
  prepareWithSegments,
  layout,
  layoutWithLines,
  layoutNextLine,
  walkLineRanges,
  type LayoutCursor,
  type LayoutLine,
  type PreparedTextWithSegments,
} from 'rn-pretext'

const FONT = '16px System'
const LH = 24
const MIN_W = 120

// --- Demo data ---

const DEMOS = [
  {
    id: 'basic',
    title: 'prepare + layout',
    desc: 'One-time measurement, then pure arithmetic on every resize.',
    text: 'Pretext computes text dimensions without the DOM. This makes resize operations extremely fast — about 0.09ms for 500 texts.',
  },
  {
    id: 'lines',
    title: 'layoutWithLines',
    desc: 'Returns per-line text, width, and cursor positions.',
    text: 'Each line knows its text content, measured width, and start/end cursors for hit-testing and selection.',
  },
  {
    id: 'streaming',
    title: 'layoutNextLine (streaming)',
    desc: 'Iterator-style API — request one line at a time. Enables variable-width layouts (floats, columns, obstacles).',
    text: 'This text is laid out line by line. Each call to layoutNextLine returns the next line and advances the cursor. Pass the previous line.end as the next start.',
  },
  {
    id: 'tightwrap',
    title: 'walkLineRanges (tight wrap)',
    desc: 'Binary search for the tightest container width that keeps the same line count — like chat bubble shrink-wrap.',
    text: 'Hello, this is a chat message that should shrink-wrap to its tightest possible width!',
  },
  {
    id: 'prewrap',
    title: 'whiteSpace: pre-wrap',
    desc: 'Preserves spaces, tabs, and newlines. Tabs align to tab stops.',
    text: '  Hello   World  \n\tIndented\t\twith tabs\nLine 3',
  },
  {
    id: 'cjk',
    title: 'CJK text',
    desc: 'Per-character breaking with kinsoku (punctuation attachment) rules.',
    text: '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。',
  },
  {
    id: 'mixed',
    title: 'Mixed scripts',
    desc: 'CJK + Latin + Arabic + emoji in one paragraph.',
    text: 'Hello 世界 مرحبا 🌍 — pretext handles mixed scripts with proper break opportunities at script boundaries.',
  },
  {
    id: 'softhyphen',
    title: 'Soft hyphens',
    desc: 'Discretionary break points — visible as "-" only when the line breaks there.',
    text: 'Trans\u00ADatlantic ship\u00ADments of un\u00ADbreak\u00ADable mer\u00ADchan\u00ADdise arrived yes\u00ADter\u00ADday.',
  },
  {
    id: 'emoji',
    title: 'Emoji & modifiers',
    desc: 'Multi-codepoint emoji sequences measured correctly.',
    text: '🚀 Rocket science 🧪 H₂O + ☀️ = 🌈 Science is magic! 💃🕺 From 🔬 to 🔭 we keep looking 👨‍👩‍👧‍👦',
  },
  {
    id: 'url',
    title: 'URLs & punctuation',
    desc: 'URLs break at punctuation boundaries, keeping path segments together.',
    text: 'See https://example.com/reports/q3?lang=ar&mode=full for details.',
  },
] as const

type DemoId = (typeof DEMOS)[number]['id']

// --- Helpers ---

function collectStreamedLines(prepared: PreparedTextWithSegments, maxWidth: number): LayoutLine[] {
  const lines: LayoutLine[] = []
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  while (true) {
    const line = layoutNextLine(prepared, cursor, maxWidth)
    if (!line) break
    lines.push(line)
    cursor = line.end
  }
  return lines
}

function findTightWidth(prepared: PreparedTextWithSegments, maxWidth: number): number {
  const target = layout(prepared, maxWidth, LH).lineCount
  let lo = 1
  let hi = Math.ceil(maxWidth)
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (layout(prepared, mid, LH).lineCount <= target) {
      hi = mid
    } else {
      lo = mid + 1
    }
  }
  return lo
}

// --- Components ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function LinesTable({ lines }: { lines: LayoutLine[] }) {
  return (
    <View>
      {lines.map((line, i) => (
        <View key={i} style={styles.lineRow}>
          <Text style={styles.lineNum}>{i + 1}</Text>
          <Text style={styles.lineText} numberOfLines={1}>{line.text}</Text>
          <Text style={styles.lineW}>{Math.round(line.width)}px</Text>
        </View>
      ))}
    </View>
  )
}

function SegmentsView({ prepared }: { prepared: PreparedTextWithSegments }) {
  const segs = (prepared as any).segments as string[]
  const kinds = (prepared as any).kinds as string[]
  return (
    <View style={styles.segRow}>
      {segs.map((seg, i) => (
        <View key={i} style={[styles.segChip, kinds[i] === 'space' && styles.segSpace]}>
          <Text style={styles.segText} numberOfLines={1}>
            {seg.replace(/ /g, '\u00B7').replace(/\t/g, '\u2192').replace(/\n/g, '\u21B5')}
          </Text>
          <Text style={styles.segKind}>{kinds[i]}</Text>
        </View>
      ))}
    </View>
  )
}

// --- Demo renderers ---

function BasicDemo({ text, width }: { text: string; width: number }) {
  const prepared = useMemo(() => prepare(text, FONT), [text])
  const result = layout(prepared, width, LH)
  return (
    <>
      <View style={styles.resultBox}>
        <Text style={styles.resultVal}>{result.lineCount} lines</Text>
        <Text style={styles.resultVal}>{result.height}px height</Text>
      </View>
      <Text style={styles.code}>
        {`prepare(text, "${FONT}")\nlayout(prepared, ${width}, ${LH})`}
      </Text>
    </>
  )
}

function LinesDemo({ text, width }: { text: string; width: number }) {
  const prepared = useMemo(() => prepareWithSegments(text, FONT), [text])
  const result = layoutWithLines(prepared, width, LH)
  return (
    <>
      <LinesTable lines={result.lines} />
      <Section title="Segments">
        <SegmentsView prepared={prepared} />
      </Section>
    </>
  )
}

function StreamingDemo({ text, width }: { text: string; width: number }) {
  const prepared = useMemo(() => prepareWithSegments(text, FONT), [text])
  const lines = useMemo(() => collectStreamedLines(prepared, width), [prepared, width])
  const batchedLines = useMemo(() => layoutWithLines(prepared, width, LH).lines, [prepared, width])

  const match = lines.length === batchedLines.length &&
    lines.every((l, i) => l.text === batchedLines[i].text)

  return (
    <>
      <LinesTable lines={lines} />
      <View style={[styles.badge, match ? styles.badgeOk : styles.badgeErr]}>
        <Text style={styles.badgeText}>
          {match ? 'Matches layoutWithLines' : 'MISMATCH with layoutWithLines!'}
        </Text>
      </View>
    </>
  )
}

function TightWrapDemo({ text, width }: { text: string; width: number }) {
  const prepared = useMemo(() => prepareWithSegments(text, FONT), [text])
  const normalResult = layout(prepared, width, LH)

  let maxLineWidth = 0
  walkLineRanges(prepared, width, (line) => {
    if (line.width > maxLineWidth) maxLineWidth = line.width
  })

  const tightWidth = useMemo(() => findTightWidth(prepared, width), [prepared, width])
  const tightResult = layout(prepared, tightWidth, LH)
  const saved = width - tightWidth

  return (
    <>
      <View style={styles.resultBox}>
        <Text style={styles.resultVal}>CSS width: {width}px</Text>
        <Text style={styles.resultVal}>Max line: {Math.round(maxLineWidth)}px</Text>
      </View>
      <View style={[styles.resultBox, { marginTop: 8 }]}>
        <Text style={[styles.resultVal, { color: '#059669' }]}>
          Tight: {tightWidth}px (-{saved}px)
        </Text>
        <Text style={styles.resultVal}>{tightResult.lineCount} lines</Text>
      </View>
      <View style={{ marginTop: 12, flexDirection: 'row', gap: 12 }}>
        <View style={[styles.previewBox, { width, borderColor: '#ccc' }]}>
          <Text style={styles.previewLabel}>Normal</Text>
          <Text style={styles.previewText}>{text}</Text>
        </View>
        <View style={[styles.previewBox, { width: tightWidth, borderColor: '#059669' }]}>
          <Text style={[styles.previewLabel, { color: '#059669' }]}>Tight</Text>
          <Text style={styles.previewText}>{text}</Text>
        </View>
      </View>
    </>
  )
}

function PreWrapDemo({ text, width }: { text: string; width: number }) {
  const prepared = useMemo(() => prepareWithSegments(text, FONT, { whiteSpace: 'pre-wrap' }), [text])
  const result = layoutWithLines(prepared, width, LH)
  return (
    <>
      <Section title="Segments (spaces/tabs/newlines preserved)">
        <SegmentsView prepared={prepared} />
      </Section>
      <Section title="Lines">
        <LinesTable lines={result.lines} />
      </Section>
    </>
  )
}

function TextDemo({ text, width }: { text: string; width: number }) {
  const prepared = useMemo(() => prepareWithSegments(text, FONT), [text])
  const result = layoutWithLines(prepared, width, LH)
  return (
    <>
      <Section title="Segments">
        <SegmentsView prepared={prepared} />
      </Section>
      <Section title={`Lines (${result.lineCount})`}>
        <LinesTable lines={result.lines} />
      </Section>
      <View style={[styles.previewBox, { width }]}>
        <Text style={styles.previewText}>{text}</Text>
      </View>
    </>
  )
}

// --- Main ---

export default function TestTab() {
  const { width: windowWidth } = useWindowDimensions()
  const maxW = Math.max(MIN_W, Math.floor(windowWidth - 48))
  const [width, setWidth] = useState(() => Math.min(300, maxW))
  const [activeDemo, setActiveDemo] = useState<DemoId>('basic')

  const demo = DEMOS.find((d) => d.id === activeDemo)!

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pretext API Demos</Text>
      <Text style={styles.subtitle}>All @chenglou/pretext APIs on React Native</Text>

      <View style={styles.chipRow}>
        {DEMOS.map((d) => (
          <Pressable
            key={d.id}
            style={[styles.chip, activeDemo === d.id && styles.chipActive]}
            onPress={() => setActiveDemo(d.id)}
          >
            <Text style={[styles.chipText, activeDemo === d.id && styles.chipTextActive]}>
              {d.title}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.desc}>{demo.desc}</Text>

      <View style={styles.sliderRow}>
        <Text style={styles.label}>Width: {width}px</Text>
        <Slider
          style={styles.slider}
          minimumValue={MIN_W}
          maximumValue={maxW}
          value={width}
          step={1}
          onValueChange={(v) => setWidth(Math.round(v))}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#ddd"
          thumbTintColor="#007AFF"
        />
      </View>

      <View style={styles.demoContent}>
        {activeDemo === 'basic' && <BasicDemo text={demo.text} width={width} />}
        {activeDemo === 'lines' && <LinesDemo text={demo.text} width={width} />}
        {activeDemo === 'streaming' && <StreamingDemo text={demo.text} width={width} />}
        {activeDemo === 'tightwrap' && <TightWrapDemo text={demo.text} width={width} />}
        {activeDemo === 'prewrap' && <PreWrapDemo text={demo.text} width={width} />}
        {(activeDemo === 'cjk' ||
          activeDemo === 'mixed' ||
          activeDemo === 'softhyphen' ||
          activeDemo === 'emoji' ||
          activeDemo === 'url') && <TextDemo text={demo.text} width={width} />}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  desc: { fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 12, color: '#333' },
  chipTextActive: { color: '#fff' },
  sliderRow: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4 },
  slider: { width: '100%', height: 36 },
  demoContent: { marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8 },
  resultBox: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#f0f7ff',
    padding: 10,
    borderRadius: 8,
  },
  resultVal: { fontSize: 15, fontWeight: '600', color: '#0066cc' },
  code: {
    marginTop: 8,
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 6,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  lineNum: { width: 24, fontSize: 11, color: '#999', fontWeight: '600' },
  lineText: { flex: 1, fontSize: 12, color: '#333', fontFamily: 'monospace' },
  lineW: { fontSize: 11, color: '#999', marginLeft: 8 },
  segRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  segChip: {
    backgroundColor: '#e8f0fe',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  segSpace: { backgroundColor: '#fff3cd' },
  segText: { fontSize: 11, fontFamily: 'monospace', color: '#333' },
  segKind: { fontSize: 9, color: '#888', textAlign: 'center' },
  badge: { marginTop: 8, padding: 8, borderRadius: 6, alignSelf: 'flex-start' },
  badgeOk: { backgroundColor: '#d1fae5' },
  badgeErr: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  previewBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#0066cc',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  previewLabel: { fontSize: 10, color: '#999', marginBottom: 4 },
  previewText: { fontSize: 16, lineHeight: 24 },
})
