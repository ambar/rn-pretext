import ExpoModulesCore
import UIKit

private func parseFontWeight(_ value: String?) -> UIFont.Weight {
  guard let rawValue = value?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased(),
        !rawValue.isEmpty,
        rawValue != "normal" else {
    return .regular
  }

  if rawValue == "bold" {
    return .bold
  }

  if let numericWeight = Int(rawValue) {
    switch numericWeight {
    case 700...:
      return .bold
    case 600:
      return .semibold
    case 500:
      return .medium
    case ...300:
      return .light
    default:
      return .regular
    }
  }

  return .regular
}

private func applyWeight(_ weight: UIFont.Weight, to font: UIFont, size fontSize: Double) -> UIFont {
  guard weight != .regular else {
    return font
  }

  var traits = font.fontDescriptor.symbolicTraits
  if weight == .bold || weight == .semibold {
    traits.insert(.traitBold)
  }

  guard let descriptor = font.fontDescriptor.withSymbolicTraits(traits) else {
    return UIFont.systemFont(ofSize: fontSize, weight: weight)
  }

  return UIFont(descriptor: descriptor, size: fontSize)
}

public class NativeTextMeasureModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeTextMeasure")

    // Synchronous function — runs on the JS thread via JSI, no bridge round-trip.
    // Uses the same CoreText engine that RN's <Text> uses for rendering,
    // so measurements match pixel-perfectly.
    Function("measureText") { (text: String, fontSize: Double, fontFamily: String, fontWeight: String?) -> Double in
      let weight = parseFontWeight(fontWeight)
      let font: UIFont
      if fontFamily == "System" || fontFamily.isEmpty {
        font = UIFont.systemFont(ofSize: fontSize, weight: weight)
      } else {
        let namedFont = UIFont(name: fontFamily, size: fontSize)
        font = namedFont.map { applyWeight(weight, to: $0, size: fontSize) }
          ?? UIFont.systemFont(ofSize: fontSize, weight: weight)
      }

      let attributes: [NSAttributedString.Key: Any] = [.font: font]
      let size = (text as NSString).size(withAttributes: attributes)
      return size.width
    }
  }
}
