package expo.modules.nativetextmeasure

import android.graphics.Paint
import android.graphics.Typeface
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private fun typefaceStyle(fontWeight: String?): Int {
  val normalized = fontWeight?.trim()?.lowercase()
  if (normalized == "bold") {
    return Typeface.BOLD
  }

  val numericWeight = normalized?.toIntOrNull()
  return if (numericWeight != null && numericWeight >= 700) {
    Typeface.BOLD
  } else {
    Typeface.NORMAL
  }
}

class NativeTextMeasureModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NativeTextMeasure")

    // Synchronous function — uses Android's Paint.measureText() which matches
    // the same text layout engine that RN's <Text> uses for rendering.
    Function("measureText") { text: String, fontSize: Double, fontFamily: String, fontWeight: String? ->
      val style = typefaceStyle(fontWeight)
      val paint = Paint().apply {
        textSize = fontSize.toFloat()
        typeface = when {
          fontFamily == "System" || fontFamily.isEmpty() ->
            if (style == Typeface.BOLD) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
          else -> Typeface.create(fontFamily, style) ?: Typeface.DEFAULT
        }
        isAntiAlias = true
      }
      paint.measureText(text).toDouble()
    }
  }
}
