# Marker column

The marker column starts ON the text edge: the mark is part of the text flow, and only the #ₙ heading badge hangs outside it. It is a whole number of character cells of the monospace body wide (Style Settings: Marker Column; two by default, four as an option), stored in `--klartext-marker-column` and resolved to a length in `--klartext-col`.

- Its last cell is always blank, the gap. Every mark is right-aligned against that gap cell, so the dash, the last digit and the checkbox all end one cell before the text.
- At two cells a dash or a single digit is flush with the edge and "10" hangs its first digit into the margin; at four cells three digits fit inside and a single digit sits two cells in.
- Every hanging block (bulleted, numbered, task, quote, callout) starts its text at the column's far edge, in both modes and in every editing state; nested items step by one column.

In Live Preview the column is the marker token itself: an inline-block one column wide, end-aligned, whose source characters stay in normal flow (hidden by the Klartext Marks face, see EMBEDDED FONTS). Its content ends on the column's far edge, so the caret at the end of the marker sits where the text begins. Obsidian measures each line's hanging indent from that same caret (see LISTS), so wrapped lines land on the same edge by construction.

## Live Preview construction

### Obsidian facts it rests on

Both facts are from Obsidian 1.13.7. They were read from its code and measured over the debugging port.

- **Rendered marks are withheld while the selection touches the token, end included.** A fresh item with the cursor right after `1. ` is always in its plain state. So is one the user has just typed extra spaces into.
- **The hanging indent is written per line from `coordsAtPos()` at the end of the marker text**, which is the caret position. It is floored to a pixel and applied as `text-indent` / `padding-inline-start`. Where there is no caret coordinate there is no indent at all.

### Tokens

- `.cm-formatting-list-ul` holds `- `. When idle, the `-` is wrapped in Obsidian's `.list-bullet`; when active it is plain.
- `.cm-formatting-list-ol` holds `1. ` together with every space that follows it. When idle it is wrapped in `.list-number`; when active it is plain.
- `.cm-formatting-quote` holds `> `. When idle, the `>` is in its own transparent span, with the space beside it; on the active line the token is one plain span.

### Construction

Keep the characters in normal flow with real metrics. Turn the ones that must not show into empty zero-advance glyphs through the Klartext Marks face. Make the token an inline-block one column wide, end-aligned. Its content then ends on the column's far edge, so the caret at the end of the marker is drawn where the text begins. Obsidian measures the hanging indent there and writes the column width, so wrapped lines sit on the same edge.

Constraints that rule out alternatives:

- A whitespace-only text node inside an inline-flex container is not rendered at all and has no caret coordinate. That rules out flex on the bullet token.
- Anything clipped or painted over hides the caret.

### Per marker

- **Bulleted.** No character of the token is visible. The dash is a `::before` followed by one cell of margin as the gap. End-aligned, it lands in the column's last mark cell: the first cell at a two-cell column, the third at four. One dash serves `-`, `*` and `+`, since Reading view can't tell them apart either.
- **Numbered.** The digits are visible and right-align on their own. The dot (or parenthesis) keeps one cell of advance but no ink, so `10.` ends on the column's edge with its digits ending one cell earlier, and extra spaces cost nothing. A number with more digits than the column has mark cells hangs its first digits into the margin. That's why the number token is a flex box.
- **Task.** Obsidian replaces `- [ ]` with a checkbox widget and leaves the space after it as body text. The widget is the column less one cell, with the box at its end; the space is the last cell.
- **Blockquote.** Each `> ` token is one column, so level-2 text sits one column further in. The bars are drawn from the line, not from the tokens: level 1 by Obsidian's own `::before`, levels 2 and 3 by an `::after` on the line, each on the axis of its own column. Obsidian's level-2 widget (`.cm-blockquote-border`) is present only on idle lines. It is collapsed to nothing, so an idle nested line measures the same as an active one.
- **Quote size.** The line takes the quote's size, not only the spans inside it, so both modes lead a quote identically (Reading view sizes the blockquote). The column is derived from the body size, not from em, so the text edge matches every other block. The inline hanging indent Obsidian writes is left alone: it equals the token's width.
