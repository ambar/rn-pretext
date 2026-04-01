import type { Document } from './types'

export const SAMPLE_PARAGRAPHS = [
  `Pretext is a pure JavaScript library for multiline text measurement and layout. It computes text dimensions without touching the DOM — avoiding expensive layout reflow operations like getBoundingClientRect or offsetHeight.`,

  `这段文字演示了跨段落文本选中功能。Pretext 支持所有语言，包括中文、日文、韩文、emoji 以及混合双向文本。你可以从这一段开始选中，一直拖到下一段。`,

  `The prepare() function does a one-time measurement pass using the browser's canvas measureText, then layout() does pure arithmetic to compute height and line count at any given width. This makes resize operations extremely fast — about 0.09ms for a batch of 500 texts.`,

  `Try selecting across multiple paragraphs! Click and drag from any position to any other position. The blue highlight should follow your selection across paragraph boundaries. 🎉`,
]

export type DemoPreset = { label: string; paragraphs: string[] }

export const DEMO_PRESETS: DemoPreset[] = [
  {
    label: 'Mixed (默认)',
    paragraphs: SAMPLE_PARAGRAPHS,
  },
  {
    label: '中文',
    paragraphs: [
      '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。闰余成岁，律吕调阳。',
      '云对雨，雪对风，晚照对晴空。来鸿对去燕，宿鸟对鸣虫。三尺剑，六钧弓，岭北对江东。',
      '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
    ],
  },
  {
    label: 'Lorem Ipsum',
    paragraphs: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
      'Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.',
    ],
  },
  {
    label: 'Emoji 🎨',
    paragraphs: [
      '🚀 Rocket science isn\'t that hard — it\'s basically just "go up and don\'t come down too fast" 🌍💨',
      '🎵 Do Re Mi Fa Sol La Si 🎶 — 音乐是世界共通的语言。Every culture has rhythm, melody, and the urge to dance 💃🕺',
      '🧪 H₂O + ☀️ = 🌈. Science is magic that works! From 🔬 to 🔭, we keep looking closer and further.',
    ],
  },
]

export function buildSelectionDemoDocument(
  maxWidth: number,
  font: string,
  lineHeight = 24,
  paragraphGap = 16,
  paragraphs: string[] = SAMPLE_PARAGRAPHS,
): Document {
  return {
    paragraphs: paragraphs.map((text) => ({
      text,
      font,
      lineHeight,
    })),
    maxWidth,
    paragraphGap,
  }
}
