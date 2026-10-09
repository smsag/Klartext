# Mermaid diagrams

### Edge labels
Mermaid paints an edge-label chip either as an SVG `rect.labelBkg` (needs `fill`) or on the span / an inner element of the HTML label (needs `background-color`), so all of them are named. The chip is widened with a `box-shadow` halo, which has zero layout impact.

Never pad these labels. Mermaid measures them to lay the diagram out, and padding on the inline span (which wraps a block `<p>`) makes its empty inline fragments generate two phantom line boxes: every label is then measured at ~3x its height and the edges spread far from their labels (reproduced and bisected in Chromium with Mermaid 11).

### Label size and font
Labels are fixed at 0.9 of the body font; Mermaid's default 16px is larger than the body text. Because Mermaid sizes node boxes from the *measured* label, smaller labels tighten the boxes and make the diagram more compact instead of leaving small text in big boxes.

Mermaid measures in an off-screen container before the svg lands in `.mermaid`, so the rule also matches the svg by Mermaid's own `aria-roledescription` attribute (set on every diagram root at creation). The size token is an absolute length (`calc`), so root and labels do not compound.

Labels use the interface font (Fira Sans), not the monospace body font, set on the same selectors so the measurement pass uses the narrower sans metrics and the boxes fit.

### Truncation
Mermaid sizes each label's `foreignObject` from its own measurement, and any display-time difference (font fallback, padding) is clipped ("Partne", "Propstac"). The theme sets `overflow: visible`. CSS padding on `.nodeLabel` clips the same way; the box inset is Mermaid's `padding` config, which CSS cannot grow.

### Geometry
CSS geometry properties win over Mermaid's `rx`/`ry` attributes, so node and subgraph corners can read the theme's flat radius.
