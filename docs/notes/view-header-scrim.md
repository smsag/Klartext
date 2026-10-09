# View header scroll scrim

- The scrim sits on `.view-content::before` of markdown leaves only, `z-index: 5`, height `2.2 × --klartext-font-size`. It is the theme's own polish, not a Style Settings option.
- It must fade in with scroll rather than rely on the note's top padding: Live Preview pads the scroller by 3vh, which is 27px in a 900px window against a ~35px scrim, so a short window or a landscape phone would fade the title's top.
- The scrollers (`.cm-scroller`, `.markdown-preview-view`) sit inside `.view-content`, so `scroll-timeline: --klartext-scroll` is named on them and hoisted to `.view-content` with `timeline-scope`. `animation-timeline` must come after the `animation` shorthand, which resets it.
- Where scroll-driven animation is unsupported, the animation runs as a zero-length plain animation with `fill: both` and holds its end state: the scrim is always on.
- The in-note find bar (`.document-search-container`) sits at the top of `.view-content`. Obsidian gives it `z-index: 30` but leaves it static, where z-index has no effect, so the scrim would wash over its field. The theme makes it `position: relative` so its own 30 applies.
