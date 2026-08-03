# PHASE_12_FINAL_PARITY.md

**Status:** Complete (web)  
**Mobile source of truth:** `K:\CountIn`  
**Web:** `K:\CountInWeb`  
**Backend:** unchanged  

> Phase 12 closes remaining **mobile-wired** gaps and hardens production quality.  
> No new business modules. No backend contract changes.

---

## 1. Architecture review

Web remains module-based (`auth`, `dashboard`, `members`, `accommodation`, `meals`, `payments`, `complaints`, `inventory`, `onboarding`, `notifications`, `profile`, `global`) with shared design-system chrome.

Phase 12 additions:

| Area | Change |
|------|--------|
| Router | `React.lazy` + `Suspense` code-splitting for page routes |
| Members | Import Existing People page + Members toolbar entry |
| My Spaces | Consumer attention badges (tenant pending-actions) |
| Accommodation | Full lifecycle API + inspector deactivate/restore/delete |
| Space details | Owner deactivate space (danger zone) |
| Shell | AppHeader theme/nav labels via i18n |

---

## 2. Parity summary (implemented this phase)

| Mobile surface | Web |
|----------------|-----|
| `ImportExistingPeopleScreen` | `/spaces/:id/members/import` |
| `useConsumerSpacesAttention` | My Spaces chips → pending actions |
| `AccommodationLifecycleActions` | Inspector footer (all entity levels) |
| `accommodationLifecycleApi` | Full client mirror |
| `useDeactivateSpace` / Space Details | Owner deactivate + confirm |
| Route bundle | Lazy-loaded pages |

---

## 3. Components improved

- `AccommodationLifecycleActions` (new)
- `EntityInspector` (lifecycle wiring)
- `ImportExistingPeoplePage` (new)
- `MySpacesPage` (consumer attention)
- `SpaceDetailsPage` (deactivate)
- `MembersWorkspacePage` (Import CTA)
- `AppHeader` (i18n a11y labels)
- Router (`routes.tsx` lazy)

---

## 4. Responsive / a11y / performance

| Theme | Work |
|-------|------|
| Responsive | Import chips wrap; My Spaces attention chips; Space Details danger zone max-width |
| Accessibility | Theme toggle / menu aria-labels; ConfirmDialog for destructive actions; route loading `role="status"` |
| Performance | Route-level code splitting; consumer attention via parallel TanStack queries |

---

## 5. API / DTO / validation / permissions

| Concern | Verification |
|---------|--------------|
| APIs | `import-candidates`, `members/import`, lifecycle POST paths, `DELETE /spaces/{id}`, pending-actions |
| DTOs | `MemberImportCandidateResponse`, `ImportMemberRequest`, `AccommodationActionMetadata` |
| Validation | Confirm dialogs for deactivate/delete; import reuses backend errors |
| Permissions | Import behind Members gate; lifecycle requires `canDeactivateAccommodation` (owner); space deactivate owner-only |

---

## 6. Intentionally deferred (still)

| Item | Reason |
|------|--------|
| Space Health / `spaceLifecycle` | Large client engine; deferred since Phase 11 |
| Accommodation Builder canvas | Explicitly deferred |
| Bulk beds/rooms outside Quick Setup | Partial; Quick Setup covers primary setup path |
| Full native profile document picker | Edit Profile URL fields remain |
| Notification resolve UI | Unused on mobile |
| Help / About / command palette | Unwired / not in mobile |
| Coachmarks / offline inventory / Reports | Mobile-only or not in product |
| Full AddCustomersHub + readiness stepper | Depends on Space Health |

---

## 7. Known limitations

- Non-EN locale files remain stubs (~6% keys) with English fallback.
- Building summary may omit `actions`; inspector falls back to `getBuilding`.
- Members CSV export remains snackbar stub (no mobile export product).
- Bundle still large; lazy routes mitigate but shared vendors remain chunked together.

---

## 8. Future roadmap (post–production)

1. Port Space Health engine if product prioritizes setup coaching.  
2. Accommodation Builder only if floor-plan becomes a requirement.  
3. Expand non-EN translations.  
4. Optional CSV export when backend supports it.  
5. Accessibility audit with axe + keyboard matrix per module.
