# Detecting an incomplete heading in Live Preview

A bare `#` is a valid (empty) ATX heading, so Obsidian sizes the line as a heading the moment the hash is typed; the theme's rules would then hide the raw hashes and draw the #ₙ badge while only a hash has been typed, and continuing *without* a space produces a tag (`#Meine`), not a heading. While the hashes stand alone, the theme undoes all three signals (hidden hashes, badge, heading size). The heading arrives with the space, when the markup stops being ambiguous.

The selector is `.HyperMD-header:has(> .cm-formatting-header):not(:has(> .cm-header:not(.cm-formatting-header))):not(:has(> .cm-formatting-header ~ .cm-formatting-header))`. Each part is needed:

1. **A heading span that is not a formatting mark** (real heading text). This carries the idle state: Obsidian drops the `#` mark from the DOM once the cursor leaves the line, so an idle heading is a single text span with no mark beside it; a test that merely counted spans would shrink every unfocused heading.
2. **A second formatting mark.** The trailing space is tokenised as its own mark, which is what says the space has been typed, so the line becomes a heading on the space rather than on the first character. Counting heading spans rather than children keeps the fold indicator (no header class) out of the count.
3. **The line holds a hash mark.** An idle heading whose whole text is a widget (`## $E = mc^2$`, an embed) has no heading-text span (the widget carries no header class) and no second mark (Obsidian has dropped the first); without this condition it would shrink to body size and lose its badge until the cursor came in. Hashes standing alone are always in the DOM, idle or not.

If a build bundles the trailing space into the hash span, neither of the first two halves fires until the first real character. CSS cannot read a span's text, so that degrades to a later jump rather than misfiring.
