import { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { Stack } from 'expo-router'
import { prepare, layout } from 'rn-pretext'

const FONT = '14px System'
const LH = 20

const MASONRY_TEXTS = [
  'Pretext computes text dimensions without the DOM.',
  '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。',
  'Each card height is predicted by pretext. No DOM read needed.',
  '🚀 Rocket science isn\'t that hard — "go up and don\'t come down too fast" 🌍💨',
  'The prepare() function segments text via Intl.Segmenter, measures each segment, and caches widths.',
  '云对雨，雪对风，晚照对晴空。',
  'Binary search for tight container width: walkLineRanges() counts lines.',
  'Trans\u00ADatlantic ship\u00ADments of un\u00ADbreak\u00ADable mer\u00ADchan\u00ADdise.',
]

export default function MasonryScreen() {
  const { width: windowWidth } = useWindowDimensions()
  const gap = 8, cols = 2
  const colWidth = (windowWidth - 48 - gap * (cols - 1)) / cols
  const textWidth = colWidth - 16

  const cards = useMemo(() => {
    return MASONRY_TEXTS.map((text) => {
      const p = prepare(text, FONT)
      return { text, height: layout(p, textWidth, LH).height + 24 }
    })
  }, [textWidth])

  const colHeights = Array(cols).fill(0)
  const positioned = cards.map((card) => {
    const shortest = colHeights.indexOf(Math.min(...colHeights))
    const pos = { x: shortest * (colWidth + gap), y: colHeights[shortest], ...card }
    colHeights[shortest] += card.height + gap
    return pos
  })

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Masonry' }} />
      <Text style={styles.desc}>
        Text-card grid with pretext height prediction. Cards placed into shortest column.
      </Text>
      <View style={[styles.card, { height: Math.max(...colHeights) }]}>
        {positioned.map((card, i) => (
          <View key={i} style={[styles.masonryCard, { left: card.x, top: card.y, width: colWidth, height: card.height }]}>
            <Text style={styles.masonryText}>{card.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  desc: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 18 },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 12,
    overflow: 'hidden',
  },
  masonryCard: { position: 'absolute', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', padding: 8 },
  masonryText: { fontSize: 14, lineHeight: 20, color: '#444' },
})
