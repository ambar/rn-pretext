# rn-pretext

## 0.0.5

### Patch Changes

- [#4](https://github.com/ambar/rn-pretext/pull/4) [`0f46c92`](https://github.com/ambar/rn-pretext/commit/0f46c926e44517b3ae9c6dfc53dc57b95cbc7d66) Thanks [@ambar](https://github.com/ambar)! - Preserve CSS font weight when measuring text in React Native.

  `rn-pretext` now forwards `bold` and numeric font weights from canvas-style font strings to the native measurement layer. `expo-text-measure` accepts the optional weight and applies it on iOS and Android, keeping bold text measurement aligned with rendered text.

- Updated dependencies [[`0f46c92`](https://github.com/ambar/rn-pretext/commit/0f46c926e44517b3ae9c6dfc53dc57b95cbc7d66)]:
  - expo-text-measure@0.0.2

## 0.0.4

### Patch Changes

- [`e6f7d36`](https://github.com/ambar/rn-pretext/commit/e6f7d36acd3de3a82606eebed718cb88a971be5b) Thanks [@ambar](https://github.com/ambar)! - Simplify re-exports with `export *` from @chenglou/pretext

## 0.0.3

### Patch Changes

- [`1e140d8`](https://github.com/ambar/rn-pretext/commit/1e140d8c9d8d579b2c73d0a4299c6b7039bf010d) Thanks [@ambar](https://github.com/ambar)! - Fix import path to include .js extension for polyfill-force

## 0.0.2

### Patch Changes

- [`486e0eb`](https://github.com/ambar/rn-pretext/commit/486e0ebefe5c8ade88d88ff2599b3f81ac890a99) Thanks [@ambar](https://github.com/ambar)! - Fix expo-text-measure dependency to use npm version instead of workspace protocol
