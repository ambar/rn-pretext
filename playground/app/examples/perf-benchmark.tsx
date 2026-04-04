import { useCallback, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { prepare, prepareWithSegments, layout, layoutWithLines } from 'rn-pretext'

// ============================================================
// Performance Benchmark
// ============================================================
// Measures and visualizes the two-phase performance model:
// Phase 1 (prepare): native measurement, slow but cached
// Phase 2 (layout): pure arithmetic, extremely fast
// ============================================================

const FONT = '14px System'
const LH = 20

const SAMPLE_TEXTS = [
  'The quick brown fox jumps over the lazy dog.',
  '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。',
  'Hello 世界 مرحبا 🌍 — mixed scripts with proper break opportunities.',
  'Pretext computes text dimensions without the DOM. This makes resize extremely fast.',
  '🚀 Rocket science 🧪 H₂O + ☀️ = 🌈 Science is magic! 💃🕺 From 🔬 to 🔭',
  'See https://example.com/reports/q3?lang=ar&mode=full for details on the API.',
  'Trans\u00ADatlantic ship\u00ADments of un\u00ADbreak\u00ADable mer\u00ADchan\u00ADdise arrived yes\u00ADter\u00ADday.',
  'Each card height is predicted by pretext. No DOM read needed for virtual lists.',
  '云对雨，雪对风，晚照对晴空。来鸿对去燕，宿鸟对鸣虫。',
  'Binary search for tight container width: walkLineRanges() counts lines.',
]

interface BenchResult {
  name: string
  count: number
  totalMs: number
  avgMs: number
  opsPerSec: number
}

function runBenchmark(
  name: string,
  fn: () => void,
  count: number,
): BenchResult {
  const start = performance.now()
  for (let i = 0; i < count; i++) {
    fn()
  }
  const totalMs = performance.now() - start
  return {
    name,
    count,
    totalMs: Math.round(totalMs * 100) / 100,
    avgMs: Math.round((totalMs / count) * 1000) / 1000,
    opsPerSec: Math.round(count / (totalMs / 1000)),
  }
}

function ResultCard({ result }: { result: BenchResult }) {
  const isfast = result.avgMs < 0.1
  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultName}>{result.name}</Text>
        <View style={[styles.speedBadge, isfast ? styles.speedFast : styles.speedNormal]}>
          <Text style={styles.speedText}>
            {isfast ? 'FAST' : 'NORMAL'}
          </Text>
        </View>
      </View>

      <View style={styles.barContainer}>
        <View
          style={[
            styles.bar,
            {
              width: `${Math.min(100, result.avgMs * 500)}%`,
              backgroundColor: isfast ? '#34d399' : '#fbbf24',
            },
          ]}
        />
      </View>

      <View style={styles.resultStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{result.avgMs}ms</Text>
          <Text style={styles.statLabel}>avg/op</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{result.totalMs}ms</Text>
          <Text style={styles.statLabel}>total</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {result.opsPerSec >= 1000
              ? `${(result.opsPerSec / 1000).toFixed(1)}K`
              : result.opsPerSec}
          </Text>
          <Text style={styles.statLabel}>ops/sec</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{result.count}</Text>
          <Text style={styles.statLabel}>iterations</Text>
        </View>
      </View>
    </View>
  )
}

