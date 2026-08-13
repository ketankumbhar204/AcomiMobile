# API Reuse — Mobile Clients → Web



The Acomi backend must remain **shared**. Web should consume the same REST contracts as the React Native app.



Primary sources: `src/api/*`, `docs/api-reference.md`, `docs/inventory-backend-implementation.md`.



---



## 1. Verdict



| Category | Share |

|----------|-------|

| **100% reusable without modification** | ~95% of API client methods |

| **Minor client adjustments** | Storage, base URL, offline cache, file upload helpers |

| **Mobile-specific assumptions** | AsyncStorage cache, image picker, coachmark storage |

| **Backend improvements (optional, additive)** | Export endpoints, bulk review — never web-only breaking changes |



---



## 2. 100% reusable APIs



Port these clients as shared packages or copied modules (prefer a future `packages/api` monorepo).



### Auth — `authApi`

- `sendOtp`, `verifyOtp`, `getMe`, `updateMe`, `completeProfile`



### Spaces — `spaceApi`, `mySpacesApi`

- create/get/update/deactivate space  

- `getMySpaces`, `searchMySpaces`, `getDefaultSpace`, `setDefaultSpace`  

- `getUserSpaces`



### Members & invitations — `memberApi` (+ aliases)

- Member CRUD, status, emergency contact, deposit  

- Documents, notes, history  

- Invitations create/accept/cancel/list  

- Import candidates + import  

- `getMyLinkedMember`



### Accommodation — `accommodationApi`

- Buildings/floors/units/rooms/beds CRUD + search/list  

- Summaries, allocation targets  

- Quick setup preview/execute  

- Duplicate building/floor/room  

- Bulk create units/rooms/beds  



### Accommodation lifecycle — `accommodationLifecycleApi`

- deactivate / restore / delete per entity



### Occupancy — `occupancyApi`

- allocate, reserve, moveIn, cancelReservation, transfer, vacate  

- get/list/member occupancies  



### Meals — `mealsApi` + related

- Plans, participations, combos, food catalog  

- Daily menus, share, eligibility, headcount  

- Polls + payment proof approve/reject/remind  

- Delivery locations CRUD/reorder  

- `enrollMemberInFullMeals`, `setMemberMealAccess`  

- `mealBillingApi`, `mealPollClosingApi`, `mealBalanceApi`, `subscriptionPlansApi` (all methods)



### Payments — `paymentsApi`

- list/get, submitProof, reviewPayment, timeline  

- summary, members, review, history  

- sync / owner month / tenant flows  



**Web (Phase 6):** Reused verbatim via `modules/payments/api/paymentsApi.ts` + `shared/types/payments.ts`. See [PAYMENTS.md](./PAYMENTS.md). 



### Dashboard & notifications

- `getDashboardSummary`, `getMemberPaymentLedger`, `getGlobalDashboard`  

- `getPendingActions`, `listNotifications`, `markRead`, `resolve` (resolve unused in mobile UI — not wired on web)



**Web (Phase 11):** `notificationsApi` list/markRead + `dashboardApi.getGlobalDashboard`. See [NOTIFICATIONS_GLOBAL_WORKSPACE.md](./NOTIFICATIONS_GLOBAL_WORKSPACE.md).



**Web (Phase 12):** `memberApi` import-candidates/import; `accommodationLifecycleApi` full surface; `spaceApi.deactivateSpace`. See [PHASE_12_FINAL_PARITY.md](./PHASE_12_FINAL_PARITY.md).



### Complaints — `complaintsApi`

- list/get/create/status/comments/attachments/assign/reopen/resolution



**Web (Phase 7):** Reused verbatim via `modules/complaints/api/complaintsApi.ts` + `shared/types/complaints.ts`. See [COMPLAINTS.md](./COMPLAINTS.md).



### Inventory — `inventoryApi`

- store, dashboard, items CRUD, stockMove, transactions, categories, suppliers  



**Web (Phase 8):** Reused verbatim via `modules/inventory/api/inventoryApi.ts` + `shared/types/inventory.ts` (no offline cache). See [INVENTORY.md](./INVENTORY.md).



### Infrastructure

- `unwrapApiResponse`, `unwrapVoidResponse`  

- DTO types in `types.ts` / `inventoryTypes.ts`  

- `mappers.ts` space mappers  

- `buildListQuery` / list page size helpers  



---



## 3. Minor adjustments (client-side only)



| Area | Mobile | Web adjustment |

|------|--------|----------------|

