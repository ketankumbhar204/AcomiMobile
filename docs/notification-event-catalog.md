# Notification & Pending Action Event Catalog

**Status:** Canonical reference for CountIn Action Center  
**Last updated:** 11 July 2026  
**Source of truth:** `space_notifications` → `PendingActionService` / notification inbox APIs

This catalog is the contract for future modules. Do not invent parallel attention systems.

**Schema:** Flyway `V75__create_space_notifications.sql`, `V76__create_space_complaints.sql`, `V77__global_dashboard_notification_indexes.sql` (no separate DB schema doc).

---

## Principles

1. Every important business event publishes through `NotificationService.publish`.
2. **Pending Actions** = open rows with `category = ACTION_REQUIRED` only.
3. **Notifications (inbox / Recent Activity)** = historical events (all categories).
4. Completing the work **resolves** the actionable row automatically (sync or event hook).
5. Deep links must open the correct screen for every published type.

---

## Operator vs participant

| Helper (FE) | Meaning |
|---|---|
| `canManageNotifications()` / `isSpaceOperator()` | OWNER/MANAGER-capable Action Center (members **or** meals **or** occupancy) |
| Tenant/Customer | Own payment-update / invitation / complaint / poll info only |

Backend manager fan-out: active `OWNER` + `MANAGER` memberships.  
**STAFF:** may receive `COMPLAINT_PENDING` when assigned. Assignee rows are preserved on manager sync and are **not** cleared/filtered by tenant “owner-only” cleanup (FE + `PendingActionService`).

---

## Event catalog

| Business event | Notification type | Category | Pending Action? | Recipients | Deep link |
|---|---|---|---|---|---|
| Payment proof submitted | `PAYMENT_NEEDS_REVIEW` | ACTION_REQUIRED | Yes — Payment Reviews | Owner/Manager | Payments → Submitted |
| Payment proof submitted | `PAYMENT_SUBMITTED` | INFORMATION | No | Tenant/Customer | Payment Detail |
| Owner requests update | `PAYMENT_NEEDS_UPDATE` | ACTION_REQUIRED | Yes — Needs Update | Owner/Manager | Payments → Changes requested |
| Owner requests update | `PAYMENT_UPDATE_REQUESTED` | ACTION_REQUIRED | Yes (tenant) | Tenant/Customer | Payment Detail |
| Payment approved | `PAYMENT_APPROVED` | SUCCESS | No | Tenant/Customer | Payment Detail |
| Payment rejected | `PAYMENT_REJECTED` | ERROR | No | Tenant/Customer | Payment Detail |
| Payment overdue | `PAYMENT_OVERDUE` | — | **Not published (P2)** | — | Payments → Members |
| Menu not planned (tomorrow) | `MENU_NOT_PLANNED` | ACTION_REQUIRED | Yes | Owner/Manager | Menu Planning |
| Menu draft ready to share | `MENU_DRAFT_PENDING_PUBLISH` | ACTION_REQUIRED | Yes | Owner/Manager | Menu Share Preview |
| Poll open / low responses | `MEAL_RESPONSES_BELOW_THRESHOLD` | ACTION_REQUIRED | Yes | Owner/Manager | Menu Planning |
| Subscription activation waiting | `SUBSCRIPTION_ACTIVATION_PENDING` | ACTION_REQUIRED | Yes | Owner/Manager | Subscription Activation Requests |
| Meal poll not published | `MEAL_POLL_NOT_PUBLISHED` | — | **Dead enum (unused)** | — | Menu Planning |
| Meal poll opened | `MEAL_POLL_PUBLISHED` | INFORMATION | No | Tenant/Customer | Today’s Menu |
| Meal poll reminder | `MEAL_POLL_REMINDER` | — | **Not published (P2)** | — | Today’s Menu |
| Reservation created | `RESERVATION_CREATED` | INFORMATION | No | Owner/Manager | Occupancy (move-ins) |
| Move-in scheduled today | `MOVE_IN_SCHEDULED_TODAY` | ACTION_REQUIRED | Yes — Today’s Move-ins | Owner/Manager | Occupancy (move-ins) |
| Move-in completed | `MOVE_IN_COMPLETED` | SUCCESS | No | Owner/Manager | Occupancy (move-ins) |
| Move-out scheduled today | `MOVE_OUT_SCHEDULED_TODAY` | ACTION_REQUIRED | Yes — Today’s Move-outs | Owner/Manager | Occupancy (active) |
| Move-out completed | `MOVE_OUT_COMPLETED` | INFORMATION | No | Owner/Manager | Occupancy (active) |
| Reservation starting today | `RESERVATION_STARTING_TODAY` | — | **Dead enum (alias unused)** | — | Occupancy |
| Vacant reserved / expired reservation | `VACANT_RESERVED_BED` / `EXPIRED_RESERVATION` | — | **Not published (P2)** | — | Occupancy |
| Invitation created | `PENDING_INVITATION` | ACTION_REQUIRED | Yes | Owner/Manager + invitee (if registered) | Members / Accept Invitations |
| Invitation accepted | `INVITATION_ACCEPTED` | SUCCESS | No | Owner/Manager | Members |
| Profile / KYC incomplete | `TENANT_PROFILE_*` / `MISSING_*` | — | **Not published (P2)** | — | Profile |
| Complaint created | `COMPLAINT_CREATED` | INFORMATION | No (paired with pending) | Owner/Manager | Complaint Detail |
| Complaint needs action | `COMPLAINT_PENDING` | ACTION_REQUIRED | Yes — Complaints Pending | Owner/Manager (+ assignee) | Complaint Detail |
| Complaint commented | `COMPLAINT_COMMENTED` | INFORMATION | No | Other party / managers | Complaint Detail |
| Complaint resolved/closed | `COMPLAINT_RESOLVED` | SUCCESS | No | Creator | Complaint Detail |
| Complaint overdue | `COMPLAINT_OVERDUE` | — | **Not published (P2 / SLA)** | — | Complaint Detail |

