# NOTIFICATIONS_GLOBAL_WORKSPACE.md — Phase 11

**Status:** Complete (web)  
**Mobile source of truth:** `K:\CountIn`  
**Web:** `K:\CountInWeb`  
**Backend:** unchanged  

> Desktop UX may improve layout only. Business rules, APIs, DTOs, validation, and permissions match mobile.  
> Features not wired in mobile UI were **not** invented on web.

---

## 1. Mobile verification (source of truth)

| Feature | Mobile | Phase 11 web |
|---------|--------|--------------|
| Notification inbox + mark read + deep links | ✅ `SpaceNotificationsScreen` | ✅ `/spaces/:spaceId/notifications` |
| Unread / bell badge (role-split) | ✅ operators = pending count; tenants = inbox unread | ✅ `NotificationBellButton` |
| Resolve notification | API exists, **never called in UI** | ❌ Skipped |
| Notification detail screen | None (tap → deep link) | ❌ Skipped |
| Profile + language | ✅ `ProfileScreen` + `LanguagePicker` | ✅ `/profile` |
| Theme preferences hub | No RN product surface | ❌ Hub skipped; keep header theme toggle |
| Global Attention / Activity | ✅ via `GET /dashboard/global` | ✅ `/global/attention`, `/global/activity` + My Spaces cards |
| Space Health | ✅ client `spaceLifecycle` engine | ❌ Deferred (full lifecycle port; no invented thin API) |
| Help / About / Support | Orphan `HomeScreen` unwired | ❌ Skipped |
| Command palette / global search | Not in mobile | ❌ Skipped |

---

## 2. Architecture

```
Space shell
  ├─ Header bell → /spaces/:id/notifications
  ├─ Nav: Notifications, Pending Actions, Profile
  └─ Inbox: search + filters + date buckets + mark-read → deep link

Account
  └─ /profile → edit via /complete-profile?mode=edit + language + theme + logout

My Spaces (operators)
  ├─ Attention / Activity summary cards
  ├─ /global/attention
  └─ /global/activity
```

State: TanStack Query + Axios + existing Zustand (auth/space/theme). No new libraries.

---

## 3. API / DTO reuse

| Client | Endpoints |
|--------|-----------|
| `notificationsApi` | `GET .../notifications`, `POST .../read`, `GET .../pending-actions` (`resolve` present, unused) |
| `dashboardApi` | `GET /dashboard/global?month&sync` |
| `authApi` | Profile refresh / complete profile (existing) |

DTOs: `SpaceNotification`, `NotificationListResponse`, `GlobalDashboardResponse`, attention/activity/space summary types — aligned with mobile `api/types.ts`.

---

## 4. Permissions & filtering

- Tenant inbox filters via `filterTenantVisibleNotifications` / owner-only type set (mobile parity).
- Deep links refuse owner-only types for non-operators.
- Global dashboard cards shown only when user has OWNER/MANAGER space (mobile `hasOperatorSpace`).

---

## 5. Navigation mapping

| Mobile | Web |
|--------|-----|
| `SpaceNotifications` | `/spaces/:spaceId/notifications` |
| `Profile` | `/profile` |
| `CompleteProfile` edit | `/complete-profile?mode=edit` |
| `GlobalAttentionList` | `/global/attention` |
| `GlobalActivityList` | `/global/activity` |
| `DashboardSpaceHealth` | Deferred |
| Bell badge | Space shell header |

Deep links map mobile screen names → existing web module routes (payments, meals, complaints, occupancy, members, accept-invitations, profile).

---

## 6. Desktop adaptations

- Inbox: persistent SearchToolbar + filter chips + denser list (not a separate detail page).
- Profile: two-column cards; language Select; theme toggle reuses existing store.
- Global lists: card/table density; switch space then navigate like mobile.
- i18n: `en` complete for these keys; `hi/mr/kn/te/ta` stub locales copied from mobile with `fallbackLng: en`.

---

## 7. Accessibility

- Bell and list rows have aria-labels.
- Language Select labeled.
- Global attention summary uses mobile a11y string with counts.
- Keyboard-focusable MUI ListItemButton / CardActionArea.

---

## 8. Performance

- Notifications query `staleTime` 20s; pending actions 30s.
- Global dashboard: unsynced snapshot then background sync (mobile parity).
- Locale JSON loaded at init (same as mobile pattern).

---

## 9. Known limitations / remaining gaps

| Item | Reason |
|------|--------|
| Space Health page | Requires porting `src/spaceLifecycle/**`; deferred — do not invent |
| Resolve notification UI | Unused on mobile |
| Native document image picker on Profile | Web uses Complete Profile URL fields / edit flow |
| Non-EN locale coverage | Mobile stubs (~6% keys); web same + en fallback |
| Help / About / Command palette | Not productized on mobile |

---

## 10. Quality checklist

- Same APIs / DTOs / permissions / terminology as mobile for shipped surfaces  
- No backend changes  
- No reports / analytics / builder / offline  
- Phase stops here — production hardening not started  
