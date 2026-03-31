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

### 依赖极窄

pretext 对 Canvas API 的使用仅限两点：

1. `ctx.font = fontString` — 设置字体（CSS font shorthand 格式，如 `"16px Inter"`）
2. `ctx.measureText(text).width` — **只读 `.width`，不读 `actualBoundingBox` 等其他属性**

### Canvas 上下文创建（measurement.ts）

```typescript
let measureContext = null;

function getMeasureContext() {
  if (measureContext !== null) return measureContext;
  if (typeof OffscreenCanvas !== 'undefined') {
    measureContext = new OffscreenCanvas(1, 1).getContext('2d')!;
    return measureContext;
  }
  if (typeof document !== 'undefined') {
    measureContext = document.createElement('canvas').getContext('2d')!;
    return measureContext;
  }
  throw new Error('Text measurement requires OffscreenCanvas or a DOM canvas context.');
}
```

### 注入点

代码中**没有内建的抽象层或 DI**，但测试文件演示了 polyfill 方式：

```typescript
// layout.test.ts — 在 import pretext 之前注入
class TestCanvasRenderingContext2D {
  font = '';
  measureText(text: string): { width: number } {
    return { width: measureWidth(text, this.font) };
  }
}
class TestOffscreenCanvas {
  constructor(_width: number, _height: number) {}
  getContext(_kind: string) {
    return new TestCanvasRenderingContext2D();
  }
}
Reflect.set(globalThis, 'OffscreenCanvas', TestOffscreenCanvas);
```

### 测量调用模式

- 每个唯一的 `(font, segmentText)` 对只测量一次，结果缓存在 `Map<string, SegmentMetrics>`
- CJK 文本会拆分到单字符粒度逐个测量
- 还会测量 `" "`（空格宽度，用于 tab stop）和 `"-"`（连字符宽度，用于 soft hyphen）
- Emoji 修正：在非 Safari 上，如果 Canvas 测量的 emoji 宽度远大于字号，会创建临时 DOM `<span>` 修正

## `prepare()` 返回的数据结构

```typescript
PreparedCore {
  widths: number[]                      // 每个 segment 的宽度
  lineEndFitAdvances: number[]          // 行尾 fit 宽度（空格为 0）
  lineEndPaintAdvances: number[]        // 行尾绘制宽度
  kinds: SegmentBreakKind[]             // 断行类型
  simpleLineWalkFastPath: boolean       // 是否可走简单快速路径
  segLevels: Int8Array | null           // Bidi 嵌入层级
  breakableWidths: (number[] | null)[]  // 每字符宽度（overflow-wrap 用）
  breakablePrefixWidths: (number[] | null)[] // 累计前缀宽度（Safari shim）
  discretionaryHyphenWidth: number      // '-' 宽度
  tabStopAdvance: number                // spaceWidth * 8
  chunks: PreparedLineChunk[]           // 硬断行分块
  segments?: string[]                   // 仅 prepareWithSegments 返回
}
```

## RN 侧文本测量方案对比

| 方案 | 同步 | 无需渲染 | 维护状态 | 备注 |
|---|---|---|---|---|
| **@shopify/react-native-skia SkFont** | **是** | **是** | **活跃 (v2.5.5)** | **推荐** |
| Skia Paragraph API | 是 | 是 | 活跃 | 更重，支持字体回退 |
| RN `onTextLayout` | 否 | 否 | Core RN | 需渲染 `<Text>` |
| react-native-canvas | 否 | 否 | 停滞 | WebView 桥接，全异步 |
| react-native-text-size | 否 | 是 | 废弃 | 旧 Bridge 架构 |
| @domir/react-native-measure-text | 是 | 是 | 活跃 | 仅返回 width |
| 自定义 Nitro/JSI 模块 | 是 | 是 | 需自维护 | 最灵活但工作量大 |

### 为什么选 Skia

- **同步调用** — `font.measureText(text)` 立即返回，匹配浏览器 Canvas 行为
- **无需渲染** — 纯 API 调用，不需要挂载任何组件
- **跨平台** — iOS/Android 单一实现
- **HarfBuzz 排版引擎** — 与浏览器 Canvas 使用相同的排版引擎，测量精度接近
- **活跃维护** — Shopify 团队维护，兼容 RN 0.83

### 备选：@domir/react-native-measure-text