---

## Sync services (backend)

| Domain | Service | Trigger |
|---|---|---|
| Payments | `PaymentNotificationSyncService` | Event hooks + `syncSpaceMonth` |
| Complaints | `ComplaintNotificationSyncService` | Event hooks + `syncSpace` |
| Invitations | `InvitationNotificationSyncService` | Event hooks + `syncSpace` |
| Occupancy | `OccupancyNotificationSyncService` | Event hooks + `syncSpace` |
| Meals / subscriptions | `PendingActionService.syncOperationalAttentionForManagers` | Via `DashboardAttentionService` (internal only — **not** dual UI) |

Aggregated by: `PendingActionService.getPendingActions` / `syncSpaceActions`.

---

## Surfaces

| Surface | Data |
|---|---|
| Space Dashboard “Pending actions” card | `dashboard-summary.pendingActions.totalCount` |
| Pending Actions screen | `GET …/pending-actions` |
| Notification bell (operator) | Pending-actions count (cached) |
| Notification bell (tenant) | Unread inbox count |
| Notification inbox | `GET …/notifications` |
| Global My Spaces | `GET …/dashboard/global` attention + `pendingActionCount` |
| Global Recent Activity | INFO / SUCCESS / WARNING / ERROR only |

Deprecated: dashboard `attention` array is always empty; do not rebuild client attention fallbacks.

---

## FE helpers

| File | Role |
|---|---|
| `src/utils/spaceOperator.ts` | `isSpaceOperator` / `canManageNotifications` |
| `src/utils/notificationDeepLinks.ts` | Shared deep-link map for inbox + pending groups |
| `src/utils/ownerOnlyNotifications.ts` | Tenant filter for owner-only types |
| `src/utils/dashboardQueryCache.ts` | Invalidate clears summary + pending caches |

---

## Adding a new event (checklist)

1. Add or reuse `NotificationType` (BE enum + FE union).
2. Publish from a `*NotificationSyncService` (prefer sync-from-store for actionable).
3. Set `ACTION_REQUIRED` only if user must act.
4. Wire recipients (managers / participant / assignee).
5. Ensure resolve on completion (event or sync stale cleanup).
6. Add deep link in `notificationDeepLinks.ts`.
7. Update this catalog.
8. Invalidate Action Center on FE after the mutation (`invalidateDashboardQueries`).
