# Desktop Improvements

Enhancements that are **only possible or primarily valuable on desktop**.  
**Do not change business workflows, validations, permissions, or terminology.**

---

## Principles

1. Same steps, same required fields, same API payloads.  
2. Improvements increase **speed, density, and visibility** — not alternate business paths.  
3. Hide advanced density features on narrow viewports rather than inventing mobile-only logic.

---

## 1. Layout & chrome

| Improvement | Benefit | Modules |
|-------------|---------|---------|
| **Pinned left sidebar** | Persistent module access | All space modules |
| **Resizable panels** | Customize list vs detail width | Members, Payments, Accommodation, Inventory |
| **Split pane layouts** | Keep list context while editing | Members, Complaints, Inventory, Payments review |
| **Right-side inspector** | Act without leaving list | Payments proof, Complaint detail, Bed summary |
| **Multi-column dashboards** | See meals + finance + occupancy at once | Dashboard |
| **Sticky toolbars** | Search/filters/actions always available | All lists |
| **Persistent filters** | Filters survive navigation (query + local prefs) | Members, Payments, Beds, Inventory |
| **Breadcrumb trails** | Hierarchy orientation | Accommodation, nested meal routes |

---

## 2. Data density

| Improvement | Benefit | Modules |
|-------------|---------|---------|
| **Large data tables** | Sort, column resize, dense rows | Members, Payments, Inventory, Complaints, Transactions |
| **Column chooser** | Operators customize fields | Members, Inventory, Payments |
| **Inline status chips in tables** | Scan without opening detail | All list modules |
| **Frozen header + first column** | Navigate wide ledgers | Payments, Inventory |
| **Virtualized long lists** | Performance at scale | Beds, members, transactions |

---

## 3. Selection & bulk (same APIs, batched UX)

| Improvement | Benefit | Constraint |
|-------------|---------|------------|
| **Multi-select rows** | Batch obvious ops | Only where API already supports bulk or safe sequential calls |
| **Bulk approve/reject payments** | Faster review queue | Same `reviewPayment` rules per item |
| **Bulk invite / import confirm** | Faster onboarding | Same invitation/import APIs |
| **Bulk stock adjust (future)** | Inventory ops | Only with existing `stockMove` semantics |
| **Bulk bed status filter actions** | Occupancy ops entry | Still opens same wizard modes per target or existing bulk endpoints |

Use existing bulk endpoints where mobile already has them (`bulkCreateBeds/Rooms/Units`, etc.). Do not invent new business rules for bulk rent changes, etc.

---

## 4. Keyboard & mouse

| Improvement | Benefit |
|-------------|---------|
| **Keyboard shortcuts** | `g d` dashboard, `g m` members, `/` focus search, `Esc` close drawer, `Enter` confirm |
| **Arrow-key table navigation** | Fast scanning |
| **Focus rings & skip links** | Accessibility |
| **Context menus (right-click)** | Same actions as overflow menus |
| **Hover affordances** | Reveal secondary actions without clutter |
| **Drag & drop** | Reorder delivery locations; optional menu library organize; builder rearrange **only if** APIs already support order (`reorder` exists for delivery locations) |

---

## 5. Accommodation-specific

| Improvement | Benefit |
|-------------|---------|
| Hierarchy **tree navigator** | Jump levels without stack thrash |
| **Floor plan canvas** (zoom/pan) | Visual ops on large monitors |
| Side-by-side **list + plan** | Toggle without losing place |
| Wider **bulk create** modals** | See preview counts |
| Builder **multi-panel** editor | Structure tree \| preview \| properties |

---

## 6. Meals-specific

| Improvement | Benefit |
|-------------|---------|
| **Calendar + editor split** | Plan week contextually |
| Headcount **always-visible panel** | Ops during service |
| Library as **catalog table** | Faster CRUD |
| Multi-slot preview on one screen | Morning briefing |

---

## 7. Payments-specific

| Improvement | Benefit |
|-------------|---------|
| Proof image **side-by-side with metadata** | Faster review |
| Month KPI strip + table | No scroll hunting |
| Export CSV for month ledger | Accounting handoff (read-only export of existing data) |
| Multi-select review | Same per-payment decisions |

---

## 8. Members & occupancy

| Improvement | Benefit |
|-------------|---------|
| Member **inspector** with tabs | Stay in directory |
| Occupancy wizard **context column** (bed, member, mode) always visible | Fewer mistakes |
| Target picker as **searchable table** | Faster than modal lists |

---

## 9. Inventory-specific

| Improvement | Benefit |
|-------------|---------|
| **DataGrid** with stock status filters | Warehouse density |
| Stock move dialog with keyboard qty | Fast adjustments |
| Transactions ledger with date range | Audit |
| Low-stock widget on dashboard | Proactive ops |

---

## 10. Cross-space / reports (presentation only)

| Improvement | Benefit |
|-------------|---------|
| Global attention **grouped table** | Multi-property operators |
| Print-friendly report views | Desk workflows |
| Optional **Reports** module later | Aggregate existing APIs — no workflow change |

---

## 11. Explicitly out of scope (do not do)

- Alternate occupancy flows that skip review/contract validation  
- Softening permission checks for “power users”  
- Web-only payment states or complaint statuses  
- Redesigning CountIn visual identity  
- Replacing OTP auth with a different auth product without backend support  

---

## 12. Priority for desktop enhancements

| Priority | Enhancements |
|----------|--------------|
| P0 | Sidebar, tables for core lists, master-detail, persistent filters, inspector for payments |
| P1 | Accommodation tree + split, keyboard shortcuts, resizable panels |
| P2 | Bulk review, DnD where API supports, exports, floor plan zoom |
| P3 | Reports module, advanced column prefs, sparklines |

Related: [responsive-strategy.md](./responsive-strategy.md), [desktop-wireframes.md](./desktop-wireframes.md).
