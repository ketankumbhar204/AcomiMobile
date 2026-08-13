# Payments — Web (Phase 6)

Desktop Payments & Billing module for Acomi Web. Mobile remains the business source of truth for APIs, DTOs, permissions, validation, payment lifecycle, and terminology. Presentation uses a **KPI + table + inspector workspace** instead of stacked mobile screens.

This workspace is the **reference pattern** for later Complaints, Inventory, and Reports.

---

## Scope

**In scope**

- Owner payments workspace (Members / Review / History)
- Month KPIs (collected, pending, under review, expected)
- Sync expected charges (`POST …/payments/sync`)
- Payment detail inspector (proof, timeline, receipt preview, review actions)
- Tenant payments list + proof submit drawer
- Deep link `/spaces/:spaceId/payments/:paymentId`
- Member-scoped list via `?memberId=` (reuse `GET …/payments?memberId=`)
- Permission gate (any membership; owner/manager vs tenant UI)

**Out of scope**

- Day-meal bulk pay / meal-poll approve-remind (Meals APIs; deferred polish)
- Create/edit invoice CRUD (not in backend — charges are synced)
- Custom receipt engine (preview from `SpacePaymentResponse` only)
- Complaints, Inventory, Reports, Settings, Profile, Analytics
- Backend contract changes

---

## Business flow (unchanged)

1. Owner/manager **syncs** expected charges for a month  
2. Tenant/customer **submits proof** (`POST …/proof`)  
3. Owner/manager **reviews** (`POST …/review` — APPROVE | REJECT | REQUEST_UPDATE)  
4. Timeline + receipt UI are presentations over the same payment DTO  

There is no separate Invoice or Receipt API.

---

## Desktop architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ Breadcrumb · Payments · Month nav · Sync · Refresh               │
├──────── Stat cards: Collected | Pending | Under review | Expected ┤
├──────── Tabs: Members | Review | History ────────────────────────┤
│ ┌──────────────────────────────┬────────────────────────────────┐ │
│ │ DataTable (search/filters)   │ Inspector                      │ │
│ │ · Members ledger OR          │ · Details · Status             │ │
│ │ · Review / History queue     │ · Receipt preview              │ │
│ │ · Member filter chip         │ · Proof image                  │ │
│ │                              │ · Timeline                     │ │
│ │                              │ · Approve / Reject / Update    │ │
│ └──────────────────────────────┴────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

Below `lg`, the inspector becomes an `AppDrawer`.

---

## Routes

| Path | Purpose |
|------|---------|
| `/spaces/:spaceId/payments` | Workspace (`?month=&tab=&queue=&memberId=`) |
| `/spaces/:spaceId/payments/:paymentId` | Same workspace with inspector open |

Guarded by `PaymentsPermissionGate` (requires `membershipRole`). Owner/manager UI when `canManagePayments`; otherwise `TenantPaymentsPage`.

---

## API reuse

| Area | Endpoints |
|------|-----------|
| List / detail | `GET /spaces/{id}/payments`, `GET …/payments/{paymentId}` |
| Proof | `POST …/payments/{id}/proof` |
| Review | `POST …/payments/{id}/review` |
| Timeline | `GET …/payments/{id}/timeline` |
| Owner month | `GET …/summary`, `…/members`, `…/review`, `…/history` |
| Sync | `POST …/payments/sync?month=` |

DTOs in `shared/types/payments.ts` aligned with mobile/backend. **No backend changes.**

---

## Permissions

| Capability | Who |
|------------|-----|
| Enter Payments route | Any space membership role |
| Summary / members / review / history / sync / approve | OWNER, MANAGER (`canManagePayments`) |
| Own payment list + submit proof | TENANT / CUSTOMER (scoped by backend) |

---

## Reusable components

| Component | Role |
|-----------|------|
| `PaymentsWorkspacePage` | Owner KPI + tabs + table + inspector |
| `TenantPaymentsPage` | Tenant list + proof |
| `PaymentInspector` | Side panel: detail, receipt, proof, timeline, review |
| `ReceiptPreview` | Copy / print from payment DTO |
| `ProofSubmitDrawer` | Method, UTR, remarks, screenshot |
| `PaymentsPermissionGate` | Route guard |
| Shared | `DataTable`, `StatCard`, `SidePanel`, `AppDrawer`, `StatusChip`, `PageHeader` |

---

## Desktop improvements

- Master-detail without leaving the workspace  
- Persistent month + tab + queue in URL  
- Ctrl/Cmd+K focuses members search  
- Member row → review with `memberId` filter (list API)  
- Receipt copy/print without a custom engine  
- Same pattern intended for Complaints / Inventory later  

---

## Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| **≥lg** | Table + sticky inspector column |
| **&lt;lg** | Full-width table; inspector as drawer |
| **sm** | KPI cards 2-up; filters stack |

No intentional horizontal scroll. Tables use shared `DataTable` pagination.

---

## Accessibility

- Month nav and refresh have `aria-label`s  
- Search field focusable via Ctrl/Cmd+K  
- Review actions in sticky inspector footer  
- Status chips use text labels (not color alone)  
- Proof image has alt text  

---

## Performance

- TanStack Query keys per summary / members / review / history / detail / timeline  
- Conditional `enabled` so inactive tabs do not fetch  
- Mutation invalidation on payment query prefix  
- Inspector detail + timeline load only when a payment is selected  

---

## Validation

- Proof/review field rules match mobile (remarks required for REQUEST_UPDATE; rejection code for REJECT)  
- Backend remains authority; UI mirrors mobile messages via `paymentCollection.*` keys  

---

## i18n

- `navigation.payments`  
- `payments.*` (workspace, KPI, tabs, inspector, receipt, tenant)  
- `paymentCollection.*` (status, type, category, method, proof, review, timeline, fields)  

No hardcoded user-facing strings in the Payments module.