如果不想引入 Skia 的体积，这个包通过 JSI 提供同步 `measureWidth()`，但功能有限（仅宽度，无字体指标）。

## 接入方案

### 方案一：OffscreenCanvas Polyfill（推荐，零侵入）

在 import pretext 之前注入 polyfill：

```typescript
import { Skia, matchFont } from '@shopify/react-native-skia';

function parseCSSFont(cssFont: string) {
  const sizeMatch = cssFont.match(/(\d+(?:\.\d+)?)\s*px/);
  const size = sizeMatch ? parseFloat(sizeMatch[1]) : 16;
  // 简单解析：去掉 size 部分，剩下的是 family（可能含 weight/style）
  const rest = cssFont.replace(/(\d+(?:\.\d+)?)\s*px/, '').trim();
  const family = rest.replace(/^(bold|italic|oblique|\d+)\s*/gi, '').trim() || 'System';
  return { fontSize: size, fontFamily: family };
}

class RNCanvasContext {
  private _font = 'System';
  private _skFont = matchFont({ fontFamily: 'System', fontSize: 16 });

  set font(cssFont: string) {
    this._font = cssFont;
    const parsed = parseCSSFont(cssFont);
    this._skFont = matchFont(parsed);
  }

  get font() {
    return this._font;
  }

  measureText(text: string) {
    const { width } = this._skFont.measureText(text);
    return { width };
  }
}

class RNOffscreenCanvas {
  constructor(_w: number, _h: number) {}
  getContext(_: string) {
    return new RNCanvasContext();
  }
}

(globalThis as any).OffscreenCanvas = RNOffscreenCanvas;

// 然后 import pretext
import { prepare, layout } from '@chenglou/pretext';
```

### 方案二：Fork measurement.ts

fork pretext 仓库，修改 `src/measurement.ts` 中的 `getMeasureContext()`，增加 RN 分支。
适合需要更精细控制的场景，但需要跟上游同步。

## 需要处理的问题

### 1. CSS Font Shorthand 解析

pretext 传入 `"bold 16px Inter"` 格式，需解析为 Skia 的 `{ fontFamily, fontSize, fontWeight }` 参数。
CSS font shorthand 语法较复杂（`font-style font-variant font-weight font-size/line-height font-family`），
实际使用中通常只用 `"16px FontName"` 或 `"bold 16px FontName"`。

### 2. 字体回退（Font Fallback）

Skia `SkFont` 绑定单一字体，不自动做 CJK/emoji 回退。
pretext 的 CJK 处理会逐字符测量，如果字体不包含该字符则宽度为 0。

解决方案：
- 对 CJK/emoji 使用系统默认字体
- 或使用 Skia Paragraph API（支持 fontFamilies 列表回退）做一层 fallback 测量

### 3. Emoji 修正逻辑

pretext 内含 Chrome/Firefox emoji 宽度修正代码（Canvas 测量的 emoji 宽度可能大于 DOM 渲染宽度）。
在 RN + Skia 环境中这个修正逻辑无意义，可能需要：
- 让 pretext 的 browser detection 返回一个中性的 engine profile
- 或 polyfill `navigator.userAgent` 为空字符串（pretext 会 fallback 到保守模式）

### 4. `Intl.Segmenter` 依赖

pretext 使用 `Intl.Segmenter` 做词/字符分段。Hermes (RN 的 JS 引擎) 从 0.72+ 开始支持 `Intl.Segmenter`。
RN 0.83 使用的 Hermes 版本应已支持，但需确认 `granularity: 'word'` 和 `granularity: 'grapheme'` 均可用。

### 5. 测量精度差异

Skia (HarfBuzz) 和浏览器 Canvas 的测量结果会有微小差异（亚像素级别）。
对布局决策（换行位置）影响极小，但不应期望 pixel-perfect 一致。

## 依赖清单

```json
{
  "@chenglou/pretext": "latest",
  "@shopify/react-native-skia": "~2.5.5"
}
```

## 后续步骤

1. 安装 `@shopify/react-native-skia`
2. 实现 OffscreenCanvas polyfill（含 CSS font 解析）
3. 验证 `Intl.Segmenter` 在 Hermes 中的可用性
4. 用简单文本测试 `prepare()` + `layout()` 能否正常工作
5. 处理 CJK / emoji 字体回退
6. 性能测试：对比 Skia 测量与浏览器 Canvas 测量的速度
