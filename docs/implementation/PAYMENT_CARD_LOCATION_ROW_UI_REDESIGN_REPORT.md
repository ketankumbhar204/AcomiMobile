# Payment Card Location Row UI Redesign — Implementation Report

**Date:** 2026-11-08
**Scope:** Individual payment card layout only (mobile + web). No Payments screen chrome, APIs, calculations, or action behaviour changes.

---

## Files changed

### Mobile (`AcomiMobile`)
| File | Change |
|---|---|
| `src/components/payments/UniversalPaymentCard.tsx` | Redesigned card layout: profile → divider + full-width location → tinted payment panel → actions |

### Web (`AcomiWeb`)
| File | Change |
|---|---|
| `src/modules/payments/components/CompactPaymentCard.tsx` | Same visual hierarchy as mobile payment card |

### Docs
| File | Change |
|---|---|
| `docs/implementation/PAYMENT_CARD_LOCATION_ROW_UI_REDESIGN_REPORT.md` | This report |

---

## Existing payment card component identified

| Platform | Component | Used by |
|---|---|---|
| Mobile | `UniversalPaymentCard` | `PaymentsScreen`, `MemberPaymentsScreen`, `TenantPaymentsTabScreen` |
| Web | `CompactPaymentCard` | `PaymentsWorkspacePage` (and related payment lists) |

Shared helpers **not** modified (to avoid affecting Members and other screens):
- `ContactAndStayMeta` / `StayTrailLine`
- `formatStayTrail` / `usePaymentStayTrail`
- `OwnerPaymentCardActions` / `OwnerPaymentRowActions`
- Payment APIs, status helpers, amount/date formatters

Location text still comes from `usePaymentStayTrail` (existing occupancy / `targetLabel` data). Display-only bullet separators (`•`) are applied inside the card.

---

## Exact layout changes made

1. **Member profile section** — avatar, name, phone, status badge remain at the top in one horizontal row (location removed from this block).
2. **Bed location section** — full-width row below profile, with hairline divider, bed icon, and hierarchy text. Hidden when there is no assignment, and hidden for `MEAL` payments.
3. **Payment information section** — status-tinted panel below location; title + calendar line on the left; amount + due (+ overdue) on the right; vertical separator between columns.
4. **Action buttons** — unchanged component, order, labels, icons, visibility, and handlers.

---

## Before / after element comparison

| Element | Before | After |
|---|---|---|
| Profile circle / name / phone / badge | Top row | Same |
| Location | Nested under profile text | Full-width row under profile + divider |
| Location separators | `→` via shared `StayTrailLine` | `•` display-only in card |
| Payment title / amount | Plain rows on card body | Inside tinted panel with vertical split |
| Billing dates | Plain caption under title | Calendar icon + caption in left panel column |
| Due / overdue | Separate due row | Right panel column under amount |
| Receive / Send reminder | Existing actions | Unchanged |

---

## Status / category coverage (layout only)

Layout applies through existing `paymentListDisplayStatus` / badge helpers. Tint mapping covers:
- Pending → light amber
- Paid → light green
- Overdue / Rejected → light red
- Under review → light blue
- Update requested / refund-related → light orange
- Cancelled / other → neutral slate

Categories (rent, short stay, booking advance, deposit, meal, etc.) keep existing titles/amounts; meal cards omit accommodation location.

---

## Space types

Location row renders only when `usePaymentStayTrail` returns a label (real assignment / `targetLabel`). Mess/Tiffin meal payments suppress the accommodation row via `paymentType === 'MEAL'`.

---

## Screenshots / visual evidence

Reference assets used:
- Existing Payments screenshots (before)
- Approved mock (`image-6b0020d6-…`) for target hierarchy, icons, and panel tints

Rebuild the app and visually compare Pending / Paid / Overdue cards on device and web.

---

## Build and test results

- IDE diagnostics on changed payment card files: clean
- Repo-wide `tsc` still reports pre-existing unrelated errors (occupancy wizard tests, etc.); none introduced in these payment card files

Recommended manual checks:
- [ ] Receive payment
- [ ] Send reminder
- [ ] Open payment details
- [ ] Cards with / without location
- [ ] Meal payment (no location row)
- [ ] Long names / narrow width

---

## Confirmation: out of scope untouched

- Payments header, summary cards, search, filters, bottom nav
- Payment APIs, DTOs, calculations, status transitions
- Receive / reminder / refund / cancel logic and handlers
- Payment detail screens / dialogs (except shared card visual layout)
- Global theme tokens and shared `StayTrailLine` used on Members

---

## Remaining issues

- Device/browser visual QA against the mock after install/reload is still required.
- Web calendar fallback uses billable-days line or month label; full rent “₹ × days” formula is no longer shown on the compact card (period details remain on the payment inspector/detail).
