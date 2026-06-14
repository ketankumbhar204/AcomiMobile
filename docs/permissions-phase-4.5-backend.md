# Phase 4.5 — Centralized Space Permissions (Backend)

Summary of server-side role enforcement aligned with `docs/permissions-backend-spec.md`.

## Access layer

| Service | Responsibility |
|---------|----------------|
| `SpaceMembershipResolver` | Resolves active membership for `(spaceId, callerUserId)` or `403 NOT_A_MEMBER` |
| `AccommodationAccessService` | Structure view / manage / deactivate + MESS gate |
| `OccupancyAccessService` | Occupancy read/write + TENANT own-scope + resident subject checks |
| `SpacePermissionPolicy` | Computes `permissions` flags for `GET /spaces/my` |

## Policy highlights

### Accommodation structure
- **View (GET):** OWNER, MANAGER, STAFF
- **Create / update / quick-setup / duplicate / bulk / allocation-targets:** OWNER, MANAGER
- **Deactivate / restore / delete:** OWNER only
- **TENANT, CUSTOMER:** denied all structure access
- **MESS spaces:** all accommodation endpoints return `403`

### Occupancy
- **Writes:** OWNER, MANAGER only; subject member must be TENANT, CUSTOMER, or STAFF (not OWNER/MANAGER)
- **List `GET /occupancies`:** OWNER, MANAGER, STAFF
- **Get occupancy / member occupancies:** ops roles, or TENANT **own linked member only** (`OWN_SCOPE_ONLY`)
- **CUSTOMER:** denied all occupancy access

### Members (unchanged)
- Add/update/invite: OWNER, MANAGER
- Remove: OWNER only

## API changes

- `GET /api/v1/spaces/my` — each item now includes optional `permissions` object for mobile tab gating
- Detail GET `actions` flags unchanged in shape; still derived from caller role via `AccommodationActionService`

## Error contract

| Code | HTTP | Message |
|------|------|---------|
| `NOT_A_MEMBER` | 403 | You are not a member of this space |
| `OWN_SCOPE_ONLY` | 403 | You can only view your own occupancy |
| (none) | 403 | Only OWNER or MANAGER can perform this action |
| (none) | 403 | Only the space owner can perform this action |
| (none) | 403 | You do not have permission to view accommodation structure |

## Endpoints touched

All `/api/v1/spaces/{spaceId}/` accommodation structure controllers, occupancy controller, and `GET /spaces/my`.

## Tests

- `AccommodationAccessServiceTest` — parameterized role matrix
- `OccupancyAccessServiceTest` — manage/view/own-scope/subject-resident
- `SpacePermissionPolicyTest` — permissions map per role
