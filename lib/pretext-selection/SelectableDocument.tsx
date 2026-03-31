import { useMemo, useRef, useCallback, useState } from 'react'
import type { Document, ParagraphLayout, DocumentPosition } from './types'
import { layoutDocument } from './layout-engine'
import { hitTest } from './hit-testing'
import { useSelectionState } from './selection-state'
import { computeSelectionRects } from './selection-geometry'
import { useSelectionGestures } from './use-selection-gestures'
import { SelectionHighlight } from './SelectionHighlight'
import { TextLine } from './TextLine'

export function SelectableDocument({
  document,
  debug = false,
}: {
  document: Document
  debug?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoverInfo, setHoverInfo] = useState<string>('')

  const layouts = useMemo(() => layoutDocument(document), [document])
  const layoutsRef = useRef<ParagraphLayout[]>(layouts)
  layoutsRef.current = layouts

  const { selection, startSelection, extendSelection, clearSelection } =
    useSelectionState()

  const selectionRects = useMemo(
    () => computeSelectionRects(selection, layouts, document.maxWidth),
    [selection, layouts, document.maxWidth],
  )

  const gestureCallbacks = useMemo(
    () => ({
      onStart: startSelection,
      onExtend: extendSelection,
      onClear: clearSelection,
    }),
    [startSelection, extendSelection, clearSelection],
  )

  const { onPointerDown, onPointerMove, onPointerUp } = useSelectionGestures(
    containerRef,
    layoutsRef,
    gestureCallbacks,
  )

  // Debug: show hit position on hover
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!debug) return
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top + el.scrollTop
      const pos = hitTest(x, y, layouts)
      setHoverInfo(
        `P${pos.paragraphIndex} seg:${pos.cursor.segmentIndex} g:${pos.cursor.graphemeIndex}`,
      )
    },
    [debug, layouts],
  )

  // Total document height
  const totalHeight = layouts.length > 0
    ? layouts[layouts.length - 1].yOffset + layouts[layouts.length - 1].height
    : 0

  return (
    <div style={{ position: 'relative' }}>
      {debug && hoverInfo && (
        <div
          style={{
            position: 'absolute',
            top: -24,
            left: 0,
            fontSize: 12,
            color: '#666',
            fontFamily: 'monospace',
          }}
        >
          {hoverInfo}
        </div>
      )}

      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => {
          onPointerMove(e)
          onMouseMove(e)
        }}
        onPointerUp={onPointerUp}
        style={{
          position: 'relative',
          width: document.maxWidth,
          height: totalHeight,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: 'text',
        }}
      >
        {/* Layer 1: Selection highlights */}
        <SelectionHighlight rects={selectionRects} />

        {/* Layer 2: Text lines */}
        {layouts.map((layout, pi) =>
          layout.lines.map((line, li) => (
            <TextLine
              key={`${pi}-${li}`}
              line={line}
              top={layout.yOffset + li * layout.lineHeight}
              font={document.paragraphs[pi].font}
            />
          )),
        )}
      </div>
    </div>
  )
}
