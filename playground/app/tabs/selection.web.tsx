import { useMemo, useState } from "react";
import { SelectableDocument } from "../../lib/pretext-selection/SelectableDocument";
import { buildSelectionDemoDocument } from "../../lib/pretext-selection/selection-demo-data";

const FONT = "16px system-ui, -apple-system, sans-serif";

export default function SelectionTabWeb() {
  const [maxWidth, setMaxWidth] = useState(600);

  const document = useMemo(
    () => buildSelectionDemoDocument(maxWidth, FONT),
    [maxWidth],
  );

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        Cross-Paragraph Text Selection
      </h1>
      <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
        Powered by <code>@chenglou/pretext</code> — click and drag to select
        text
      </p>

      <div style={{ marginBottom: 20 }}>
        <label
          htmlFor="selection-width"
          style={{ fontSize: 13, fontWeight: 600, color: "#333" }}
        >
          Container width: {maxWidth}px
        </label>
        <input
          id="selection-width"
          type="range"
          min={300}
          max={900}
          value={maxWidth}
          onChange={(e) => setMaxWidth(Number(e.target.value))}
          style={{ display: "block", width: 300, marginTop: 8 }}
        />
      </div>

      <div
        style={{
          border: "1px solid #e0e0e0",
          borderRadius: 8,
          padding: 20,
          backgroundColor: "#fff",
        }}
      >
        <SelectableDocument document={document} debug />
      </div>
    </div>
  );
}
