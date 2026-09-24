# Changelog

All notable changes to the Klartext theme are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Twelve Style Settings switches for Obsidian's furniture**, every one **off
  by default**, so a vault that wants a quiet window does not need a plugin for
  it. Eleven hide something: the tab strip, the status bar, the vault profile,
  scroll bars, the sidebar toggle buttons, tooltips, the file explorer's button
  row, properties in Reading view, the search options panel, the per-file match
  counts in the search pane, and the keyboard hints at the foot of a prompt.
  The twelfth, **Align Top Row With Window Buttons**, drops the window's top row
  4px onto the axis of the macOS window buttons, sidebar toggles included.

  Several reach further than their names, so their descriptions say what goes
  with them and how to get it back. Hiding the tab strip also takes the **+**
  new tab button and the right sidebar button, and makes the note header the
  handle for dragging the window, since the strip was the only one. Hiding the
  vault profile takes the settings gear, the help button and the vault switcher
  with it, and is desktop only.

  Each rule is narrower than the class it hides, because Obsidian reuses them:
  tooltips spare the error tooltip that says why a rename or a property was
  refused, the match counts leave the backlinks and tag panes alone, and the
  search options rule leaves the quick switcher and the editor's autocomplete
  alone. Scroll bars are hidden through Obsidian's own `--scrollbar-native-width`,
  which is what actually works on macOS; a `::-webkit-scrollbar` rule is ignored
  there. The window-button inset and alignment apply only where Obsidian's own
  reservation does, with the frame hidden and not in fullscreen.

### Changed
- **The list tree line is the theme's, from end to end.** It used to be a
  collaboration: Obsidian drew a guide on every indented line, and the theme
  added the one segment Obsidian never draws — the parent's own, since a guide
  begins at the first child. That made the line depend on **Settings → Editor →
  Show indentation guides**: with it off there were no guides, and the theme's
  segment became a stub joined to nothing, beside the one item in a note whose
  text happened to wrap. Reported as exactly that.

  The theme now draws the whole line. A line's ancestor columns are a single
  repeating gradient over its full height, its parent's column is the segment
  below its bullet, and Obsidian's own guide steps aside so nothing is painted
  twice. The tree reads the same whether the setting is on or off — verified by
  scanning the painted pixels in both states and finding the same columns to
  the pixel. Obsidian's **active** guide is deliberately left alone: it marks
  the level the cursor is on, which a uniform line cannot say, and it only
  exists while the setting is on.

  Nesting is drawn to six levels; deeper items simply get no line rather than a
  wrong one.
### Changed
- **A search field now has an edge you can see.** The field at the top of the
  search, tag and backlinks panes was drawn as a filled box with a border, and
  the border was `--background-modifier-border` — a hairline meant for the seam
  between two surfaces, measured here at 1.23:1 against the page. In dark it was
  worse than faint: Obsidian sets the form-field fill to `#2e2e2e`, which is
  exactly what that token resolves to, so fill and border were the same colour
  and the box had no edge at all. WCAG asks 3:1 for the boundary of a control.

  Rather than tint the fill harder, the box is gone. A pane is already a box,
  and a second one at the top of it competes with the list it filters. What is
  left is the field on the pane's own ground with one rule underneath, at
  `--klartext-field-rule` — a new token, measured at 3.46 / 3.23 / 3.03 to 1 on
  the three light grounds and 3.65 / 3.34 / 3.01 on the dark ones. This is the
  silhouette the theme already gave the command palette; the palette keeps it
  and gains the same rule.

  It is also the silhouette Obsidian itself uses on a phone. Measured with no
  theme loaded, the field there already has no fill, no radius and a bottom
  border alone — only the desktop wrapped it in a box. So there is one rule at
  every size, and the phone is unchanged apart from the colour.

- **Focus says something.** Both fields now answer focus by thickening that rule
  to 2px in the accent, and nothing else — no ring outside the box, which a pane
  clips along its top edge into something that reads as a rendering fault.
  Hover holds the rest colour rather than replacing it: Obsidian states hover
  and focus for this field at a specificity a plain rule loses to, so both are
  restated here at its own and win on source order. Without that, crossing the
  field with a pointer put the boundary straight back under 3:1.

### Fixed
- **The one gap in the heading gutter that was supposed to be constant came
  out three different sizes.** Live Preview reserves a column to the left of
  every heading and hangs the `#ₙ` badge back into it, so headings share a left
  edge with the body text. Every length in that column is measured in body
  units — except the fold chevron's, which ended `+ 0.5em`, and `em` on that
  element is the HEADING's size. At a 14px body that is 18.2px under an `h1`,
  10.5px under an `h2` and 9.1px under an `h3`. It is now
  `var(--klartext-cell)`, one width at every level.
  Nothing on a desktop ever showed it: the chevron is hover-only there, so its
  margin never reaches the layout. That is exactly what let a level-dependent
  length sit in the column unnoticed, and it is why the guard below is worth
  more than the fix.
- `tools/check-heading-gutter.mjs` fails on any heading-relative unit (`em`,
  `rem`, `ch`, `ex`, `lh`) inside the gutter rules, and on the rules going
  missing. Proved to fail on the original `0.5em` and on a fresh one planted in
  the badge rule.

- **The theme's button hover no longer overrides a plugin that styles its own.**
  This theme flattens the resting fill to white, which leaves Obsidian's own
  hover a five-in-255 step off the ground, so the BUTTONS rule replaces it with
  `--surface-muted`. That is worth keeping — plugins use `<button>` for
  icon-shaped controls that would otherwise have no hover feedback at all. The
  `!important` on it was not: the selector is (0,2,1) against Obsidian's (0,1,1)
  and already wins, while `!important` cannot be out-ranked at any specificity,
  so it also reached past plugins that had deliberately styled their own hover.
  Measured in Obsidian: one plugin's accent-filled primary button painted
  `#f2f2ee` under a white label — 1.12:1, an empty grey box where its Send
  button used to be. With the `!important` gone, every button without a hover
  of its own still paints `#f2f2ee` (Obsidian's own, and two of the three
  plugins measured), and that primary button is back to 3.51:1 on its own
  accent.
- `tools/check-button-hover.mjs` fails if an `!important` declaration lands on a
  bare `button` again. `.mod-cta` is exempt — that is Obsidian's own dialog
  chrome. It reads the selector's SUBJECT, so a rule that merely mentions a
  button in `:has()` is not flagged.

### Added
- `tools/check-highlight.mjs` fails if the marker-pen stroke changes shape: the
  seven numbers that are the geometry, and the three properties the rule states
  as `none` / `0` because each has been re-added by hand before — a
  border-radius (which makes the end read as a chip), a text-shadow halo (which
  inverts between light and dark) and a box-shadow.

### Changed
- The HIGHLIGHT / MARK rule's comment now states the stroke's own reasoning: the
  geometry, the measured ink strength (this ink sits 70 from the page, Euclidean
  RGB distance sampled over the flat middle of the stroke; 60-140 is the band
  where a mark on prose reads as a mark), and the three things not to add. It
  previously pointed at a file outside the theme for half of that.

### Removed
- **`kit/highlight.css` and `tools/check-highlight-kit.mjs`.** The theme had
  started carrying a copy of its own stroke for other projects to take, and a
  guard that failed when the two drifted. That made the theme a dependency of
  things that must work under any theme, and it made a change here a red build
  elsewhere. The stroke stays exactly as it is; it is simply the theme's own
  again, documented in the rule rather than in a file written for someone else.

## [1.6.3] — 2026-09-19

### Changed
- **The line between a sidebar and the note is a hairline again.** The theme
  softens that divider on the resize handle, where Obsidian draws it, and then
  drew a second one at full strength on the sidebar split itself, immediately
  alongside. Measured in Obsidian, the seam painted as a two-pixel ramp —
  `#f0f0ed` then `#e8e8e6` against the note's `#ffffff` — so it read as a rule
  rather than an edge. The split's border is gone; one pixel of `--border-subtle`
  remains, a contrast step of 15 against the note instead of 23 (dark mode: 12
  instead of 20). Pane geometry is unchanged.

### Fixed
- **The sidebar's background rule points at a class that exists.** It was headed
  by `.workspace-sidebar`, which matches nothing — Obsidian's stylesheet never
  emits that class, and this was the only rule in the theme that named it. The
  file explorer was tinted anyway, through `.nav-files-container` further down
  the same selector list; the dead lines have been dropped. The tint is not
  extended to plugin panels: a panel builds its own tonal hierarchy on
  `--background-primary`, and repainting its ground flattens the surfaces it
  raises to `--background-secondary`.

- **A list level indented with spaces no longer paints twice as deep.** Obsidian
  emits one indent box per nesting level and floors each at `--list-indent`; a
  tab is exactly that wide, and a run of spaces is only correct while the floor
  catches it. This theme's unit is the marker column, 1.2em, and Live-Preview
  list lines are monospace, where a space is 0.6em — so four spaces measured
  2.4em, cleared the floor, and rendered as two levels. In a file mixing tabs
  and spaces (a paste, an import, a vault whose "Indent using tabs" setting
  changed) a sibling therefore dropped onto its own children's column while the
  parser still read it as a sibling, so it also survived the parent's fold.
  A whole level's worth of spaces now carries no advance, which puts it back
  under the floor; tabs are untouched, and the remainder of a PARTIAL indent
  (three spaces under "1. ", say) is left as Obsidian renders it, since it has
  no floor to fall back on. Measured in Obsidian: a second-level item was
  19.2px in with a tab and 38.4px in with four spaces, and is now 19.2px either
  way.

