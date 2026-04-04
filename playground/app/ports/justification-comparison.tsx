import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Slider from '@react-native-community/slider'
import { prepareWithSegments, layoutWithLines } from 'rn-pretext'
import { Stack } from 'expo-router'

const FONT = '14px System'
const LH = 20

const PARAGRAPHS = [
  'Typography is the art and technique of arranging type to make written language legible, readable and appealing when displayed. The arrangement of type involves selecting typefaces, point sizes, line lengths, line-spacing, and letter-spacing.',
  'Justification is the typographic alignment setting of text or images within a column or measure. There are four common methods: left, right, center, and justified. Fully justified text has its left and right edges flush with the margins.',
  '排版是安排文字使其美观可读的艺术。中文排版需要考虑标点禁则、行首行尾规则，以及中英文混排时的间距处理。Pretext 支持这些规则。',
]

export default function JustificationComparisonDemo() {
  const { width: windowWidth } = useWindowDimensions()
  const maxW = windowWidth - 32
  const [width, setWidth] = useState(Math.min(300, maxW))

  const prepared = useMemo(
    () => PARAGRAPHS.map((p) => prepareWithSegments(p, FONT)),
    [],
  )

  const layouts = useMemo(
    () => prepared.map((p) => layoutWithLines(p, width, LH)),
    [prepared, width],
  )

  return (
    <>
      <Stack.Screen options={{ title: 'Justification Compared' }} />
      <View style={styles.sliderCard}>
        <Text style={styles.label}>Width: {width}px</Text>
        <Slider
          style={styles.slider}
          minimumValue={150}
          maximumValue={maxW}
          value={width}
          step={1}
          onValueChange={(v) => setWidth(Math.round(v))}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#ddd"
          thumbTintColor="#007AFF"
        />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.desc}>
          Side-by-side: pretext greedy layout vs RN native Text.
          Red bars show wasted space at line ends in greedy mode.
          Compare where each engine chooses to break.
        </Text>

        {PARAGRAPHS.map((para, pi) => (
          <View key={pi} style={styles.paraSection}>
            <View style={styles.columns}>
              <View style={{ width }}>
                <Text style={styles.colLabel}>Pretext (greedy)</Text>
                <View style={[styles.textBox, { width }]}>
                  {layouts[pi].lines.map((line, li) => {
                    const isLast = li === layouts[pi].lines.length - 1
                    const slack = width - line.width
                    return (
                      <View key={li} style={{ height: LH, position: 'relative' }}>
                        <Text style={styles.lineText}>{line.text}</Text>
                        {!isLast && slack > 1 && (
                          <View
                            style={[
                              styles.slackBar,
                              { width: slack, right: 0 },
                            ]}
                          />
                        )}
                      </View>
                    )
                  })}
                </View>
                <Text style={styles.meta}>
                  {layouts[pi].lineCount} lines, max slack{' '}
                  {Math.round(
                    Math.max(
                      ...layouts[pi].lines
                        .slice(0, -1)
                        .map((l) => width - l.width),
                      0,
                    ),
                  )}
                  px
                </Text>
              </View>

              <View style={{ width }}>
                <Text style={styles.colLabel}>RN native</Text>
                <View style={[styles.textBox, { width }]}>
                  <Text style={styles.nativeText}>{para}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 60 },
  desc: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 18 },
  sliderCard: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: '#fff' },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4 },
  slider: { width: '100%', height: 36 },
  paraSection: { marginBottom: 24 },
  columns: { gap: 12 },
  colLabel: { fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 4 },
  textBox: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 4, padding: 6, overflow: 'hidden' },
  lineText: { fontSize: 14, lineHeight: LH, color: '#333' },
  nativeText: { fontSize: 14, lineHeight: LH, color: '#333' },
  slackBar: { position: 'absolute', top: 0, height: LH, backgroundColor: 'rgba(220, 38, 38, 0.1)' },
  meta: { fontSize: 10, color: '#aaa', marginTop: 4 },
})
