# expo-text-measure

Synchronous native text measurement for React Native via Expo Modules.

## What it does

Provides a single synchronous function `measureText(text, fontSize, fontFamily)` that returns the text width using the same engine RN's `<Text>` uses for rendering:

- **iOS**: `NSString.size(withAttributes:)` → CoreText
- **Android**: `Paint.measureText()`

Zero measurement drift — what you measure is exactly what renders.

## Install

```sh
npm install expo-text-measure
```

Requires native rebuild (`expo prebuild` or `pod install`).

## Usage

```typescript
import NativeTextMeasure from 'expo-text-measure'

// Synchronous — runs on JS thread via JSI
const width = NativeTextMeasure.measureText('Hello world', 16, 'System')
```

