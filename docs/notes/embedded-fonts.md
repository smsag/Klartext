# Embedded fonts

- Obsidian injects `theme.css` into a `<style>` tag, so a relative `url('fonts/…')` resolves against `app://obsidian.md`, not the theme folder, and never finds a local file. Embedding the faces as data URIs is the only way to ship fonts inside a theme.
- `fonts/embed.py` writes the built `theme.css`: `src/theme.css` with every comment but the `@settings` schema stripped, then the `@font-face` rules as a generated "EMBEDDED FONTS" section. `src/theme.css` is never modified. The file is written as UTF-8 with LF line endings and replaced in one step, so the build is identical on every platform and an interrupted run leaves the previous file.
- Two more faces are embedded: `Klartext Marks` and `Klartext Marks Quote`, built by `fonts/make-marks.py`. Their glyphs are empty, and their `unicode-range` is exactly the characters of a Live Preview block marker (`Quote`: only `>`), so they hide those characters and touch nothing else (see `docs/notes/marker-column.md`).
- Only the weights and styles the theme renders are included: Fira Sans (UI) 400/500/600, plus 700 for H1; JetBrains Mono (editor) 400–700, regular and italic.
- JetBrains Mono's faces are variable (one file per style covers 400–700): 700 is used for **bold** text, 600 for code keyword tokens.
- Each face is split into latin / latin-ext subsets with `unicode-range`, mirroring Google's subsetting.
- To refresh: put new `.woff2` subsets in `./fonts`, then run `python3 fonts/embed.py`, which rebuilds `theme.css`.
