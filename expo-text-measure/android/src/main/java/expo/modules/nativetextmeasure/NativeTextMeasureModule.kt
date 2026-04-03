package expo.modules.nativetextmeasure

import android.graphics.Paint
import android.graphics.Typeface
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NativeTextMeasureModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NativeTextMeasure")

    // Synchronous function — uses Android's Paint.measureText() which matches
    // the same text layout engine that RN's <Text> uses for rendering.
    Function("measureText") { text: String, fontSize: Double, fontFamily: String ->
      val paint = Paint().apply {
        textSize = fontSize.toFloat()
        typeface = when {
          fontFamily == "System" || fontFamily.isEmpty() -> Typeface.DEFAULT
          else -> Typeface.create(fontFamily, Typeface.NORMAL) ?: Typeface.DEFAULT
        }
        isAntiAlias = true
      }
      paint.measureText(text).toDouble()
    }
  }
}
