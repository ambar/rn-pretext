import {expect, test} from 'bun:test'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'

const packageRoot = join(import.meta.dir, '..')

test('native text measure accepts and applies font weight', () => {
  const indexSource = readFileSync(join(packageRoot, 'index.ts'), 'utf8')
  const iosSource = readFileSync(join(packageRoot, 'ios/NativeTextMeasureModule.swift'), 'utf8')
  const androidSource = readFileSync(
    join(packageRoot, 'android/src/main/java/expo/modules/nativetextmeasure/NativeTextMeasureModule.kt'),
    'utf8',
  )

  expect(indexSource).toContain('fontWeight?: string')
  expect(iosSource).toContain('parseFontWeight')
  expect(iosSource).toContain('UIFont.systemFont(ofSize: fontSize, weight: weight)')
  expect(androidSource).toContain('typefaceStyle')
  expect(androidSource).toContain('Typeface.BOLD')
})
