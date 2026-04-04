import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { prepare, layout } from 'rn-pretext'

// ============================================================
// Virtual Scroll with Pretext Height Prediction
// ============================================================
// Demonstrates using prepare() + layout() to predict the exact
// pixel height of every item in a list WITHOUT rendering them,
// enabling efficient virtual scrolling with accurate positions.
// ============================================================

const FONT = '14px System'
const LH = 20
const ITEM_PADDING = 16
const ITEM_MARGIN = 8
const ITEM_BORDER = 2 // top + bottom border

// Generate a large list of varied-length items
const ITEMS = (() => {
  const texts = [
    'Short text.',
    'A medium length text that spans a couple of lines in most screen widths.',
    'Pretext computes text dimensions without the DOM. This makes resize extremely fast — about 0.09ms for 500 texts. The two-phase model separates measurement from layout.',
    '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。',
    'The quick brown fox jumps over the lazy dog.',
    'React Native supports multiline text measurement through native modules. Using CoreText on iOS and Paint on Android ensures zero drift with the platform rendering engine. This is critical for virtual lists where height prediction must match rendered height exactly.',
    '🚀 Rocket science is just "go up, don\'t come down too fast" — easy, right?',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    '每一张卡片的高度都由 pretext 预测，无需 DOM 读取。这使得虚拟滚动列表可以精确地定位每一项。',
    'Binary search + walkLineRanges = tight-wrapped chat bubbles. Pure arithmetic after the initial measurement pass.',
  ]
  const items: { id: number; text: string; author: string }[] = []
  const authors = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']
  for (let i = 0; i < 1000; i++) {
    items.push({
      id: i,
      text: texts[i % texts.length],
      author: authors[i % authors.length],
    })
  }
  return items
})()

const OVERSCAN = 5

interface ItemLayout {
  text: string
  author: string
  textHeight: number
  totalHeight: number
  y: number
}

export default function VirtualScroll() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const textWidth = windowWidth - 48 - ITEM_PADDING * 2
  const viewportHeight = windowHeight - 120
  const [scrollY, setScrollY] = useState(0)

  // Phase 1: Predict all heights upfront using pretext
  const { items, totalHeight, prepareTimeMs, layoutTimeMs } = useMemo(() => {
    const prepStart = performance.now()
    const prepared = ITEMS.map((item) => prepare(item.text, FONT))
    const prepEnd = performance.now()

    const layoutStart = performance.now()
    let y = 0
    const itemLayouts: ItemLayout[] = ITEMS.map((item, i) => {
      const { height: textHeight } = layout(prepared[i], textWidth, LH)
      const authorHeight = 18
      const totalHeight = textHeight + authorHeight + ITEM_PADDING * 2 + ITEM_MARGIN + ITEM_BORDER
      const result = {
        text: item.text,
        author: item.author,
        textHeight,
        totalHeight,
        y,
      }
      y += totalHeight
      return result
    })
    const layoutEnd = performance.now()

    return {
      items: itemLayouts,
      totalHeight: y,
      prepareTimeMs: Math.round((prepEnd - prepStart) * 100) / 100,
      layoutTimeMs: Math.round((layoutEnd - layoutStart) * 100) / 100,
    }
  }, [textWidth])

  // Phase 2: Determine visible range using binary search
  const { startIdx, endIdx } = useMemo(() => {
    // Binary search for first visible item
    let lo = 0
    let hi = items.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (items[mid].y + items[mid].totalHeight < scrollY) {
        lo = mid + 1
      } else {
        hi = mid
      }
    }
    const startIdx = Math.max(0, lo - OVERSCAN)

    // Find last visible
    const endY = scrollY + viewportHeight
    let end = lo
    while (end < items.length && items[end].y < endY) {
      end++
    }
    const endIdx = Math.min(items.length - 1, end + OVERSCAN)

    return { startIdx, endIdx }
  }, [items, scrollY, viewportHeight])

  const visibleItems = items.slice(startIdx, endIdx + 1)
  const visibleCount = endIdx - startIdx + 1

  const handleScroll = useCallback(
    (e: any) => {
      setScrollY(e.nativeEvent.contentOffset.y)
    },
    [],
  )

  return (
    <View style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statGroup}>
          <Text style={styles.statLabel}>Items</Text>
          <Text style={styles.statValue}>{ITEMS.length}</Text>
        </View>
        <View style={styles.statGroup}>
          <Text style={styles.statLabel}>Visible</Text>
          <Text style={styles.statValue}>{visibleCount}</Text>
        </View>
        <View style={styles.statGroup}>
          <Text style={styles.statLabel}>prepare()</Text>
          <Text style={styles.statValue}>{prepareTimeMs}ms</Text>
        </View>
        <View style={styles.statGroup}>
          <Text style={styles.statLabel}>layout()</Text>
          <Text style={styles.statValue}>{layoutTimeMs}ms</Text>
        </View>
        <View style={styles.statGroup}>
          <Text style={styles.statLabel}>Total H</Text>
          <Text style={styles.statValue}>{Math.round(totalHeight)}px</Text>
        </View>
      </View>

      {/* Scroll position indicator */}
      <View style={styles.scrollIndicator}>
        <View
          style={[
            styles.scrollThumb,
            {
              top: `${(scrollY / totalHeight) * 100}%`,
              height: `${(viewportHeight / totalHeight) * 100}%`,
            },
          ]}
        />
      </View>

      {/* Virtual scroll area */}
      <ScrollView
        style={[styles.scrollView, { height: viewportHeight }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Spacer for total content height */}
        <View style={{ height: totalHeight }}>
          {/* Only render visible items */}
          {visibleItems.map((item, i) => {
            const idx = startIdx + i
            return (
              <View
                key={idx}
                style={[
                  styles.item,
                  {
                    position: 'absolute',
                    top: item.y,
                    left: 0,
                    right: 0,
                    height: item.totalHeight - ITEM_MARGIN,
                  },
                ]}
              >
                <Text style={styles.itemText}>{item.text}</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemAuthor}>{item.author}</Text>
                  <Text style={styles.itemIdx}>#{idx}</Text>
                  <Text style={styles.itemHeight}>
                    {item.textHeight}px text | {item.totalHeight}px total
                  </Text>
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>

      {/* Info bar */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          Rendering {visibleCount} of {ITEMS.length} items ({startIdx}–{endIdx}).
          Heights predicted by prepare() + layout() — no DOM reads.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1e1e2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  statGroup: { alignItems: 'center' },
  statLabel: { fontSize: 9, color: '#888', marginBottom: 2 },
  statValue: { fontSize: 12, fontWeight: '700', color: '#cdd6f4', fontFamily: 'monospace' },

  scrollIndicator: {
    position: 'absolute',
    right: 2,
    top: 50,
    bottom: 40,
    width: 4,
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
    zIndex: 10,
  },
  scrollThumb: {
    position: 'absolute',
    width: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
    minHeight: 20,
  },

  scrollView: { flex: 1 },

  item: {
    marginHorizontal: 16,
    marginBottom: ITEM_MARGIN,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: ITEM_PADDING,
  },
  itemText: { fontSize: 14, lineHeight: LH, color: '#333' },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  itemAuthor: { fontSize: 11, fontWeight: '600', color: '#007AFF' },
  itemIdx: { fontSize: 10, color: '#ccc' },
  itemHeight: { fontSize: 10, color: '#999', marginLeft: 'auto' },

  infoBar: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoText: { fontSize: 11, color: '#1e40af', lineHeight: 16 },
})
