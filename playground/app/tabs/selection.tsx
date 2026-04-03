import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { SelectableDocument } from "../../lib/pretext-selection/SelectableDocument";
import {
  buildSelectionDemoDocument,
  DEMO_PRESETS,
} from "../../lib/pretext-selection/selection-demo-data";

const FONT = "16px System";
const MIN_WIDTH = 200;

function paragraphsToText(paragraphs: string[]) {
  return paragraphs.join("\n\n");
}

function textToParagraphs(text: string) {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function SelectionTab() {
  const { width: windowWidth } = useWindowDimensions();
  const sliderMax = Math.max(MIN_WIDTH, Math.floor(windowWidth - 50));

  const [maxWidth, setMaxWidth] = useState(() =>
    Math.min(600, Math.max(MIN_WIDTH, Math.floor(windowWidth))),
  );
  const [activePreset, setActivePreset] = useState(3);
  const [customText, setCustomText] = useState(() =>
    paragraphsToText(DEMO_PRESETS[3].paragraphs),
  );
  const docRef = useRef<View>(null);

  async function shareAsImage() {
    try {
      const uri = await captureRef(docRef, { format: "png", quality: 1 });
      await Sharing.shareAsync(uri);
    } catch (e: any) {
      Alert.alert("Share failed", e.message);
    }
  }

  useEffect(() => {
    setMaxWidth((w) => Math.min(Math.max(w, MIN_WIDTH), sliderMax));
  }, [sliderMax]);

  const paragraphs = useMemo(() => textToParagraphs(customText), [customText]);

  const document = useMemo(
    () =>
      buildSelectionDemoDocument(
        maxWidth,
        FONT,
        undefined,
        undefined,
        paragraphs.length > 0 ? paragraphs : undefined,
      ),
    [maxWidth, paragraphs],
  );

  function selectPreset(index: number) {
    setActivePreset(index);
    setCustomText(paragraphsToText(DEMO_PRESETS[index].paragraphs));
  }

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
          Container width: {maxWidth}px (max {sliderMax}px)
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

      <View ref={docRef} collapsable={false} style={styles.docWrap}>
        <SelectableDocument document={document} />
      </View>

      <Pressable style={styles.shareBtn} onPress={shareAsImage}>
        <Text style={styles.shareBtnText}>Share as Image</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.label}>Presets</Text>
        <View style={styles.presetRow}>
          {DEMO_PRESETS.map((preset, i) => (
            <Pressable
              key={i}
              style={[
                styles.presetChip,
                activePreset === i && styles.presetChipActive,
              ]}
              onPress={() => selectPreset(i)}
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
        <Text style={styles.label}>
          Custom text (separate paragraphs with blank lines)
        </Text>
        <TextInput
          style={styles.textInput}
          value={customText}
          onChangeText={(text) => {
            setCustomText(text);
            setActivePreset(-1);
          }}
          multiline
          textAlignVertical="top"
          placeholder="Type your text here…"
          placeholderTextColor="#999"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  docWrap: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 0,
    backgroundColor: "#fafafa",
    marginBottom: 20,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  presetChipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  presetChipText: {
    fontSize: 13,
    color: "#333",
  },
  presetChipTextActive: {
    color: "#fff",
  },
  shareBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    backgroundColor: "#fff",
    color: "#333",
  },
});
