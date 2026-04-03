# 跨段落文本选中（Cross-Paragraph Text Selection）

基于 `@chenglou/pretext` 的行级布局数据，在 Web 平台实现自定义文本选中。

## 架构

```
SelectableDocument          ← 主组件，整合所有模块
  ├─ layout-engine          ← 调用 pretext prepareWithSegments + layoutWithLines
  ├─ hit-testing            ← (x, y) → DocumentPosition
  ├─ selection-state        ← useReducer: START / EXTEND / CLEAR
  ├─ selection-geometry     ← Selection → SelectionRect[]
  ├─ use-selection-gestures ← 鼠标拖选 + 触摸长按拖选
  ├─ SelectionHighlight     ← 渲染半透明蓝色高亮矩形
  └─ TextLine               ← 渲染单行文本（absolute + white-space: pre）
```

## 文件结构

```
lib/pretext-selection/
  types.ts                  — 核心类型：DocumentPosition, DocumentSelection, ParagraphLayout 等
  layout-engine.ts          — layoutDocument(): 计算各段落 yOffset 和行布局
  hit-testing.ts            — hitTest() + cursorToX()（双向：坐标↔游标）
  selection-state.ts        — useSelectionState() hook
  selection-geometry.ts     — computeSelectionRects()
  use-selection-gestures.ts — pointer events 处理
  SelectionHighlight.tsx    — 高亮矩形层
  TextLine.tsx              — 单行文本组件
  SelectableDocument.tsx    — 主组件

app/selection/index.tsx     — Demo 页面
```

## 关键设计决策

### 平台策略
先面向 Web 实现。pretext 在浏览器中可直接使用原生 Canvas `measureText()`，无需 polyfill。

### 渲染对齐
文本用 `white-space: pre` 渲染，`font` 字符串与传给 pretext 的完全一致，确保浏览器渲染与 pretext 测量对齐。

### Hit-Testing 算法
1. 根据 Y 坐标找段落（遍历 `yOffset` + `height`）
2. 根据段落内 Y 找行（`floor(localY / lineHeight)`）
3. 根据 X 遍历 segments 累加宽度，判断最近的游标位置
   - 多 grapheme segment 使用 `breakableWidths` 逐字符累加
   - 当累加宽度的中点超过 targetX 时，返回当前游标

### Selection Geometry
- 标准化 anchor/focus 方向（start ≤ end）
- 完全选中的行：`rect = { x: 0, width: maxWidth }`
- 首行/末行部分选中：用 `cursorToX()` 计算精确 X 坐标

### 手势处理
- **鼠标**: pointerdown 开始 → pointermove 扩展 → pointerup 结束
- **触摸**: 长按 500ms 启动 → 拖动扩展
- 容器设置 `user-select: none` 防止浏览器原生选中干扰

## 访问 Pretext 内部数据

`PreparedTextWithSegments` 类型通过继承链暴露了 `widths`、`breakableWidths`、`segments`、`kinds` 等字段，无需 unsafe cast。具体类型链：

```
PreparedTextWithSegments = InternalPreparedText & { segments: string[] }
InternalPreparedText = PreparedText & PreparedCore
PreparedCore = { widths, breakableWidths, kinds, ... }
```

## Native 平台 (React Native)

### 渲染架构
每条 pretext 计算的行对应一个 `<Text>` 组件，绝对定位（`position: absolute, left: 0, top: yOffset + lineIndex * lineHeight`）。容器 `<View>` 设置固定宽高。

### 测量对齐
polyfill 通过 `expo-text-measure` 调用平台原生 API（iOS CoreText / Android Paint）测量文本宽度，与 RN `<Text>` 使用同一排版引擎，零偏差。

### 手势处理
Native 使用 `PanResponder`（`use-selection-gestures.native.ts`），长按 500ms 启动选中，拖动扩展。

### 已修复的 pretext Bug
`walkPreparedLines` 在 space 后跟大量 CJK 字符时，overflow 回退到 pendingBreak 会跳过中间 segment，导致整段文字丢失。已在 pretext 0.0.4 修复。

## Demo

### Web
`bun dev` → 访问 `/selection`

- 4 段中英文混合文本
- 宽度滑块（300–900px）
- 鼠标拖选跨段落
- Debug overlay 显示 hit-test 位置

### Native (Expo)
`bun run start` → Selection tab

- Preset 切换（Mixed/中文/Lorem Ipsum/Emoji）
- 宽度滑块（200px – screenWidth-50px）
- 长按拖选跨段落
- 自定义文本输入
