# Live Preview list indentation and tree line

## Indent units

- Obsidian emits one `.cm-indent` per nesting level and floors each at `--list-indent`:
  `.markdown-source-view.mod-cm6 .cm-indent { min-width: var(--list-indent); display: inline-block; }`
- A tab is exactly `--list-indent` wide, because Obsidian sets `tab-size` to that length. A run of spaces renders at its own width; the floor normally keeps it in line (under Obsidian's own tokens four spaces measure about 20px against a 36px unit, so they round up to the unit).
- Klartext's unit is the marker column, 1.2em, and Live Preview list lines are set in the monospace face, where a space is 0.6em. Four spaces are 2.4em, wider than the unit, so the floor never applies and one space-indented level paints as two. In a file mixing tabs and spaces (a paste, an import, a changed "Indent using tabs" setting), a sibling drops onto its own children's column while the parser still reads it as a sibling, so it also survives the parent's fold. Measured: level 2 at 19.2px with a tab, 38.4px with four spaces.
- Fix: zero-advance spaces (`word-spacing`) inside `.cm-indent` put a whole level back under the floor, so it resolves to one unit. Tabs are untouched: word-spacing does not apply to a tab, and its width comes from `tab-size`.
- Only on `.cm-indent`, Obsidian's box for a complete level and the one carrying the floor. The remainder of a partial indent (three spaces under `1. `) goes in `.cm-indent-spacing`, which has no floor; zeroing it there would collapse the indent, so it keeps Obsidian's rendering.
- Not `font-size`: the indentation guide is `.cm-indent`'s own `::before` and takes its height, so shrinking the face drops the guide from 25.6px to 6.4px (measured).
- With Editor → "Show indentation guides" off there is no `.cm-indent` at all: the indent is bare text in `.cm-hmd-list-indent` with no floor (measured: level 2 at 38px with four spaces, 19px with a tab). So `.cm-hmd-list-indent` sets each space to one `--klartext-tab-size`-th of a level: `--klartext-tab-size` spaces are exactly one unit, and a partial indent shrinks in proportion. With guides on, the `.cm-indent` rule replaces this inside each box.

## Tree line

- Obsidian draws an indentation guide only on an indented line, so its guide begins at the first child, never at the parent, and draws nothing when "Show indentation guides" is off. Klartext therefore draws the whole tree line itself and hides Obsidian's non-active guide; the active guide (cursor level) stays.
- Ancestor columns are a repeating background gradient over the line's full height, clipped to N-1 columns at level N. The parent's own column is an `::after` from below its first line box to the end of the item. Both read `--klartext-tree-x`, so they cannot drift apart.
- The gradient uses `background-origin: border-box`: Obsidian gives a list line a `padding-left` equal to its whole indent with a matching negative `text-indent`, so a content-box gradient starts past every column (measured: 38px too far right on level 2).
