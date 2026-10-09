# Image alignment

Alignment is written into the alt text: `![Map | center | 750](map.png)` or `![[map.png|center|750]]`; also `left` and `right`.

- Obsidian reads the width only from the **last** segment, so the word goes before it (`| 750 | center` would lose the width) or stands alone (`![Map | right](map.png)`).
- What is left in the alt is the caption plus the word, `Map | center`. Live Preview keeps the space before the width (`Map | center `), hence the trailing-space selector variants.
- `Population center | 300` is a caption, not a command: the word has to be a segment of its own.

An aligned image is a figure, not a word, so it leaves the sentence:
- **Reading view** makes the inline embed a flex row. As an inline element the theme's block-gap margin never applied to it, so `margin-block: 0` keeps the paragraph's spacing unchanged.
- **Live Preview** keeps Obsidian's `inline-flex` and widens it to the line (Obsidian sizes it to the image with `width: fit-content`). `display: block` would push CodeMirror's cursor buffers on either side onto lines of their own, making the line 45px taller than the same image unaligned.