- **A callout or a quote inside a list item is spaced like an item again.** Both
  blocks carry generous vertical margins chosen against the paragraphs they sit
  between, and the quote's is deliberately asymmetric so its bottom survives the
  collapse with the next paragraph. A list item collapses none of it: Obsidian
  gives every item 1.2px of vertical padding, and a padding edge stops a child's
  margin collapsing through it, so both ends were added in full inside the item.
  Measured in reading view: a callout with a title and no body, written as a
  list item's whole content, turned a 22px block into a 72px item and left the
  item's number sitting 25px above the line it numbers; a quote turned a 24px
  block into 84px. A three-item sublist came out 184px tall where its content
  needs 91px. Such a block now takes the same 0.4em the theme already puts
  between items. Live Preview is unaffected — Obsidian does not build a callout
  widget for one written inside a list item, so those lines stay source there.

### Added
- `tools/check-dividers.mjs` fails if a border on the sidebar split comes back.
  It needs no Obsidian and runs from the pre-commit hook for any commit that
  touches `src/theme.css`.
- `tools/check-list-blocks.mjs` fails if a callout or a quote keeps its
  prose-flow margin inside a list item — if the override is dropped, if only one
  of the two blocks is covered, or if it is written without the `!important` the
  rule it overrides carries. Same conditions: no Obsidian, run from the hook.
- `tools/check-list-indent.mjs` fails if a level written with spaces can render
  wider than one indent unit — if the space advance stops being neutralised on
  the indent box, if it is neutralised with `font-size` (which also collapses
  the indentation guide, measured at 25.6px to 6.4px), or if the tokens the
  arithmetic reads change shape. Same conditions: no Obsidian, run from the
  hook.

## [1.6.2] — 2026-09-16

### Changed
- **The phone's floating chrome takes Obsidian's own shapes again.** 1.6.1
  flattened the phone's touch radius ladder along with the desktop's, so the
  tab switcher's card and rows, the collapsed selector and the drawer's
  search and filter fields became 4px rectangles — under a blurred shadow
  drawn for a rounded card, with the active row's highlight ending hard on
  the selector. Those are controls under a thumb, not panels on a page, and
  measured against Obsidian's own drawer they are pills for that reason (card
  and rows 30px, filter 44px). The touch ladder and the six tokens Obsidian
  derives from it are no longer pinned; the theme's flat corner stays for
  blocks, callouts, code, tables and the desktop's controls. The selector
  also keeps Obsidian's fill rather than 1.6.1's surround colour and hairline.

### Fixed
- **The open tab switcher's last row no longer ends on the selector's edge.**
  Obsidian's reserve puts the last row's bottom exactly on the selector's top
  (0px, measured in both themes); the card's own 8px step is added, so the
  seam is a gap.
- **No dead strip under a plugin's view in the phone drawer.** 1.6.1 padded the
  bottom of every drawer view by `--touch-size-l` (52px), reasoning that the
  collapsed tab selector floats over the view's last row. Measured in Obsidian
  1.13 with the phone emulation, it does not: the drawer is a flex column and
  the selector is `position: relative`, sitting below the view in normal flow.
  The reserve was 52px of empty panel under every plugin view — under a chat
  composer, its Send button hung two finger-widths above the selector, and
  Obsidian's own floating-nav fade (a 48px sidebar-coloured `::after` at the
  foot of each drawer leaf) painted that empty strip as a gradient band. The
  rule is removed; the open tab switcher's own reserve (the floating option
  list) is unchanged.

## [1.6.1] — 2026-09-15

### Fixed
- **Flat corners on the phone's chrome.** The radius ladder was pinned on
  `body`, and Obsidian assigns the phone's radius tokens under `.is-mobile`,
  which out-ranks it — so the drawer's tab switcher, its search and filter
  fields and every control reading `--touch-radius-*` kept 24-44px corners
  while the desktop sat at 4px. The ladder and the six tokens Obsidian
  derives from it (`--nav-item-radius`, `--input-radius`, `--textarea-radius`,
  `--modal-radius`, `--setting-items-radius`, `--canvas-controls-radius`)
  are restated on `body.is-mobile`, and the switcher's own elements take the
  flat radius directly, so a literal value in a mobile rule cannot put a
  round corner back beside 4px panels. The sheet grab handle keeps its pill.
- **Nothing paints outside the drawer.** A list row wider than the drawer —
  a full-bleed selection band sized against the window rather than against
  the panel — was drawn across the note beside it. The drawer clips its own
  horizontal overflow (`overflow-x: clip`, which establishes no scroll
  container, so scrolling inside it is untouched).
- **The last row of the open tab switcher clears the selector.** The theme
  cut the panel's bottom reserve from Obsidian's `--touch-size-l` (52px) to
  a flat 40px, read off a ~35px control. The control is a floating card with
  its own margins and is taller than that, so the panel's last option sat
  half-covered by it. The reserve now follows the theme's interface scale
  only where that is the larger value and never falls below the touch size.
- **The last entry of a sidebar list clears the tab selector.** The
  collapsed selector floats over the bottom of the drawer, so a view whose
  list runs to the foot of the panel put its last row under the control.
  The drawer's content carries a scroll reserve of one touch target
  (`--touch-size-l`).

### Verification
- Written from two phone screenshots; not yet checked on a device. The
  radius restatement and the drawer clip are both cascade-level changes with
  no desktop selector, so the desktop is unaffected by construction.

## [1.6.0] — 2026-09-14

### Changed
- **The palette declares Obsidian's tokens directly.** `--bg-primary`,
  `--bg-secondary`, `--bg-secondary-alt`, `--text-primary` and
  `--text-secondary` were exact aliases of `--background-primary`,
  `--background-secondary`, `--background-secondary-alt`, `--text-normal`
  and `--text-muted`, and every rule now reads those. `--border` stays a
  theme token because Obsidian sets `--background-modifier-border` to
  transparent inside a property's multi-select container, and the theme's
  frame lines must not follow; Obsidian 1.13.7 redefines no other public
  token contextually. A snippet that read the old names needs the new ones.
- **Stylelint.** `.stylelintrc.json` checks for duplicate selectors,
  duplicate and shorthand-overridden declarations and empty blocks; the
  descending-specificity rule is off because restating a selector at
  Obsidian's specificity, later in the cascade, is how this theme wins
  ties. `.githooks/pre-commit` runs it on commits that touch the
  stylesheet, after `git config core.hooksPath .githooks`. The two remaining
  duplicate selector pairs are merged; the `body` token blocks that sit
  beside the rules reading them, and the callout colour default, carry a
  disable comment each.

- **The stylesheet is authored in `src/theme.css`; `theme.css` is built.**
  `fonts/embed.py` now writes the root `theme.css` as the source file plus
  the generated `@font-face` block, so the file under review is the 180 KB
  of stylesheet rather than 570 KB with fonts inside. `--fonts` prints only
  the font block, as the script did before. Obsidian still installs the root
  `theme.css`, which stays committed; the built file changed only in its
  banner, verified byte for byte before the banner was added.
- **Selectors that restated a class Obsidian always pairs are gone.** Every
  Reading-view element that carries `.markdown-preview-view` also carries
  `.markdown-rendered`, and `.is-ios` / `.is-android` never appear on `body`
  without `.is-mobile`. Where a rule listed both forms, the narrower one is
  dropped: same specificity, same cascade position, same elements matched.
  52 selectors; rules that listed only one form are untouched.
- **`--ia-editor-font-size` is now `--klartext-font-size`.** The `--ia-`
  prefix was a fossil of the iA Writer inspiration. `--ia-line-height` and
  `--klartext-col-cells` were pure aliases of `--klartext-line-height` and
  `--klartext-marker-column` and are replaced by them. Style Settings ids and
  the variables named after them are unchanged. A snippet that read the old
  names needs the new ones.
- **Comments say why a value is what it is, not how it got there.**
  Sentences that narrated earlier versions, releases and failed attempts
  are cut or rewritten as the constraint they illustrated; every measurement
  stays. Two comments that had drifted from the code are corrected.

### Added
- **`tools/verify.mjs` and `tools/check-note.md`.** The on-device check
  described under Verification, as a script: it snapshots the computed
  styles of the check note in the running Obsidian and diffs two snapshots.

### Removed
- **The mobile restatement of the background tokens**, which without the
  private layer would have pointed each token at itself. Obsidian 1.13.7
  has no mobile rule that it countered.
- **Tokens nothing reads.** `--font-size-base`, `--editor-font-size`,
  `--font-family-editor` and `--font-family-preview` are read by neither
  Obsidian 1.13.7 nor the theme; `--klartext-highlight-strong` was defined in
  both palettes and never read once the stroke moved to the `-hl-ink` pair;
  `--canvas-dot-color` is not an Obsidian token. The table's `width: 100%`
  was overridden by `width: max-content` in the same section. The two print
  rules on the table are one.

### Verification
- Every step was checked in the running Obsidian 1.13.7 over the debugging
  port: the computed styles of a check note in Live Preview and Reading
  view, light and dark, with and without the mobile body classes, are
  identical before and after each commit. The comment pass is additionally
  proven by stripping comments from both versions and comparing.

## [1.5.2] — 2026-09-14

### Changed
- **Mobile toolbar band.** The row of editing buttons above the phone's
  keyboard sat on a band the theme painted in the secondary grey with a
  hairline on top, which read as a second keyboard strip and buried the
  buttons in it. The band now takes the page colour, Obsidian's own
  default, and the button pills carry the muted surface that code blocks
  and table headers use, so the controls stand on the page instead of in a
  strip. Not seen on a phone yet.

## [1.5.1] — 2026-09-14

### Changed
- **Interface text size derives from the body size; one anchor per
  device.** On the desktop the sidebars, panels and plugin text follow
  Appearance → Font size at 13/16, the ratio the theme was designed at, so
  enlarging the prose for a high-resolution display enlarges the interface
  with it. On the phone they follow Mobile Body Text Size one to one, as the
  defaults already were (14 and 14). The UI Font Size and Mobile UI Font
  Size sliders are gone: the desktop one was capped at 16px, which on a
  high-resolution display was the ceiling of legibility, and both were a
  second control beside the one that already sizes the device. Nothing
  changes at the defaults (16px prose still gives a 13px interface). A
  snippet on `--klartext-ui-font-size` sets the interface outright for
  anyone who wants large prose with a compact interface. Ten settings.

