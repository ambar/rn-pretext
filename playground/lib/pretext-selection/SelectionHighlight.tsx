import type { SelectionRect } from './types'

export function SelectionHighlight({ rects }: { rects: SelectionRect[] }) {
  return (
    <>
      {rects.map((rect, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  )
}