| Token storage | AsyncStorage / memory | `localStorage` / httpOnly cookie strategy (prefer same Bearer header) |

| Base URL | `config/env.ts`, emulator host | Vite `import.meta.env` |

| Inventory offline cache | AsyncStorage `@acomi/inventory/cache/...` | Optional IndexedDB; or omit offline-first on web v1 |

| Image upload | `react-native-image-picker` | `FormData` from `<input type="file">` — **same multipart endpoints** |

| List pagination UI | Infinite scroll | Table pagination — **same query params** |

| Query caches | Ad-hoc TTL maps | TanStack Query keys — **same endpoints** |



No request/response shape changes required.



---



## 4. Mobile-specific assumptions (do not encode into backend)



| Assumption | Guidance for web |

|------------|------------------|

| Bottom-tab information architecture | Sidebar; same permission flags |

| Stack-only inventory screens | Still call same inventory APIs; register routes on web |

| Coachmarks / progressive footers | Optional UX; not API |

| `spaceType` passed into some inventory UI helpers but unused on wire | Keep for UI seeding copy only |

| Emulator localhost rewriting | Web uses deployed/API env URL |

| Permission deny → in-app screen | Web route guard + page |



---



## 5. Types / models — fully reusable



Port as `shared/types`:



- All exports from `src/api/types.ts`  

- All exports from `src/api/inventoryTypes.ts`  

- Space type helpers from `spaceTypes.ts`  



Keep names identical (`MemberResponse`, `OccupancyResponse`, `SpacePaymentResponse`, etc.) so docs and backend stay aligned.



---



## 6. Validation & permissions — fully reusable



Port without semantic change:



- `utils/spacePermissions.ts` + domain `*Permissions.ts`  

- `occupancyRules.ts`, `occupancyContract.ts`  

- `validateNewMemberFields.ts`, `indianMobile.ts`, `memberDeposit.ts`  

- `paymentProofPolicy.ts`, meal price validators  

- `accommodationSetup.ts`, `accommodationLimits.ts`  

- Domain `*Errors.ts` parsers  



Web forms call the same functions and show the same i18n keys.



---



## 7. Potential backend improvements (optional, additive, shared)



These help **both** clients. Do not make them web-exclusive contracts.



| Improvement | Why | Priority |

|-------------|-----|----------|

| Consistent `SpacePermissionsResponse` including inventory flags | Avoid client-side preserve hacks | High |

| Bulk payment review endpoint | Desktop multi-select | Medium |

| CSV/export endpoints for payments/occupancy/inventory | Reports | Medium |

| Cursor/keyset pagination standards | Large tables | Medium |

| Stronger ETag/If-Match on concurrent stock moves | Inventory | Low |

| Webhook/SSE for pending actions | Live ops dashboard | Low |

| Register/document inventory categories/suppliers/transactions (already exist) | Parity | Docs only |



**Must not:** fork APIs (`/web/...` vs `/mobile/...`), remove fields mobile needs, or change occupancy state machine.



---



## 8. Barrel export cleanup (web hygiene)



Mobile `api/index.ts` omits some clients (`complaintsApi`, meal sub-APIs, inventory types). For web/shared package:



- Export **all** domain clients from one barrel  

- Keep deprecated aliases (`invitationApi`) for compatibility or delete only after both clients migrate  



---



## 9. Reuse checklist for each new web page



1. Call existing API method — no new endpoint unless additive and documented.  

2. Run same permission helper before mutating.  

3. Run same validator before submit.  

4. Map errors with same `*Errors` util.  

5. Use same i18n keys for user-visible strings.  



Related: [web-architecture.md](./web-architecture.md), [implementation-roadmap.md](./implementation-roadmap.md).





## Phase 9 — Account / Onboarding / Spaces



| Client | Endpoints |

|--------|-----------|

| authApi.completeProfile | PATCH /auth/me/profile |

| mySpacesApi | GET /spaces/my, GET /spaces/default, PUT /spaces/{id}/default |

| spaceApi | POST/GET/PUT/DELETE /spaces |

| invitationApi | GET /invitations/my, POST /invitations/{id}/accept |

| mealBillingApi / mealPollClosingApi | space meal settings |





## Phase 10 — Meal Subscription & Day-meal Billing



| Client | Endpoints |

|--------|-----------|

| subscriptionPlansApi | /subscription-plans, activation-requests |

| mealsApi payment | meal-activity, payment-proof, approve/reject/remind |

| memberMealBalanceApi | purchases, end, history (UI end wired) |

