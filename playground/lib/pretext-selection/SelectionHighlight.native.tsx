import { View, StyleSheet } from 'react-native'
import type { SelectionRect } from './types'

export function SelectionHighlight({ rects }: { rects: SelectionRect[] }) {
  return (
    <>
      {rects.map((rect, i) => (
        <View
          key={`${rect.x}-${rect.y}-${rect.width}-${rect.height}-${i}`}
          pointerEvents="none"
          style={[
            styles.rect,
            {
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
            },
          ]}
        />
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  rect: {
    position: 'absolute',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
})
