import { requireNativeModule } from 'expo-modules-core'

interface NativeTextMeasureModule {
  measureText(text: string, fontSize: number, fontFamily: string, fontWeight?: string): number
}

export default requireNativeModule<NativeTextMeasureModule>('NativeTextMeasure')
