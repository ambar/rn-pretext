import type { LayoutLine } from 'rn-pretext'

export function TextLine({
  line,
  top,
  font,
}: {
  line: LayoutLine
  top: number
  font: string
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        font,
        whiteSpace: 'pre',
        pointerEvents: 'none',
      }}
    >
      {line.text}
    </div>
  )
}