### Removed
- **Six Style Settings options**, after a review of all nineteen with the
  aim of keeping only what answers a preference people hold or something
  CSS cannot see. List Indent contradicted the column model: untouched it
  followed the marker column, but Style Settings writes a slider's variable
  only once it is touched, so the first touch pinned the indent to a fixed
  em and the four-character column then broke the nesting alignment
  silently. Translucent Diagram Boxes shipped off and experimental, a flag
  patching a Mermaid routing defect rather than a choice. Spaces Per Level
  was a second knob for a one-in-a-thousand case; the toggle stays and
  assumes Obsidian's default of four, overridable by snippet. Soft Scroll
  Edge and Paragraph Spacing were the theme's own polish and rhythm wearing
  a switch: the scrim is always on now, the paragraph gap is fixed at 1.4.
  Diagram Font Scale is fixed at 0.9. Every token remains in the file and
  the README lists the snippet for each, so nothing is lost for anyone who
  wants the old value. Thirteen settings remain.
- **Editor Background**, the same day. The page is pure white; the warm
  off-white variant and its rebalanced surface and border tokens are gone
  from the file. Twelve settings remain. Readable Line Width was removed
  for an hour on the belief that it did nothing: it feeds Obsidian's
  `--file-line-width`, which Obsidian reads only while its own Appearance →
  Readable line length switch is on, and with the switch off the column
  spans the pane. It is back, and its description now says so.
- **UI Font Size and Mobile UI Font Size**, see Changed above.

### Fixed
- **Three Style Settings controls never reached the theme: Line Height,
  Readable Line Width and Marker Column.** Style Settings writes a
  control's value to a CSS variable named after the setting's id, and
  nothing else — the `variable:` key the schema carried is not part of the
  plugin and was ignored. So Line Height wrote `--klartext-line-height`
  while the theme read `--ia-line-height`, Readable Line Width wrote
  `--klartext-line-width` while Obsidian reads `--file-line-width`, and
  Marker Column wrote `--klartext-marker-column` while the theme read
  `--klartext-col-cells`. The controls whose id happened to equal the
  token (mobile body size, and the sliders since removed) worked, which is
  why the mismatch went unnoticed. The theme now declares each of the
  three id-named variables with its default and aliases its own token to
  it, so the plugin's value lands and every stored setting keeps working
  under its old id. The `variable:` keys are gone from the schema. Each
  verified in the running app: the editor's line height follows the
  slider, the text column takes the slider's width while Obsidian's
  Readable line length is on, and the marker column changes to four cells.
  (An earlier note in this entry blamed a stale emission for Line Height;
  the cause was this.)

## [1.5.0] — 2026-09-14

### Added
- **LICENSE.** The theme is under the MIT License, which the community theme
  store requires as a file at the repository root. The embedded typefaces
  are not covered by it and the file says so: JetBrains Mono and Fira Sans
  are used under the SIL Open Font License 1.1, whose only condition on
  bundling is that the copyright notice and the licence accompany the
  fonts. The notices are in the embedded fonts' own name tables (read
  back from the woff2 files: copyright and the OFL URL are present, the
  licence description field is not), and the full licence texts are now
  in `fonts/LICENSE-JetBrainsMono.txt` and `fonts/LICENSE-FiraSans.txt`.
  Neither face declares a Reserved Font Name, so the subsetted copies may
  keep their names. The README credits say the same.
- **Guidelines check for the embedded fonts.** Obsidian's theme guidelines
  and the submission page were read on 2026-09-14. They require that a
  theme load nothing over the network — every asset bundled — and set no
  size limit; the embedding guide only warns that a large file may load
  and edit slowly. theme.css is 575 KB: 187 KB of CSS and 388 KB of
  base64 holding 291 KB of woff2 across fourteen faces, every one with a
  unicode-range so only the faces a note needs are decoded. No `@import`,
  no remote `url()`. The four Latin Extended faces of Fira Sans are the
  largest single item (128 KB decoded, about 170 KB of base64) and serve
  only characters outside basic Latin; dropping them is the one cut worth
  weighing if the size ever matters.
- **What ships is decided.** `theme.css`, `manifest.json`, the README and
  the screenshots are what Obsidian and the theme store read. The `fonts/`
  folder stays in the repository as source: the subsetted woff2 files,
  the embed and marks scripts, the licence texts. The three 1.3.0 backup
  files that sat beside the live theme are gone from the folder (moved to
  the Trash rather than deleted, since 1.3.0 predates the git history,
  which begins at 1.4.0). The README says what the repository holds.

One change, made because the previous constructions had become a fight with
the editor and were expected to break on the next Obsidian release: every
mark — dash, number, checkbox, quote bar, callout rule — sits in the text
flow on the prose edge, in a marker column of whole character cells, and
every hanging block starts its text at that column's far edge, in Live
Preview with the cursor on the line, in Live Preview with the cursor
elsewhere, and in Reading view. Nothing shifts between those states. Only
the `#ₙ` heading badge hangs outside the text. Every position below was
measured in the running Obsidian 1.13.7 over Chromium's debugging port
rather than in a reconstruction; the numbers are at the default 16px body
size and the default two-cell column.

### Changed
- **The marker column, on the text edge, with its width as a setting.**
  Style Settings → Marker Column: two characters (default) or four. The
  column's last cell is always the blank gap, and every mark is
  right-aligned against it, so the dash, the last digit and the checkbox all
  end one cell before the text. At two cells a dash or a single digit is
  flush with the prose edge and a number from 10 hangs its first digits into
  the margin, as 1.4.0 did; at four cells three digits fit inside the column
  and a single digit sits two cells in. Measured at two cells: list, task,
  quote and callout text at 19.2px from the line start, identical in both
  editing states and in Reading view; nested items and nested quotes at
  38.4px; `10` and `100` hang one and two cells with their text still at
  19.2px. At four cells the same lines measure 38.4px and 76.8px. A
  callout's title line sits on the same edge as its body — it used to land
  about a character to the right while the callout's source was showing.
- **The marker axis is the centre of the column's last mark cell** — half
  a cell in at two cells, one and a half at four — the cell the marks
  occupy: the quote bar, the callout rule, the indentation guides and the
  list tree line all sit there. The heading badge's gap to its heading is
  now the same one cell every other mark keeps.
- **List Indent defaults to the column width**, so a nested item's mark
  starts where its parent's text starts. The Style Settings slider still
  governs it; a value already set in a vault is kept. A quote inside a quote
  steps in the same way in both modes, with a bar per level.
- **Numbers are numbers.** `1 Text`, `10 Text`, with neither the source's
  dot nor the dash the theme drew after it, in both modes; the dot's cell is
  kept blank as the gap. Extra spaces after a marker cost nothing: they used
  to break the numbered marker's geometry, because Obsidian's token includes
  every space that follows the dot and the old clip assumed exactly one.
- **One bullet mark for `-`, `*` and `+`, in every state.** The active line
  used to reveal the literal character while idle lines showed the dash.
  Reading view cannot tell the three apart either, so one dash for all.
- **A highlight never lifts mid-line.** It still lands and lifts once per
  wrapped line, as a marker pen on paper does, but it no longer lifts and
  lands again around every piece of formatting inside it. Live Preview
  splits a highlight into one span per formatting change — inline code,
  bold, a link, the `==` marks while the line is edited — and the theme
  painted each span as a complete stroke. Now a span followed by more of the
  same highlight ends flat and runs on under the next span's landing, the
  ink is opaque and the span blends with `darken` (`lighten` in dark mode),
  so ink over ink is simply ink and the landing vanishes under the flat end
  instead of showing as a seam. Which spans those are is read off the
  siblings: adjacent while the line is edited, and on an idle line separated
  by the two widget buffers and the empty span Obsidian leaves in place of
  hidden formatting, so both patterns are matched. A span that continues a
  highlight keeps its landing on each of its wrapped lines, in the plain ink;
  the strong press belongs to the true start only. One limit remains,
  because a span's ends are decided per span rather than per line: a span
  that leads into formatting ends flat on all its own lines. Inline code
  inside a highlight keeps a fill, but a translucent one, so it sits on the
  stroke instead of cutting a window into it. Reading view renders the whole
  highlight as one element with the formatting nested inside, so there every
  line lands and lifts and no seam exists.
- **The `!important` audit the 1.3.0 pass could not finish.** That pass
  measured note content in a harness and left 112 flags on interface
  selectors "awaiting an in-app pass". This is that pass, run in the
  running Obsidian over the debugging port, in two halves. First a cascade
  analysis: for every flagged declaration, every rule in every loaded
  stylesheet — Obsidian's, every plugin's, the theme's own — that sets the
  same property on a matching element, with hover and focus states folded
  in, and a verdict of whether any of them would beat the theme's rule
  without the flag. Then the empirical half: the flags the analysis called
  redundant were stripped, the theme reloaded, and the computed value of
  every one of them re-read on every matching element, in Live Preview
  with a kitchen-sink note and the cursor inside a callout, with the
  command palette open, and in Reading view: 4,320 values, identical.
  The analysis has one blind spot the diff exposed: Obsidian sets some
  paddings and margins through logical properties, which the CSSOM lists
  under different longhand names, so four rules it had called safe moved
  when stripped and keep their flags. Result: 66 written declarations lose
  the flag, 221 down to 155. Of those that stay, 53 have a named competitor
  that would win without it, 62 sit on states no script could produce here
  — hover popovers, canvas, the nested table-cell editor, the phone, the
  settings modal, which will not open while the window is unfocused — and
  five are the diff's catches and one selector the mapper could not match.
  Snippets and plugins can now override that much more of the theme
  without needing a flag of their own.
- **The quote mark is never shown.** The bar is the mark in every state,
  including the line being edited, where the theme used to step the bar
  back and show the `>`. Nested quotes show one bar per level, drawn from
  the line rather than from the tokens, on the axis of each level's own
  column, whether or not the line is being edited.
