# Design System — Amico Web

Adapt the existing mobile Material 3–inspired system for desktop.  
**Do not redesign the brand.** Desktop should feel like Amico.

Source tokens: `src/theme/*` (colors, typography, spacing, radius, shadows, navigation).

---

## 1. Brand & color

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#25D366` | CTAs, active nav, focus accents |
| `primaryHover` | `#20BD5A` | Hover on primary |
| `primaryDark` | `#128C7E` | Eyebrows, emphasis links |
| `background` | `#ECFDF5` | App canvas (light green wash) |
| `lightGreen` | `#D1FAE5` | Soft chips, selected rows tint |
| `surface` | `#F8FAFC` | Panels, sidebar, tables |
| `white` | `#FFFFFF` | Cards, dialogs |
| `textPrimary` | `#0F172A` | Headings, body strong |
| `textSecondary` | `#64748B` | Supporting text |
| `muted` | `#94A3B8` | Placeholders, icons inactive |
| `border` | `#E2E8F0` | Dividers, table lines |
| `success` | `#059669` | Positive states |

**Desktop additions (derived, not new brand):**

| Token | Suggestion | Usage |
|-------|------------|-------|
| `sidebarBg` | `white` or `surface` | Left nav |
| `sidebarActiveBg` | `lightGreen` | Active item |
| `tableHover` | `rgba(37,211,102,0.06)` | Row hover |
| `danger` | Align with mobile destructive (use existing complaint/payment error reds from visuals utils) | Errors |
| `warning` | From payment/inventory visual tokens | Warnings |

Avoid purple gradients, cream/serif “AI default” looks, or dark-mode-first. Stay WhatsApp-green Amico.

---

## 2. Typography

| Token | Mobile | Web |
|-------|--------|-----|
| Family | **Plus Jakarta Sans** | Same (load via Google Fonts / self-host) |
| Display | 32 / bold | Page heroes rare; use sparingly |
| H1 | 28 / bold | Page titles ~24–28 |
| H2 | 24 / bold | Section titles |
| H3 | 20 / semibold | Card titles |
| Body | 15 / regular | Default UI 14–15 |
| Caption | 13 | Table secondary |
| Label / Eyebrow | 11 semibold uppercase | Filters, overlines |

**Desktop density:** Allow `body` 14px in tables; keep marketing/auth at mobile sizes.

Weights: 400 / 500 / 600 / 700 — same as mobile.

---

## 3. Spacing & radius

Mobile scale (keep):

```
xxs 2 · xs 4 · sm 8 · md 12 · lg 16 · xl 20 · xxl 24 · xxxl 32 · section 40
```

| Radius | Value | Web usage |
|--------|-------|-----------|
| sm | 8 | Chips, small controls |
| button / input | 12 | Buttons, fields |
| card | 16 | Cards, dialogs |
| section | 20 | Large panels |
| full | 9999 | Avatars only — avoid pill-everything |

**Desktop layout spacing:** content padding `24–32`; sidebar width `240–280` (collapsed `72`).

---

## 4. Grid & breakpoints

| Breakpoint | Width | Columns | Content max |
|------------|-------|---------|-------------|
| xs | <640 | 4 | fluid |
| sm | 640 | 8 | fluid |
| md | 1024 | 12 | fluid |
| lg | 1280 | 12 | 1200–1440 |
| xl | 1536 | 12 | 1440–1600 |

Gutter: 16–24. Dashboard widgets: 12-col grid with 4/6/8 spans.

---

## 5. Sidebar

| Property | Spec |
|----------|------|
| Width expanded | 240–280px |
| Width collapsed | 72px (icon + tooltip) |
| Background | `white` / `surface` |
| Active item | `lightGreen` bg + `primaryDark` text/icon |
| Hover | subtle `surface` / green tint |
| Sections | Main modules; footer: space switcher + profile |
| Badges | Same as mobile tab badges (payments under review) |

Icons: **Lucide** (parity with `lucide-react-native`).

---

## 6. Header (top bar)

| Element | Spec |
|---------|------|
| Height | 56–64px |
| Content | Breadcrumbs or page title · search (contextual) · notifications · profile |
| Border | bottom `border` |
| Background | `white` |

