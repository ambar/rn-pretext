import { useEffect, useMemo, useRef, useState } from 'react'
import { PanResponder, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import {
  prepareWithSegments,
  layoutWithLines,
  layoutNextLine,
  walkLineRanges,
  type LayoutCursor,
  type LayoutLine,
  type PreparedTextWithSegments,
} from 'rn-pretext'
import { Stack } from 'expo-router'

// ── Constants (aligned with source) ──────────────────────────

const BODY_FONT = '16px System'
const BODY_LINE_HEIGHT = 26
const HEADLINE_FONT_FAMILY = 'System'
const HEADLINE_TEXT = 'THE FUTURE OF TEXT LAYOUT IS NOT CSS'
const GUTTER = 24
const COL_GAP = 20
const BOTTOM_GAP = 16
const MIN_SLOT_WIDTH = 50
const DROP_CAP_LINES = 3

type Interval = { left: number; right: number }
type PositionedLine = { x: number; y: number; width: number; text: string }
type OrbColor = [number, number, number]
type Orb = { x: number; y: number; r: number; vx: number; vy: number; paused: boolean }

// ── Body text (abridged from source essay) ───────────────────

const BODY_TEXT = `The web renders text through a pipeline that was designed thirty years ago for static documents. A browser loads a font, shapes the text into glyphs, measures their combined width, determines where lines break, and positions each line vertically. Every step depends on the previous one.

For a paragraph in a blog post, this pipeline is invisible. But the web is no longer a collection of static documents. It is a platform for applications, and those applications need to know about text in ways the original pipeline never anticipated.

A messaging application needs to know the exact height of every message bubble before rendering a virtualized list. A masonry layout needs the height of every card to position them without overlap. An editorial page needs text to flow around images, advertisements, and interactive elements.

Every one of these operations requires text measurement. And every text measurement on the web today requires a synchronous layout reflow. The cost is devastating. Measuring the height of a single text block forces the browser to recalculate the position of every element on the page.

What if text measurement did not require the DOM at all? What if you could compute exactly where every line of text would break, exactly how wide each line would be, and exactly how tall the entire text block would be, using nothing but arithmetic?

This is the core insight of pretext. When text first appears, pretext measures every word once via canvas and caches the widths. After this preparation phase, layout is pure arithmetic: walk the cached widths, track the running line width, insert line breaks when the width exceeds the maximum, and sum the line heights.

The performance improvement is not incremental. Measuring five hundred text blocks with DOM methods costs fifteen to thirty milliseconds. With pretext, the same operation costs 0.05 milliseconds. This is a three hundred to six hundred times improvement.

The glowing orbs drifting across this page are not decorative — they are the demonstration. Each orb is a circular obstacle. For every line of text, the engine checks whether the line's vertical band intersects each orb. If it does, it computes the blocked horizontal interval and subtracts it from the available width. The remaining width might be split into two or more segments — and the engine fills every viable slot, flowing text on both sides of the obstacle simultaneously.

All of this runs without a single DOM measurement. The line positions, widths, and text contents are computed entirely in JavaScript using cached font metrics. Fifteen kilobytes. Zero dependencies. Zero DOM reads. And the text flows.`

const PULLQUOTE_TEXT = '"The performance improvement is not incremental — it is categorical. 0.05ms versus 30ms. Zero reflows versus five hundred."'

// ── Orb definitions (from source) ────────────────────────────

const ORB_DEFS: { fx: number; fy: number; r: number; vx: number; vy: number; color: OrbColor }[] = [
  { fx: 0.52, fy: 0.22, r: 55, vx: 24, vy: 16, color: [196, 163, 90] },
  { fx: 0.18, fy: 0.48, r: 42, vx: -19, vy: 26, color: [100, 140, 255] },
  { fx: 0.74, fy: 0.58, r: 48, vx: 16, vy: -21, color: [232, 100, 130] },
  { fx: 0.38, fy: 0.72, r: 38, vx: -26, vy: -14, color: [80, 200, 140] },
]

// ── Geometry (from wrap-geometry.ts) ─────────────────────────

function circleIntervalForBand(
  cx: number, cy: number, r: number,
  bandTop: number, bandBottom: number,
  hPad: number, vPad: number,
): Interval | null {
  const top = bandTop - vPad
  const bottom = bandBottom + vPad
  if (top >= cy + r || bottom <= cy - r) return null
  const minDy = cy >= top && cy <= bottom ? 0 : cy < top ? top - cy : cy - bottom
  if (minDy >= r) return null
  const maxDx = Math.sqrt(r * r - minDy * minDy)
  return { left: cx - maxDx - hPad, right: cx + maxDx + hPad }
}

function carveTextLineSlots(base: Interval, blocked: Interval[]): Interval[] {
  let slots = [base]
  for (const interval of blocked) {
    const next: Interval[] = []
    for (const slot of slots) {
      if (interval.right <= slot.left || interval.left >= slot.right) {
        next.push(slot)
        continue
      }
      if (interval.left > slot.left) next.push({ left: slot.left, right: interval.left })
      if (interval.right < slot.right) next.push({ left: interval.right, right: slot.right })
    }
    slots = next
  }
  return slots.filter(slot => slot.right - slot.left >= MIN_SLOT_WIDTH)
}

// ── Headline fitting (binary search, from source) ────────────

function fitHeadline(maxWidth: number, maxSize: number): { fontSize: number; lines: PositionedLine[] } {
  let lo = 16, hi = maxSize, best = lo, bestLines: PositionedLine[] = []

  while (lo <= hi) {
    const size = Math.floor((lo + hi) / 2)
    const font = `700 ${size}px ${HEADLINE_FONT_FAMILY}`
    const lineHeight = Math.round(size * 0.93)
    const prepared = prepareWithSegments(HEADLINE_TEXT, font)
    let breaksWord = false
    let lineCount = 0
    walkLineRanges(prepared, maxWidth, line => {
      lineCount++
      if (line.end.graphemeIndex !== 0) breaksWord = true
    })
    if (!breaksWord) {
      best = size
      const result = layoutWithLines(prepared, maxWidth, lineHeight)
      bestLines = result.lines.map((line, i) => ({
        x: 0, y: i * lineHeight, text: line.text, width: line.width,
      }))
      lo = size + 1
    } else {
      hi = size - 1
    }
  }
  return { fontSize: best, lines: bestLines }
}

// ── Column layout with obstacles (from source layoutColumn) ──

function layoutColumn(
  prepared: PreparedTextWithSegments,
  startCursor: LayoutCursor,
  regionX: number, regionY: number, regionW: number, regionH: number,
  lineHeight: number,
  orbs: Orb[],
  rectObstacles: { x: number; y: number; w: number; h: number }[],
): { lines: PositionedLine[]; cursor: LayoutCursor } {
  let cursor = startCursor
  let lineTop = regionY
  const lines: PositionedLine[] = []
  let textExhausted = false

  while (lineTop + lineHeight <= regionY + regionH && !textExhausted) {
    const bandTop = lineTop
    const bandBottom = lineTop + lineHeight
    const blocked: Interval[] = []

    for (const orb of orbs) {
      const interval = circleIntervalForBand(orb.x, orb.y, orb.r, bandTop, bandBottom, 10, 2)
      if (interval) blocked.push(interval)
    }
    for (const rect of rectObstacles) {
      if (bandBottom <= rect.y || bandTop >= rect.y + rect.h) continue
      blocked.push({ left: rect.x, right: rect.x + rect.w })
    }

    const slots = carveTextLineSlots({ left: regionX, right: regionX + regionW }, blocked)
    if (slots.length === 0) { lineTop += lineHeight; continue }

    const ordered = [...slots].sort((a, b) => a.left - b.left)
    for (const slot of ordered) {
      const line = layoutNextLine(prepared, cursor, slot.right - slot.left)
      if (!line) { textExhausted = true; break }
      lines.push({ x: Math.round(slot.left), y: Math.round(lineTop), text: line.text, width: line.width })
      cursor = line.end
    }
    lineTop += lineHeight
  }
  return { lines, cursor }
}

// ── Main component ───────────────────────────────────────────

export default function EditorialEngineDemo() {
  const { width: pageWidth, height: pageHeight } = useWindowDimensions()
  const columnCount = pageWidth > 700 ? 2 : 1
  const contentWidth = pageWidth - GUTTER * 2
  const columnWidth = (contentWidth - COL_GAP * (columnCount - 1)) / columnCount

  const preparedBody = useMemo(() => prepareWithSegments(BODY_TEXT, BODY_FONT), [])
  const preparedPQ = useMemo(() => prepareWithSegments(PULLQUOTE_TEXT, `italic 15px ${HEADLINE_FONT_FAMILY}`), [])

  // Orb state
  const [orbs, setOrbs] = useState<Orb[]>(() =>
    ORB_DEFS.map(d => ({ x: d.fx * pageWidth, y: d.fy * pageHeight, r: d.r, vx: d.vx, vy: d.vy, paused: false })),
  )
  const orbsRef = useRef(orbs)
  orbsRef.current = orbs

  // Animation loop
  useEffect(() => {
    let raf: number
    let lastTime: number | null = null
    function tick(now: number) {
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0
      lastTime = now
      setOrbs(prev => {
        const next = prev.map(orb => {
          if (orb.paused) return orb
          let { x, y, vx, vy, r } = orb
          x += vx * dt
          y += vy * dt
          if (x - r < 0) { x = r; vx = Math.abs(vx) }
          if (x + r > pageWidth) { x = pageWidth - r; vx = -Math.abs(vx) }
          if (y - r < GUTTER) { y = r + GUTTER; vy = Math.abs(vy) }
          if (y + r > pageHeight - BOTTOM_GAP) { y = pageHeight - BOTTOM_GAP - r; vy = -Math.abs(vy) }
          return { ...orb, x, y, vx, vy }
        })
        // Orb-orb collision
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i], b = next[j]
            const dx = b.x - a.x, dy = b.y - a.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const minDist = a.r + b.r + 12
            if (dist >= minDist || dist <= 0.1) continue
            const force = (minDist - dist) * 0.8
            const nx = dx / dist, ny = dy / dist
            if (!a.paused) { a.vx -= nx * force * dt; a.vy -= ny * force * dt }
            if (!b.paused) { b.vx += nx * force * dt; b.vy += ny * force * dt }
          }
        }
        return next
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pageWidth, pageHeight])

  // Drag handling
  const dragRef = useRef<{ idx: number; sx: number; sy: number; ox: number; oy: number } | null>(null)
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gs) => {
      const px = gs.x0, py = gs.y0
      for (let i = orbsRef.current.length - 1; i >= 0; i--) {
        const o = orbsRef.current[i]
        if ((px - o.x) ** 2 + (py - o.y) ** 2 <= o.r ** 2) {
          dragRef.current = { idx: i, sx: px, sy: py, ox: o.x, oy: o.y }
          return
        }
      }
      dragRef.current = null
    },
    onPanResponderMove: (_, gs) => {
      const d = dragRef.current
      if (!d) return
      setOrbs(prev => prev.map((o, i) => i === d.idx ? { ...o, x: d.ox + gs.dx, y: d.oy + gs.dy, paused: true } : o))
    },
    onPanResponderRelease: (_, gs) => {
      const d = dragRef.current
      if (d && gs.dx ** 2 + gs.dy ** 2 < 16) {
        setOrbs(prev => prev.map((o, i) => i === d.idx ? { ...o, paused: !o.paused } : o))
      }
      dragRef.current = null
    },
  }), [])

  // Layout computation
  const { headlineLines, headlineFont, headlineLineHeight, headlineHeight } = useMemo(() => {
    const maxSize = pageWidth > 700 ? 48 : 28
    const { fontSize, lines } = fitHeadline(contentWidth, maxSize)
    const lh = Math.round(fontSize * 0.93)
    return { headlineLines: lines, headlineFont: `700 ${fontSize}px ${HEADLINE_FONT_FAMILY}`, headlineLineHeight: lh, headlineHeight: lines.length * lh }
  }, [contentWidth, pageWidth])

  const bodyTop = GUTTER + headlineHeight + 16

  // Drop cap
  const dropCapSize = BODY_LINE_HEIGHT * DROP_CAP_LINES - 4
  const dropCapPrepared = useMemo(() => prepareWithSegments(BODY_TEXT[0]!, `700 ${dropCapSize}px ${HEADLINE_FONT_FAMILY}`), [dropCapSize])
  const dropCapWidth = useMemo(() => { let w = 0; walkLineRanges(dropCapPrepared, 9999, l => { w = l.width }); return Math.ceil(w) + 8 }, [dropCapPrepared])

  // Pullquote
  const pqWidth = Math.round(columnWidth * 0.5)
  const pqLines = useMemo(() => layoutWithLines(preparedPQ, pqWidth - 16, 22).lines, [preparedPQ, pqWidth])
  const pqHeight = pqLines.length * 22 + 12
  const pqX = columnCount > 1 ? GUTTER + columnWidth - pqWidth : GUTTER + contentWidth - pqWidth
  const pqY = bodyTop + (pageHeight - bodyTop) * 0.4

  // Body lines
  const bodyLines = useMemo(() => {
    const allLines: PositionedLine[] = []
    const bodyHeight = pageHeight - bodyTop - BOTTOM_GAP
    const dropCapRect = { x: GUTTER - 2, y: bodyTop - 2, w: dropCapWidth, h: DROP_CAP_LINES * BODY_LINE_HEIGHT + 2 }
    const pqRect = columnCount > 1 ? { x: pqX, y: pqY, w: pqWidth, h: pqHeight } : null

    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 1 } // skip drop cap char
    for (let col = 0; col < columnCount; col++) {
      const colX = GUTTER + col * (columnWidth + COL_GAP)
      const rects: { x: number; y: number; w: number; h: number }[] = []
      if (col === 0) rects.push(dropCapRect)
      if (pqRect && ((columnCount === 1) || (col === 0 && pqX < GUTTER + columnWidth))) rects.push(pqRect)
      if (pqRect && col === 1 && pqX >= GUTTER + columnWidth) rects.push(pqRect)

      const result = layoutColumn(preparedBody, cursor, colX, bodyTop, columnWidth, bodyHeight, BODY_LINE_HEIGHT, orbs, rects)
      allLines.push(...result.lines)
      cursor = result.cursor
    }
    return allLines
  }, [preparedBody, orbs, pageWidth, pageHeight, columnCount, columnWidth, dropCapWidth, pqX, pqY, pqWidth, pqHeight, bodyTop])

  return (
    <>
      <Stack.Screen options={{ title: 'The Editorial Engine', headerShown: false }} />
      <View style={styles.stage} {...panResponder.panHandlers}>
        {/* Headline — hidden for debugging */}

        {/* Drop cap */}
        <Text style={[styles.dropCap, { left: GUTTER, top: bodyTop, fontSize: dropCapSize, lineHeight: dropCapSize }]}>
          {BODY_TEXT[0]}
        </Text>

        {/* Body lines */}
        {bodyLines.map((line, i) => (
          <Text key={`b-${i}`} style={[styles.bodyLine, { left: line.x, top: line.y }]}>
            {line.text}
          </Text>
        ))}

        {/* Pullquote */}
        {columnCount > 1 && (
          <View style={[styles.pullquoteBox, { left: pqX, top: pqY, width: pqWidth, height: pqHeight }]}>
            {pqLines.map((line, i) => (
              <Text key={`pq-${i}`} style={[styles.pullquoteLine, { top: 6 + i * 22 }]}>
                {line.text}
              </Text>
            ))}
          </View>
        )}

        {/* Orbs */}
        {orbs.map((orb, i) => {
          const color = ORB_DEFS[i].color
          return (
            <View
              key={`orb-${i}`}
              style={[
                styles.orb,
                {
                  left: orb.x - orb.r,
                  top: orb.y - orb.r,
                  width: orb.r * 2,
                  height: orb.r * 2,
                  borderRadius: orb.r,
                  backgroundColor: `rgba(${color[0]},${color[1]},${color[2]},0.12)`,
                  opacity: orb.paused ? 0.45 : 1,
                },
              ]}
            />
          )
        })}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: '#0a0a0c', position: 'relative' },
  headlineLine: { position: 'absolute', fontWeight: '700', color: '#fff', letterSpacing: -0.5, backgroundColor: 'transparent' },
  dropCap: { position: 'absolute', fontWeight: '700', color: '#c4a35a', backgroundColor: 'transparent' },
  bodyLine: { position: 'absolute', fontSize: 16, lineHeight: BODY_LINE_HEIGHT, color: '#e8e4dc', backgroundColor: 'transparent' },
  pullquoteBox: {
    position: 'absolute',
    borderLeftWidth: 3,
    borderLeftColor: '#6b5a3d',
    paddingLeft: 14,
    paddingRight: 4,
  },
  pullquoteLine: { position: 'absolute', left: 14, fontSize: 15, lineHeight: 22, fontStyle: 'italic', color: '#b8a070', backgroundColor: 'transparent' },
  orb: { position: 'absolute' },
})
