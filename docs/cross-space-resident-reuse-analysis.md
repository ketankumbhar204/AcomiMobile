# Cross-Space Member Reuse — Architecture & Implementation

**Status:** Accommodation resident reuse shipped; **Mess customer reuse shipped** (2026-07-24).  
**Date:** 2026-07-24  
**Scope:** Move In / ALLOCATE / RESERVE (lodging) + Add Customer (Mess) across owner-managed spaces.

---

## 1. Executive verdict

| Question | Finding |
|----------|---------|
| Are Member / Occupancy / Person / Space Member separate? | **Member**, **Occupancy**, **SpaceMembership**, and **User** are separate. **There is no Person entity.** |
| Member ownership | **Space-scoped** only (`/spaces/{spaceId}/members`). Not org-global, not owner-global. |
| Cross-space search API? | **None.** |
| Multi active occupancy (same space)? | **Not supported.** At most one `ACTIVE` or one `RESERVED` per member per space. |
| Cross-space active occupancy? | Not modeled as a single rule. Same human can be a Member in Space A (ACTIVE) and Space B (separate Member row) today if created twice. |
| True single source of truth for a person? | **Requires backend** (Person or import/link API). Frontend alone can only copy fields into a **new** Member in the target space. |

**STOP for true SoT:** Reusing a person without duplicating Member rows cannot be done with existing APIs. See §10.

A **pragmatic frontend Phase 1.5** (fan-out search + create-with-copied basics) is possible without backend changes, but it still creates a second Member record in the destination space.

---

## 2. Concept model (as implemented)

```
User (global identity / auth)
  │
  ├── owns → Space (PG | HOSTEL | CO_LIVING | RENTAL | MESS)
  │
  └── SpaceMembership (access: OWNER | MANAGER | TENANT | CUSTOMER | STAFF)
         optional link
              ↓
         Member (space business roster: name, mobile, role, status, deposit, docs…)
              ↓
         Occupancy (ACTIVE | RESERVED | VACATED) → Bed | Room | Unit
```

| Concept | Exists? | Scope | Notes |
|---------|---------|-------|-------|
| **User** | Yes | Global | Auth; optional `linkedUser` on Member |
| **Space** | Yes | Owned by User (`ownerId`) | No Organization membership for residents |
| **SpaceMembership** | Yes | Space + User | App access after invite |
| **Member** | Yes | **Space** | Operational resident/customer/staff profile |
| **Occupancy** | Yes | Space + Member | Allocation lifecycle |
| **Person** | **No** | — | Not a type, table, or API |
| **SpaceMember** | Name only | — | Informal; real type is `SpaceMembershipResponse` / `Member` |
| **Organization** | Partial | Space field `organizationId?` | Not used for member roster |

Authoritative domain doc: `docs/domain-model.md`.

---

## 3. Current Move In flow

### Naming (important)

| UI label | Wizard mode | Meaning |
|----------|-------------|---------|
| **Move In today** | `ALLOCATE` | Walk-in: pick member + bed → create `ACTIVE` occupancy |
| **Complete move-in** | `MOVE_IN` | Reservation → `ACTIVE` (member already known; **no member picker**) |
| **Reserve** | `RESERVE` | Pick member + dates → `RESERVED` |

Cross-space reuse applies to **`ALLOCATE` and `RESERVE` member steps**, not to `MOVE_IN`.

### Primary UI

- Screen: `src/features/occupancy/OccupancyWizard/OccupancyWizardScreen.tsx`
- Member step: `.../steps/MemberPickerStep.tsx`
- Parallel path: `HierarchyOccupancyPickerModal` (same member search/create patterns)

### ALLOCATE steps

`[target?] → [member?] → contract → review` → `POST /spaces/{spaceId}/occupancies`

### Member step today

- Toggle: **Search existing** | **Add new tenant**
- Search: `useMemberSearch` → `GET /spaces/{spaceId}/members?search=&occupancyStatus=`
- Filter client-side: `status === 'ACTIVE'` and `shouldShowOccupancySection(role)` (TENANT | CUSTOMER | STAFF)
- Preferred filter for allocate/reserve: `occupancyStatus=VACATED` (already allocated/reserved rows disabled)
- Add new: name + mobile → `POST /spaces/{spaceId}/members` with `role: 'TENANT'`

---

## 4. Dependency map (screens)

```
Dashboard / Accommodation lists / Bed|Room|Unit detail / Member profile
  └─ openOccupancyWizard(ALLOCATE|RESERVE|…)
       └─ OccupancyWizardScreen
            ├─ MemberPickerStep  ←── target for reuse UX
            ├─ TargetPickerStep (BedInventoryBrowser)
            ├─ ContractTermsStep
            ├─ ReserveDatesStep
            ├─ ReviewStep
            └─ Transfer / Vacate steps

Hierarchy path:
  useHierarchyOccupancyPicker → BuildingPickerModal → HierarchyOccupancyPickerModal
    └─ member search/create (same APIs)
```

