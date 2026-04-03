import ExpoModulesCore
import UIKit

public class NativeTextMeasureModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeTextMeasure")

    // Synchronous function — runs on the JS thread via JSI, no bridge round-trip.
    // Uses the same CoreText engine that RN's <Text> uses for rendering,
    // so measurements match pixel-perfectly.
    Function("measureText") { (text: String, fontSize: Double, fontFamily: String) -> Double in
      let font: UIFont
      if fontFamily == "System" || fontFamily.isEmpty {
        font = UIFont.systemFont(ofSize: fontSize)
      } else {
        font = UIFont(name: fontFamily, size: fontSize) ?? UIFont.systemFont(ofSize: fontSize)
      }

      let attributes: [NSAttributedString.Key: Any] = [.font: font]
      let size = (text as NSString).size(withAttributes: attributes)
      return size.width
    }
  }
}
