import { useRef, useCallback, useEffect } from 'react'
import type { RefObject } from 'react'
import type { GestureResponderEvent, View } from 'react-native'
import type { DocumentPosition, ParagraphLayout } from './types'
import { hitTest } from './hit-testing'

type GestureCallbacks = {
  onStart: (pos: DocumentPosition) => void
  onExtend: (pos: DocumentPosition) => void
  onClear: () => void
}

const MOVE_CANCEL_PX2 = 100

/**
 * Touch selection: long-press (~500ms) then drag to extend, matching web touch behavior.
 */
export function useSelectionGestures(
  _containerRef: RefObject<View | null>,
  layoutsRef: RefObject<ParagraphLayout[]>,
  callbacks: GestureCallbacks,
) {
  const isDragging = useRef(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startCoords = useRef<{ x: number; y: number } | null>(null)
  const callbacksRef = useRef(callbacks)

  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const getDocPosition = useCallback(
    (x: number, y: number): DocumentPosition | null => {
      const layouts = layoutsRef.current
      if (!layouts?.length) return null
      return hitTest(x, y, layouts)
    },
    [layoutsRef],
  )

  const onResponderGrant = useCallback(
    (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent
      startCoords.current = { x: locationX, y: locationY }
      isDragging.current = false

      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null
        const s = startCoords.current
        if (!s) return
        const pos = getDocPosition(s.x, s.y)
        if (pos) {
          isDragging.current = true
          callbacksRef.current.onStart(pos)
        }
      }, 500)
    },
    [getDocPosition],
  )

  const onResponderMove = useCallback(
    (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent
      const s = startCoords.current
      if (s && longPressTimer.current) {
        const dx = locationX - s.x
        const dy = locationY - s.y
        if (dx * dx + dy * dy > MOVE_CANCEL_PX2) clearTimer()
      }
      if (!isDragging.current) return
      const pos = getDocPosition(locationX, locationY)
      if (pos) callbacksRef.current.onExtend(pos)
    },
    [clearTimer, getDocPosition],
  )

  const onResponderRelease = useCallback(() => {
    clearTimer()
    isDragging.current = false
    startCoords.current = null
  }, [clearTimer])

  const responderHandlers = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant,
    onResponderMove,
    onResponderRelease,
    onResponderTerminate: onResponderRelease,
    onResponderTerminationRequest: () => !isDragging.current,
  }

  return { responderHandlers }
}
