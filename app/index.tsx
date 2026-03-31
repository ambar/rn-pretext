import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import {
  prepare,
  layout,
  prepareWithSegments,
  layoutWithLines,
} from "../src/pretext";

const FONT = "16px System";
const LINE_HEIGHT = 24;

const SAMPLE_TEXT =
  "Pretext is a pure JavaScript library for multiline text measurement and layout. " +
  "It computes text dimensions without touching the DOM — avoiding expensive layout reflow. " +
  "This text is being measured and laid out by pretext running on React Native, " +
  "with @shopify/react-native-skia providing the text measurement backend.";

export default function Index() {
  const [width, setWidth] = useState(320);
  const [text, setText] = useState(SAMPLE_TEXT);

  const prepared = prepare(text, FONT);
  const result = layout(prepared, width, LINE_HEIGHT);

  const preparedWithSegs = prepareWithSegments(text, FONT);
  const linesResult = layoutWithLines(preparedWithSegs, width, LINE_HEIGHT);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pretext + React Native</Text>
      <Text style={styles.subtitle}>Text measurement via Skia</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Container width: {width}px</Text>
        <TextInput
          style={styles.slider}
          keyboardType="numeric"
          value={String(width)}
          onChangeText={(v) => {
            const n = parseInt(v, 10);
            if (!isNaN(n) && n > 0) setWidth(n);
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Input text:</Text>
        <TextInput
          style={styles.textInput}
          multiline
          value={text}
          onChangeText={setText}
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
          <View key={i} style={styles.lineRow}>
            <Text style={styles.lineNumber}>{i + 1}</Text>
            <Text style={styles.lineText} numberOfLines={1}>
              {line.text}
            </Text>
            <Text style={styles.lineWidth}>{Math.round(line.width)}px</Text>
          </View>
        ))}
      </View>

      <View style={[styles.section, styles.preview]}>
        <Text style={styles.label}>Preview ({width}px container):</Text>
        <View style={[styles.previewBox, { width }]}>
          <Text style={styles.previewText}>{text}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
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
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  resultBox: {
    flexDirection: "row",
    gap: 16,
    backgroundColor: "#f0f7ff",
    padding: 12,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0066cc",
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  lineNumber: {
    width: 28,
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
  },
  lineText: {
    flex: 1,
    fontSize: 13,
    color: "#333",
    fontFamily: "monospace",
  },
  lineWidth: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
  preview: {
    marginBottom: 40,
  },
  previewBox: {
    borderWidth: 1,
    borderColor: "#0066cc",
    borderStyle: "dashed",
    padding: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  previewText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
