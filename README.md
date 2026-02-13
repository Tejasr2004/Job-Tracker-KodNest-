# KodNest Premium Build System

Design system for KodNest. One mind. No drift.

## Contents

| File | Purpose |
|------|--------|
| `DESIGN-SYSTEM.md` | Philosophy, layout, component rules, and usage guidelines |
| `tokens.css` | Colors, typography, spacing, radius, transitions |
| `base.css` | Typography and base element styles |
| `layout.css` | Top bar, context header, workspace, panel, proof footer |
| `components.css` | Buttons, inputs, cards, badges, prompt box, error/empty states |
| `kn-design-system.css` | Single entry; imports all of the above |

## Usage

1. Load fonts (e.g. in your app or HTML):
   - **Headings:** Lora (serif)
   - **Body:** Source Sans 3 (sans-serif)

2. Link the design system:
   ```html
   <link rel="stylesheet" href="path/to/kn-design-system.css" />
   ```

3. Build pages with the layout classes and components described in `DESIGN-SYSTEM.md`. Use only the tokens and classes provided; do not add one-off values.

## Layout structure (every page)

1. **Top bar** — `.kn-topbar`, project name, progress, status badge  
2. **Context header** — `.kn-context-header`, headline + subtext  
3. **Main** — `.kn-main`, `.kn-workspace` (70%) + `.kn-panel` (30%)  
4. **Proof footer** — `.kn-proof-footer`, checklist with proof inputs  

Component class names are prefixed with `kn-` to avoid collisions.