Related but out of scope for picker: Move Out (`VACATE`), Transfer, Reservation complete (`MOVE_IN`), Quick Setup, Create Member screen, Invite Member.

Legacy unused: `MoveInModal.tsx` (no callers).

---

## 5. APIs (reuse inventory)

### Members (`memberApi.ts`) — all space-scoped

| Method | Endpoint | Reusable for cross-space? |
|--------|----------|---------------------------|
| GET | `/spaces/{id}/members?search&occupancyStatus` | Yes, **per space** (fan-out) |
| POST | `/spaces/{id}/members` | Yes, create in **target** space |
| GET | `/spaces/{id}/members/{memberId}` | Yes, read source profile for copy |
| PUT | status / emergency / deposit / docs / notes | Only after member exists in target |

**No:** org members, owner members, import member, link member, Person CRUD.

### Occupancy (`occupancyApi.ts`)

| Method | Endpoint | Role in reuse |
|--------|----------|---------------|
| POST | `/occupancies` | Allocate after member selected/created |
| POST | `/occupancies/reserve` | Reserve after member selected/created |
| GET | `/members/{id}/occupancies` | Current/reserved/history **in that space** |

### Spaces

| Method | Use |
|--------|-----|
| My spaces (`mySpacesApi` / `useSpaceStore.mySpaces`) | Discover other accommodation spaces to search |

### Search limitations

- Params: `search`, `occupancyStatus` only
- **No pagination** on member list (returns full array)
- No filter by role on server
- No email / government ID on Member search (Member has no email field; email is on User)

---

## 6. Occupancy states

### `OccupancyStatus`

| Value | UI meaning |
|-------|------------|
| `ACTIVE` | Currently occupying |
| `RESERVED` | Future / reserved, not moved in |
| `VACATED` | Ended (checkout **or** cancelled reservation) |

There is **no** `MOVED_OUT`, `INACTIVE`, `PENDING`, `CANCELLED` occupancy status. Cancelled reservations become `VACATED` with history event `RESERVATION_CANCELLED`.

### `MemberOccupancyStatus` (derived)

`ALLOCATED` | `RESERVED` | `VACATED`

### `MemberStatus` (ops, not occupancy)

`ACTIVE` | `VACATED` | `SUSPENDED` | `BLACKLISTED`

### Multi-occupancy

- **Per space:** forbidden (backend + client `alreadyOccupied`).
- **Across spaces:** not prevented by a global Person rule (separate Member rows).

**Recommendation:** For reuse search, exclude anyone with `ALLOCATED` or `RESERVED` in **any** of the owner’s accommodation spaces (keyed by mobile), unless product later supports multi-site concurrent stay.

---

## 7. Roles & eligibility matrix (proposed)

### Roles on Member (`MembershipRole`)

`OWNER` | `MANAGER` | `TENANT` | `CUSTOMER` | `STAFF`

Mess defaults to `CUSTOMER`; lodging defaults to `TENANT`.

### Eligibility for “Select Existing Resident” (product rules mapped to code)

| Show | Map to |
|------|--------|
| PG / Hostel / Rental / Co-living resident | `role === 'TENANT'` in lodging space types |
| Previous / moved out | `occupancyStatus === 'VACATED'` or no occupancy |
| Never occupied | Member exists, no ACTIVE/RESERVED |
| Inactive / transferred out | Treat as vacated / no current occupancy (no separate TRANSFERRED member status; transfer vacates old occupancy) |

| Hide | Map to |
|------|--------|
| Mess / meal-only / delivery customers | `role === 'CUSTOMER'` and/or space type `MESS` |
| Owners / managers | `OWNER`, `MANAGER` |
| Staff / kitchen / service | `STAFF` (and any future staff subtypes — not in API today) |
| Blocked / deleted / archived | `BLACKLISTED`, `SUSPENDED`; deleted members absent from list |
| Active / reserved occupancy (any owned lodging space) | `ALLOCATED` or `RESERVED` |

**Note:** Today `shouldShowOccupancySection` includes `CUSTOMER` and `STAFF`. Cross-space reuse must **narrow to `TENANT`** for eligibility.

### Role compatibility (space type → space type)

| From \ To | PG | Hostel | Rental | Co-living | Mess |
|-----------|----|--------|--------|-----------|------|
| PG TENANT | ✅ | ✅ | ✅ | ✅ | ❌ (different product role) |
| Hostel TENANT | ✅ | ✅ | ✅ | ✅ | ❌ |
| Rental TENANT | ✅ | ✅ | ✅ | ✅ | ❌ |
| Co-living TENANT | ✅ | ✅ | ✅ | ✅ | ❌ |
| Mess CUSTOMER | ❌ | ❌ | ❌ | ❌ | N/A for accommodation move-in |
| OWNER/MANAGER/STAFF | ❌ | ❌ | ❌ | ❌ | ❌ |

