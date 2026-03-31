import type { LayoutCursor, LayoutLine, PreparedTextWithSegments } from '@chenglou/pretext'

/** Position within a multi-paragraph document */
export type DocumentPosition = {
  paragraphIndex: number
  cursor: LayoutCursor
}

/** Selection range: anchor (start of gesture) + focus (current end) */
export type DocumentSelection = {
  anchor: DocumentPosition
  focus: DocumentPosition
} | null

/** Layout result for a single paragraph */
export type ParagraphLayout = {
  prepared: PreparedTextWithSegments
  lines: LayoutLine[]
  yOffset: number
  lineHeight: number
  height: number
}

/** A rectangle for rendering selection highlight */
export type SelectionRect = {
  x: number
  y: number
  width: number
  height: number
}

/** Input paragraph definition */
export type Paragraph = {
  text: string
  font: string
  lineHeight: number
}

/** Document model */
export type Document = {
  paragraphs: Paragraph[]
  maxWidth: number
  paragraphGap: number
}
