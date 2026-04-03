import { useRef, useCallback } from 'react'
import type { RefObject } from 'react'
import type { DocumentPosition, ParagraphLayout } from './types'
import { hitTest } from './hit-testing'

type GestureCallbacks = {
  onStart: (pos: DocumentPosition) => void
  onExtend: (pos: DocumentPosition) => void
  onClear: () => void
}

/**
 * Returns pointer event handlers for selection gestures.
 * - Mouse: click-drag to select
 * - Touch: long-press (500ms) then drag to select
 */
export function useSelectionGestures(
  containerRef: RefObject<HTMLDivElement | null>,
  layoutsRef: RefObject<ParagraphLayout[]>,
  callbacks: GestureCallbacks,
) {
  const isDragging = useRef(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getDocPosition = useCallback(
    (clientX: number, clientY: number): DocumentPosition | null => {
      const el = containerRef.current
      const layouts = layoutsRef.current
      if (!el || !layouts) return null

      const rect = el.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top + el.scrollTop
      return hitTest(x, y, layouts)
    },
    [containerRef, layoutsRef],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Touch: start long-press timer
      if (e.pointerType === 'touch') {
        const startX = e.clientX
        const startY = e.clientY
        longPressTimer.current = setTimeout(() => {
          const pos = getDocPosition(startX, startY)
          if (pos) {
            isDragging.current = true
            callbacks.onStart(pos)
          }
        }, 500)
        return
      }

      // Mouse: start selection immediately
      const pos = getDocPosition(e.clientX, e.clientY)
      if (pos) {
        isDragging.current = true
        callbacks.onStart(pos)
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      }
    },
    [getDocPosition, callbacks],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Cancel long-press if finger moves
      if (e.pointerType === 'touch' && longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }

      if (!isDragging.current) return

      const pos = getDocPosition(e.clientX, e.clientY)
      if (pos) {
        callbacks.onExtend(pos)
      }
    },
    [getDocPosition, callbacks],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      isDragging.current = false
    },
    [],
  )

  return { onPointerDown, onPointerMove, onPointerUp }
}