- **How, and why it holds.** Two facts of Obsidian 1.13.7, both read from
  its code and confirmed by measurement, decide the construction. First,
  the rendered number and bullet marks are withheld while the selection
  touches the marker token, END INCLUDED — so a fresh item, cursor right
  after `1. `, is always in its plain state. Second, the per-line hanging
  indent (the inline `text-indent` / `padding-inline-start`) is the caret
  coordinate at the end of the marker text, floored to a pixel. So the
  theme now styles the token's CONTAINER, which is present in both states,
  keeps the source characters in normal flow with real metrics, and hides
  the ones that must not show with a font rather than with CSS: a
  400-byte companion face, Klartext Marks, embedded beside the others,
  whose glyphs for the space, `-`, `*`, `+` and `>` are empty with zero
  advance and whose `.` and `)` are empty with one cell of advance. Its
  `unicode-range` is exactly those seven code points, so every other
  character falls through to JetBrains Mono, and its vertical metrics copy
  JetBrains Mono's so a line holding only a marker keeps its height. Every
  marker token is then a box one column wide, end-aligned: its content ends
  on the column's far edge, the caret at the end of the marker is drawn
  where the text begins, and Obsidian, measuring the hanging indent there,
  writes the column width — wrapped lines sit on the same edge without a
  second rule. The number token is a flex box, so a number wider than the
  column overflows at its start and hangs into the margin; the bullet token
  is not, because flex layout would drop its whitespace-only trailing space
  and with it the caret. Nothing is clipped or painted over. A callout's
  header line, which Obsidian tokenises as one span `> [!type] `, uses a
  second face that blanks only the `>`, so the tag and its trailing space
  keep their cells and the tag sits on the edge. Both faces are touched by
  a hidden pseudo-element at startup, because a data-URI face loads on
  first use and Obsidian caches an indent it measured in the fallback face.
  Source: `fonts/make-marks.py`; `fonts/embed.py` embeds the result.

### Fixed
- **No caret on a fresh bulleted item** (pressing Enter in a list gave a
  new `- ` line with no cursor). The 1.4.0 change that pinned the bullet
  token to one column made it an inline-flex box, and flex layout does not
  render a whitespace-only text child at all — the trailing space of `- `
  had no box, CodeMirror's coordsAtPos returned null for the position after
  it, and neither the caret nor the hanging indent could be computed.
  Measured before the fix: null; after: on the column's edge, where the
  text begins.
- **No caret on a fresh numbered item.** Obsidian draws the primary caret
  natively (`caret-color`), not through CodeMirror's cursor layer, and the
  page-coloured patch the theme painted over the dot sat above it. The
  patch is gone with the rest of that construction.
- **The note title is the headline.** It takes the h1 size and weight, read
  from the h1 tokens so the two can never drift, instead of the 1.75em at
  weight 500 it had carried: a note that opens with an h1 was putting its
  biggest type under a smaller name. Its FACE is a Style Settings choice,
  **Note Title Font** — the body monospace by default, the interface face
  for anyone who wants the top of the page in one family — and the hairline
  rule under it stays, which is what still tells a title from a heading.
  The block is set through Obsidian's own `--inline-title-*` tokens now
  rather than on the element, which drops three `!important` flags:
  Obsidian applies all of them from `.inline-title:not([data-level])`,
  which out-ranks a plain class. That same specificity gap had been
  silently swallowing the theme's letter-spacing, so the title now tracks
  with its heading rather than at Obsidian's own value.
- **Reading view leads a heading exactly as Live Preview does.** Measured
  text box to text box at every level, the gap above a heading had been
  20px (h6) to 46px (h1) wider in Reading view; it is now within 1px
  everywhere, and the gap below within 1px as well. What the editor shows
  around a heading is one blank source line and nothing else — the theme's
  own `.HyperMD-header-N` margins never reach it, since Obsidian zeroes
  every `.cm-content` child's margin with `!important` — so Reading view is
  built to that: the heading owns the gap above it and the block before it
  hands its bottom margin over, h1 listed apart because its tighter
  line-height puts its text differently inside the box. The 1.4.0 note
  claiming the two already matched within 0.2px did not hold.
- **The list tree line assumed tab indentation.** Obsidian sets `tab-size`
  to a LENGTH on list lines, so a tab is exactly one List Indent wide;
  spaces render at their own width instead — four of them are 38.4px against
  the 19.2px a tab gives at the default. The parent segment multiplies a
  level by that unit, so in a vault with "Indent using tabs" off it was
  drawn 15px short at level 2 and 34px short at level 3, while Obsidian's
  own guides, which ride on the indent spans, sat where the text was. The
  unit is now its own token and a Style Settings toggle, **Lists Indented
  With Spaces** (with **Spaces Per Level**, default 4), switches it. A
  stylesheet cannot read the indent characters, so this is told rather than
  detected; nothing else in the theme depends on knowing. Measured both
  ways at every level: with the toggle matching the vault the segment lands
  on the child's guide column exactly.
- **The fold chevron sat on a list item's number.** Obsidian anchors it just
  before the item's own column, and its 0.4em put the glyph 6.4px out — but
  a mark wider than the column overflows to the start, so a two-digit
  number's digits began 3.2px inside the chevron. The clearance is two cells
  now: one full cell past a two-digit number's overflow, two past a dash,
  at every nesting level.
- **The type tag of a callout whose source is showing** (`[!note]`) was
  underlined dotted like an external link, Obsidian tokenising it as a bare
  link. It is a mark: faint, upright, undecorated.

- **PDF export, three defects found in a 65-page export of a real note.**
  A table wider than the column was cut off at the right edge of the page:
  on screen it may grow to twice the column and scroll inside its wrapper,
  and the print block made the wrapper visible without capping the table,
  so the paper simply lost the ends of the second column. Tables now take
  the page width at most and their cells wrap. Bulleted items printed the
  browser's own disc in the text colour: Obsidian's export renders with
  its list-bullet option off, so the `.list-bullet` span the screen draws
  the dash in does not exist on paper, and only numbered items — drawn on
  the item itself — printed as designed. The dash is now drawn on the item
  for print, in the same column, and the native marker is off for every
  list. And a two-page table was pushed whole onto a fresh page, leaving
  60% of the page before it blank, because `table` sat in the
  `break-inside: avoid` list; a table taller than the space left cannot
  avoid breaking anyway, so the rule only moved the gap. `table` is out of
  that list, rows stay in it, and Chromium repeats the header row on every
  page. Code blocks stay in the list on purpose: a fence kept whole is
  worth the gap it can leave. Verified in the running app under emulated
  print media: the dash in the faint colour, task items keeping only their
  checkbox, bulleted and numbered text on one edge one column in, the wide
  table inside its wrapper, `break-inside` auto on the table and avoid on
  its rows. All three confirmed on a second export of the same note. That
  export showed one more thing: wherever a table ran onto the next page,
  an empty framed row was left at the foot of the page it left. Chromium
  extends a fragmented table's box to the page edge and paints the table's
  own side borders along it, with or without any break rule (tested in a
  headless Chromium against six variants of the rules). So on paper the
  frame is drawn on the cells instead: the header cells carry the top
  edge, the first and last cells of every row the sides, the last row the
  bottom, and the table itself has no border and square corners. Borders
  stop with the last row that fits, and the repeated header row brings
  the top edge onto the next page. Confirmed on a third export of the same
  note: every page foot clean.

### Removed
- The inline-flex marker boxes, the `clip-path` on the number, the
  page-coloured patch and the raw-state rules that went with them; the
  quote line's forced padding and its `text-indent: 0`; the `-1em` pull on
  the callout header token, replaced by the Quote face described above.

### Not verified
- **Mobile.** The column and the axis are derived from the body size and
  apply on the phone unchanged, but nothing in this release was seen on a
  phone.

## [1.4.0] — 2026-09-12

A pass driven by use on both platforms at once. Three themes run through it:
markers that were icons become type, the corner radii collapse from four
values into one, and the places where Obsidian restates a token under a
higher-specificity mobile selector are found and answered. Sizes and colours
below were measured against Obsidian's own stylesheet and, where a vault's
content decided the value, against the vault itself rather than estimated.

### Added
- **Mobile Body Text Size** (Style Settings, 14px default, 12–22 in half
  steps). Appearance → Font size lives in `appearance.json`, which sits
  inside the vault and therefore syncs to every device, so one value had to
  serve a wide desktop display and a phone: sized for the desktop it is
  overbearing on the phone, sized for the phone it is small on the desktop.
  Mobile now takes its own size and the Appearance slider governs desktop
  alone. Everything the theme derives — marker column, heading prefix, quote
  size, list geometry, code — is calculated from the same alias, so each
  platform stays in proportion at its own size rather than keeping the
  other's spacing.
- **Incomplete heading feedback** (Live Preview). A bare `#` is already a
  valid empty ATX heading, so Obsidian sizes the line as a heading the moment
  the hash is typed; the theme then hid the raw hashes and drew its own `#ₙ`
  badge in their place, and the line read as a finished headline while the
  document held nothing but a hash. Carrying on without the space produced a
  tag, not a heading. While the hashes stand alone all three signals are now
  undone: the literal hashes are visible, the badge is dropped, and the line
  stays at body size. The heading arrives with the SPACE, the point after
  which no further typing can turn the line into a tag.
- `<details>` / `<summary>` have a marker: `+` closed, `−` open, in the body
  monospace, hung in the same column the heading badges use so the section
  title sits on the shared left edge. The browser's disclosure triangle was
  the only mark on the page nobody chose. Both glyphs are one cell wide, so
  toggling cannot shift the title; the open state uses a real minus rather
  than the hyphen that serves as the list bullet.
- Two radius tokens, `--klartext-radius-chip` and `--klartext-radius-flat`,
  so each of the four families (blocks, panels, chips, flat interface) is
  named and can be retuned on its own.
