import { useEffect, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import Slider from '@react-native-community/slider'
import {
  prepare,
  layout,
  prepareWithSegments,
  layoutWithLines,
} from '../../src/pretext'
import { DEMO_PRESETS } from '../../lib/pretext-selection/selection-demo-data'

const FONT = '16px System'
const LINE_HEIGHT = 24

const DEFAULT_TEXT =
  'Pretext is a pure JavaScript library for multiline text measurement and layout. ' +
  'It computes text dimensions without touching the DOM — avoiding expensive layout reflow. ' +
  'This text is being measured and laid out by pretext running on React Native, ' +
  'with @shopify/react-native-skia providing the text measurement backend.'

const TEXT_PRESETS = [
  { label: 'Default', text: DEFAULT_TEXT },
  ...DEMO_PRESETS.map((p) => ({
    label: p.label,
    text: p.paragraphs.join('\n\n'),
  })),
]

const MIN_WIDTH = 200

export default function PretextTab() {
  const { width: windowWidth } = useWindowDimensions()
  const sliderMax = Math.max(MIN_WIDTH, Math.floor(windowWidth))

  const [width, setWidth] = useState(() =>
    Math.min(320, Math.max(MIN_WIDTH, Math.floor(windowWidth))),
  )
  const [text, setText] = useState(TEXT_PRESETS[0].text)
  const [activePreset, setActivePreset] = useState(0)

  useEffect(() => {
    setWidth((w) => Math.min(Math.max(w, MIN_WIDTH), sliderMax))
  }, [sliderMax])

  const prepared = prepare(text, FONT)
  const result = layout(prepared, width, LINE_HEIGHT)

  const preparedWithSegs = prepareWithSegments(text, FONT)
  const linesResult = layoutWithLines(preparedWithSegs, width, LINE_HEIGHT)

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Pretext + React Native</Text>
      <Text style={styles.subtitle}>Text measurement via Skia</Text>

      <View style={styles.section}>
        <Text style={styles.label}>
          Container width: {width}px (max {sliderMax}px)
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={MIN_WIDTH}
          maximumValue={sliderMax}
          value={width}
          step={1}
          onValueChange={(v) => setWidth(Math.round(v))}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#ddd"
          thumbTintColor="#007AFF"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Presets</Text>
        <View style={styles.presetRow}>
          {TEXT_PRESETS.map((preset, i) => (
            <Pressable
              key={i}
              style={[
                styles.presetChip,
                activePreset === i && styles.presetChipActive,
              ]}
              onPress={() => {
                setActivePreset(i)
                setText(preset.text)
              }}
            >
              <Text
                style={[
                  styles.presetChipText,
                  activePreset === i && styles.presetChipTextActive,
                ]}
              >
                {preset.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Input text:</Text>
        <TextInput
          style={styles.textInput}
          multiline
          value={text}
          onChangeText={(v) => {
            setText(v)
            setActivePreset(-1)
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Layout result:</Text>
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>Lines: {result.lineCount}</Text>
          <Text style={styles.resultText}>Height: {result.height}px</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Line-by-line breakdown:</Text>
        {linesResult.lines.map((line, i) => (
          <View key={`line-${i}-${Math.round(line.width)}`} style={styles.lineRow}>
            <Text style={styles.lineNumber}>{i + 1}</Text>
            <Text style={styles.lineText} numberOfLines={1}>
              {line.text}
            </Text>
            <Text style={styles.lineWidth}>{Math.round(line.width)}px</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Preview ({width}px container):</Text>
        <View style={[styles.previewBox, { width }]}>
          <Text style={styles.previewText}>{text}</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  resultBox: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  lineNumber: {
    width: 28,
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  lineText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontFamily: 'monospace',
  },
  lineWidth: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  previewBox: {
    borderWidth: 1,
    borderColor: '#0066cc',
    borderStyle: 'dashed',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  previewText: {
    fontSize: 16,
    lineHeight: 24,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  presetChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  presetChipText: {
    fontSize: 13,
    color: '#333',
  },
  presetChipTextActive: {
    color: '#fff',
  },
})
