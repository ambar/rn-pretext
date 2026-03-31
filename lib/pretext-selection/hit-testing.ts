import type { LayoutCursor, LayoutLine } from '@chenglou/pretext'
import type { DocumentPosition, ParagraphLayout } from './types'

/**
 * Compute X offset for a cursor within a line, by walking segment widths.
 * Shared by hit-testing (x -> cursor) and selection geometry (cursor -> x).
 */
export function cursorToX(
  cursor: LayoutCursor,
  line: LayoutLine,
  layout: ParagraphLayout,
): number {
  const { prepared } = layout
  const { widths, breakableWidths, segments } = prepared

  let x = 0
  for (let seg = line.start.segmentIndex; seg <= cursor.segmentIndex; seg++) {
    if (seg === cursor.segmentIndex) {
      // Partial segment: accumulate grapheme widths up to cursor.graphemeIndex
      const bw = breakableWidths[seg]
      if (bw && cursor.graphemeIndex > 0) {
        for (let g = 0; g < cursor.graphemeIndex; g++) {
          x += bw[g]
        }
      }
      break
    }

    // Full segment: skip if before line start grapheme
    if (seg === line.start.segmentIndex && line.start.graphemeIndex > 0) {
      const bw = breakableWidths[seg]
      if (bw) {
        for (let g = line.start.graphemeIndex; g < bw.length; g++) {
          x += bw[g]
        }
      } else {
        x += widths[seg]
      }
    } else {
      x += widths[seg]
    }
  }

  return x
}

/**
 * Find which line in a paragraph contains the given Y (relative to paragraph top).
 */
function findLineIndex(localY: number, layout: ParagraphLayout): number {
  const idx = Math.floor(localY / layout.lineHeight)
  return Math.max(0, Math.min(idx, layout.lines.length - 1))
}

/**
 * Walk segments in a line to find the cursor closest to target X.
 */
function xToCursor(
  targetX: number,
  line: LayoutLine,
  layout: ParagraphLayout,
): LayoutCursor {
  const { widths, breakableWidths } = layout.prepared

  let x = 0
  for (let seg = line.start.segmentIndex; seg < line.end.segmentIndex; seg++) {
    const startG = seg === line.start.segmentIndex ? line.start.graphemeIndex : 0
    const bw = breakableWidths[seg]

    if (bw) {
      // Multi-grapheme segment: walk individual graphemes
      for (let g = startG; g < bw.length; g++) {
        const gw = bw[g]
        if (x + gw / 2 > targetX) {
          return { segmentIndex: seg, graphemeIndex: g }
        }
        x += gw
      }
    } else {
      // Single-width segment
      const w = seg === line.start.segmentIndex && startG > 0 ? 0 : widths[seg]
      if (x + w / 2 > targetX) {
        return { segmentIndex: seg, graphemeIndex: startG }
      }
      x += w
    }
  }

  // Past end of line: return line end cursor
  return { ...line.end }
}

/**
 * Convert (x, y) document coordinates to a DocumentPosition.
 */
export function hitTest(
  x: number,
  y: number,
  layouts: ParagraphLayout[],
): DocumentPosition {
  // Find paragraph
  let paraIndex = layouts.length - 1
  for (let i = 0; i < layouts.length; i++) {
    if (y < layouts[i].yOffset + layouts[i].height) {
      paraIndex = i
      break
    }
  }

  // Clamp to valid paragraph
  if (y < 0) paraIndex = 0

  const layout = layouts[paraIndex]
  const localY = y - layout.yOffset
  const lineIndex = findLineIndex(localY, layout)
  const line = layout.lines[lineIndex]
  const cursor = xToCursor(x, line, layout)

  return { paragraphIndex: paraIndex, cursor }
}
