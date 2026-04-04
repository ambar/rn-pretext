import { useMemo, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { prepareWithSegments, layoutWithLines } from 'rn-pretext'

// ============================================================
// Text Cursor & Caret Positioning
// ============================================================
// Uses layoutWithLines() to get per-line data with precise
// character positions, enabling pixel-accurate cursor placement
// — the foundation for any text editor built with pretext.
// ============================================================

const FONT = '16px System'
const FONT_SIZE = 16
const LH = 24

const SAMPLE_TEXTS = [
  'Hello, world! Tap any character to place the cursor. Each position is computed from pretext line data.',
  '中文排版示例：天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。',
  'Mixed: Hello 世界! Emoji 🎉 and soft\u00ADhyphens in trans\u00ADatlantic.',
]

interface CharPosition {
  line: number
  indexInLine: number
  x: number
  y: number
  char: string
}

function buildCharPositions(
  text: string,
  maxWidth: number,
): { positions: CharPosition[]; lines: { text: string; width: number }[] } {
  const prepared = prepareWithSegments(text, FONT)
  const result = layoutWithLines(prepared, maxWidth, LH)
  const positions: CharPosition[] = []

  let globalIdx = 0
  for (let lineIdx = 0; lineIdx < result.lines.length; lineIdx++) {
    const line = result.lines[lineIdx]
    const lineText = line.text

    // Measure each character's x offset within the line
    let x = 0
    for (let ci = 0; ci < lineText.length; ci++) {
      const ch = lineText[ci]
      // Get character width by measuring substring
      const charPrepared = prepareWithSegments(ch, FONT)
      const charWidth = charPrepared.widths
        ? (charPrepared.widths as number[]).reduce((a: number, b: number) => a + b, 0)
        : FONT_SIZE * 0.6 // fallback

      positions.push({
        line: lineIdx,
        indexInLine: ci,
        x,
        y: lineIdx * LH,
        char: ch,
      })
      x += charWidth
      globalIdx++
    }
  }

  return {
    positions,
    lines: result.lines.map((l) => ({ text: l.text, width: l.width })),
  }
}

export default function TextCursor() {
  const { width: windowWidth } = useWindowDimensions()
  const maxWidth = windowWidth - 48 - 32
  const [textIdx, setTextIdx] = useState(0)
  const [cursorIdx, setCursorIdx] = useState(0)

  const text = SAMPLE_TEXTS[textIdx]
  const { positions, lines } = useMemo(
    () => buildCharPositions(text, maxWidth),
    [text, maxWidth],
  )

  const cursorPos = positions[Math.min(cursorIdx, positions.length - 1)]

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Text Cursor & Caret</Text>
      <Text style={styles.desc}>
        layoutWithLines() provides per-line text and widths. Tap characters
        below to place a blinking cursor at computed pixel coordinates.
      </Text>

      <View style={styles.chipRow}>
        {SAMPLE_TEXTS.map((_, i) => (
          <Pressable
            key={i}
            style={[styles.chip, textIdx === i && styles.chipActive]}
            onPress={() => { setTextIdx(i); setCursorIdx(0) }}
          >
            <Text style={[styles.chipText, textIdx === i && styles.chipTextActive]}>
              {['English', 'CJK', 'Mixed'][i]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Text display with cursor */}
      <View style={styles.editorCard}>
        <View style={{ height: lines.length * LH, position: 'relative' }}>
          {/* Render line backgrounds */}
          {lines.map((line, i) => (
            <View
              key={`bg-${i}`}
              style={[
                styles.lineBg,
                { top: i * LH, height: LH },
                i % 2 === 0 && styles.lineBgAlt,
              ]}
            />
          ))}

          {/* Render text lines */}
          {lines.map((line, i) => (
            <Text
              key={`text-${i}`}
              style={[styles.lineText, { top: i * LH, height: LH, lineHeight: LH }]}
            >
              {line.text}
            </Text>
          ))}

          {/* Cursor */}
          {cursorPos && (
            <View
              style={[
                styles.cursor,
                { left: cursorPos.x, top: cursorPos.y },
              ]}
            />
          )}

          {/* Invisible tap targets */}
          {positions.map((pos, i) => (
            <Pressable
              key={i}
              style={[
                styles.tapTarget,
                { left: pos.x, top: pos.y, width: FONT_SIZE * 0.8, height: LH },
              ]}
              onPress={() => setCursorIdx(i)}
            />
          ))}
        </View>
      </View>

      {/* Cursor info */}
      {cursorPos && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Cursor Position</Text>
          <View style={styles.infoGrid}>
            <InfoItem label="Character" value={`"${cursorPos.char}"`} />
            <InfoItem label="Line" value={String(cursorPos.line + 1)} />
            <InfoItem label="Column" value={String(cursorPos.indexInLine + 1)} />
            <InfoItem label="X offset" value={`${Math.round(cursorPos.x)}px`} />
            <InfoItem label="Y offset" value={`${cursorPos.y}px`} />
          </View>
        </View>
      )}

      {/* Per-line data */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Line Data from layoutWithLines()</Text>
        {lines.map((line, i) => (
          <View key={i} style={styles.lineInfo}>
            <Text style={styles.lineNum}>L{i + 1}</Text>
            <Text style={styles.lineContent} numberOfLines={1}>
              {line.text}
            </Text>
            <Text style={styles.lineWidth}>{Math.round(line.width)}px</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  desc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 16 },

  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
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

  editorCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  lineBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  lineBgAlt: { backgroundColor: 'rgba(255,255,255,0.03)' },
  lineText: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: FONT_SIZE,
    color: '#cdd6f4',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: LH - 4,
    marginTop: 2,
    backgroundColor: '#f9e2af',
    borderRadius: 1,
  },
  tapTarget: { position: 'absolute' },

  infoCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 16,
    marginBottom: 12,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    minWidth: 80,
  },
  infoLabel: { fontSize: 10, color: '#999', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#333', fontFamily: 'monospace' },

  lineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  lineNum: { fontSize: 11, fontWeight: '600', color: '#999', width: 28 },
  lineContent: { flex: 1, fontSize: 12, fontFamily: 'monospace', color: '#555' },
  lineWidth: { fontSize: 11, color: '#888', marginLeft: 8 },
})
