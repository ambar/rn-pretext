# rn-pretext

[`@chenglou/pretext`](https://github.com/chenglou/pretext) for React Native — multiline text measurement and layout without the DOM.

## What it does

Re-exports all `@chenglou/pretext` APIs with a native measurement polyfill applied. Pretext's `prepare()` uses platform-native text measurement (CoreText on iOS, Paint on Android) via [`expo-text-measure`](https://github.com/ambar/rn-pretext/tree/main/expo-text-measure), so measurements match RN's `<Text>` rendering with zero drift.

## Install

```sh
npm install rn-pretext expo-text-measure
```

Requires native rebuild (`expo prebuild` or `pod install`).

## Usage

```typescript
import { prepare, layout, prepareWithSegments, layoutWithLines } from 'rn-pretext'

// One-time measurement
const prepared = prepare('Hello world', '16px System')

// Pure arithmetic on every resize — no native calls
const { height, lineCount } = layout(prepared, containerWidth, 24)

// Line-by-line data for custom rendering
const result = layoutWithLines(prepareWithSegments(text, font), width, lineHeight)
result.lines.forEach(line => {
  console.log(line.text, line.width)
})
```

## API

All APIs from `@chenglou/pretext` are re-exported:

- `prepare()` / `prepareWithSegments()` — one-time text measurement
- `layout()` — compute height + line count (pure arithmetic)
- `layoutWithLines()` — per-line text, width, and cursor data
- `layoutNextLine()` — iterator-style, for variable-width layouts
- `walkLineRanges()` — line geometry without materializing text
- `clearCache()` / `setLocale()` — cache and locale management

See [@chenglou/pretext README](https://github.com/chenglou/pretext) for full documentation.
