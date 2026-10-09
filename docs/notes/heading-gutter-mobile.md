# Heading gutter on mobile

On a phone the desktop 2.6em prefix strip on top of Obsidian's 24px file margin puts 61px left against 24px right on a 430px screen, and the text block reads as pushed to the right. The mobile column is symmetric: one marker width (1.2em, the column the list dashes already use) on each side, so headings and lists share one column, the block is centred (40px / 40px), and the `#` ink starts ~22px from the screen edge. Reading mode gets the same two paddings so switching modes does not shift the text edge.

Fit within the 1.2em column:
- list dash needs 1.2em → fits
- #₂…#₆ need ink + gap → 16–18px, fits
- #₁ with its gap in heading em would need 31px, so on mobile the gap is 0.4 body em → 19px, 3px into the file margin, which is acceptable.

The fold chevron is hidden on mobile except on a collapsed heading (Obsidian keeps the hover rule desktop-only). The desktop shift would put it 38px out, so on mobile it is not shifted; instead the marker is hidden while the heading is collapsed and the chevron takes its place.

On the desktop, Reading view without the shared column starts text 41.6px further left at a 16px body, with a correspondingly wider column, so paragraphs break at different words than in Live Preview.
