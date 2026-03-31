import { useMemo, useState } from 'react'
import { SelectableDocument } from '../../lib/pretext-selection/SelectableDocument'
import type { Document } from '../../lib/pretext-selection/types'

const FONT = '16px system-ui, -apple-system, sans-serif'
const LINE_HEIGHT = 24
const PARAGRAPH_GAP = 16

const SAMPLE_PARAGRAPHS = [
  `Pretext is a pure JavaScript library for multiline text measurement and layout. It computes text dimensions without touching the DOM — avoiding expensive layout reflow operations like getBoundingClientRect or offsetHeight.`,

  `这段文字演示了跨段落文本选中功能。Pretext 支持所有语言，包括中文、日文、韩文、emoji 以及混合双向文本。你可以从这一段开始选中，一直拖到下一段。`,

  `The prepare() function does a one-time measurement pass using the browser's canvas measureText, then layout() does pure arithmetic to compute height and line count at any given width. This makes resize operations extremely fast — about 0.09ms for a batch of 500 texts.`,

  `Try selecting across multiple paragraphs! Click and drag from any position to any other position. The blue highlight should follow your selection across paragraph boundaries. 🎉`,
]

export default function SelectionDemo() {
  const [maxWidth, setMaxWidth] = useState(600)

  const document: Document = useMemo(
    () => ({
      paragraphs: SAMPLE_PARAGRAPHS.map((text) => ({
        text,
        font: FONT,
        lineHeight: LINE_HEIGHT,
      })),
      maxWidth,
      paragraphGap: PARAGRAPH_GAP,
    }),
    [maxWidth],
  )

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        Cross-Paragraph Text Selection
      </h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
        Powered by <code>@chenglou/pretext</code> — click and drag to select text
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
          Container width: {maxWidth}px
        </label>
        <input
          type="range"
          min={300}
          max={900}
          value={maxWidth}
          onChange={(e) => setMaxWidth(Number(e.target.value))}
          style={{ display: 'block', width: 300, marginTop: 8 }}
        />
      </div>

      <div
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          padding: 20,
          backgroundColor: '#fff',
        }}
      >
        <SelectableDocument document={document} debug />
      </div>
    </div>
  )
}
