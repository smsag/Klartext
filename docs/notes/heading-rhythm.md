# Heading and block rhythm: Reading view matched to Live Preview

Live Preview is the reference. There, what separates a heading from its neighbours is the blank source line between them and nothing else: the gap is one blank line plus the leading that the blank line's own box adds at each end.

- Obsidian reads the `--hN-*` variables in both modes: h1…h6 in Reading view, and the heading *line* in Live Preview, where the `.cm-header-N` span is forced to `font-size: inherit !important`. So the size ladder lives in one place; the Reading-view heading rules add only margins and H6's colour (also kept on the LP span).
- Margins do not reach the editor. Obsidian zeroes every `.cm-content` child's margin with `margin: 0 !important` at (0,3,1), so `.HyperMD-header-N` margins and margins on list lines compute to 0. List items are spaced by Obsidian alone (`--list-spacing`, as padding).
- Reading view has no blank line, so the gap is built from margins. The heading owns the gap above it; the block before it hands over its bottom margin, because the paragraph gap (2.24em) would otherwise win the collapse and open ~36px where the editor shows ~28px.
- h1 has line-height 1.15 against 1.3 for h2–h6, which puts ~2px less leading above its text and ~2px more below, so it gets its own margins.
- Measured at a 16px body, both modes, text box to text box: every gap lands within 1px of Live Preview.
- Obsidian's own (0,2,3) rule `div + div > hN` gives a heading that follows a block a 3em gap; the theme restates that specificity so its values win on load order.
- Each level gets its own selector rather than one `:is(h2, …, h6)`: a rule whose last compound is a multi-argument `:is()` cannot be filed under a tag, so Chromium tries it against every element on every style recalculation. Written out, it is tried only against headings.

### Gap below a standalone block

Obsidian wraps each rendered block in its own `.el-*` div, but the wrappers carry no margins, so adjacent blocks still collapse: the gap is max(previous bottom, next top), not the sum. A paragraph's margins are asymmetric (35.84px below, 19.2px above at default settings) because the gap between paragraphs is carried by the bottom one. Above a block, the paragraph's bottom margin wins the collapse. Below a block, the next paragraph offers only its small top margin, so without an explicit bottom margin the gap comes out short: 22px after a quote, 19px after a code block, 24px short after a callout (own 1.5em), against the 36px Live Preview gives. The block family (blockquote, callout, pre, table, embed, math, mermaid) therefore takes `--klartext-block-bottom`, the same length the paragraph gap uses.

### Live Preview paragraph gap

A Markdown paragraph break is a blank line, rendered as a `.cm-line` holding only a `<br>`. That line gets `--klartext-p-gap` × body line height. Blank lines directly before/after a heading, a list or a horizontal rule stay at one line height (the heading's taller line, the list's attachment to its neighbours, and the rule's own margins set those gaps). So does the last line when empty: taller, it moved whatever follows the note (plugin footers, backlinks) by the difference when a character was typed into it, and back on Enter (9px each way at a 14px body, measured on a phone).
