# Payment Stability — Root Cause Report

**Date:** 2026-07-14  
**Context:** Certification Mode — Test Mess 1 · Baner · July 2026 · 3G simulation  
**Status:** Root cause identified; stabilizing fixes applied. **Not certified.**

---

## Observed symptoms (from device logs)

1. `/payments/summary` → **Network Error** (no HTTP status)
2. `/payments/members` identical params fired **3×**, then Network Error
3. `/dashboard-summary` and `/meal-polls` later Network Error while some Meal APIs still 200
4. Backend was healthy at boot (auth, spaces, notifications, pending-actions 200)

---

## Root cause (verified)

### A. Frontend — triplicate `/payments/members` (confirmed)

`usePaymentsMembers` registered **three** `useEffect`s that all called `load(0)` on mount:

| Effect | Trigger on mount |
|--------|------------------|
| `[enabled, load, month]` | Immediate fetch |
| `[search]` (300ms debounce) | Second fetch |
| `[filters.preset, filters.sort, filters.statuses]` | Third fetch |

Logs match: three identical `page=0&size=20&sort=due_desc` requests.

Additionally, **Summary and Members started in parallel**, so cold snapshot materialization could race.

### B. Backend — GET stampede of full ledger rebuild (confirmed)

Both `GET /payments/summary` and `GET /payments/members` called `snapshotService.ensureMonth()`.

On a **missing** `space_payment_month_summary` row (common after deploy / first month open):

```
ensureMonth → rebuildMonth → spaceBillingService.buildLedger
```

For **MESS + PAY_PER_MEAL**, `buildLedger` runs **per-member** meal activity (heavy).  
Hikari pool in `application-dev.yml`: **`maximum-pool-size: 10`**.

So on open:

```
1× summary ensureMonth rebuild  +  3× members ensureMonth rebuild
= up to 4 concurrent full Mess ledgers
```

Each holds a request thread + DB connections for a long time → pool/thread starvation → **Axios Network Error** (timeout / connection drop) on Payments, then Dashboard / Meals.

This is **not** “Payments UI copy is wrong”; it is **overload from write-heavy materialization on GET**, amplified by duplicate FE calls.

### C. Error UX note

“Payments unavailable / Could not reach Acomi” maps to `payments.errors.network` — correct for transport failure caused by the overload above, not a 404 service-missing case.

---

## Fixes applied (stability only)

| Change | Purpose |
|--------|---------|
| `usePaymentsMembers` — skip search/filter effects on first mount | **1** members request on open |
| `PaymentsScreen` — gate list hooks until `!summary.loading` | Summary settles first; then one list call |
| `getMembers` — **read-only**, no `ensureMonth` | No parallel rebuilds from list API |
| `ensureMonth` / `rebuildMonth` — per `spaceId\|month` lock + timing logs | Single rebuild if summary still materializes |

---

## Lifecycle (after fix)

```
Open Payments
→ GET /summary  (ensureMonth once if snapshot missing; may be slow cold)
→ then GET /members  (pure read from snapshot; fast if row exists)
```

Pull-to-refresh still `POST /sync` → rebuild snapshot → reload.

---

## How to verify (you)

1. Restart backend (so code + locks load). Reload app.
2. Open Payments on Test Mess 1.
3. Network log must show:
   - **1×** `payments/summary`
   - **1×** `payments/members` (after summary returns)
4. Backend log should show at most **one** `payment_snapshot_rebuild_start` per space/month, then `payments_*_done` with `durationMs`.
5. Dashboard / meal-polls should stay reachable while summary cold-rebuild runs (list no longer multiplies rebuild).

**Cold first open** can still take many seconds for Mess (one `buildLedger`). Prefer pull-to-refresh after deploy if needed. Warm opens should be fast snapshot reads.

---

## Remaining risk (not fixed in this pass)

| Risk | Notes |
|------|--------|
| Cold `ensureMonth` on summary still expensive for Mess | Single rebuild OK; consider moving materialize fully to `POST /sync` only if cold GET still times out under 3G |
| Dashboard may still call full `buildLedger` | Can compete for same pool — separate from Payments stampede |
| Certification blocked until device re-check | Duplicate-request + stability items in §9 |

---

## Certification impact

**Do not certify.** Re-run production-readiness checks after restart:

- [ ] No duplicate members requests  
- [ ] Summary + members succeed on warm path  
- [ ] No cascade Network Error on Dashboard/Meals while opening Payments  

Update `docs/payment-certification-report.md` after your device pass.
