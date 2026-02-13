# KodNest Premium Build System

Design system for a serious B2C product. One mind. No drift.

---

## Design philosophy

- **Calm** — No visual noise. Space and clarity over density.
- **Intentional** — Every element has a purpose. Nothing decorative.
- **Coherent** — Same patterns everywhere. Predictable.
- **Confident** — Restraint as strength. No hedging.

**Out of scope:** Gradients, glassmorphism, neon, animation noise, flashy or playful treatment, hackathon-style UI.

---

## Color system

Maximum four colors across the entire system.

| Role        | Token              | Value     | Use |
|------------|--------------------|-----------|-----|
| Background | `--color-bg`       | `#F7F6F3` | Page and card backgrounds |
| Primary text | `--color-text`   | `#111111` | Headings, body, labels |
| Accent     | `--color-accent`   | `#8B0000` | Primary actions, links, key emphasis |
| Success    | `--color-success` | Muted green | Success states, confirmations |
| Warning    | `--color-warning` | Muted amber | Warnings, caution (semantic only; counts as one semantic family) |

Success and warning are muted, low-chroma variants so the system still reads as a 4-color palette.

---

## Typography

- **Headings:** Serif font. Large. Confident. Generous spacing. No decorative or display fonts.
- **Body:** Clean sans-serif. 16–18px. Line-height 1.6–1.8. Max width for text blocks: 720px.
- **Rule:** No random sizes. Use the defined scale only.

---

## Spacing system

Single scale. No arbitrary values (e.g. 13px, 27px). Whitespace is part of the design.

| Token   | Value |
|--------|-------|
| `--space-1` | 8px  |
| `--space-2` | 16px |
| `--space-3` | 24px |
| `--space-4` | 40px |
| `--space-5` | 64px |

Use only these five values for margin, padding, and gap.

---

## Global layout structure

Every page follows this order, top to bottom:

1. **Top Bar** — Project name (left), progress (center), status badge (right).
2. **Context Header** — Large serif headline, one-line subtext, clear purpose. No hype.
3. **Primary Workspace (70%) + Secondary Panel (30%)** — Main interaction + supporting content.
4. **Proof Footer** — Persistent. Checklist: □ UI Built □ Logic Working □ Test Passed □ Deployed. Each item requires user proof.

---

## Top bar

- **Left:** Project name.
- **Center:** Progress indicator — "Step X / Y".
- **Right:** Status badge: Not Started | In Progress | Shipped.
- Same height and padding on every page.

---

## Context header

- One large serif headline.
- One line of subtext.
- Clear purpose. No marketing or hype language.

---

## Primary workspace (70% width)

- Where the main product interaction happens.
- Clean cards. Predictable components. No crowding.
- Uses spacing scale and component rules only.

---

## Secondary panel (30% width)

- Short step explanation.
- Copyable prompt box.
- Actions: Copy, Build in Lovable, It Worked, Error, Add Screenshot.
- Calm styling. No competing emphasis.

---

## Proof footer (persistent)

- Checklist: □ UI Built □ Logic Working □ Test Passed □ Deployed.
- Each checkbox requires user proof input.
- Always visible at bottom. Same structure on every page.

---

## Component rules

- **Primary button:** Solid deep red (`--color-accent`). One clear primary per context.
- **Secondary button:** Outlined. Same border radius and hover behavior as primary.
- **Hover:** Same effect and duration everywhere (150–200ms, ease-in-out).
- **Border radius:** Single value. Same on buttons, inputs, cards.
- **Inputs:** Clean borders. No heavy shadows. Clear focus state (e.g. border + outline).
- **Cards:** Subtle border. No drop shadows. Padding from spacing scale.

---

## Interaction rules

- **Transitions:** 150–200ms, ease-in-out only. No bounce. No parallax.
- **Motion:** Only where it aids clarity. No decoration.

---

## Error and empty states

- **Errors:** Explain what went wrong and how to fix it. Never blame the user.
- **Empty states:** Provide the next action. Never feel dead or abandoned.

---

## Visual drift

Everything must feel like one mind designed it. No one-off colors, type sizes, or spacing. When in doubt, use the token.
