import { prepareWithSegments, layoutWithLines } from 'rn-pretext'
import type { Document, ParagraphLayout } from './types'

/**
 * Compute layout for all paragraphs in a document.
 * Returns per-paragraph layout data with absolute Y offsets.
 */
export function layoutDocument(doc: Document): ParagraphLayout[] {
  const { paragraphs, maxWidth, paragraphGap } = doc
  const layouts: ParagraphLayout[] = []
  let yOffset = 0

  for (const para of paragraphs) {
    const prepared = prepareWithSegments(para.text, para.font)
    const result = layoutWithLines(prepared, maxWidth, para.lineHeight)
    const height = result.lineCount * para.lineHeight

    layouts.push({
      prepared,
      lines: result.lines,
      yOffset,
      lineHeight: para.lineHeight,
      height,
    })

    yOffset += height + paragraphGap
  }

  return layouts
}
