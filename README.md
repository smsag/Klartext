# Klartext

A quiet, typographic theme for Obsidian. The body is monospace, the interface is not,
and every structural mark is set in type rather than drawn as an icon.

Headings, lists, quotes, tables and code share **one left edge**, so a note reads as a
single column rather than a stack of indented boxes. Both colour schemes ship in the
one file and follow Obsidian's own light/dark setting.

## Screenshots

**Light**

![Klartext in light mode](screenshots/klartext-light.png)

**Dark**

![Klartext in dark mode](screenshots/klartext-dark.png)

## What it does differently

- **Marks instead of icons.** A heading carries its level as a small `#₁`…`#₆` badge
  hung in the margin. A list item takes a dash, whichever of `-`, `*` or `+` was
  typed; an ordered item takes its number alone, without the dot. A task takes its
  box, a quote its bar. A collapsible section opens with `+` and closes with `−`. A
  code block's language is a lowercase word. None of these are images, so they scale
  with your text size and match the body face.
- **One left edge.** Headings and prose start on the paragraph edge, and every mark
  sits right there, in the text flow: the dash, the number, the checkbox, the quote
  bar. Their text starts one marker column further in — the same edge for lists,
  tasks, quotes and callouts — and keeps it whether you are reading the note,
  editing another line, or editing that very line. Wrapped lines return to that
  edge. Nested items step in by exactly one column, so a nested mark starts where
  its parent's text starts. Only the heading badge hangs outside the text.
- **Link destination in the underline.** Internal links are underlined solid,
  external links dotted. No arrow glyph interrupts the sentence.
- **A highlight is a marker stroke.** It lands once, runs flat through wrapped lines
  and through any code, bold or link inside it, and lifts once at the end.
- **One corner radius.** Content blocks, panels, chips and the flat interface all sit
  at 4px, each from its own named token so any family can be retuned alone. Callouts
  and highlights are deliberately square.
- **Separate text size per platform.** Obsidian's font-size slider lives in the vault
  and therefore syncs to every device, which makes one value serve a desktop display
  and a phone. Klartext takes the phone off that slider, so the two can be set
  independently.
- **Vertical rhythm on purpose.** Paragraph gaps, heading margins and blank lines are
  derived from the body line height rather than left to defaults, and Reading view is
  matched to Live Preview so switching modes does not shift the text.

## Requirements

- **Obsidian 1.4 or newer**, which is what `minAppVersion` declares. That floor is
  set by Properties, introduced in 1.4 and styled by this theme. Everything else the
  theme touches predates it.
- A reasonably current **installer**. Two CSS features the layout depends on, `:has()`
  and `round()`, come from the Chromium inside Obsidian's installer rather than from
  the app version, so `minAppVersion` cannot express them. Obsidian updates the app
  and the installer separately; if the marker column or the quote bar sits wrong on a
  very old installation, reinstall from the download page. Developed and measured
  against Obsidian 1.13.7.
- [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) for the
  options below. The theme works without it, at the defaults.
- No font installation. JetBrains Mono ships inside the stylesheet as a 400–700
  variable face, upright and italic, so bold and bold-italic are real faces rather
  than synthesized.

## Installation

**From Obsidian**  Settings → Appearance → Themes → Manage, then search for Klartext
and click Use.

**Manually**  Copy this folder to `<vault>/.obsidian/themes/Klartext`, so that
`theme.css` and `manifest.json` sit directly inside it. Then pick Klartext in
Settings → Appearance.

## Options

All of these live in Settings → Style Settings → Klartext.

| Option | Default | What it does |
|---|---|---|
| Editor Background | Pure White | Pure white, or a warm off-white with surfaces and borders rebalanced against it |
| Dotted Code & Header Fill | on | A faint dot-grid texture on code blocks and table headers |
| Soft Scroll Edge | on | Fades text out under the view header while scrolling instead of cutting it off |
| Hide View Header | on | Lifts the note header out of the layout; hover the top edge to bring it back. Desktop only |
| Center Mermaid Diagrams | on | Centres rendered diagrams in the text column |
| Greyscale Mermaid Diagrams | on | Renders diagrams in the theme's greys instead of Mermaid's colours |
| Translucent Diagram Boxes | off | Node fills at half opacity so edges routed behind a node stay visible |
| Diagram Font Scale | 0.9 | Mermaid label size as a factor of the body font; boxes shrink to match |
| UI Font Size | 13px | Sidebars, panels and plugin text on desktop |
| Mobile UI Font Size | 14px | The same, on phone and tablet. Obsidian resets its interface scale on mobile, so it needs its own control |
| Mobile Body Text Size | 14px | Body text on phone and tablet, independent of Appearance → Font size |
| Readable Line Width | 680px | Feeds Obsidian's own readable-line-length setting |
| Line Height | 1.6 | Body leading |
| Marker Column | Two characters | Width of the column that holds the marks. Two: a dash or a single digit is flush with the text edge, numbers from 10 hang into the margin. Four: three digits fit inside, right-aligned |
| List Indent | the column | Indent step per nested list level; left alone it equals the marker column, so nested marks start on the parent's text edge |
| Paragraph Spacing | 1.4 | Gap between paragraphs as a multiple of the line height |

After editing `theme.css` by hand, Style Settings keeps its cached parse until it
re-reads the file. Switching theme away and back, or restarting Obsidian, refreshes it.

## Mobile

Phone and tablet are treated as their own targets rather than a narrower desktop. The
marker column is symmetric so the text block stays centred, Reading view and Live
Preview get the same side padding so switching modes does not shift the text, and the
body size is its own setting. Several places where Obsidian restates a token under a
higher-specificity mobile selector are answered explicitly, so the theme's value wins
rather than Obsidian's.

## Notes for anyone editing it

`theme.css` is one file, sectioned by element with a comment block above each rule that
explains why the value is what it is. Where a number was measured rather than chosen,
the comment says what it was measured against. The `@settings` block at the top of the
file is the Style Settings schema; the four `--klartext-radius-*` tokens are the corner
system; `--ia-editor-font-size` is the alias every derived size chains from;
`--klartext-col` is the marker column that holds every mark, on the text edge.

Live Preview keeps a block's source marker in the editor as real text, and the theme
relies on that: Obsidian measures each line's hanging indent from the caret position at
the end of the marker, so the theme makes every marker token exactly one column wide
and lets the indent follow. The characters that must not show — the space, `-`, `*`,
`+`, `>`, and the dot after a number — are hidden by a font rather than by CSS:
`Klartext Marks` and its `Quote` variant, two 400-byte faces of empty glyphs built by
`fonts/make-marks.py` and embedded like the others. Nothing is clipped, boxed in flex or painted over, which is
what keeps the caret visible and the layout the same in every state.

Measured values were taken in the running Obsidian over Chromium's debugging port
(`open -a Obsidian --args --remote-debugging-port=9222`), where the caret position,
the inline hanging indent and screenshots of the real editor can be read directly.

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
records the mechanism behind each change, not just the outcome.

## Credits

By [Steffen Seitz](https://smsag.de). Typefaces: [JetBrains
Mono](https://www.jetbrains.com/lp/mono/) by JetBrains and [Fira
Sans](https://github.com/mozilla/Fira) by Mozilla, both under the SIL Open Font
License 1.1. The Klartext Marks faces are part of the theme.