Transition is not a Member role change across spaces; it is **create or match TENANT in destination** + new Occupancy.

---

## 8. Recommended search scope

| Scope | Feasible today? | Recommendation |
|-------|-----------------|----------------|
| Current space only | ✅ Current behavior | Keep as baseline + include in results |
| Owner’s accommodation spaces | ✅ via `mySpaces` + fan-out GET | **Phase 1.5 recommended** |
| Organization | ❌ No org member API | Defer |
| Global | ❌ Insecure / no API | Never |

**Scalable long-term:** Backend  
`GET /owners/me/residents/search?q=&eligibleForSpaceId=`  
with server-side pagination, eligibility, and occupancy checks.

---

## 9. Profile reuse vs occupancy (product split)

### Person-like data (should copy / link)

Name, photo (if any), mobile, gender, emergency contact, documents, notes, linked user — today mostly on **Member** / **User**, not shareable across spaces without copy or Person.

`CreateMemberRequest` only accepts: `fullName`, `mobileNumber`, `role`, `gender?`, `mealBillingType?`.  
Emergency contact, documents, deposit require **follow-up APIs after create**. Full profile reuse without backend import is **partial**.

### Occupancy-specific (always fresh)

Building / floor / unit / room / bed, move-in date, rent, deposit, food, agreement, amenities, occupancy notes — already collected on contract / target steps. **Do not change.**

---

## 10. Backend changes — decision

### Required for true single source of truth

1. **Person** (or owner-scoped Resident identity) **or**
2. **`POST /spaces/{targetSpaceId}/members/import`** with `{ sourceSpaceId, sourceMemberId }` that:
   - Copies allowed profile fields
   - Creates Member in target (or links)
   - Rejects if mobile already active in target
   - Rejects if source has ACTIVE/RESERVED elsewhere (policy)

Plus ideally: **`GET /residents/search`** across owner spaces with pagination.

### No backend required for

- Label renames (Select Existing Resident / Create New Resident)
- Empty-state copy + CTA
- Result card layout
- Fan-out search UX (with known performance limits)
- Create-in-target with name/mobile/gender copy

### Explicit statement

**True SoT + full profile reuse + safe occupancy exclusion at scale → Backend required.**  
**UI labels + cross-space discoverability with duplicate Member rows → No backend changes required.**

---

## 11. Security

- Only search spaces returned by **My Spaces** for the authenticated user (OWNER/MANAGER with `canManageMembers` / occupancy permission).
- Never query arbitrary `spaceId`.
- Do not surface Mess customers into lodging move-in.
- Respect existing `canManageOccupancy` gates on wizard entry.

---

## 12. Performance

- Member list has **no pagination** — fan-out across many spaces can be expensive.
- Mitigations without backend: debounce, search only when query length ≥ 2 (or load vacated on focus with cap), parallel requests with limit (e.g. max N spaces), dedupe by mobile.
- Owners with thousands of residents → **must** have server-side search (defer).

---

## 13. Edge cases (analysis)

| Case | Handling |
|------|----------|
| Duplicate mobile across spaces | Dedupe by mobile; prefer vacated; if already in target space, select that Member |
| Active in Space A, search in Space B | Exclude (policy) |
| Reserved in any space | Exclude |
| Mess CUSTOMER into lodging Move In | Exclude (role + space type) — still true |
| Mess CUSTOMER / lodging TENANT into Mess Add Customer | **Eligible** (Mess import path) |
| STAFF / OWNER / MANAGER | Exclude |
| BLACKLISTED / SUSPENDED | Exclude |
| ALLOCATED / RESERVED in lodging (for lodging Move In) | Exclude |
| ALLOCATED TENANT into Mess | **Eligible** (PG→Mess reuse; occupancy stays on PG) |
| No mobile | Rare; exclude from cross-space match or show with caution |
| Hundreds of spaces | Cap fan-out; prefer backend search |
| Offline | Same as today (API required) |

---

## 14. Implementation plan

### Done — Backend + frontend (2026-07-24)

Server-side import-candidates + import APIs; app wired for ALLOCATE/RESERVE member picker.

### Deferred

1. True Person entity / single global SoT (still one Member row per space after import)
2. Server pagination for very large owners
3. Notes copy on import

---

## 15. Testing (manual checklist — for when implemented)

### Happy path

- [ ] PG → PG vacated resident appears and move-in works  
- [ ] Hostel ↔ Rental ↔ Co-living eligible TENANT  
- [ ] Create New Resident still works  
- [ ] Current-space vacated residents still appear  

