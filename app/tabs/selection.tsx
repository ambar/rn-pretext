import { useEffect, useMemo, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import Slider from '@react-native-community/slider'
import { SelectableDocument } from '../../lib/pretext-selection/SelectableDocument'
import { buildSelectionDemoDocument } from '../../lib/pretext-selection/selection-demo-data'

const FONT = '16px System'
const MIN_WIDTH = 200

export default function SelectionTab() {
  const { width: windowWidth } = useWindowDimensions()
  const sliderMax = Math.max(MIN_WIDTH, Math.floor(windowWidth))

  const [maxWidth, setMaxWidth] = useState(() =>
    Math.min(600, Math.max(MIN_WIDTH, Math.floor(windowWidth))),
  )

  useEffect(() => {
    setMaxWidth((w) => Math.min(Math.max(w, MIN_WIDTH), sliderMax))
  }, [sliderMax])

  const document = useMemo(
    () => buildSelectionDemoDocument(maxWidth, FONT),
    [maxWidth],
  )

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Cross-paragraph text selection</Text>
      <Text style={styles.subtitle}>
        Powered by @chenglou/pretext — long-press (~0.5s), then drag to select
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>
          Container width: {maxWidth}px (max {sliderMax}px, screen width)
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={MIN_WIDTH}
          maximumValue={sliderMax}
          value={maxWidth}
          step={1}
          onValueChange={(v) => setMaxWidth(Math.round(v))}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#ddd"
          thumbTintColor="#007AFF"
        />
      </View>

      <View style={styles.docWrap}>
        <SelectableDocument document={document} />
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
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
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
  docWrap: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fafafa',
  },
})
