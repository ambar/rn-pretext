import { useMemo, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import type { Document, ParagraphLayout } from './types'
import { layoutDocument } from './layout-engine'
import { useSelectionState } from './selection-state'
import { computeSelectionRects } from './selection-geometry'
import { useSelectionGestures } from './use-selection-gestures.native'
import { SelectionHighlight } from './SelectionHighlight'
import { TextLine } from './TextLine'

export function SelectableDocument(props: {
  document: Document
  debug?: boolean
}) {
  const { document } = props
  const containerRef = useRef<View>(null)

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

  const { responderHandlers } = useSelectionGestures(
    containerRef,
    layoutsRef,
    gestureCallbacks,
  )

  const totalHeight =
    layouts.length > 0
      ? layouts[layouts.length - 1].yOffset +
        layouts[layouts.length - 1].height
      : 0

  return (
    <View style={styles.outer}>
      <View
        ref={containerRef}
        collapsable={false}
        {...responderHandlers}
        style={[
          styles.canvas,
          { width: document.maxWidth, height: totalHeight },
        ]}
      >
        <SelectionHighlight rects={selectionRects} />

        {layouts.map((layout, pi) =>
          layout.lines.map((line, li) => (
            <TextLine
              key={`${pi}-${li}-${line.text.slice(0, 12)}-${line.start.segmentIndex}`}
              line={line}
              top={layout.yOffset + li * layout.lineHeight}
              font={document.paragraphs[pi].font}
            />
          )),
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
  },
  canvas: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
})
