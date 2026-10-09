# Embedded fonts

- Obsidian injects `theme.css` into a `<style>` tag, so a relative `url('fonts/…')` resolves against `app://obsidian.md`, not the theme folder, and never finds a local file. Embedding the faces as data URIs is the only way to ship fonts inside a theme.
- `fonts/embed.py` appends the `@font-face` rules to the built `theme.css` as a generated "EMBEDDED FONTS" section, so `src/theme.css` stays readable.
- Only the weights and styles the theme renders are included: Fira Sans (UI) 400/500/600, plus 700 for H1; JetBrains Mono (editor) 400–700, regular and italic.
- JetBrains Mono's faces are variable (one file per style covers 400–700): 700 is used for **bold** text, 600 for code keyword tokens.
- Each face is split into latin / latin-ext subsets with `unicode-range`, mirroring Google's subsetting.
- To refresh: put new `.woff2` subsets in `./fonts`, then run `python3 fonts/embed.py`, which rebuilds `theme.css`.
