# Phone search fields

On a phone, Obsidian draws the settings search (`.setting-search-container .search-input-container`) and the command palette's field (`.prompt-input-container`) as a raised pill. Both containers carry `.mod-raised`:

- `.is-phone .mod-raised` sets `background: var(--raised, var(--raised-background))`, a translucent fill.
- `.is-mobile.is-floating-nav .mod-raised` adds `backdrop-filter`, `box-shadow` and a transparent `border`, each read through `var(--raised, …)`. On iOS a `::after` mask adds a bright edge, its `display` read the same way.
- `.is-phone .search-input-container.mod-raised` and `.is-phone .prompt-input-container` round the container: `--touch-radius-m` / `--touch-size-m`, 44px measured.
- `.is-phone .prompt-input[type=text]` gives the palette's input a full `--background-modifier-border` border and the same radius.

Measured in Obsidian 1.14.4 with the phone body classes: container fill `color(srgb 1 1 1 / 0.65)`, radius 44px, a three-layer shadow; the palette's input 1px all round, radius 44px.

Every other field in the theme is one rule on the ground: no fill, no radius, no shadow, a 1px `--klartext-field-rule` under it, 2px accent on focus (SEARCH and MODAL & COMMAND PALETTE in `src/theme.css`). Setting `--raised: none` on the two containers switches every `var(--raised, …)` declaration to `none` at once, the iOS mask's `display` included, which is the lever Obsidian gives for this. Only the radius and the palette input's own border are restated.