export default function PerfBenchmark() {
  const [results, setResults] = useState<BenchResult[]>([])
  const [running, setRunning] = useState(false)

  const runAll = useCallback(() => {
    setRunning(true)
    // Use setTimeout to let the UI update before blocking
    setTimeout(() => {
      const newResults: BenchResult[] = []
      const widths = [200, 300, 400]

      // Benchmark 1: prepare() — first call (uncached)
      // Clear any cached state by using unique texts
      const uniqueTexts = SAMPLE_TEXTS.map((t, i) => t + ' '.repeat(i + 1))
      newResults.push(
        runBenchmark('prepare() — 10 texts', () => {
          for (const t of uniqueTexts) {
            prepare(t, FONT)
          }
        }, 50),
      )

      // Benchmark 2: prepareWithSegments()
      newResults.push(
        runBenchmark('prepareWithSegments() — 10 texts', () => {
          for (const t of SAMPLE_TEXTS) {
            prepareWithSegments(t, FONT)
          }
        }, 50),
      )

      // Pre-prepare for layout benchmarks
      const prepared = SAMPLE_TEXTS.map((t) => prepare(t, FONT))
      const preparedWithSegs = SAMPLE_TEXTS.map((t) => prepareWithSegments(t, FONT))

      // Benchmark 3: layout() — the fast path
      newResults.push(
        runBenchmark('layout() — 10 texts x 3 widths', () => {
          for (const p of prepared) {
            for (const w of widths) {
              layout(p, w, LH)
            }
          }
        }, 500),
      )

      // Benchmark 4: layoutWithLines()
      newResults.push(
        runBenchmark('layoutWithLines() — 10 texts x 3 widths', () => {
          for (const p of preparedWithSegs) {
            for (const w of widths) {
              layoutWithLines(p, w, LH)
            }
          }
        }, 200),
      )

      // Benchmark 5: Batch scenario — virtual list height prediction
      newResults.push(
        runBenchmark('Virtual list: 500 layout() calls', () => {
          for (let i = 0; i < 500; i++) {
            layout(prepared[i % prepared.length], 300, LH)
          }
        }, 100),
      )

      // Benchmark 6: Resize scenario — 1 text at 100 different widths
      const oneText = prepared[0]
      newResults.push(
        runBenchmark('Resize: 1 text x 100 widths', () => {
          for (let w = 100; w < 500; w += 4) {
            layout(oneText, w, LH)
          }
        }, 200),
      )

      setResults(newResults)
      setRunning(false)
    }, 50)
  }, [])

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Performance Benchmark</Text>
      <Text style={styles.desc}>
        Pretext's two-phase model: prepare() measures once (native call),
        layout() computes at any width (pure arithmetic). Tap below to benchmark.
      </Text>

      <View style={styles.phaseCard}>
        <View style={styles.phaseRow}>
          <View style={[styles.phaseDot, { backgroundColor: '#fbbf24' }]} />
          <View style={styles.phaseInfo}>
            <Text style={styles.phaseTitle}>Phase 1: prepare()</Text>
            <Text style={styles.phaseDesc}>Native measurement call. Slow but cached.</Text>
          </View>
        </View>
        <View style={styles.phaseDivider} />
        <View style={styles.phaseRow}>
          <View style={[styles.phaseDot, { backgroundColor: '#34d399' }]} />
          <View style={styles.phaseInfo}>
            <Text style={styles.phaseTitle}>Phase 2: layout()</Text>
            <Text style={styles.phaseDesc}>Pure arithmetic. Extremely fast, no native calls.</Text>
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.runBtn, running && styles.runBtnDisabled]}
        onPress={running ? undefined : runAll}
      >
        <Text style={styles.runBtnText}>
          {running ? 'Running...' : results.length > 0 ? 'Run Again' : 'Run Benchmarks'}
        </Text>
      </Pressable>

      {results.map((r, i) => (
        <ResultCard key={i} result={r} />
      ))}

      {results.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Key Takeaway</Text>
          <Text style={styles.summaryText}>
            layout() is orders of magnitude faster than prepare() because it
            performs only arithmetic on cached character widths. This means
            resize/reflow operations are nearly free — perfect for responsive
            layouts, window resize handlers, and virtual scrolling.
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  desc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 16 },

  phaseCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 16,
    marginBottom: 16,
  },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  phaseDot: { width: 10, height: 10, borderRadius: 5 },
  phaseInfo: { flex: 1 },
  phaseTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  phaseDesc: { fontSize: 12, color: '#888' },
  phaseDivider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 12,
  },

  runBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  runBtnDisabled: { opacity: 0.5 },
  runBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  resultCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 16,
    marginBottom: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: { fontSize: 13, fontWeight: '600', color: '#333', flex: 1 },
  speedBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  speedFast: { backgroundColor: '#d1fae5' },
  speedNormal: { backgroundColor: '#fef3c7' },
  speedText: { fontSize: 9, fontWeight: '700', color: '#333' },

  barContainer: {
    height: 6,
    backgroundColor: '#e5e5e5',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  bar: { height: 6, borderRadius: 3 },

  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 13, fontWeight: '700', color: '#333', fontFamily: 'monospace' },
  statLabel: { fontSize: 9, color: '#999', marginTop: 1 },

  summaryCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 16,
    marginTop: 6,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#1e40af', marginBottom: 6 },
  summaryText: { fontSize: 12, color: '#1e40af', lineHeight: 18 },
})
