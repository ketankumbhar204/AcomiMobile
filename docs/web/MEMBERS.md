# Members — Web (Phase 3)

Desktop Members module for Acomi Web. Mobile remains the business source of truth for APIs, DTOs, permissions, validation, and terminology. Presentation uses a **master-detail workspace** instead of stacked mobile screens.

---

## Scope

**In scope**

- Members directory (table) + Pending Invitations tab
- Master-detail inspector (Profile, Subscription, Accommodation, Payments, Occupancy, Activity)
- Add Member / Edit Member (drawer)
- Invite Member (dialog) + cancel invitation
- Subscription pack record + subscription history (meal-balance APIs)
- Per-member payment history (current month)
- Occupancy current + history
- Audit history + notes
- Permission gate `canManageMembers`
- Bulk invite (UI) + Export (UI preparation only)
- **Import Existing People** (`/members/import`)
- **Add Customers hub** (`/members/add-hub`) — mirrors mobile hub without Space Health stepper
- Deep link `?create=1` opens create-member drawer

**Out of scope**

- Accommodation builder / occupancy wizard
- Full Payments / Meals / Complaints / Inventory modules
- Full AddCustomersHub readiness stepper (deferred with Space Health)
- Backend changes

---

## Routes

| Path | Purpose |
|------|---------|
| `/spaces/:spaceId/members` | Workspace list |
| `/spaces/:spaceId/members/import` | Import existing people |
| `/spaces/:spaceId/members/add-hub` | Add Customers hub (MESS) |
| `/spaces/:spaceId/members/:memberId` | Same workspace with selection (shareable URL) |

Add / Edit / Invite are overlays (drawer / dialog) — fewer clicks than mobile stack navigation.

Guarded by `MembersPermissionGate` → `/forbidden` when `!canManageMembers`.

---

## Master-detail strategy

```
┌──────────────────────────────┬─────────────────────────────┐
│ Members | Pending tabs       │ Member Inspector            │
│ Search + filters + table     │ Profile | Meals | Stay | …  │
│ Bulk invite / Export prep    │ Quick actions Edit/Invite   │
└──────────────────────────────┴─────────────────────────────┘
```

| Breakpoint | Behavior |
|------------|----------|
| **xl (≥1536)** | Side-by-side list + inspector |
| **lg–xl** | List with detail section below when selected |
| **&lt;lg** | Detail-only when `:memberId` present (back clears selection) |

---

## API reuse

| Endpoint | Usage |
|----------|--------|
| `GET/POST /spaces/{id}/members` | List / create |
| `GET/PUT/DELETE /spaces/{id}/members/{memberId}` | Detail / update / remove |
| `GET /spaces/{id}/invitations` | Pending invites |
| `POST /invitations`, `DELETE /invitations/{id}` | Invite / cancel |
| `GET/POST .../meal-balance`, `.../purchases`, `.../subscription-history` | Subscription |
| `GET .../members/{id}/occupancies` | Stay + occupancy history |
| `GET /spaces/{id}/payments?memberId=&month=` | Payment history |
| `GET .../history`, `.../notes` | Activity + notes |

DTOs: `MemberResponse`, `MemberDetailsResponse`, `CreateMemberRequest`, `UpdateMemberRequest`, `CreateInvitationRequest`, meal-balance and occupancy list shapes — aligned with mobile.

Permissions: `canManageMembers` (OWNER/MANAGER), `canRemoveMember` (OWNER), never edit/remove OWNER; meal manage via `canManageMeals`.

Validation: Indian mobile `/^[6-9]\d{9}$/`, gender required for PG/HOSTEL, assignable roles by space type, subscription payload builder parity.

---

## Desktop improvements

1. Persistent filters (role, status, sort) beside search
2. Column-rich DataTable with selection, pagination, column visibility (shared DataTable)
3. Inspector tabs replace 4–5 mobile stack screens
4. Sticky form footer on Add/Edit drawer
5. Keyboard-friendly table row open + focus rings on actions
6. Bulk invite + Export button (export deferred — snackbar)

---

## Reusable for future modules

- Master-detail workspace pattern (`list + SidePanel inspector`)
- Permission gate outlet pattern
- Form drawer + sticky footer
- Filter chips / multi-select filter bar patterns

---

## Files

`src/modules/members/` — api, hooks, utils, components, pages  
`src/shared/types/member.ts`  
Docs: this file; updates to module-mapping / screen-inventory / component-mapping
