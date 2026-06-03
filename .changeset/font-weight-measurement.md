---
"expo-text-measure": patch
"rn-pretext": patch
---

Preserve CSS font weight when measuring text in React Native.

`rn-pretext` now forwards `bold` and numeric font weights from canvas-style font strings to the native measurement layer. `expo-text-measure` accepts the optional weight and applies it on iOS and Android, keeping bold text measurement aligned with rendered text.
