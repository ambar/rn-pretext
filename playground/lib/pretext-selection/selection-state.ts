import { useReducer } from 'react'
import type { DocumentPosition, DocumentSelection } from './types'

type Action =
  | { type: 'START'; position: DocumentPosition }
  | { type: 'EXTEND'; position: DocumentPosition }
  | { type: 'CLEAR' }

function reducer(_state: DocumentSelection, action: Action): DocumentSelection {
  switch (action.type) {
    case 'START':
      return { anchor: action.position, focus: action.position }
    case 'EXTEND':
      return _state ? { anchor: _state.anchor, focus: action.position } : null
    case 'CLEAR':
      return null
  }
}

export function useSelectionState() {
  const [selection, dispatch] = useReducer(reducer, null)

  return {
    selection,
    startSelection: (position: DocumentPosition) =>
      dispatch({ type: 'START', position }),
    extendSelection: (position: DocumentPosition) =>
      dispatch({ type: 'EXTEND', position }),
    clearSelection: () => dispatch({ type: 'CLEAR' }),
  }
}
