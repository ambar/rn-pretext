/**
 * Re-exports @chenglou/pretext with the Skia polyfill applied.
 * Always import pretext from this module (never directly from @chenglou/pretext).
 */
import './pretext-polyfill'

export {
  prepare,
  prepareWithSegments,
  layout,
  layoutWithLines,
  layoutNextLine,
  walkLineRanges,
  clearCache,
  setLocale,
} from '@chenglou/pretext'

export type {
  PreparedText,
  PreparedTextWithSegments,
  LayoutResult,
  LayoutLine,
  LayoutLineRange,
  LayoutLinesResult,
  LayoutCursor,
  PrepareOptions,
} from '@chenglou/pretext'
