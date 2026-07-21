# Payment Module Certification Checklist

**Module:** Payments  
**Status:** Stabilization complete — certify before freezing  
**Certified version (when 100% green):** `v1.0 Certified`  
**Template for:** Complaints · Members · Deposits · Notifications · Reports  

Use this as the definition of done.

**Discipline**

1. Do **not** write another line of Payment code until this checklist is **100% green** (except defect fixes found during certification).
2. Once every item is checked → **Freeze** the Payment module and mark it **v1.0 Certified**.
3. Use the frozen module as the architectural blueprint for Complaints (and later modules).
4. Do **not** start Complaints until certification is complete.

---

## Architecture rules (must hold)

- [ ] Screen opens are **read-only** — no `syncExpected` / meal backfill on GET
- [ ] Sync only via `POST /payments/sync`, mutations, or scheduled jobs
- [ ] Summary / List / Detail APIs are separate; no giant aggregate required for UI
- [ ] Only the **active tab** loads list data
- [ ] Server-side pagination for Members, Review, History
- [ ] Summary reads from **month snapshot** (or materializes once), not a full live ledger loop for every open
- [ ] One source of truth for tab counts (`PaymentMonthCountsSupport`)
- [ ] Cache invalidation after mutations — not on tab / chip / filter changes

> Agent pre-verification results live in `docs/payment-certification-report.md`. Checkboxes here stay unchecked until **you** confirm (device Network panel + workflows). Do not treat agent PASS as final certification.

## 1. Functional verification

### Owner / Manager — Payments screen

- [ ] Open Payments → Summary cards appear without waiting for every list
- [ ] Default tab Members loads first page only (~20)
- [ ] Pending Review loads only when that tab is opened
- [ ] History loads only when that tab is opened
- [ ] Tab switch does **not** call `/sync` or reload other tabs
- [ ] Month change reloads Summary + **active tab only**
- [ ] Pull-to-refresh calls `POST /sync` then Summary + active tab
- [ ] Search / status / sort on Members hits API params (`q`, `status`, `sort`, `page`, `size`)
- [ ] Load more appends next page; totals match server `totalElements`
- [ ] Approve / Reject / Request Update updates Summary counts and review list
- [ ] After review, Members / Dashboard / Pending Actions reflect new state (after refetch)

### Detail

- [ ] Payment detail loads timeline + proof + actions
- [ ] Soft refresh failure keeps last successful detail (no empty flash)
- [ ] Submit / edit proof invalidates month caches + dashboard

### Tenant / Customer

- [ ] Tenant payments open with `sync: false`
- [ ] Submit proof updates own list and does not leave owner Summary stale after owner refresh
- [ ] Day-meal proof / bulk pay invalidates payments month caches

### Roles & spaces

- [ ] Owner can manage; non-manager sees access denied on owner Payments
- [ ] Manager with payment permission matches Owner flows
- [ ] Works for PG, Hostel, Rental, Co-Living, Mess (architecture identical)

---

## 2. API verification

| Endpoint | Check |
|----------|--------|
| `GET .../payments/summary` | No member/payment arrays; KPIs + counts only |
| `GET .../payments/members` | True DB page from `space_payment_member_month` |
| `GET .../payments/review` | DB page; excludes bundled MEAL rows when policy says so |
| `GET .../payments/history` | DB page for PAID/REJECTED/HISTORY |
| `GET .../payments/{id}` | Detail only |
| `POST .../payments/sync` | Only write path for expected sync + snapshot rebuild |
| `GET .../owner-month` | Deprecated; default `sync=false` |
| `GET .../payments`, `/ledger` | Default `sync=false` |

- [ ] No write-on-read on default GETs
- [ ] No N+1 on review/history page (ID page + graph hydrate)
- [ ] Snapshot rebuilt after sync / approve / reject / request update / proof submit

---

## 3. Performance benchmarks

Record for a space with **≥200 members** and **≥2k payments** in the month:

| Metric | Target | Measured | Pass |
|--------|--------|----------|------|
| Summary (warm snapshot) | &lt; 500ms p95 | | [ ] |
| Members page (size=20) | &lt; 500ms p95 | | [ ] |
| Review page (size=20) | &lt; 500ms p95 | | [ ] |
| APIs on open (default Members) | 2 (summary + members) | | [ ] |
| APIs on tab switch | 0–1 (new tab only) | | [ ] |
| SQL on summary (warm) | small (snapshot + status group) | | [ ] |
| Open does not run syncExpected | 0 writes for expected gen | | [ ] |

Optional: attach before/after from `scripts/benchmark-dashboard-apis.mjs` or APM.

---

## 4. State transition verification

For each transition, confirm **Summary · Members · Review · History · Dashboard · Notifications · Pending Actions · Customer UI · Owner UI**:

