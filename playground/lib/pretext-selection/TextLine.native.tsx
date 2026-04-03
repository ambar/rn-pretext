import { Platform, Text, StyleSheet, type TextStyle } from 'react-native'
import type { LayoutLine } from 'rn-pretext'

function parseFont(font: string): Pick<TextStyle, 'fontSize' | 'fontFamily'> {
  const m = font.trim().match(/^(\d+(?:\.\d+)?)px\s+(.+)$/i)
  if (m) {
    return { fontSize: parseFloat(m[1]), fontFamily: m[2].trim() }
  }
  return { fontSize: 16 }
}

export function TextLine({
  line,
  top,
  font,
  lineHeight,
}: {
  line: LayoutLine
  top: number
  font: string
  lineHeight: number
}) {
  const f = parseFont(font)
  return (
    <Text
      style={[
        styles.line,
        Platform.OS === 'android' ? styles.lineAndroid : null,
        {
          top,
          fontSize: f.fontSize,
          fontFamily: f.fontFamily,
          lineHeight,
        },
      ]}
    >
      {line.text}
    </Text>
  )
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 0,
    width: 9999,
    color: '#000',
  },
  lineAndroid: {
    includeFontPadding: false,
  },
})
