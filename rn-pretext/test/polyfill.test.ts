import {expect, mock, test} from 'bun:test'

test('passes CSS font weight through to native measurement', async () => {
  const calls: unknown[][] = []

  mock.module('expo-text-measure', () => ({
    default: {
      measureText: (...args: unknown[]) => {
        calls.push(args)
        return 42
      },
    },
  }))

  delete (globalThis as {OffscreenCanvas?: unknown}).OffscreenCanvas

  await import('../src/polyfill')

  const canvas = new (globalThis as any).OffscreenCanvas(1, 1)
  const context = canvas.getContext('2d')
  context.font = '700 20px System'
  const metrics = context.measureText('Bold heading — 示例')

  expect(metrics.width).toBe(42)
  expect(calls).toEqual([['Bold heading — 示例', 20, 'System', '700']])
})