- A README, with light and dark screenshots rendered from the stylesheet
  itself, the full Style Settings table, and notes for anyone editing the
  file.
- **Mobile UI Font Size** (Style Settings, 14px default, 11–18 in half
  steps). The mobile counterpart to UI Font Size, for the same reason the
  body size needed one: a phone and a wide desktop display do not want the
  same interface scale, and the vault holds one setting.

### Changed
- **Corner radii: four families, one value (4px).** Panels were 6px and the
  flat interface 2px. Two of Obsidian's radii do not derive from the
  `-s`/`-m`/`-l` ladder the theme pins and so had been missed — the input
  radius (5px; text fields, dropdowns, number inputs, the formula editor)
  and the pill radius (2em; multi-select pills, the same shape as a tag) —
  which left the flat family aligned everywhere except the boxes people type
  into. Both now read a token, as do four rules that hardcoded 2px (focus
  ring, search matches, `<kbd>`, canvas nodes) and the Mermaid node corners,
  which were a fixed value under a comment claiming they matched the theme.
  Twenty-two box types verified at 4px. Callouts, callout titles and
  highlights stay square by design; the scrollbar thumb, the cancelled-task
  dash and the phone sheet grab handle keep their own sizes, being shapes
  rather than boxes.
- `--radius-xl` is pinned into that family. Obsidian leaves it at 16px and
  uses it for mobile chrome — the drawer's outer corners, tab-switcher card
  previews, the mobile tab pin — so it was a round shape left in an otherwise
  flat theme. The bottom-sheet grab handle is restored as a pill, being a
  handle rather than a panel.
- **Mobile's own radius ladder is pinned.** Obsidian 1.13 added
  `--touch-radius-*`, which does not derive from `--radius-*`: each step is
  assigned the matching TOUCH TARGET dimension, so its xs step is 30px and
  its m step 44px. Nothing in the theme fed it, so on a phone most of the
  interface kept corners between 24px and 60px while the desktop sat at 4px.
  Pinning the six source tokens is sufficient on its own, because
  `.is-mobile` assigns the nav item, modal, input, textarea, settings and
  canvas-control radii from that ladder, and those assignments out-rank a
  plain `body` override. `--touch-size-*` is untouched: those are real touch
  targets, and their use as corner radii is the underlying mix-up.
- **Tags carry a soft accent chip** in both modes and on both platforms,
  built from the accent token so it follows whatever accent is set. They had
  been transparent everywhere except mobile in dark mode, where Obsidian
  restates `--tag-background` under a two-class selector that out-ranks the
  theme's own block — so the chip came from Obsidian, not from here. The
  reading-view rule had `transparent` hard-coded and would have left that
  mode without chips; it reads the token now. Corner 4px.
- **External and internal links are told apart by the rule under the words**:
  solid stays inside the vault, dotted leaves it, in both editor modes and
  reading view. Obsidian's external-link glyph and the 0.9em it reserved are
  gone; the icon is drawn to different proportions than the embedded
  monospace face and at 0.825em read as a character in the sentence rather
  than an annotation to it. Hover changes colour and closes an external
  link's dotted rule to solid. Anchors in the interface keep the theme's
  undecorated style.
- **Code block controls** sit in a measured corner: the copy button owns the
  top right and the language label sits to its left, both placed off the
  button's box instead of a fixed distance from the edge that was really a
  guess at the label's width — a short language left a gap and a long one ran
  into it. The button is one square sized from the editor font with the glyph
  pinned inside it, rather than Obsidian's text-button padding and its
  per-context icon size. A block's top padding is now the control row's exact
  height, so the first line of code starts below both controls instead of
  under them; that mattered most on mobile, where Obsidian keeps the button
  visible at all times rather than only on hover. The size cap is keyed off
  the block rather than the button's class, so it holds in Live Preview,
  whose corner Obsidian builds differently and has renamed between versions.
- Code fences in Live Preview have air at both ends. Obsidian gives code
  lines a padding-inline-start and nothing vertical, so the opening ``` sat
  directly on the border the theme draws above it. The two delimiter lines
  are padded rather than the block, so it lands once at each end instead of
  on every line of code, and both ends get the same amount.
- **The properties box** (Live Preview): the key column goes from Obsidian's
  9em to 12.5em, measured against every distinct frontmatter key in a real
  vault — at 9em three of them truncate, and 10em and 11em still cut two and
  one; mobile needs the extra half em because the property icon sharing that
  column is drawn two pixels larger there. The fill keeps its own colour but
  gains the horizontal padding Obsidian never gave it, so heading, keys and
  values no longer sit flush against the panel edge. Rows take the chip
  radius and the box the block radius, where the rows had carried Obsidian's
  6px and the box was square.
- **The view header's path and name are legible.** Obsidian dims the whole
  title area to 70% on phones and the theme painted the path in its faintest
  grey on top of that, which left the path at 2.7:1 against the page and the
  name at 4.15:1 — below the 4.5:1 floor for text that size, and for the path
  below the 3:1 floor that applies even to large text. The dimming is dropped
  and the hierarchy carried in colour: 7.1:1 and 11.7:1 in dark, 7.2:1 and
  12.6:1 in light, identical on desktop and mobile. Sizes and weights
  unchanged.
- The view header's bottom border is transparent rather than page-coloured.
  A page-coloured border is invisible only while the header's own opaque
  background sits behind it; with Obsidian's floating navigation the header
  is transparent and floats over the note, so that 1px of page colour was
  the only thing left painting — a hard dark line drawn straight across the
  text. The 1px is kept for layout, so nothing shifts.
- Workspace dividers are a step softer, reading `--border-subtle` instead of
  `--border`: lighter in both light modes, darker in dark, which is what
  "quieter" means on each ground. Widths and the accent-coloured hover are
  untouched, so every divider is still there and every handle still drags.
  The status bar's top border and the tab outlines read the same token
  upstream and are deliberately left at full strength.

### Fixed
- A Live Preview blockquote's first visual line hung left, out past the quote
  bar; wrapped lines were correct. Obsidian measures each line's marker and
  writes the hanging indent onto the line element as an inline style, one
  declaration for the padding and one for the negative text indent. The
  theme cancelled both, but only the padding half carried `!important`, so
  the inline text indent survived and dragged the first line left by the
  marker width. The comment above that rule had claimed both were overridden.
  Scoped to quote lines that are not list items: a list inside a blockquote
  carries both classes, and that same inline indent is what hangs a list
  item's marker to the left of its text, so cancelling it there flattened
  quoted lists and ran every wrapped line back to the marker column.
- `minAppVersion` was `1.0.0`, which the theme has never actually supported.
  It is now `1.4.0`, the release that introduced Properties — the newest
  Obsidian feature the theme styles, and therefore the real floor. Everything
  else it touches predates that. The two modern CSS features the layout
  depends on, `:has()` and `round()`, come from the Chromium in Obsidian's
  installer rather than from the app version, so no `minAppVersion` can
  express them; the README says so plainly instead.
- **UI Font Size never reached mobile.** The theme wires Obsidian's
  `--font-ui-*` ladder to its own base, but Obsidian redefines that whole
  ladder from a 16px base under `.is-mobile`, which out-ranks a plain `body`
  declaration. So the setting was silently desktop-only and every sidebar,
  menu, panel and plugin on the phone ran about 23% above the theme's scale.
  The theme's base and the wiring into Obsidian's ladder are both restated
  for mobile, pointed at the theme's own tokens rather than at numbers, so
  one scale serves both platforms.
- The collapsed sidebar tab selector no longer reads as a button at rest. Its
  fill was only 1.05 from the surround in light and 1.17 in dark, so it was
  never contrast that made it shout — it was a large solid shape with its own
  corner under a busy list. The fill now takes the surrounding colour and
  stays fully opaque, which it has to: the control masks the file list
  scrolling behind it. A hairline above draws the boundary the slab was
  drawing, and the grey moves to the touch state, where it says something.
  Label contrast is unchanged in light (12.6) and improves in dark (9.1 to
  10.7); geometry, tap target and chevron are untouched. Scoped to the
  collapsed state: the same element is also a row inside the open panel,
  where Obsidian's own styling applies instead.
- The sidebar tab switcher's rows carried a 24px icon from Obsidian's mobile
  icon scale. Once the interface text followed the theme's base, that icon
  was the only thing still setting the row's height and read as oversized
  beside it. It is now derived from the UI base, which takes the collapsed
  selector from 40px to about 35px. Its padding is left as Obsidian set it,
  because padding here also sets the row's height and the row is a thumb
  target.
- The sidebar tab switcher's selected row showed four bright notches inside
  its highlight on mobile. Its panel and its rows both take
  `--touch-radius-xs`, 30px on a row about 44px tall, which is all but a
  pill; the panel is painted with `--interactive-normal` and the selected row
  with `--nav-item-background-hover` over it, so the row's deep corners let
  the panel's lighter fill show through. An earlier attempt attributed this to
  `--radius-xl` and did not fix it — that token is used elsewhere in the
  mobile chrome, not here.
- **Reading view and Live Preview now lead a document identically.** The
  theme's vertical rhythm is built to keep the two in step, and every
  measured pair had drifted. Above a heading Reading view ran wider, by 10px
  at h1 down to 2px at h3; below a heading wider again, by 15px at h1 to 5px
  at h6, where the em term in those margins turned out to be exactly the
  drift at every level and is now dropped; at h5 and h6 the top was instead
  too tight. Below a standalone block Reading view ran SHORT — 14px after a
  quote, 17px after a code block — because Obsidian's per-block wrappers
  carry no margins of their own, so blocks still collapse against the next
  paragraph, and a paragraph's margins are asymmetric: its large gap is all
  on the bottom, so above a block it wins the collapse and below one it does
  not. The block family now states the paragraph gap on its bottom side.
  Finally, a Live Preview quote's LINE was sized from the body font while its
  text ran at the 0.93 quote scale, so quotes were led at 25.6px in the
  editor against 23.8px in Reading view — a gap that compounded with every
  wrapped line of a long quote. Every pair now matches within 0.2px, except
  the gap above a blockquote, which remains 2px tighter in Reading view.
- A highlight pushed the text after it along. The marker stroke overshoots
  its word with side padding, and negative side margins are supposed to hand
  that overshoot back so the line keeps its metrics — but at -0.18em against
  0.42em of padding they cancelled less than half of it, leaving 0.24em of
  real advance on each side. A highlight ending mid-sentence opened a gap
  before the next character, most visibly before a full stop, which floated
  away from the word it belongs to. The margins now cancel the padding
  exactly. The stroke is unchanged: its gradient stops are measured against
  the padded box, which has not moved.
- Unordered list text sits a character right of ordered and task list text in
  Live Preview. The theme pins the ordered marker token to exactly one marker
  column and never pinned the unordered one, so it renders at whatever width
  its parts come to. The unordered token is now pinned the same way, which
  makes the width of the dash, the space and Obsidian's bullet widget
  irrelevant. NOT CONFIRMED ON DEVICE — the symptom was reported on mobile
  and had not cleared at the time of writing. Whether that is because the
  class this rule targets does not exist in the editor's markup, or because
  the change had not yet synced, is unresolved. A diagnostic snippet that
  outlines each candidate element is in .obsidian/snippets as
  klartext-list-probe.css.
- Table column alignment was ignored in Live Preview. Obsidian carries the
  delimiter row's colons as an `align` attribute and styles it at (0,2,1);
  the theme's blanket cell default reached the editor through
  `.markdown-source-view.mod-cm6 th`, also (0,2,1), and won the tie on load
  order, so every column came out left-aligned however the table was
  written. Reading view was unaffected, its branch being only (0,1,1).
  Restated for both modes above either, so the markup decides. The default
  is now `start` rather than `left`, matching Obsidian and staying correct
  in right-to-left text.
- Pressing Enter inside a blockquote gave a new `> ` line with no visible
  cursor. The marker was drawn as an inline block boxed to 1em and pulled
  back by an equal negative margin, which zeroed its advance but left an
  atomic box with no text metrics inside it; CodeMirror sizes the caret from
  the metrics of the character the caret sits in, and on a fresh quote line
  the marker is the only content. Replaced with the technique the heading
  marks already use — the monospace face plus `letter-spacing: -1ch`, which
  cancels the advance while keeping the glyph and its metrics. The two
  regressions the box had been guarding against were properties of the box
  and do not recur: idle and edited quote lines now measure the same height
  and share the same text edge. Quote lines also regain about 15px of
  measure, since an atomic inline claims its width for line-breaking even
  when a negative margin moves it elsewhere.
- Selecting a headline drew its `#` on top of the first letter. The theme's
  own `::selection` rule repaints every selected character in the text
  colour, including the marks the theme deliberately renders invisible; both
  are zero-width by construction, so the returning glyph had nothing to push
  aside. Fixed for the heading hashes and for the blockquote `>`, which had
  the same latent behaviour.

