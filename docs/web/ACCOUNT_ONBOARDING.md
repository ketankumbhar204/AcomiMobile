# ACCOUNT_ONBOARDING.md — Phase 9

**Status:** Complete (web)  
**Mobile source of truth:** `K:\CountIn`  
**Web module:** `K:\CountInWeb\src\modules\onboarding`  
**Backend:** unchanged — reuse existing auth, spaces, invitations, meal settings APIs  

> Before implementing any screen, web was compared to the corresponding React Native screen and backend API. Intentional desktop UX deviations below preserve the same workflow, validation, permissions, and API contracts.

---

## 1. Architecture

```
Auth (OTP)
  → SpaceBootstrapOutlet (GET /spaces/my)
  → AuthenticatedRootRedirect (resolveStartupSpace)
       ├─ default space → /spaces/:id/dashboard
       ├─ 2+ spaces, no default → /my-spaces
       ├─ pending invitations → /accept-invitations
       └─ none → /onboarding
  → Space routes wrapped in ProfileCompletionGate
       (TENANT/CUSTOMER + incomplete profile → /complete-profile)
```

State: Zustand (`authStore`, `spaceStore`), TanStack Query (invitations, space details, meal settings), Axios client.

---

## 2. Onboarding & space lifecycle (mobile parity)

| Flow | Mobile | Web | Notes |
|------|--------|-----|-------|
| Startup routing | `resolveStartupSpace` | Same util + `AuthenticatedRootRedirect` | Identical kinds |
| Onboarding choice | `OnboardingChoiceScreen` | `/onboarding` two-column cards | Desktop layout only |
| Create space | `CreateSpaceScreen` | `/create-space` stepper wizard | Same validation + `POST /spaces` |
| Join space | `JoinSpaceScreen` | `/join-space` wait + refresh | **No join codes** (mobile has none) |
| Accept invitations | `AcceptInvitationsScreen` | `/accept-invitations` | **Accept-only**; no reject |
| Profile gate | `requiresProfileCompletion` | `ProfileCompletionGate` | Same TENANT/CUSTOMER rule |
| Complete profile | wizard steps | `/complete-profile` stepper | Same required fields + API |
| My Spaces | `MySpacesScreen` | `/my-spaces` searchable cards | `search` + set default on open |
| Default / switch | `switchSpace` → PUT default | `spaceStore.switchSpace` | Header switcher + My Spaces |
| Space details | `SpaceDetailsScreen` | `/spaces/:id/details` | Read-only summary |
| Edit / settings | `EditSpaceScreen` | `/spaces/:id/edit` | Owner-only; meal + poll tabs |
| No spaces | empty CTAs | `/no-spaces` + onboarding links | |

---

## 3. Intentional desktop UX deviations

Documented deviations that **do not** change business behavior:

1. **Create Space** uses a 3-step desktop stepper (Basics → Configuration → Review) instead of a single scrolling form. Fields, validation, and `POST /spaces` payload match mobile.
2. **My Spaces** uses a responsive card grid + `SearchToolbar` instead of a mobile list. Search still hits `GET /spaces/my?search=`.
3. **Complete Profile** uses URL text fields for optional photo/document references instead of native image pickers. Required address fields and `PATCH /auth/me/profile` (with mobile fallback) are unchanged.
4. **Edit Space** uses Material tabs + sticky save footer instead of chip tabs. Meal billing (MESS + owner) and poll closing (owner) visibility match mobile.
5. **Space switcher** lives in the shell header and always calls `PUT /spaces/{id}/default` (same as mobile `switchSpace`).

---

## 4. Explicit non-features (do not invent)

| Topic | Decision |
|-------|----------|
| Join codes / invite tokens | **Not in mobile** → not on web |
| Invitee reject invitation | **Not in mobile** (cancel is sender-side) → not on web |
| Full ProfileScreen (language, docs hub) | Deferred beyond Phase 9 scope list |
| Subscription plans / notifications / reports | Out of phase — stop after Phase 9 |

---

## 5. API reuse

| API | Endpoints |
|-----|-----------|
| `authApi` | `PATCH /auth/me/profile`, `PATCH /auth/me` (fallback), `GET /auth/me` |
| `mySpacesApi` | `GET /spaces/my`, `GET /spaces/my?search=`, `GET /spaces/default`, `PUT /spaces/{id}/default` |
| `spaceApi` | `POST /spaces`, `GET/PUT /spaces/{id}`, `DELETE /spaces/{id}` |
| `invitationApi` | `GET /invitations/my`, `POST /invitations/{id}/accept` |
| `mealBillingApi` | `GET/PUT /spaces/{id}/meal-billing-settings` |
| `mealPollClosingApi` | `GET/PUT /spaces/{id}/meal-poll-closing-settings` |
| `memberApi` | `GET /spaces/{id}/members/me` (+ update/docs on profile fallback sync) |

---

## 6. DTO / validation / permissions reuse

- DTOs: `CompleteUserProfileRequest`, `CreateSpaceRequest`, `UpdateSpaceRequest`, `MySpaceResponse`, `SpaceDetailsResponse`, `MyInvitationResponse`, meal billing/poll settings types.
- Validation: mobile-equivalent required name/type on create; profile address fields; owner-only edit (`isSpaceOwner`).
- Profile gate: `requiresProfileCompletion(user, mySpaces)` — only when consumer membership exists and profile incomplete.
- Amenities / property category: same `supportsSpaceAmenities` / `supportsSpacePropertyCategory` rules as mobile.

---

## 7. Responsive behavior

- Forms: single column &lt; md, two-column ≥ md.
- Steppers: alternative labels hidden on xs where noted.
- My Spaces: 1 / 2 / 3 column card grid.
- Sticky footers for create / join refresh / profile / edit save.
- Targets: 1920 → 768 without horizontal scroll on primary flows.

---

## 8. Accessibility

- Semantic headings via `PageHeader`.
- `aria-label` on space switcher, search clear, loading spinners, invitation accept busy state.
- Keyboard-reachable MUI buttons, tabs, selects, steppers.
- Visible focus from MUI theme.

---

## 9. Performance

- TanStack Query for invitations, space details, billing/poll settings.
- Keyed form remount on edit (`details.updatedAt` + settings `dataUpdatedAt`) avoids effect hydration loops.
- Route-level module pages (no extra heavy charts).

---

## 10. Stop condition

Phase 9 is production-ready for Account / Onboarding / Space Lifecycle.  
**Do not start** Subscription Plans, Day Meal Payments, Notifications, or Reports in this phase.
