/**
 * OffscreenCanvas polyfill using platform-native text measurement.
 *
 * Uses CoreText (iOS) / Paint.measureText (Android) via expo-text-measure.
 * Because the measurement engine is the same one RN's <Text> uses for
 * rendering, there is zero width discrepancy.
 *
 * Must be imported BEFORE @chenglou/pretext so that pretext's
 * getMeasureContext() picks up the polyfilled OffscreenCanvas.
 */

import "@formatjs/intl-segmenter/polyfill-force";

// navigator.userAgent polyfill — exists in RN but userAgent is undefined,
// which crashes pretext's getEngineProfile() on `ua.includes(...)`.
if (typeof navigator !== "undefined" && !navigator.userAgent) {
  (navigator as any).userAgent = "Safari/1";
  (navigator as any).vendor = "Apple Computer, Inc.";
}

import NativeTextMeasure from "expo-text-measure";

function parseCSSFont(cssFont: string): {
  fontSize: number;
  fontFamily: string;
} {
  let fontSize = 16;
  let fontFamily = "System";

  const tokens: string[] = [];
  const re = /'[^']*'|"[^"]*"|\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cssFont)) !== null) {
    tokens.push(m[0]);
  }

  let i = 0;
  for (; i < tokens.length; i++) {
    const sizeMatch = tokens[i].match(/^(\d+(?:\.\d+)?)\s*px/);
    if (sizeMatch) {
      fontSize = parseFloat(sizeMatch[1]);
      i++;
      break;
    }
  }

  if (i < tokens.length) {
    fontFamily = tokens
      .slice(i)
      .map((t) => t.replace(/^['"]|['"]$/g, ""))
      .join(" ");
  }

  return { fontSize, fontFamily };
}

class RNCanvasContext {
  private _cssFont = "16px System";
  private _fontSize = 16;
  private _fontFamily = "System";

  set font(cssFont: string) {
    if (cssFont === this._cssFont) return;
    this._cssFont = cssFont;
    const { fontSize, fontFamily } = parseCSSFont(cssFont);
    this._fontSize = fontSize;
    this._fontFamily = fontFamily;
  }

  get font() {
    return this._cssFont;
  }

  measureText(text: string): { width: number } {
    const width = NativeTextMeasure.measureText(
      text,
      this._fontSize,
      this._fontFamily,
    );
    return { width };
  }
}

class RNOffscreenCanvas {
  constructor(_w: number, _h: number) {}
  getContext(_kind: string) {
    return new RNCanvasContext();
  }
}

(globalThis as any).OffscreenCanvas = RNOffscreenCanvas;
