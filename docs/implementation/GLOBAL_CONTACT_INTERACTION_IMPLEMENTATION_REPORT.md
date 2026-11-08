# Global Contact Interaction — Implementation Report

**Date:** 2026-11-08
**Platform:** AcomiMobile (React Native / Android)

---

## 1. Coverage summary

| Metric | Count |
|---|---|
| Phone-number display sites reviewed | 30+ |
| Applicable interactive displays integrated | ~22 |
| Intentionally excluded (forms / self / workflow CTAs) | ~10 |
| Blocked | 0 |

Inventory: `docs/implementation/GLOBAL_CONTACT_INTERACTION_SCREEN_INVENTORY.md`

---

## 2. Reusable components created

| Component | Path | Role |
|---|---|---|
| `contactActions` | `src/utils/contactActions.ts` | Dial, SMS, message chooser, WhatsApp, copy |
| `ContactOptionsBottomSheet` | `src/components/contact/ContactOptionsBottomSheet.tsx` | ACOMI Contact sheet UI |
| `ContactOptionsProvider` / `useContactOptions` | `src/components/contact/ContactOptionsProvider.tsx` | App-wide open API |
| Enhanced `ContactNumberLine` | `src/components/member/ContactAndStayMeta.tsx` | Tappable number → sheet |

Provider wired in `App.tsx` next to existing sheet providers.

---

## 3. Intent / permission handling

| Action | Implementation |
|---|---|
| Call | `Linking.openURL('tel:+91…')` — dialer only, no `CALL_PHONE` |
| Message | Prefers `smsto:` / `sms:`; falls back to `Share.share` |
| SMS | `smsto:` then `sms:` |
| WhatsApp | `https://wa.me/{digits}` via existing `whatsAppPhoneDigits` |
| Copy | `copyTextToClipboard` + toast |

Invalid / missing numbers never open the sheet. Failures show an existing-style toast.

---

## 4. Integrated surfaces (representative)

- Payments list / details / create payment
- Members list, pending invites, member header & profile (incl. emergency contact)
- Occupancy picker, occupied bed stay, inventory summary
- Meal response members
- Service contacts list & details
- Owner contact card (discovery)
- Received / My enquiries
- Space details contact
- Admin property / mess / enquiry detail mobiles

Excluded: auth/register/OTP/edit forms, own profile number, payment reminder send workflow, inquiry-credits support CTA.

---

## 5. Tests

- New shared helpers reuse proven `indianMobile` / `whatsAppPhoneDigits` / clipboard utilities.
- Manual QA checklist: open sheet from payment card & members list; Call / SMS / WhatsApp / Copy; dismiss; card row press still navigates when tapping non-phone areas.
- Repo-wide `tsc` still has pre-existing unrelated errors; contact files are lint-clean in IDE diagnostics.

---

## 6. Scope confirmation

- No payment, occupancy, enquiry, or notification business logic changes.
- No API / schema changes.
- No redesign of cards beyond making the phone number tappable and opening the shared sheet.
- Existing role-based visibility of numbers is unchanged (only already-shown numbers become interactive).

---

## 7. Remaining follow-ups

- Optional: port the same Contact sheet to AcomiWeb.
- Optional: occupancy wizard inline `name · mobile` chips (compact banners) can adopt `ContactNumberLine` where they are not purely contextual labels.
- Visual device QA of the sheet against the approved mock (Call / Message cards + messaging list).
