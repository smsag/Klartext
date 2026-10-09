# Highlight stroke

`==Highlight==` is drawn as a marker stroke, not a form field: a slanted, feathered start where the pen sets down, a flat run, and a lighter, feathered lift. A highlight that wraps is one stroke per line, each with its own landing and lift (`box-decoration-break: clone`). Vertical padding overshoots the letters as a felt tip does (inline padding never moves the line), and equal negative side margins hand the horizontal overshoot back so the text keeps its place. No radius, no shadow, one hue.

### Geometry
- Sweep angle 104deg.
- Landing: transparent to 0.2em, full ink by 0.7em (the pen lands over half a character).
- Lift: full ink to 88%, transparent by `calc(100% - 0.28em)` (it lifts off over the last sixth).
- Padding 0.14em vertical / 0.42em horizontal, cancelled by an equal negative margin.
- The `--hl-*` custom properties are local to the stroke rule.

### Ink strength
Ink strength is measured, not picked. The yellow ink sits 70 from the page: Euclidean RGB distance from `--background-primary`, sampled over the flat middle of the stroke in a screenshot. 60–140 is the band where a mark on a run of prose reads as a mark: below it, a rendering artefact; above it, a UI chip dropped into a paragraph.

### Rejected treatments
- No `border-radius`: a marker has no corners, and a rounded end reads as a field or chip.
- No `text-shadow`: a halo competes with the stroke and inverts between light and dark.
- No `box-shadow`, no border.
- Do not vary the angle to tell two marks apart; it is not legible at text size. Vary the ink.

### Live Preview seams
A stroke must not lift in the middle of a line. Live Preview splits a highlight into one span per formatting change (inline code, bold, a link, and the `==` marks themselves while the line is edited). If each span were a complete stroke the pen would lift and land around every piece of code in a sentence. So:
- A span **followed** by more of the same highlight ends flat: its lift is switched off and its end padding runs on under the next span's start. The siblings are matched in both patterns: adjacent while the line is edited, and on an idle line separated by two `.cm-widgetBuffer`s and the empty span Obsidian leaves in place of hidden formatting.
- A span that **continues** a highlight keeps its landing (so its own wrapped lines still start with one) but lands in the plain ink, not the strong one: the strong press belongs to the true start only.
- The ink is **opaque** and the span blends with `darken` (light) or `lighten` (dark). Where the flat end of one span overlaps the landing of the next, ink over ink is simply ink, and the feathered landing vanishes under the flat end instead of showing as a seam. Translucent tints cannot do this: two of them always add up darker. The opaque colours are translucent tints composited on the page.

Limitation: a span that leads into formatting ends flat on *all* its lines, because a span's ends are decided per span, not per line; a long span before inline code has no lift at its own line ends. Its landings, and every landing after the formatting, are kept. Reading view renders the whole highlight as one `<mark>` with the formatting nested inside, so every line lands and lifts and no seam exists.

Inline code inside a highlight keeps a translucent fill, so it sits on the stroke instead of cutting a window into it.

### Coloured highlights (Obsidian 1.13)
`==🔴text==` or the formatting menu. Only the two ink tokens change, on the element itself, so the stroke and seam rules read them as they read the yellow. Reading view marks the colour as `data-highlight` on the `<mark>`; Live Preview as a `cm-highlight-<colour>` class on every span. Yellow, and a `<mark>` with an empty `data-highlight`, keep the yellow ink.

While the line is edited, Live Preview shows a swatch (`.cm-highlight-color-widget`) in place of the emoji, between the opening `==` and the text, framed by two widget buffers. It is treated as a piece of the middle: the `==` before it runs on under it, it neither lands strong nor lifts, and the text after it continues the stroke. Obsidian's own fill behind the swatch would sit on the stroke as a second, translucent band; the stroke rule clears it.
