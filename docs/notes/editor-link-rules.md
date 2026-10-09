# Link underlines in the editor

Klartext marks a link's destination with the rule under it: solid for a link inside the vault, dotted for one that leaves it. This replaces Obsidian's external-link glyph, an arrow set as a background image. The icon is drawn to different proportions than the embedded monospace face, so at its 0.825em it reads as a character in the sentence, not as an annotation.

The rule is scoped to the classes Obsidian puts on links in note content, in both editor modes and in Reading view. A permanent underline on every settings link would be noise.

**Markdown links in the editor.** A `[text](target)` link is `.cm-link` wherever it points, so the class alone can't say which rule it takes. The `.external-link` widget can: Obsidian sets it after an external target, on the span its arrow was painted on. Measured in Obsidian 1.14:

- On an idle line, the widget follows the link text after exactly four hidden spans (`]`, `(`, the target, `)`), each between two widget buffers.
- On the line being edited, it follows after exactly four visible spans.
- This holds for every target form: a title, `<angle brackets>`, `mailto:`, `obsidian://`.
- A link to a note has no such widget.

So a `.cm-link` is solid, and dotted when that tail follows it. Link text split by formatting (`[**a** b](…)`) is matched one split deep.

A Markdown link to a missing note can't be told apart in the editor, because Obsidian marks it only in Reading view, so it stays solid.

**Wikilinks.** The rule sits on `.cm-underline`. Obsidian wraps it in `.is-unresolved` when the note is missing. Only the direct child takes the rule, so a missing note's link has none, as in Reading view.
