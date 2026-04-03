# Pretext + React Native 接入调研

## Pretext 是什么

[`@chenglou/pretext`](https://github.com/chenglou/pretext) 是一个纯 JS/TS 多行文本测量与布局库。它避开 DOM reflow，通过 Canvas `measureText` 做一次性测量，之后纯算术计算文本高度、行数、行宽等。

主要用途：虚拟列表高度预计算、Canvas/SVG/WebGL 文本渲染、文字环绕图片、masonry 布局等。

## 架构：两阶段分离

```
prepare(text, font, options?)  ──→  PreparedText（不透明句柄）
                                         │
layout(prepared, maxWidth, lineHeight)   │  纯算术，零 Canvas/DOM 调用
layoutWithLines(prepared, ...)           │
walkLineRanges(prepared, ...)            │
layoutNextLine(prepared, ...)            │
```

- **`prepare()` 是唯一依赖 Canvas 的阶段**
- `layout()` 等函数全部是纯计算，可直接在任何 JS 运行时使用

## Canvas 依赖面分析

pretext 对 Canvas API 的使用仅限两点：

1. `ctx.font = fontString` — 设置字体（CSS font shorthand 格式，如 `"16px Inter"`）
2. `ctx.measureText(text).width` — **只读 `.width`**

注入点：在 import pretext 之前设置 `globalThis.OffscreenCanvas` polyfill 即可。

## RN 接入方案演进

### 方案对比

| | Skia ParagraphBuilder | Native Measure (当前) |
|---|---|---|
| **测量引擎** | Skia `ParagraphBuilder` + 系统 FontMgr | iOS CoreText / Android Paint |
| **字体回退** | ✅ 系统 FontMgr | ✅ 平台原生 |
| **CJK 偏差** | ~3px | **~0px** |
| **英文偏差** | ~10px | **~0px** |
| **Emoji 偏差** | ~5px | **~0px** |
| **额外依赖** | @shopify/react-native-skia (~5MB) | 无 |
| **需要 native rebuild** | 否（预编译二进制） | 是（Expo Module 源码编译） |
| **选区对齐** | 接近（仍有偏差） | **完美** |

### 为什么弃用 Skia

1. **测量和渲染使用不同引擎**：Skia (HarfBuzz) 测量，RN native (CoreText/Android Paint) 渲染。即使用 ParagraphBuilder 改善了字体回退，两套引擎对同一文字测出的宽度仍有 ~3-10px 偏差。

2. **偏差导致的问题**：
   - **断行位置不同**：pretext 认为一行满了但 RN 原生还有空间（或反之），导致视觉上断行位置和原生 `<Text>` 不一致
   - **选区错位**：selection highlight 的 X 坐标基于 Skia 测量，但文字实际位置由 RN 原生渲染决定，累积偏差导致选区和文字不对齐
   - **文字溢出/重叠**：pretext 算出的行宽比 RN 实际渲染窄时，`<Text>` 会自动换行到下一行，与下方内容重叠

3. **包体积开销**：`@shopify/react-native-skia` 约 5MB，仅用于文字测量不划算

4. **Skia 渲染方案的可访问性问题**：为解决偏差可改用 Skia Canvas 渲染（测量和渲染同一引擎），但 Canvas 渲染的文字无可访问性（VoiceOver/TalkBack 看不到），需要叠透明 `<Text>` overlay

### 当前方案：Native Measurement Polyfill

通过 `expo-text-measure` Expo Module 调用平台原生 API：
- **iOS**: `NSString.size(withAttributes:)` → CoreText
- **Android**: `Paint.measureText()`

与 RN `<Text>` 使用完全相同的排版引擎，测量零偏差。断行、选区、文字渲染三者完全对齐。

### Monorepo 结构

```
expo-text-measure/       # Expo Module: 原生文字测量
  ios/                   # CoreText (Swift)
  android/               # Paint.measureText (Kotlin)
  expo-module.config.json
  index.ts

rn-pretext/              # Polyfill + reexport @chenglou/pretext
  src/
    polyfill.ts          # OffscreenCanvas polyfill (imports expo-text-measure)
    index.ts             # import './polyfill' + reexport pretext

playground/              # Expo Router demo app
  app/                   # 页面
  lib/pretext-selection/ # 选区实现
```

### 使用方式

```typescript
// 不需要关心 polyfill，直接 import：
import { prepareWithSegments, layoutWithLines } from 'rn-pretext'
```

`rn-pretext` 包内部先执行 polyfill（设置 `globalThis.OffscreenCanvas`），再 reexport `@chenglou/pretext` 的所有 API。

### 测量精度

| 文本类型 | 与 RN `<Text>` 的偏差 |
|----------|----------------------|
| CJK | ~0px |
| 英文 | ~0px |
| Emoji | ~0px |

因为测量和渲染用的是同一套引擎（CoreText / Android Paint）。

## 已发现的 pretext 上游 Bug（0.0.3，已在 0.0.4 修复）

### `walkPreparedLines` CJK 文本丢失

**Bug**: `line-break.ts` 中 `walkPreparedLinesSimple` 和 `walkPreparedLines` 在使用 `pendingBreak` 回退换行时，`i`（segment 遍历指针）没有回退到 `pendingBreakSegmentIndex`，导致 pendingBreak 和 `i` 之间的所有 segment 被跳过。

**触发条件**: space 后跟足够多的 CJK 字符导致 overflow。英文不受影响，因为每个 space 都更新 pendingBreak。

**修复**: 0.0.4 中在 emit 前检查 `lineEndSegmentIndex > pendingBreakSegmentIndex`，如果当前行已超过 pendingBreak 则直接用 `lineEnd` 断行。

## 其他已解决的问题

### CSS Font Shorthand 解析
polyfill 中 `parseCSSFont()` 解析 `"16px System"` / `"bold 16px Inter"` 等格式。

### Engine Profile（UA 模拟）
polyfill `navigator.userAgent = "Safari/1"` 使 pretext 选择 WebKit engine profile（lineFitEpsilon = 1/64 等）。

### `Intl.Segmenter` 依赖
Hermes 对 `Intl.Segmenter` 支持不完整，使用 `@formatjs/intl-segmenter/polyfill-force` 强制 polyfill。

## 依赖清单

```json
{
  "@chenglou/pretext": "^0.0.4",
  "@formatjs/intl-segmenter": "^12.2.1",
  "expo-text-measure": "*"
}
```