## [1.3.0] — 2026-09-05

Feature release for the Live Preview writing surface: a hidden view header,
list tree lines, a reworked quote model, and a round of Mermaid polish. All
geometry was measured against Obsidian 1.13.7's own stylesheet and its
bundled Mermaid 11.13.0 rather than assumed.

### Added
- **Hide View Header** (Style Settings, on by default, desktop only). The
  note header (breadcrumb, back/forward, actions) leaves the layout and the
  note sits directly under the window edge. Moving the mouse to the top edge
  fades it back in as an overlay; it also shows while one of its buttons has
  keyboard focus. While the toggle is on, the header's 40px stays reserved
  as an empty band at the top of the note in both editor modes: text never
  scrolls up under the macOS window controls, the soft scroll edge sits at
  the band's bottom, and the revealed header always lands on empty space.
- **List tree line** (Live Preview). Obsidian's indentation guide starts at
  the first child; the theme now adds the parent's segment. On an item that
  is directly followed by a child item, a guide runs from below its first
  line, down its wrapped lines, into the children's guide — same column,
  width and colour as Obsidian's, and it follows the active-guide highlight.
  Levels 1–4; assumes tab indentation (Obsidian's default).
- **Translucent Diagram Boxes** (Style Settings, off by default). Mermaid
  node fills at half opacity so edges routed behind a node stay visible.
  Fill only; outlines, labels, clusters and edge-label chips stay opaque.
- The elements that were still left to Obsidian's defaults are styled:
  block math sits on the text edge with the block rhythm of code and
  diagrams (MathJax centres it by default) and inline math is body-sized
  text; in the editor the `$` delimiters are faint and source math is the
  body monospace, not italic. Search and find-in-note matches use the
  theme's highlight colour. Block identifiers are faint. `<kbd>` is a
  quiet chip in the interface font; `<sub>` and `<sup>` no longer stretch
  the line. Video and audio embeds share the image corners, PDF embeds get
  a hairline frame. Context menus sit on the page colour with the theme's
  border and a soft shadow. A print stylesheet drops the header band and
  scroll scrim and keeps stripes, callout colours and code fills.
- `==Highlights==` look like a marker stroke instead of a flat tinted box,
  in both modes: slanted, feathered ends from an angled gradient, a tint
  that is stronger where the pen set down and lighter where it lifted, a
  slight overshoot above and below the letters that never moves the line,
  and one stroke per wrapped line with its own ends. No radius, no shadow,
  one hue; dark mode uses the palette's lower opacities. The pen lands over
  half a character and lifts off in a sixth, with the strong tint kept a
  step above the body tint (0.38 over 0.30 light, 0.25 over 0.18 dark), so
  the start reads as a landing rather than a blot.
- Cancelled tasks (`- [-]`) have a treatment in both modes: the text is
  struck through in the faint grey, one step lighter than a done task, and
  the box shows a short dash on a neutral fill instead of a checkmark.
  Nested sub-tasks under a cancelled task are protected like those under a
  done one. Neither Obsidian nor the theme styled this state before.
- Bold text is now weight 700, and JetBrains Mono ships as a 400–700
  variable face in upright and italic, so bold and bold-italic in the
  editor are real faces rather than synthesized.

### Changed
- `!important` pass, measured rather than by hand: 316 flags went in, 119
  came out. Method: every flag stripped, the computed style of every
  element (and its ::before/::after) on 22 harness renders compared
  against the original, and a flag kept only where a property changed
  without it; then the reduced file verified the same way against the
  original with zero style differences. Kept on evidence: 44 that Obsidian
  or another theme rule would otherwise override (editor and reading
  fonts, colours and backgrounds, the quote padding, table cell padding
  and header fill, the highlight, bold, checkbox border, mermaid greyscale
  fills, math delimiters). Kept unverified: 37 on hover/focus/active
  rules, 4 in the print block, 112 on selectors the harness has no element
  for (workspace chrome, settings, menus, file explorer) — those await an
  in-app pass. Snippets and plugins now override the theme's code, tag,
  callout, embed, footnote, heading, link, list-bullet, blockquote, hr,
  view-header and diagram styling without needing `!important` themselves.
  Backup: theme.backup-1.3.0-pre-important-pass.css.
- Wide tables scroll sideways instead of being squeezed. Every table was
  forced to the column width, so nine columns became strips of wrapped
  words. Now the per-column minimum is 11ch (about nine characters of
  content) and header labels never wrap, so a table that does not fit grows
  past the column and scrolls inside Obsidian's block wrapper in Reading
  mode and inside the table widget in Live Preview; the frame, radius and
  stripes travel with it, the note itself never scrolls sideways. Every
  table takes its natural width, capped at twice the column, so short
  cells stay on one line and a prose column keeps its length instead of
  collapsing to its narrowest; past the cap, cells wrap again. Body cells
  have a maximum of 45ch, so a prose column wraps at a reading measure
  instead of running on as one line (Chrome and WebKit both size columns
  by it). Tables are no longer stretched to the column (GitHub's model):
  a stretched table hands spare width to columns in proportion to their
  natural widths, so a glossary's term column grew to half the table and
  sat empty while the meanings wrapped; a table narrower than the column
  is now a compact box on the text edge. Print lets tables wrap again.
  Verified in both modes: nine-column test table 959px scrolling in a
  616px column, a two-column glossary at its natural width with meanings
  wrapped at 45ch, page width unchanged.
- Print / PDF export rebuilt. The old block only touched elements that
  are not part of Obsidian's print container. Now: the dark palette and the
  dark callout tints are screen-only, so a PDF exported in dark mode comes
  out on white with the light palette instead of grey pages (Obsidian keeps
  the theme class on the body while printing); colour fills survive the
  printer's colour stripping; headings keep the block that follows them;
  code, tables, rows, quotes, callouts, images, math, diagrams, embeds and
  footnotes are not cut across pages; paragraphs and items keep two lines
  on either side of a break; indentation guides, the dot grid and panel
  shadows are off; links print in text colour with a faint underline; list
  markers and checkboxes use light-ground colours. Verified with Chrome's
  print-to-PDF (the export engine) in both modes over a five-page test.
- Live Preview heading marker moved next to the heading. `#ₙ` used to sit at
  the far left of its 2.6em column with the fold chevron between it and the
  text, which left a wide empty gap. The marker is now right-aligned in that
  column with a 0.5em gap to the heading text (like a numbered item's `1–`),
  and the chevron moves to the far side of the marker, still hover-only and
  still Obsidian's own control. Measured at 13px: marker ink ends 10px before
  the text, chevron ink ends 8px before the marker; nothing overlaps.
- Mobile gets a small symmetric column instead of the heading-marker strip.
  On a phone the 2.6em strip sat on top of Obsidian's 24px margin, so the
  note had 61px on the left and 24px on the right and looked pushed to the
  right; Reading mode never had the strip. Live Preview now pads one marker
  width (1.2em, the list-dash column) on both sides, so headings and lists
  share a column and the text block is centred; Reading mode gets the same
  two paddings so switching modes does not shift the text edge. The `#ₙ`
  gap is 0.4 body em on mobile so `#₁` fits, and on a collapsed heading the
  marker steps aside for the chevron, which Obsidian only shows on mobile in
  that state. Measured at 430px: 40px left, 40px right in both modes, marker
  ink 19px from the screen edge. Desktop keeps its column for the chevron.
- Callout palette re-measured and rebuilt. The title is small caps at
  0.78em, so every type colour now reaches at least 5:1 on white (tip and
  warning sat at 3.5:1) and at least 6:1 on the dark ground through its own
  lifted tint per type (the light palette was reused there and fell to
  2.8–3.4:1 for note, failure, example and quote). Each type has one hue:
  note moved from the accent's violet to a calm blue, important has its
  own teal instead of sharing green with success, question and warning
  separate into amber and orange, example is the only violet left. Unknown
  and custom types inherit the quiet quote grey instead of Obsidian's
  saturated blue.
- Lists sit with the sentence that introduces them. In Live Preview a blank
  line directly before or after a list keeps one line height instead of the
  paragraph gap, and the first item after a blank line drops its extra top
  margin (about 40px → 24px between lead-in and list). Reading view gets the
  same one-line gap before a list.
- Blockquotes follow the list model: the `>` marker is hidden while idle
  and shown only on the line being edited, without moving the quote text.
  The quote bar sits on the shared text edge, aligned with the text above.
  On the line being edited the bar segment steps back so bar and marker
  never overlap. The bar spans the quote's line boxes exactly, flush like a
  callout's rule, in both modes (a 0.4em top/bottom padding that made it
  overshoot its text by ~6px on each end is gone). The quote bar and the
  callout rule sit on the marker axis, half a character in: the centre line
  of the dashes, digits and checkboxes, where the indentation guides and
  the list tree line already run. At the column's edge they read as shifted
  left of every marker. Text edges are unchanged. In the editor Obsidian
  zeroes every callout margin with a more specific rule, which had cancelled
  the axis margin there; an editor-scoped rule restores it. The axis is
  rounded to whole pixels (3.9px let a border and a positioned bar snap to
  different device pixels), and the guide offset is the axis minus the one
  pixel of Obsidian's guide box, so the drawn guide, the tree segment, the
  quote bar and the callout rule all land on the same pixel column. Reading
  view's guide is drawn on a zero-width box, unlike the editor's one-pixel
  box, so it derives from the axis directly; derived from the editor token
  it sat one pixel left. The panel shadow's light value moved from body
  into the light palette beside its dark counterpart. Quote and callout text now start at the marker width
  (what "- " measures in the body font), the same edge a first-level list
  item's text hangs on, in both modes; before, quote text sat one em from
  the bar and list text at the marker width, 3px apart in Reading view and
  visibly apart in the editor.
- Editor lists sit on the text edge. Obsidian pads the editor's list marker
  by 0.75em, which put the dash ~10px in and list text ~25px in while
  Reading view had no such inset; that token is zeroed, so the dash, the
  task checkbox and the text edges are identical in both modes (dash and
  checkbox on the edge, text at the marker width). Editor task lines had
  their checkbox ~8px in and text ~32px in from Obsidian's own widget
  margins; they now hang exactly like list items. The checkbox is 0.8 × the
  body size instead of 1 × (in notes only): at full size it filled the
  marker column and the text sat 2.6px from it.
- Numbered lists read "1–Text": digit and dash fill the two-character
  marker column exactly as "– " does, and the text follows the dash
  directly on the same edge as bullet, task and quote text, in both modes;
  "10–" hangs its first digit into the margin. Before, "1. " put numbered
  text one character right of every other list. Reading view writes the
  marker as counter plus dash; Live Preview turns the number token into an
  end-aligned box one marker width wide, clips the source's ". " away and
  draws the dash in the second column. Source mode is untouched and keeps
  "1. ". Nested levels follow. While the cursor touches the marker,
  Obsidian withholds its number mark (as it reveals `**` inside bold) and
  the raw "8. " is rendered; the theme paints the dash over the dot on a
  page-coloured patch so the item still reads "8–" — at the price of the
  caret being hidden behind the patch and a two-digit number showing its
  first digit only for that moment. The raw token's trailing space is
  collapsed to zero width there, so the caret waits exactly where the text
  begins once typing starts; before, it sat one character further right.
- Indentation guides moved from Obsidian's 0.85em, right of the dash, to the
  centre of the dash (half a character in), so a child's guide continues
  from its parent's marker; the list tree line and the Reading-view guide
  derive from the same token. The fold chevron on list lines keeps 0.4em of
  distance from the bullet, which centres it between a parent's guide and
  the marker on nested lines; with the marker on the text edge it had come
  to touch it.
- Editor quote lines were taller than their text and jumped on click: the
  hidden `> ` marker box is an inline-block with hidden overflow, which
  takes its bottom edge as baseline and lifted every quote line ~5px, and
  on idle lines Obsidian splits the marker into a `>` span and a space-only
  span whose empty box lifted the line a further ~10px. The box keeps its
  space as content and is top-aligned; idle and edited lines now measure
  the same.
- Editing a callout clipped its header line to two characters. Obsidian
  folds `[!type] ` into the quote-marker token of the first line, so
  `> [!note] ` is one span with the quote-formatting class, and the theme's
  1em marker box hid everything after the `>` while typing. The callout
  header token is excluded from the marker box and stays in normal flow,
  pulled back by the same em so its `>` sits in the same column as the
  boxed `>` of the body lines, and every `>` marker now has the quote size
  and style set directly, so header and body markers match. The editor's
  quote size is an absolute length derived from the body size rather than
  0.93em, because Obsidian nests its own mark inside the quote token and a
  relative size compounded to 0.86em there, leaving the body marker smaller
  than the header's and its box shifted.
- Tables sit on the text edge: the table border aligns with paragraphs and
  headings instead of overhanging to the left.
- The paragraph measure (78ch) is removed. Line length is governed by the
  window and Obsidian's readable-line-length setting, not by the theme.
- Mermaid labels use Fira Sans at 0.9× body size (Style Settings slider);
  edge labels sit on page-coloured chips widened by a box-shadow halo;
  subgraph titles are set at weight 500; node and cluster corners are 2px;
  the grey hover border around rendered blocks is gone.

### Fixed
- Reading-mode numbering on iOS showed "1." with Obsidian's default spacing
  while the desktop showed "1–". WebKit honours only `color` and `font-size`
  on `::marker` and silently ignores its `content` (verified in a WKWebView
  on macOS). The number is now a `::before` float in the marker column, the
  same construction as the bullet, driven by the implicit `list-item`
  counter, which honours `<ol start>` and nesting in both engines. Rendered
  identically in WebKit and Chrome.
- Review pass over the whole stylesheet (backup: theme.backup-pre-review-1.3.0.css):
  the active file in the explorer carried two conflicting colours, both
  important (accent wins, the duplicate is gone); the unresolved-link
  decoration token held a value that is invalid for the property Obsidian
  applies it to; text selection was painted with literal colours although the
  theme has a token for it; a hover rule set a border colour on tags that have
  no border; bold inside a done or cancelled task kept the normal dark colour
  while the rest of the item was struck and greyed; a global image rule
  rounded every image in the UI rather than only images in notes; Reading
  view spaced list items 0.5em/0.15em where the editor uses 0.4em/0;
  two list-gap rules computed a blank line by hand instead of using the
  blank-line token; block margins, corner radii and panel shadows were set
  with six different literal values across sections and now come from one
  token each (block gap 1.5em; block radius 4px, panel radius 6px, UI radius
  2px; one panel shadow, light and dark); two rules had drifted away from
  their siblings; and six comments still described superseded geometry.
  The mobile rule that swapped the editor font for the system monospace is
  removed: it predates the embedded fonts, so iOS now renders JetBrains
  Mono like the desktop.
- Reading view lists did not share the text edge the way Live Preview does:
  text sat ~38px in with a dot bullet at 26px, and each nested level stepped
  ~54px. Measured against Obsidian's rendered-list model and rebuilt: the
  en-dash bullet now sits on the text edge in both modes, item text starts
  at the marker width, nested levels step by the editor's tab width, the
  reading indentation guide sits on the parent's bullet column, and task
  checkboxes sit on the edge with their text at the marker width.
- Callouts of a type the theme doesn't list (custom types included) had no
  left rule and a grey title while the icon stayed Obsidian blue. Obsidian
  1.13 defines `--callout-color` as a colour and the theme wrote an
  "R, G, B" triplet wrapped in `rgb()`, which is invalid for every other
  value. The palette is stored as real colours now and used bare, so
  unlisted types take Obsidian's colour for rule, title and icon alike.
  Both modes, since callouts share one renderer.
- Inside callouts and blockquotes a paragraph followed by a list kept the
  full paragraph gap; it now keeps one line height like at the top level,
  and the last block in a callout drops its bottom margin so callout
  spacing no longer depends on what comes last.
- Reading view tables ignored the theme's 0.9em size: Obsidian sizes cells
  from an absolute token, so cells rendered at full body size. Cells now
  inherit the table's size. Obsidian also gives every cell a full border,
  which the theme's separate-border model doubled between cells and along
  the top edge; cells now carry right and bottom borders only. Code blocks
  were checked the same way and needed no change.
- Zebra stripes in Reading view stopped at the first column: Obsidian's own
  column-alternation rule for even body cells out-ranked the theme's row
  stripe, so every second column of a striped row stayed white. The stripe
  rule now matches that specificity and the row is painted edge to edge.
- Reading view headings sat at the wrong distance from the text. Obsidian's
  own rule for a heading that follows a block (3em above) out-ranked the
  theme's per-level margins, so an H1 sat 117px below the text instead of
  the editor's 79px, while the gap below every heading was smaller than in
  the editor. The reading margins now fold in the one blank line that Live
  Preview always renders around a heading, so both modes show identical
  gaps for every level, above and below.
- Tags looked different per mode: the editor drew Obsidian's accent pill
  while Reading view showed the theme's quiet grey tag. The theme now sets
  Obsidian's tag tokens, which both the editor and the reader draw from,
  so tags are the same unfilled tag everywhere. Inline tags were also too
  small and too faint to read (0.8em in the subtle grey, about 10px at a
  13px base); they are now body size, secondary grey, weight 500.
- Inline images broke their sentence in Reading view: the theme forced every
  image to `display: block`, while the editor keeps an inline image in the
  line. Images are inline again, bottom-aligned so a lone image still sits
  flush without a gap below it.
- Note embeds were inset twice: Obsidian's 24px accent-bar padding was added
  to the theme's own box padding, so embedded text sat 40px in. The box
  padding is now the only inset. A heading or paragraph at the top of an
  embed also kept its full top margin, opening the box with 60px of air
  against 11px at the bottom; the first block now starts flush, matching
  Obsidian's treatment of the last one. Both modes.
- Horizontal rules: Reading view showed 34px above and 27px below a rule,
  while the editor shows a blank line plus the margin on both sides. The
  reading margin now folds in that blank line, and in the editor the blank
  lines next to a rule keep one line height, so both modes show 51px on
  each side.
- Footnotes: the section had two separators (the theme's top border plus
  Obsidian's own rule inside the section, 37px lower); the inner rule is
  hidden. Footnote text was indented further than an ordered list because
  of an extra list padding; it now hangs like any ordered list. The
  back-reference arrow was painted in the link accent because the generic
  link colour rule out-ranked it; it is the subtle grey again.
- Task lists: in Reading view a done task struck through and greyed its
  nested open sub-tasks, because the strike sits on the whole item and
  propagates into the nested list (the editor marks per line and never did).
  A nested list inside a done task now stops that propagation and keeps the
  normal colour; its own done items still show as done. The done colour is
  also one token for both modes now; Reading view used a lighter grey than
  the editor.
- Mermaid edge labels were measured three times their height, which pushed
  every label away from its edge. Cause: padding on the inline label span
  made its empty inline fragments generate phantom line boxes during
  Mermaid's measurement pass. The padding is gone; the halo is a box-shadow
  with zero layout impact. Diagrams rendered before this fix keep their old
  layout until the note is re-rendered (reopen it or edit the source). Note
  that with several parallel edges between two nodes, Mermaid's default
  `basis` curve still places the outermost labels ~30px off their curves;
  `%%{init: {"flowchart": {"curve": "monotoneX"}}}%%` at the top of the
  fence puts every label on its edge.
- The caret was invisible at the start of a heading line: the hidden `#`
  marks were collapsed with `font-size: 0`, which gives CodeMirror a
  zero-height caret there. They are now collapsed with negative letter-
  spacing at full size, so the caret keeps its height.
- Mermaid node labels could be clipped at the box edge; the label padding
  that caused it is removed and `foreignObject` overflow is visible.

## [1.2.1] — 2026-09-05

Review release: bug fixes and internal cleanup, no new features. Every change
was checked against Obsidian 1.13.7's own stylesheet; the goal was zero
regression.

### Fixed
- Live Preview heading gaps were double-counted: Obsidian gives every heading
  line `padding-top: var(--p-spacing)`, which stacked on the theme's heading
  margins. That padding is now zeroed in the editor, so the margins are the
  single source of the gap in both modes (headings sit ~1.2em closer to the
  text above than in 1.2.0 — that was the double-count, not the design).
- The 3vh top padding of the editor was bound to `.is-focused`, which is
  Obsidian's *window*-focus class, so the content shifted whenever the app
  gained or lost focus. It is unconditional now.
- Task-list lines were pinned to `line-height: 1.6 !important` — a no-op at the
  current body line height that would have made task lines uneven as soon as
  the Line Height slider moved. Removed.
- Source mode `#` marks requested weight 300, which isn't bundled and was being
  synthesized. Removed.
- The blockquote `>` marker toggled `display` on the active line, moving the
  quote text when a line gained focus. It now keeps its width (`visibility`),
  so revealing it never shifts text; quote text sits one marker-width further
  right of the bar in every state.
- In the warm off-white background mode, table-header and code fills were
  nearly invisible against the warm page. The mode now has its own
  `--surface-muted`, `--code-bg`, `--border` and `--border-subtle` values.

### Changed
- The Live Preview prefix column is a single `padding-left` on `.cm-content`
  instead of an `!important` left margin on every block. Obsidian sets
  `.cm-content { padding: 0 }`, so nothing is clobbered, and the nested-editor
  and table-widget exceptions that the margin forced are gone.
- Headings have one source of truth: the `--h1-… --h6-` variables, which
  Obsidian reads in both modes. The reading-view element rules now carry only
  margins and H6's colour; the shared `.cm-header` rule only font-family and
  colour.
- The nested cell-editor rules are merged into one block; the graph-view
  variables live in the main `body` block; the reading-view measure rule
  names each prose container once.
- The Live Edit bullet dot is hidden explicitly (`.list-bullet::after`)
  rather than by the side effect of `font-size: 0` on an em-sized box.
- Removed unused tokens: `--bg-tertiary`, `--readability-list-gap`,
  `--section-spacing-sm`, `--font-interface-weight` (Obsidian neither defines
  nor reads the last one).
- `--klartext-highlight` is defined in both palettes rather than in `body`
  with a dark-mode override; `--p-spacing` is documented as deliberately
  setting the reading-view heading→paragraph gap.

## [1.2.0] — 2026-09-04

Typography and Live-Preview overhaul: one shared text edge, a heading-level
marker instead of raw `#` marks, a prose measure, and diagrams and tables
brought into the theme's monochrome language.

### Added
- Live Preview heading marker: `##` is shown as `#₂` (subscript level) in a
  reserved prefix column to the left of the text edge. Raw marks are zero-width
  in every state, so a heading never shifts when focused. Source mode and
  Reading view are unchanged.
- Prefix column: every block in Live Preview — headings, paragraphs, lists,
  quotes/callouts, tables, code — shares one left text edge.
- Prose measure: paragraphs, list items, quotes and callouts wrap at
  `--klartext-measure` (78ch); tables, code, diagrams and images keep full
  width. Style Settings → *Paragraph Measure*.
- Paragraph rhythm: the blank line between paragraphs is scaled by
  `--klartext-p-gap` (1.4 × line height), except directly around headings.
  Style Settings → *Paragraph Spacing*.
- Tables: zebra striping on every second body row (`--table-stripe-bg`),
  both modes.
- Mermaid: greyscale rendering in the theme's own greys (token overrides plus
  a `grayscale` filter so every diagram type is covered), centred in the text
  column, labels in Fira Sans at 0.9 × body size. Style Settings →
  *Greyscale Mermaid Diagrams*, *Center Mermaid Diagrams*, *Diagram Font Scale*.
- Soft scroll edge: a short gradient scrim under the view header so scrolled
  text fades out instead of being cut off. Style Settings → *Soft Scroll Edge*.
- Fira Sans 700 bundled (used by H1); `fonts/embed.py` regenerates the
  embedded font block from the `.woff2` sources.

### Changed
- Heading hierarchy: H1 is a display size (2.6 × body, 700, tighter tracking
  and line-height); H2–H6 are 1.5 / 1.3 / 1.2 / 1.1 / 1.0 × body at 600.
  Sizes are now set through Obsidian's `--h1-size … --h6-size` variables so
  they apply in Live Preview as well as Reading view.
- Body: line height 1.5 → 1.6 (Style Settings default updated); text colour
  softened to `#333333`; nested list indent 0.75em → 2em (Style Settings
  default updated).
- Lists (Live Edit): en-dash bullet, dimmed markers, extra separation between
  top-level items; nested items and wrapped lines stay tight.
- Tables: outer border sits on the text edge; one line-height token (1.4)
  for static and edited cells.
- Links: no underline, set through Obsidian's `--link-*-decoration`
  variables; colour and hover cue unchanged.
- View header and tab bar: bottom borders are no longer visible.

### Fixed
- Bundled fonts did not load (`ERR_FILE_NOT_FOUND`): Obsidian injects
  `theme.css` as a `<style>` tag, so theme-relative `url('fonts/…')` can never
  resolve. All faces are now embedded as base64 data URIs (latin + latin-ext,
  with `unicode-range`).
- Heading sizes set on `.cm-header-N` never applied in Live Preview — Obsidian
  forces that span to `font-size: inherit !important` — so Live Preview showed
  Obsidian's default ladder. Fixed via the `--hN-size` variables (see Changed).
- Live Preview heading margins were pre-multiplied for a base-size line, but
  the heading line is heading-sized; they ran ~1.6× too large and now match
  the Reading view values.
- Editing a table cell painted the cell white over its header fill, grew the
  row, and indented the text: the nested cell editor is now transparent,
  unpadded, un-inset and inherits the cell's font and line height.
- Heading text no longer jumps horizontally when a heading gains focus.

## [1.1.0] — 2026-09-04

### Added
- Fonts are now bundled locally in `fonts/` (JetBrains Mono + Fira Sans, latin
  and latin-ext subsets), so the theme renders fully offline with no request to
  Google Fonts and no flash of unstyled text on mobile.

### Changed
- Replaced the Google Fonts `@import` with local `@font-face` rules, trimmed to
  only the weights and styles the theme actually renders — Fira Sans 400/500/600
  and JetBrains Mono 400–600 + italic 400 (font families unchanged).

### Fixed
- Bold text (`strong`) and code keyword tokens now use a true JetBrains Mono 600
  weight. Previously that weight was never loaded, so it fell back to 500 and
  rendered too light.

## [1.0.0]

### Added
- Initial release. iA Writer-inspired minimalist theme in JetBrains Mono +
  Fira Sans, with light and dark modes, desktop and mobile support, and Style
  Settings controls (background mode, dotted fill, UI font size, line width,
  line height, list indent).
