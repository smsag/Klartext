# Search field contrast

`--klartext-field-rule` draws the boundary of a search field. WCAG 1.4.11 asks 3:1 for the boundary of a control.

- `--border` is a hairline between surfaces and is meant to be quiet: against the three grounds a field can sit on it measures 1.23 / 1.14 / 1.07 to 1.
- `--klartext-field-rule` is the darkest neutral that clears 3:1 on all of them: 3.46 on `--background-primary`, 3.23 on `--background-secondary`, 3.03 on `--background-secondary-alt`.
- `--text-subtle` would also pass, but lands at 4.0–4.6 and reads as an underline rather than as an edge.
