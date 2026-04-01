import "@formatjs/intl-segmenter/polyfill-force";

/**
 * OffscreenCanvas polyfill for React Native using @shopify/react-native-skia.
 *
 * Must be imported BEFORE @chenglou/pretext so that pretext's
 * `getMeasureContext()` picks up the polyfilled OffscreenCanvas.
 */

// navigator.userAgent polyfill — exists in RN but userAgent is undefined,
// which crashes pretext's getEngineProfile() on `ua.includes(...)`.
if (typeof navigator !== "undefined" && !navigator.userAgent) {
  // Simulate Safari so pretext's getEngineProfile() picks the Apple/WebKit
  // branch (lineFitEpsilon = 1/64, preferPrefixWidthsForBreakableRuns, etc.)
  (navigator as any).userAgent = "Safari/1";
  (navigator as any).vendor = "Apple Computer, Inc.";
}

import { matchFont } from "@shopify/react-native-skia";

const fontWeightMap: Record<string, string> = {
  "100": "100",
  "200": "200",
  "300": "300",
  "400": "normal",
  "500": "500",
  "600": "600",
  "700": "bold",
  "800": "800",
  "900": "900",
  normal: "normal",
  bold: "bold",
  lighter: "300",
  bolder: "700",
};

/**
 * Parse a CSS font shorthand string into components.
 * Handles common forms:
 *   "16px Inter"
 *   "bold 16px Inter"
 *   "italic bold 18px 'Helvetica Neue'"
 *   "700 14px/1.5 System"
 */
function parseCSSFont(cssFont: string): {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: "normal" | "italic" | "oblique";
} {
  let fontStyle: "normal" | "italic" | "oblique" = "normal";
  let fontWeight = "normal";
  let fontSize = 16;
  let fontFamily = "System";

  // Tokenize, respecting quoted strings
  const tokens: string[] = [];
  const re = /'[^']*'|"[^"]*"|\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cssFont)) !== null) {
    tokens.push(m[0]);
  }

  let i = 0;

  // Consume optional font-style
  if (tokens[i] === "italic" || tokens[i] === "oblique") {
    fontStyle = tokens[i] as "italic" | "oblique";
    i++;
  }

  // Consume optional font-weight
  if (tokens[i] && fontWeightMap[tokens[i]]) {
    fontWeight = fontWeightMap[tokens[i]];
    i++;
  }

  // Consume font-size (with optional /line-height)
  if (tokens[i]) {
    const sizeToken = tokens[i];
    const sizeMatch = sizeToken.match(/^(\d+(?:\.\d+)?)\s*px/);
    if (sizeMatch) {
      fontSize = parseFloat(sizeMatch[1]);
      i++;
    }
  }

  // Everything remaining is font-family
  if (i < tokens.length) {
    fontFamily = tokens
      .slice(i)
      .map((t) => t.replace(/^['"]|['"]$/g, ""))
      .join(" ");
  }

  return { fontSize, fontFamily, fontWeight, fontStyle };
}

class RNCanvasContext {
  private _cssFont = "16px System";
  private _skFont = matchFont({ fontFamily: "System", fontSize: 16 });

  set font(cssFont: string) {
    if (cssFont === this._cssFont) return;
    this._cssFont = cssFont;
    const { fontSize, fontFamily, fontWeight, fontStyle } =
      parseCSSFont(cssFont);
    this._skFont = matchFont({
      fontFamily,
      fontSize,
      fontWeight: fontWeight as any,
      fontStyle: fontStyle as any,
    });
  }

  get font() {
    return this._cssFont;
  }

  measureText(text: string): { width: number } {
    const rect = this._skFont.measureText(text);
    return { width: rect.width };
  }
}

class RNOffscreenCanvas {
  constructor(_w: number, _h: number) {}
  getContext(_kind: string) {
    return new RNCanvasContext();
  }
}

(globalThis as any).OffscreenCanvas = RNOffscreenCanvas;
