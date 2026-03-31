import type { DocumentPosition, DocumentSelection, ParagraphLayout, SelectionRect } from './types'
import { cursorToX } from './hit-testing'

/** Compare two DocumentPositions. Returns <0, 0, or >0. */
function comparePositions(a: DocumentPosition, b: DocumentPosition): number {
  if (a.paragraphIndex !== b.paragraphIndex) return a.paragraphIndex - b.paragraphIndex
  if (a.cursor.segmentIndex !== b.cursor.segmentIndex)
    return a.cursor.segmentIndex - b.cursor.segmentIndex
  return a.cursor.graphemeIndex - b.cursor.graphemeIndex
}

/** Normalize selection so start <= end. */
function normalizeSelection(sel: NonNullable<DocumentSelection>) {
  const cmp = comparePositions(sel.anchor, sel.focus)
  return cmp <= 0
    ? { start: sel.anchor, end: sel.focus }
    : { start: sel.focus, end: sel.anchor }
}

/**
 * Check if a cursor is at or past the line end.
 */
function isCursorAtOrPastLineEnd(
  cursor: { segmentIndex: number; graphemeIndex: number },
  lineEnd: { segmentIndex: number; graphemeIndex: number },
): boolean {
  if (cursor.segmentIndex > lineEnd.segmentIndex) return true
  if (cursor.segmentIndex === lineEnd.segmentIndex)
    return cursor.graphemeIndex >= lineEnd.graphemeIndex
  return false
}

/**
 * Check if a cursor is at or before the line start.
 */
function isCursorAtOrBeforeLineStart(
  cursor: { segmentIndex: number; graphemeIndex: number },
  lineStart: { segmentIndex: number; graphemeIndex: number },
): boolean {
  if (cursor.segmentIndex < lineStart.segmentIndex) return true
  if (cursor.segmentIndex === lineStart.segmentIndex)
    return cursor.graphemeIndex <= lineStart.graphemeIndex
  return false
}

/**
 * Compute highlight rectangles for a selection across multiple paragraphs.
 */
export function computeSelectionRects(
  selection: DocumentSelection,
  layouts: ParagraphLayout[],
  maxWidth: number,
): SelectionRect[] {
  if (!selection) return []

  const { start, end } = normalizeSelection(selection)
  const rects: SelectionRect[] = []

  for (let pi = start.paragraphIndex; pi <= end.paragraphIndex; pi++) {
    const layout = layouts[pi]
    if (!layout) continue

    for (let li = 0; li < layout.lines.length; li++) {
      const line = layout.lines[li]
      const lineY = layout.yOffset + li * layout.lineHeight

      const isFirstPara = pi === start.paragraphIndex
      const isLastPara = pi === end.paragraphIndex

      // Determine if this line is within the selection
      const lineStartPos = { segmentIndex: line.start.segmentIndex, graphemeIndex: line.start.graphemeIndex }
      const lineEndPos = { segmentIndex: line.end.segmentIndex, graphemeIndex: line.end.graphemeIndex }

      // Skip lines entirely before selection start in first paragraph
      if (isFirstPara && isCursorAtOrBeforeLineStart(lineEndPos, start.cursor)) continue
      // Skip lines entirely after selection end in last paragraph
      if (isLastPara && isCursorAtOrPastLineEnd(lineStartPos, end.cursor)) continue

      // Determine x range for this line
      let x0 = 0
      let x1 = maxWidth

      // First line of selection: starts at start cursor X
      if (isFirstPara && !isCursorAtOrBeforeLineStart(start.cursor, lineStartPos)) {
        x0 = cursorToX(start.cursor, line, layout)
      }

      // Last line of selection: ends at end cursor X
      if (isLastPara && !isCursorAtOrPastLineEnd(end.cursor, lineEndPos)) {
        x1 = cursorToX(end.cursor, line, layout)
      }

      if (x1 > x0) {
        rects.push({ x: x0, y: lineY, width: x1 - x0, height: layout.lineHeight })
      }
    }
  }

  return rects
}