Do not duplicate sidebar labels as a heavy second nav.

---

## 7. Tables

Desktop primary list pattern.

| Property | Spec |
|----------|------|
| Header | semibold caption; sticky |
| Row height | 48–56px comfortable; 40 dense optional |
| Hover | `tableHover` |
| Selected | `lightGreen` |
| Borders | horizontal only preferred |
| Status | StatusChip (ported visuals) |
| Empty | EmptyState centered |
| Loading | Skeleton rows |

Prefer tables over card lists for Members, Payments, Inventory, Complaints.

---

## 8. Cards

| Use cards | Avoid cards |
|-----------|-------------|
| Dashboard widgets, hub actions, layout tiles, tenant payment simplicity, KPI | Dense directories (use tables) |
| Auth/onboarding choice | Nesting cards inside cards |

Radius `card` (16). Shadow: soft elevation from mobile `shadows.ts` — one level, not multi-layer glow.

---

## 9. Forms

| Pattern | Spec |
|---------|------|
| Label | Above field; caption/secondary |
| Input | radius 12; border `border`; focus ring primary |
| Error | text below; same i18n keys |
| Density | Prefer 2-column field groups on md+ |
| Actions | Sticky footer (`ProgressiveWorkflowFooter` pattern) or dialog actions |

Pickers (Role, Gender, SpaceType, Category) → accessible Select/Listbox with same options.

---

## 10. Buttons

| Variant | Mapping |
|---------|---------|
| Primary | filled `primary` |
| Secondary | outlined / tonal `lightGreen` |
| Ghost | text |
| Destructive | tonal red (from existing destructive patterns) |

Height ~40–44px; icon+label OK. Loading state same as mobile.

No FAB on desktop — use toolbar primary.

---

## 11. Dialogs & drawers

| Type | Width | Use |
|------|-------|-----|
| Dialog | 400–560 (sm); 640–720 (md) | Confirm, short forms, bulk |
| Drawer right | 400–480 (sm); 560–640 (forms) | Entity forms, inspectors |
| Drawer left | 320–360 | Filters on mid screens |
| Full-screen modal | rare | Wizard on smaller desktops |

Scrim + Esc to close; focus trap required.

---

## 12. Icons

- Library: **Lucide React**  
- Default size: 20 toolbar / 24 nav / 16 inline  
- Stroke aligned with mobile  
- Food type / status colors from existing visual utils  

---

## 13. Hover, focus, keyboard

| State | Behavior |
|-------|----------|
| Hover | Background tint; show secondary actions |
| Focus visible | 2px `primary` ring; never remove outlines |
| Active | Slightly darker primary |
| Disabled | muted + no pointer |
| Keyboard | Tab order logical; `Esc` closes overlays; shortcuts documented in Phase 10 |

---

## 14. Status & feedback

Reuse mobile visual helpers:

- `billingVisuals`, `complaintVisuals`, `inventoryVisuals`, `paymentStatusTheme`, `mealStatusTheme`, `spaceVisuals`

Toast → Snackbar bottom-right on desktop (non-blocking).  
Confirm → centered dialog (same copy).

---

## 15. Shadows & elevation

Port `src/theme/shadows.ts` presets. Prefer:

- Cards: light shadow  
- Dropdowns/menus: medium  
- Modals: stronger  

Avoid neon glow / heavy multi-shadow stacks.

---

## 16. Motion

Keep purposeful and short (150–250ms):

- Drawer slide  
- Dialog fade+scale  
- Sidebar collapse  
- Table row selection  

No decorative parallax. Optional: reuse progressive reveal for setup — not required for v1.

---

## 17. Implementation note (library)

Recommended: **MUI** with a Amico theme mapping tokens above → `palette`, `typography`, `shape`, `components` overrides.  
Alternatively: Radix + CSS variables using the same tokens.

Either way, **token values and component names** from this doc and mobile should stay the source of truth.

Related: [component-mapping.md](./component-mapping.md), [responsive-strategy.md](./responsive-strategy.md).