| Transition | Verified |
|------------|----------|
| Pending → Under Review (proof submitted) | [ ] |
| Under Review → Paid (approve) | [ ] |
| Under Review → Rejected | [ ] |
| Under Review / Paid path → Needs Update (request update) | [ ] |
| Needs Update / Rejected → Under Review (resubmit) | [ ] |
| Overdue / Pending member still pending after partial flow | [ ] |
| Mess day proof → appears in owner Pending Review | [ ] |

---

## 5. UX consistency

Layout pattern on owner Payments:

`Month nav → Summary cards → Tabs → Filters → Paginated list → Detail`

- [ ] Owner / Manager match this pattern
- [ ] Filter chips / drawer do not wipe Summary
- [ ] Initial failure → full-page error
- [ ] Background failure → keep data + inline retry
- [ ] Never replace successful content with empty state on soft refresh

---

## 6. Cross-role testing

- [ ] Owner
- [ ] Manager
- [ ] Tenant
- [ ] Customer (mess/customer rail if applicable)

---

## 7. Cross-space testing

- [ ] PG
- [ ] Mess
- [ ] Hostel
- [ ] Rental
- [ ] Co-Living

Payment types exercised:

- [ ] Rent
- [ ] Meal day / MEAL space payment
- [ ] Subscription-related charges (if present)
- [ ] Deposit (if present)

---

## 8. Regression checklist

- [ ] Approval workflow unchanged
- [ ] Request Update flow unchanged
- [ ] Timeline events unchanged
- [ ] Notifications still fire
- [ ] Pending Actions counts still move
- [ ] Permissions unchanged
- [ ] Accounting / expected formulas unchanged (`buildLedger` still SoT for snapshot rebuild)
- [ ] Legacy `/owner-month` still works for old clients (`sync=false` by default)
- [ ] No infinite reload / duplicate in-flight storms on open
- [ ] Network error does not trigger legacy sync cascading fallbacks (404-only legacy)

---

## 9. Production readiness

These are the conditions users hit in production. Certify on a device/build with network tooling (Chrome DevTools / Flipper / Charles), not only happy-path office Wi‑Fi.

- [ ] No console errors (app JS + Metro; review RN logs during open, tab switch, month change, approve)
- [ ] No API retries looping (failed calls retry at most once with backoff — never an infinite storm)
- [ ] No memory leaks (open/close Payments + Detail repeatedly; heap/session stable)
- [ ] No duplicate requests (Network panel: open = Summary + active tab only; no parallel identical GETs)
- [ ] No race conditions (rapid tab switches / month changes keep last intentional request; UI matches latest)
- [ ] Offline / network failure handling (airplane mode → full-page or inline error; restore → recovery without wipe)
- [ ] Slow network (3G simulation) — Summary still appears first; lists do not block KPIs; no timeout cascades into legacy sync
- [ ] Refresh during mutation (pull-to-refresh or focus reload while Approve / Submit Proof in flight — no double apply / stuck spinner)
- [ ] Month switching while loading (change month mid-flight; previous month response must not overwrite new month UI)
- [ ] Concurrent approvals (two owners/managers or rapid double-tap Approve — one outcome, counts stay consistent, no ghost cards)

---

## Remaining technical debt (acceptable at freeze)

Documented debt may ship under **v1.0 Certified** only if listed here and accepted at sign-off. Do not add new Payment features to “work around” debt — file follow-ups after freeze.

| Item | Notes |
|------|--------|
| First open of a month without snapshot | `ensureMonth` materializes once (ledger cost once, not every open) |
| Tenant / day-meal lists | Still month blob + client filter (acceptable for single-member scope) |
| Dashboard financial KPI | May still call `buildLedger` until dashboard adopts summary snapshot |
| Prepaid pack sales outside payment mutations | May need explicit snapshot refresh hook if prepaid KPIs lag |
| Legacy hooks | `useOwnerPaymentsMonth`, `usePaymentReview` deprecated — keep until zero references |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering | | | |
| QA / Product | | | |

**Freeze rule**

- [ ] Checklist **100% green** (sections 1–9 + architecture rules)
- [ ] Payment module frozen — no further Payment code until a post-v1.0 defect or approved exception
- [ ] Marked **v1.0 Certified** (update Status at top of this file)
- [ ] Complaints may start only after this freeze, using Payments as the Summary → List → Detail blueprint

---

## Template for future modules

Copy this file to `docs/<module>-certification.md` and replace Payments-specific APIs with:

1. Summary API  
2. Paginated list API(s)  
3. Detail API  
4. Mutations + explicit sync/rebuild if needed  

Keep the same loading, cache, verification, and **Production readiness** sections.
