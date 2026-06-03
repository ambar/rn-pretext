# expo-text-measure

## 0.0.2

### Patch Changes

- [#4](https://github.com/ambar/rn-pretext/pull/4) [`0f46c92`](https://github.com/ambar/rn-pretext/commit/0f46c926e44517b3ae9c6dfc53dc57b95cbc7d66) Thanks [@ambar](https://github.com/ambar)! - Preserve CSS font weight when measuring text in React Native.

  `rn-pretext` now forwards `bold` and numeric font weights from canvas-style font strings to the native measurement layer. `expo-text-measure` accepts the optional weight and applies it on iOS and Android, keeping bold text measurement aligned with rendered text.
