# Complaints — Web (Phase 7)

Desktop Complaints & Service Requests module for CountIn Web. Mobile remains the business source of truth for APIs, DTOs, permissions, status transitions, validation, and terminology. Presentation uses the **Payments reference pattern**: KPI strip + DataTable + inspector.

---

## Scope

**In scope**

- Complaints workspace (list + KPIs + filters)
- Raise complaint drawer (category, priority, subject, description, meal context, photos)
- Detail inspector (meta, assign, resolution actions, comments, attachments, timeline)
- Status lifecycle: start / resolve / close / cancel / reopen
- Assign (`POST …/assign`) — desktop improvement over mobile (API existed, no mobile UI)
- Search (client-side), filters persisted in URL
- Permission gate + role-scoped `mine` list

**Out of scope**

- Inventory, Reports, Settings, Notifications, Analytics
- Rich-text comments / mentions (not in backend)
- Backend contract changes
- Standalone closed/overdue analytics APIs (KPIs from list response + client high-priority count)

---

## Business flow (unchanged)

```
CREATE (OPEN)
  → [manage] IN_PROGRESS
  → [manage] resolve (resolution summary) → RESOLVED
  → [manage] CLOSED
  → [manage] CANCELLED (from OPEN / IN_PROGRESS)
RESOLVED → reopen when canReopen (server: ~7 days)
```

Attachments max 5; blocked on CLOSED/CANCELLED. Internal notes for managers only.

---

## Desktop architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ Breadcrumb · Complaints · Refresh · Raise                        │
├──── Stat cards: Open | In progress | Resolved | High/Urgent ─────┤
│ ┌──────────────────────────────┬────────────────────────────────┐ │
│ │ Search + Status/Priority/    │ Inspector                      │ │
│ │ Category (+ mine scope)      │ · Badges · Description         │ │
│ │ DataTable tickets            │ · Assign (manage)              │ │
│ │                              │ · Photos · Comments · Timeline │ │
│ │                              │ · Start / Resolve / Close…     │ │
│ └──────────────────────────────┴────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

Below `lg`, inspector becomes `AppDrawer`. Raise uses a right drawer with sticky footer.

---

## Routes

| Path | Purpose |
|------|---------|
| `/spaces/:spaceId/complaints` | Workspace (`?status=&priority=&category=&mine=`) |
| `/spaces/:spaceId/complaints/:complaintId` | Same workspace with inspector open |

Guarded by `ComplaintsPermissionGate` (`canRaise` / `canViewAll` / `canManage`).

---

## API reuse

| Method | Endpoint |
|--------|----------|
| list | `GET /spaces/{id}/complaints` |
| get | `GET …/complaints/{id}` |
| create | `POST …/complaints` |
| updateStatus | `PATCH …/{id}/status` |
| addComment | `POST …/{id}/comments` |
| addAttachment | `POST …/{id}/attachments` |
| reopen | `POST …/{id}/reopen` |
| assign | `POST …/{id}/assign` |
| updateResolution | `PATCH …/{id}/resolution` |

DTOs in `shared/types/complaints.ts`. **No backend changes.** List has no server pagination — client pages filtered rows.

---

## Permissions

| Capability | Who |
|------------|-----|
| Enter route | Raise or view-all or manage |
| View all | OWNER, MANAGER (`mine` omitted) |
| View own | TENANT, CUSTOMER (`mine=true`) |
| Raise | OWNER, MANAGER, TENANT, CUSTOMER (+ flag) |
| Status / assign / resolution / internal notes | OWNER, MANAGER |
| Comment / photo (when viewable) | Any viewer of the ticket |
| Reopen | When `canReopen` on response |

---

## Reusable components

| Component | Role |
|-----------|------|
| `ComplaintsWorkspacePage` | KPI + filters + table + inspector |
| `ComplaintInspector` | Detail, assign, comments, timeline, actions |
| `RaiseComplaintDrawer` | Create form |
| `ComplaintsPermissionGate` | Route guard |
| Shared | `DataTable`, `StatCard`, `SidePanel`, `AppDrawer`, `StickyFooter`, `StatusChip` |

---

## Desktop improvements vs mobile

- Master-detail without stack navigation  
- Assign dropdown (API already existed)  
- URL-persisted filters  
- Ctrl/Cmd+K search focus  
- KPI click applies status filter  

---

## Responsive / a11y / performance

| Concern | Approach |
|---------|----------|
| Responsive | ≥lg split pane; &lt;lg drawer inspector |
| A11y | Refresh/search labels; text status chips; photo alt |
| Performance | Detail query only when selected; list staleTime 15s; mutation invalidation on `complaint*` keys |

---

## i18n

Ported mobile `complaints.*` plus web keys: `workspace`, `inspector`, `kpi`, `search`, `table`, `photos`, field extras (`reporter`, `assigned`, `assign`, …). Nav: `navigation.complaints`.
