# Inventory — Web (Phase 8)

Desktop Inventory module for CountIn Web. Mobile remains the business source of truth for APIs, DTOs, permissions, stock-status derivation, and terminology. Presentation uses a **catalog-first workspace** (KPI + table + inspector), matching the Payments/Complaints pattern — deliberately simple (not ERP / WMS).

---

## Scope

**In scope**

- Catalog-first inventory workspace (search, stock filters, category filter)
- Dashboard KPIs from `GET …/inventory/dashboard`
- Item master-detail inspector (stock, supplier, recent transactions)
- Add / edit item drawer
- Stock In / Stock Out / Adjust stock drawer
- Categories tab (list + create)
- Suppliers tab (list + create)
- Transactions ledger tab
- Space-aware profile title (FOOD / ASSET / FURNITURE)
- Permission gate (`canViewInventory` / `canManageInventory`)

**Out of scope**

- Purchase orders, multi-warehouse, barcodes, batch/SKU systems, accounting
- Reports, Settings, Notifications, Profile, Analytics
- Backend contract changes
- Offline AsyncStorage cache (mobile-only)

---

## Space-aware behavior

One shared module. Profile kind from space type:

| Space type | Profile |
|------------|---------|
| MESS | FOOD |
| RENTAL | FURNITURE |
| PG / HOSTEL / CO_LIVING / default | ASSET |

Backend seeds defaults; web does not re-seed. Default form units follow the profile.

---

## Desktop architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ Breadcrumb · Profile title · Refresh · Add item                  │
├──── KPIs: Items | Low | Out | Value ─────────────────────────────┤
├──── Attention banner (optional) ─────────────────────────────────┤
├──── Tabs: Catalog | Categories | Suppliers | Transactions ───────┤
│ ┌──────────────────────────────┬────────────────────────────────┐ │
│ │ Search + stock/category      │ Item inspector                 │ │
│ │ DataTable catalog            │ · Available / min / status     │ │
│ │                              │ · Stock In/Out/Adjust · Edit   │ │
│ │                              │ · Recent activity              │ │
│ └──────────────────────────────┴────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

Below `lg`, inspector becomes `AppDrawer`.

---

## Routes

| Path | Purpose |
|------|---------|
| `/spaces/:spaceId/inventory` | Workspace (`?tab=&stock=&categoryId=`) |
| `/spaces/:spaceId/inventory/items/:itemId` | Catalog + inspector open |

Guarded by `InventoryPermissionGate` (`canViewInventory`).

---

## API reuse

| Method | Endpoint |
|--------|----------|
| getDashboard | `GET …/inventory/dashboard` |
| listItems / getItem | `GET …/items`, `GET …/items/{id}` |
| create / update / delete | `POST/PUT/DELETE …/items` |
| stockMove | `POST …/items/{id}/stock-moves` |
| listTransactions | `GET …/transactions?itemId=` |
| categories | `GET/POST/DELETE …/categories` |
| suppliers | `GET/POST …/suppliers` |

DTOs in `shared/types/inventory.ts`. **No backend changes.**

---

## Permissions

| Flag | Roles |
|------|-------|
| `canViewInventory` | OWNER, MANAGER, STAFF |
| `canManageInventory` | OWNER, MANAGER |

---

## Reusable components

| Component | Role |
|-----------|------|
| `InventoryWorkspacePage` | KPIs + tabs + catalog/inspector |
| `ItemInspector` | Detail + activity + actions |
| `ItemFormDrawer` | Create/edit |
| `StockMoveDrawer` | Stock In / Out / Adjust |
| `InventoryPermissionGate` | Route guard |

---

## Desktop improvements vs mobile

- Categories / suppliers / transactions UIs (API existed; mobile unwired)
- Adjust stock (`setAbsoluteStock`)
- Dashboard KPIs wired (`getDashboard`)
- Master-detail without stack navigation
- URL-persisted filters; Ctrl/Cmd+K search

---

## Responsive / a11y / performance

| Concern | Approach |
|---------|----------|
| Responsive | ≥lg split pane; &lt;lg drawer |
| A11y | Refresh/search labels; text status chips |
| Performance | Detail + item transactions only when selected; inventory query invalidation |

---

## i18n

Ported mobile `inventory.*` plus web keys: `workspace`, `inspector`, `banner`, `filters`, `table`, `actions.adjust`, `form.moveType` / `setStock`, `errors.load`. Nav: `navigation.inventory`.