### Not eligible

- [ ] Mess CUSTOMER hidden  
- [ ] OWNER / MANAGER / STAFF hidden  
- [ ] BLACKLISTED / SUSPENDED hidden  
- [ ] ALLOCATED / RESERVED in any owned lodging space hidden  

### Regression

- [ ] MOVE_IN (reservation complete) unchanged  
- [ ] Transfer / Vacate / Reserve  
- [ ] Members list / Create Member / Invite  
- [ ] Accommodation / Dashboard / Payments / Complaints / Quick Setup  
- [ ] Permissions  

---

## 16. Future improvements (defer)

- Person entity / global resident identity  
- Server-side pagination for very large owners  
- Concurrent multi-space occupancy (if product needs it)  
- Email / government ID search fields on Member  
- Member notes copy on import  

---

## 18. Implementation status (2026-07-24)

### Backend (shipped)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/spaces/{targetSpaceId}/members/import-candidates?search=` | Target-type aware candidates across managed portfolio |
| `POST /api/v1/spaces/{targetSpaceId}/members/import` | Copy profile into target space (idempotent by mobile + role) |

**Lodging targets:** TENANT only; VACATED occupancy; exclude busy (ALLOCATED/RESERVED) mobiles across managed PG/HOSTEL/CO_LIVING/RENTAL.

**Mess targets:** CUSTOMER from managed Mess spaces **or** TENANT from managed lodging (including ALLOCATED residents). Creates CUSTOMER. Concurrent Mess memberships allowed (no occupancy busy block). Meal participation is **not** copied — Add Customer enrolls separately.

Import copies: name, mobile, gender, mealBillingType, emergency contact, document metadata. Does **not** copy occupancy, deposits, notes, or meal participation.

### Frontend (shipped)

**Lodging**

- Labels: Select Existing Resident / Create New Resident
- `useResidentImportSearch` + import in OccupancyWizard and HierarchyOccupancyPickerModal

**Mess**

- Add Customer (`AddMemberScreen`): Select Existing Customer / Create New Customer
- Reuses `MemberPickerStep` (`audience="customer"`) + same import APIs
- After import: meal access enroll + optional subscription (same as create-new path)

### Still deferred

- True Person entity / single global SoT (still one Member row per space)
- Server pagination / email / member-code search fields
- Notes copy on import
- Configurable “one Mess only” concurrency policy

---

## 19. Mess Guided Customer Reuse

### Business rules

| Rule | Decision |
|------|----------|
| Search scope | Caller’s **managed portfolio** (OWNER/MANAGER spaces) — not global, not other owners |
| Mess → Mess | Reuse CUSTOMER; create new CUSTOMER membership in target Mess |
| PG/Hostel/Rental/Co-living → Mess | Reuse TENANT person profile; create CUSTOMER in Mess (even if still ALLOCATED on lodging) |
| Concurrent Mess memberships | **Allowed** (customer may eat at two messes) |
| Owners / Managers / Staff / Blocked | Never shown |
| Meal participation | Space-specific; enroll after import on Add Customer screen |

### Eligibility matrix (Mess target)

| Source | Role | Status | Shown? |
|--------|------|--------|--------|
| Mess | CUSTOMER | ACTIVE / VACATED | Yes |
| Mess | OWNER / MANAGER / STAFF | any | No |
| PG / Hostel / Co-living / Rental | TENANT | ACTIVE / VACATED | Yes |
| Lodging | STAFF / OWNER / MANAGER | any | No |
| Any | SUSPENDED / BLACKLISTED | — | No |
| Other owner’s spaces | any | — | No |

### Role compatibility

| Source role | Mess import result role |
|-------------|-------------------------|
| CUSTOMER | CUSTOMER |
| TENANT | CUSTOMER |
| Others | Rejected |

### Person vs Membership (current architecture)

There is still **no Person entity**. Reuse creates a **new Member row** in the target space with copied profile fields (same pragmatic model as lodging import). True single-person SoT remains a future backend evolution.

### Screens modified

- `AddMemberScreen.tsx` — Mess Select Existing / Create New
- `MemberPickerStep.tsx` — `audience` prop for customer copy
- Backend: `MemberMasterService`, `MemberRepository`, `MemberController`

### Manual testing (Mess)

- [ ] Mess A customer appears when adding to Mess B; import creates CUSTOMER; no duplicate mobile conflict on retry
- [ ] PG ALLOCATED tenant appears for Mess Add Customer; Mess CUSTOMER created; PG occupancy unchanged
- [ ] Hostel / Rental / Co-living TENANT same as PG
- [ ] OWNER / MANAGER / STAFF / blocked never appear
- [ ] Create New Customer still works; meal access + subscription still work after import
- [ ] Lodging Move In reuse unchanged (Mess customers still excluded from lodging import)
