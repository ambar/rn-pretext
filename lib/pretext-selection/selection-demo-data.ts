import type { Document } from './types'

export const SAMPLE_PARAGRAPHS = [
  `Pretext is a pure JavaScript library for multiline text measurement and layout. It computes text dimensions without touching the DOM — avoiding expensive layout reflow operations like getBoundingClientRect or offsetHeight.`,

  `这段文字演示了跨段落文本选中功能。Pretext 支持所有语言，包括中文、日文、韩文、emoji 以及混合双向文本。你可以从这一段开始选中，一直拖到下一段。`,

  `The prepare() function does a one-time measurement pass using the browser's canvas measureText, then layout() does pure arithmetic to compute height and line count at any given width. This makes resize operations extremely fast — about 0.09ms for a batch of 500 texts.`,

  `Try selecting across multiple paragraphs! Click and drag from any position to any other position. The blue highlight should follow your selection across paragraph boundaries. 🎉`,
]

export function buildSelectionDemoDocument(
  maxWidth: number,
  font: string,
  lineHeight = 24,
  paragraphGap = 16,
): Document {
  return {
    paragraphs: SAMPLE_PARAGRAPHS.map((text) => ({
      text,
      font,
      lineHeight,
    })),
    maxWidth,
    paragraphGap,
  }
}
