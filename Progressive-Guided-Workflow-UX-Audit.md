# Amico Progressive Guided Workflow — UX Audit



**Status:** Progressive Guided Workflow initiative **COMPLETE** (Phases 3–5) · 2026-07-25  

**Lifecycle note:** Coachmarks shipped as Lifecycle Phase 4 (separate track) — Progressive WF screens/components unchanged.  

**Date:** 2026-07-24 (audit) · updated 2026-07-25  

**Audience:** Product, design, engineering  

**Related:** `docs/meals-phase-5.2-menu-planning.md` (Progressive Meal Planning Flow), `Space-Onboarding-And-Lifecycle-Design.md`, Dashboard Design System  



---



## Implementation status



### Phase 3 — High Priority ✅



| Item | Status | Notes |

|------|--------|-------|

| Daily Menu Edit (Extras) | ✅ | Shared `useProgressiveSectionReview` + `ProgressiveMealPlanningFooter` |

| Shared primitives | ✅ | `ProgressiveWorkflowFooter`, `useProgressiveSectionReview`, `resolveProgressivePhase` |

| Occupancy Wizard — Contract | ✅ | Sticky Continue + intra-step Continue → deposit/amenities |

| Hierarchy Occupancy Modal — Contract | ✅ | Same progressive contract review |

| Add / Edit Member (Mess) | ✅ | Progressive footer when meal billing/access sections exist |

| Menu Share Preview | ✅ | Slots → review message/recipients → Share |

| Quick Setup Preview / Generate | ✅ | Sticky Back/Next/Generate |

| Edit Space | ✅ | Section chips + sticky Save |



### Phase 4 — Medium Priority ✅



| Item | Status | Notes |

|------|--------|-------|

| Create Space | ✅ | Sticky Create; amenities progressive when applicable |

| Raise Complaint | ✅ | Sticky Submit; Continue → photos |

| Payment Detail | ✅ | Sticky operator / pay actions |

| Complaint Detail | ✅ | Sticky operator actions |

| Hierarchy create forms | ✅ | Sticky Save; `PricingAfterCreateHint` on Unit/Room/Bed create |



### Phase 5 — Polish & remaining backlog ✅



| Item | Status | Notes |

|------|--------|-------|

| Customer Subscription Request | ✅ | Plan → Continue to payment details → Submit (`CustomerSubscriptionPlansScreen`) |

| Complete Profile | ✅ | Sticky Next / Back / Submit (existing 4-step wizard unchanged) |

| Sticky footer consistency | ✅ | Shared `stickyBarChrome` + safe-area `useStickyBarPaddingBottom`; all sticky bars via `StickyFormActions` or `ProgressiveWorkflowFooter` |

| Progressive footer consistency | ✅ | Same Continue / highlight / animation / scroll-detection primitives |

| PricingAfterCreateHint wording | ✅ | Clarified “set rent after you save” |

| Empty state (subscription catalog) | ✅ | Business-oriented no-plans copy + icon |

| Keyboard / a11y | ✅ | Safe-area footers; dismiss-on-drag; a11y labels on profile wizard CTAs |



**Shared primitives (final):**



- `ProgressiveWorkflowFooter`

- `StickyFormActions` (`stack` | `row`, `footerExtra`)

- `useProgressiveSectionReview`

- `resolveProgressivePhase`

- `stickyBarChrome` / `useStickyBarPaddingBottom`

- `PricingAfterCreateHint`

- `BusinessProgressStepper` (unchanged; no second stepper)



**Backend:** No API/DTO changes across Phases 3–5 (frontend-only).



**Out of scope (Lifecycle roadmap — not Progressive WF):** Coachmarks, Health Score, new lifecycle states, enterprise.



**Manual test guides:** § Phase 3, § Phase 4, § Phase 5 below.



## Executive summary



Amico has many **long, multi-section screens** where the final action (Save, Share, Create, Submit, Continue) appears before the owner has naturally reviewed later sections. Menu Planning exposed this clearly: owners selected meals and tapped Share before noticing Extras.



This audit maps form and workflow screens across accommodation, occupancy, members, meals, payments, complaints, and space settings. It recommends where to adopt a shared **Progressive Guided Workflow** pattern—and where to leave screens alone.



### Top findings



| Priority | Screens / flows | Core issue |

|----------|-----------------|------------|

| **High** | Daily Menu Edit (Extras) — *already shipped*; Occupancy **Contract** step; **Add / Edit Member**; **Edit Space**; **Menu Share Preview**; Quick Setup **preview → Generate** | Final CTA before important optional/contextual sections |

| **Medium** | Raise Complaint; Customer subscription request; Payment detail actions; Create Space; Meal combo form quantities; Hierarchy create forms (pricing on edit only) | Below-fold optional fields or mid-scroll actions |

| **Low** | Short CRUD forms; list hubs; sticky-sheet forms that already pin CTA; true wizards with short steps | Sequence already clear or risk low |



### Guiding principle



> Guide the **business process**, not the form fields.  

> Ask: *“What would a first-time owner naturally do next?”*



No popups. No forced validation of optional sections. Same page where possible. Reuse Dashboard Design System + Lifecycle patterns.



---



## Pattern definition (reference)



**Progressive Guided Workflow**



Instead of exposing the final action immediately after the first section is complete, the sticky (or clearly next) CTA advances the user through logical stages:



```

Section A complete

        ↓

Review Section B (optional or contextual)

        ↓

Save / Share / Submit

```



The UI teaches the workflow. Optional sections remain optional—**seeing** them is enough.



**Already implemented (reference):** Mess `DailyMenuEditScreen` + `ProgressiveMealPlanningFooter`  

(`select` → `review_extras` → `ready`).



---



## How this audit was done



1. Inventory of `src/screens/**` and major occupancy/meal form components.  

2. Classification: scrollable, multi-section, always-visible final CTA, below-fold optional content.  

3. First-time owner confusion heuristics (missed sections, premature final action, hidden knowledge).  

4. Recommendation: Keep / Progressive Footer / Stepper / Inline Next / Sticky section nav / Collapsible / Smart empty / Business workflow.  

5. Complexity, impact, backend need, reusability.



**Out of scope for progressive footer:** pure lists, dashboards, auth OTP, read-only detail browsers (unless they embed a long action form).



---



# Part 1 — Screen-by-screen audit



## 1. Meals



### 1.1 Daily Menu Edit (Plan Breakfast / Lunch / …)



| Field | Detail |

|-------|--------|

| **Screen** | `DailyMenuEditScreen` |

| **Current workflow** | Select combos/items → (Extras) → Notes → sticky Save Draft / Share |

| **Confusion points** | Extras below fold; Save/Share visible as soon as meals selected |

| **Why** | Single long page; Extras feel secondary; Share is emotionally “done” |

| **Proposed workflow** | Meals → Review Extras (optional) → Save/Share |

| **UI pattern** | **Progressive Footer** (implemented) |

| **Complexity** | Low–Medium (done) |

| **User impact** | High |

| **Backend** | No |

| **Reusable** | Yes — `ProgressiveMealPlanningFooter` is the reference |



**Recommendation:** Keep / polish; use as the **canonical pattern** for other screens.



---



### 1.2 Menu Planning Hub



| Field | Detail |

|-------|--------|

| **Screen** | `MenuPlanningScreen` |

| **Current workflow** | Pick date → slot cards → edit / share / poll |

| **Confusion points** | Share from hub without editing; enroll banner easy to ignore |

| **Why** | Hub mixes overview + deep actions |

| **Proposed** | Soft guidance (banner / next action) already partly lifecycle-driven |

| **UI pattern** | **Smart Empty States** + lifecycle CTA; Keep sticky share on overview |

| **Complexity** | Low |

| **Impact** | Medium |

| **Backend** | No |



**Recommendation:** **Keep As Is** for footer; improve empty/enroll messaging only if needed.



---



### 1.3 Menu Share Preview



| Field | Detail |

|-------|--------|

| **Screen** | `MenuSharePreviewScreen` |

| **Current workflow** | Select slots → optional other spaces → message → Share |

| **Confusion points** | Other spaces + message below fold; Share early |

| **Why** | Scroll-end primary CTA |

| **Proposed** | Slots confirmed → Review recipients/message → Share |

| **UI pattern** | **Progressive Footer** or **Inline Next Step** |

| **Complexity** | Medium |

| **Impact** | High (wrong-space share / incomplete message) |

| **Backend** | No |



**Recommendation:** **High Priority** — Progressive Footer.



---



### 1.4 Menu Library



| Field | Detail |

|-------|--------|

| **Screen** | `MenuLibraryScreen` |

| **Current workflow** | Tabs Items / Combos / Extras; inline edits |

| **Confusion points** | Catalog incomplete before planning (business, not footer) |

| **Proposed** | Lifecycle / empty states (“Add items → Create combo → Mark extras”) |

| **UI pattern** | **Smart Empty States** + Business Progress (dashboard already covers setup) |

| **Complexity** | Low |

| **Impact** | Medium |

| **Backend** | No |



**Recommendation:** **Keep As Is** for progressive footer; strengthen empty/next-step copy.



---



### 1.5 Create / Edit Combo



| Field | Detail |

|-------|--------|

| **Screen** | `MealComboFormScreen`, `CreateComboSheet` |

| **Current workflow** | Name/price → items → quantities → sticky Save |

| **Confusion points** | Quantities below fold |

| **Why** | Long picker |

| **Proposed** | Sticky review already helps; optional “Continue to quantities” only if qty required |

| **UI pattern** | **Keep As Is** (sticky Save + review bar) or light **Inline Next** if qty becomes required |

| **Complexity** | Low |

| **Impact** | Low–Medium |

| **Backend** | No |



**Recommendation:** **Keep As Is**.



---



### 1.6 Meal Delivery Locations



| Field | Detail |

|-------|--------|

| **Screen** | `MealDeliveryLocationsScreen` |

| **Current workflow** | Inline add + list + edit modal |

| **Confusion** | Low |

| **UI pattern** | Keep |

| **Complexity** | — |

| **Impact** | Low |



**Recommendation:** **Keep As Is**.



---



### 1.7 Meal Poll Response (customer)



| Field | Detail |

|-------|--------|

| **Screen** | `MealPollResponseScreen` |

| **Current workflow** | Choices (+ delivery) → sticky Submit → optional payment step |

| **Confusion** | Multi-meal; payment second step already progressive |

| **UI pattern** | Keep sticky submit; already stepped for payment |

| **Impact** | Medium (mitigated) |



**Recommendation:** **Keep As Is**.



---



### 1.8 Customer Subscription Plans



| Field | Detail |

|-------|--------|

| **Screen** | `CustomerSubscriptionPlansScreen` |

| **Current workflow** | Select plan → proof/ref/notes → Submit in scroll |

| **Confusion points** | Request fields only after select, below fold |

| **Proposed** | Plan selected → Continue to payment details → Submit |

| **UI pattern** | **Progressive Footer** or sheet step |

| **Complexity** | Medium |

| **Impact** | Medium–High |

| **Backend** | No |



**Recommendation:** **Medium Priority**.



---



### 1.9 Owner Subscription Plans / Member Subscription



| Field | Detail |

|-------|--------|

| **Screens** | `SubscriptionPlansScreen`, sheets, `MemberSubscriptionScreen` |

| **Notes** | Sheet footers already pin Save; member screen Save in scroll |

| **Recommendation** | Keep sheets; optional sticky Save on `MemberSubscriptionScreen` (**Low**) |



---



## 2. Members / customers



### 2.1 Add Customers Hub



| Field | Detail |

|-------|--------|

| **Screen** | `AddCustomersHubScreen` |

| **Current workflow** | Guided cards + BusinessProgressStepper → Add / Import |

| **Confusion** | Low for a hub |

| **UI pattern** | Already business-driven |

| **Recommendation** | **Keep As Is** |



---



### 2.2 Add Member / Edit Member



| Field | Detail |

|-------|--------|

| **Screens** | `AddMemberScreen`, `EditMemberScreen` |

| **Current workflow** | Role → identity/import → meal billing → subscription → gender → meal access → Save/Cancel **in scroll** |

| **Confusion points** | Billing, subscription, meal access below fold; Save early on short viewports after name/mobile |

| **Why** | One mega-form; Mess adds more sections |

| **Proposed** | Identity → Meal access / billing (Mess) → Optional subscription → Save |

| **UI pattern** | **Progressive Footer** (Mess) or **Collapsible Sections** + sticky Save; Lodging can stay shorter |

| **Complexity** | Medium–High |

| **Impact** | **High** |

| **Backend** | No |

| **Reusable** | Yes — same footer primitive as meals |



**Recommendation:** **High Priority** (especially Mess).



---



### 2.3 Import Existing People / Invite Member



| Field | Detail |

|-------|--------|

| **Screens** | `ImportExistingPeopleScreen`, `InviteMemberScreen` |

| **Notes** | Per-row Add / short invite form |

| **Recommendation** | **Keep As Is** |



---



## 3. Accommodation



### 3.1 Quick Setup Wizard



| Field | Detail |

|-------|--------|

| **Screen** | `QuickSetupWizardScreen` |

| **Current workflow** | Building → Structure → Rooms → Preview → Generate (**in scroll**) |

| **Confusion points** | Generate buried under tall preview tree; layout chosen early and forgotten |

| **Why** | Preview step can be very tall; actions scroll away |

| **Proposed** | Sticky footer: Back / Next / Generate; on preview, “Review structure → Generate” |

| **UI pattern** | **Progressive Stepper** (exists) + **sticky footer** on all steps |

| **Complexity** | Medium |

| **Impact** | **High** |

| **Backend** | No |



**Recommendation:** **High Priority** — sticky CTA on wizard (not new steps).



---



### 3.2 Hierarchy CRUD (Building / Floor / Unit / Room / Bed forms)



| Field | Detail |

|-------|--------|

| **Screens** | `BuildingFormScreen`, `FloorFormScreen`, `UnitFormScreen`, `RoomFormScreen`, `BedFormScreen` |

| **Current workflow** | Short fields → Save in scroll |

| **Confusion points** | Building layout mode skimmed; **rent/deposit only on edit** for unit/room/bed |

| **Proposed** | Sticky Save (minor); product decision: offer pricing on create OR post-create empty state “Set default rent” |

| **UI pattern** | Sticky Save (**Low**); pricing via **Smart Empty States** on detail (**Medium** business fix) |

| **Complexity** | Low–Medium |

| **Impact** | Medium (pricing gap is product, not progressive footer) |

| **Backend** | Only if create API should accept rent (optional later) |



**Recommendation:** **Medium** for sticky Save + pricing empty state; not full progressive multi-stage unless forms grow.



---



### 3.3 Builder / list / detail screens



| Field | Detail |

|-------|--------|

| **Screens** | Accommodation home, builder, floors/units/rooms/beds lists, details |

| **Notes** | Launchers, not long save forms |

| **Recommendation** | **Keep As Is** |



---



## 4. Occupancy



### 4.1 Occupancy Wizard (Move In / Out / Transfer / Reserve / Allocate)



| Field | Detail |

|-------|--------|

| **Screen** | `OccupancyWizardScreen` + steps |

| **Current workflow** | Dynamic steps → Continue → Review → Submit; Continue often **in scroll** |

| **Confusion points** | **ContractTermsStep** packs rent, food, deposit, other charges, amenities; Continue scrolls off |

| **Why** | Longest step; amenities after form |

| **Proposed** | Within contract: Rent → Deposit & charges → Food & amenities → Continue; sticky Continue always |

| **UI pattern** | Existing **Stepper** + **sticky Continue** + optional **inline next** inside contract |

| **Complexity** | Medium–High |

| **Impact** | **High** |

| **Backend** | No |



**Recommendation:** **High Priority**.



---



### 4.2 Hierarchy Occupancy Picker Modal



| Field | Detail |

|-------|--------|

| **Component** | `HierarchyOccupancyPickerModal` |

| **Notes** | Already has **sticky Continue/Allocate**; same contract miss risk |

| **Recommendation** | Align contract sub-flow with Occupancy Wizard; **Keep** sticky footer |



---



### 4.3 Legacy MoveInModal



| Field | Detail |

|-------|--------|

| **Notes** | Unused / replaced by wizard |

| **Recommendation** | Exclude from roadmap; document as retired |



---



## 5. Payments



### 5.1 Day-meal bulk pay / proof



| Field | Detail |

|-------|--------|

| **Screens / components** | `DayMealPaymentsPanel` + bulk footer; `DayMealBulkPayScreen`; `UniversalPaymentProofModal` |

| **Notes** | Select → sticky Pay; proof form in modal/inline |

| **Recommendation** | **Keep As Is** (already progressive enough) |



---



### 5.2 Payment Detail (owner review)



| Field | Detail |

|-------|--------|

| **Screen** | `PaymentDetailScreen` |

| **Current workflow** | Summary → approve / needs update / reject / proof mid-scroll |

| **Confusion** | Actions not sticky |

| **Proposed** | Sticky action bar when status needs decision |

| **UI pattern** | Sticky actions (**not** multi-stage progressive) |

| **Complexity** | Low |

| **Impact** | Medium |



**Recommendation:** **Medium Priority** — sticky decision footer.



---



### 5.3 Payments hub / history / tenant tab



| Field | Detail |

|-------|--------|

| **Recommendation** | **Keep As Is** (list/review patterns) |



---



## 6. Complaints



### 6.1 Raise Complaint



| Field | Detail |

|-------|--------|

| **Screen** | `RaiseComplaintScreen` |

| **Current workflow** | Category → priority → title → description → meal fields → photos → Submit in scroll |

| **Confusion points** | Photos / meal context below fold |

| **Proposed** | Details → Attachments → Submit; sticky Submit |

| **UI pattern** | Sticky Submit + optional **Inline Next** to photos |

| **Complexity** | Low–Medium |

| **Impact** | Medium |

| **Backend** | No |



**Recommendation:** **Medium Priority**.



---



### 6.2 Complaint Detail



| Field | Detail |

|-------|--------|

| **Screen** | `ComplaintDetailScreen` |

| **Notes** | Operator actions deep in scroll |

| **Proposed** | Sticky operator action bar when actionable |

| **UI pattern** | Sticky actions |

| **Impact** | Medium |



**Recommendation:** **Medium Priority** (sticky actions, not progressive stages).



---



## 7. Space / settings / profile



### 7.1 Create Space



| Field | Detail |

|-------|--------|

| **Screen** | `CreateSpaceScreen` |

| **Current workflow** | Type → name → category → address → contact → amenities → Save in scroll |

| **Confusion** | Amenities below fold |

| **Proposed** | Essentials → Amenities (optional) → Create; sticky Create |

| **UI pattern** | **Progressive Footer** or sticky Create |

| **Complexity** | Low–Medium |

| **Impact** | Medium |

| **Backend** | No |



**Recommendation:** **Medium Priority**.



---



### 7.2 Edit Space



| Field | Detail |

|-------|--------|

| **Screen** | `EditSpaceScreen` |

| **Current workflow** | Identity + amenities + **MealBillingSettings** + **PollClosingDefaults** + one Save |

| **Confusion points** | Mess billing & poll defaults far below; Save once for unrelated domains |

| **Why** | Settings dump on one page |

| **Proposed** | Section nav: General → Meals & billing → Polls → Save; or split routes |

| **UI pattern** | **Sticky Section Navigation** + sticky Save, or **Collapsible Sections** |

| **Complexity** | Medium–High |

| **Impact** | **High** (wrong billing defaults) |

| **Backend** | No (split routes optional) |



**Recommendation:** **High Priority**.



---



### 7.3 Complete Profile



| Field | Detail |

|-------|--------|

| **Screen** | `CompleteProfileScreen` |

| **Notes** | Already 4-step wizard; footer in scroll |

| **Proposed** | Sticky Next/Submit only |

| **UI pattern** | Keep stepper; add sticky footer |

| **Impact** | Low–Medium |



**Recommendation:** **Low Priority** polish.



---



### 7.4 Profile / Permissions



| Field | Detail |

|-------|--------|

| **Notes** | Profile navigates out to Complete Profile; no dedicated permissions settings screen |

| **Recommendation** | **Keep As Is** |



---



## 8. Dashboard / lifecycle (not forms, but related)



| Surface | Role | Progressive? |

|---------|------|--------------|

| `DashboardSetupProgressCard` + `BusinessProgressStepper` | Space setup milestones | Already progressive **business** workflow |

| `AddCustomersHub` stepper | Mess customer onboarding | Keep |

| Global attention / pending actions | Ops queues | Keep |



**Recommendation:** Reuse milestone language (“Next step”) in progressive footers for consistency.



---



# Part 2 — Prioritized recommendations



## High priority (adopt Progressive Guided Workflow or sticky stage CTAs)



| # | Screen / flow | Pattern | Why |

|---|---------------|---------|-----|

| 1 | **Daily Menu Edit** | Progressive Footer | Done — reference |

| 2 | **Occupancy Contract step** (+ sticky Continue) | Stepper + sticky / inline next | Food, deposit, amenities missed |

| 3 | **Add / Edit Member** (Mess) | Progressive Footer | Billing / subscription / meal access skipped |

| 4 | **Edit Space** | Sticky section nav + sticky Save | Billing & poll defaults buried |

| 5 | **Menu Share Preview** | Progressive Footer | Recipients/message skipped |

| 6 | **Quick Setup** | Sticky Next/Generate on existing steps | Generate under tall preview |



## Medium priority



| # | Screen / flow | Pattern |

|---|---------------|---------|

| 7 | Raise Complaint | Sticky Submit ± continue to photos |

| 8 | Customer Subscription request | Progressive Footer / sheet step |

| 9 | Payment Detail / Complaint Detail | Sticky decision actions |

| 10 | Create Space | Sticky Create ± amenities as next |

| 11 | Unit/Room/Bed create pricing gap | Smart empty on detail (product) |

| 12 | Building form layout mode | Sticky Save + stronger layout emphasis |



## Low priority / Keep As Is



- Floor form, bulk modals, invite, import list, delivery locations, menu library tabs, combo sticky save, poll response (already sticky), day-meal bulk pay, list hubs, auth, read-only details, dashboard lists.



---



# Part 3 — Reusable design pattern proposal



## Amico Progressive Guided Workflow (shared UX pattern)



### When to use



Use when **all** of the following are true:



1. One screen (or modal) has **≥2 logical sections** for one business outcome.  

2. A **final** action exists (Save, Share, Create, Submit, Generate, Allocate).  

3. Later sections are **important or easy to miss** (optional extras, billing, recipients, contract add-ons).  

4. First-time owners benefit from a clear **next step**.  

5. Popups would feel interruptive (prefer page-native guidance).



### When **not** to use



- Short single-purpose forms (Invite, Floor name).  

- Pure lists / hubs without a multi-section form.  

- Flows that are **already** clear multi-step wizards with short steps (unless only sticky CTA is missing).  

- Destructive confirms that **should** use an explicit dialog.  

- When every field is required and visible without scrolling on common phones.



### UX principles



1. **Business sequence over form fields.**  

2. **One primary CTA** at a time.  

3. **Optional ≠ invisible** — guide review, don’t force selection.  

4. **Manual scroll counts** — don’t force “Continue”.  

5. **Same page** preferred; steppers only when sections are large or mutually exclusive.  

6. **Stable footer height** — avoid layout jump.  

7. **Experienced users** — skip gates when editing an existing complete draft / returning mid-flow.  

8. **No new APIs** for guidance — local UI state only.  

9. **Reuse Dashboard Design System** — colors, type, buttons, amber highlight, `LayoutAnimation`.



### Suggested reusable components



| Component | Role |

|-----------|------|

| `ProgressiveWorkflowFooter` | Generalize `ProgressiveMealPlanningFooter`: phases, progress line, Continue vs final actions |

| `useProgressiveSectionReview` | Track `reviewed`, visibility via scroll, interact callbacks, highlight timer |

| `SectionHighlight` | Amber border/background flash (DashboardActionRow tokens) |

| `ProgressiveStepChrome` | Optional “Step N of M · ✓ A · Next B” caption |

| Existing | `BusinessProgressStepper`, Occupancy step header, sheet footers |



### Footer behavior



| Phase | Footer content |

|-------|----------------|

| Empty / start | Final actions disabled **or** hidden per product; match current empty state |

| Mid sections incomplete (unreviewed) | **Continue to {Next section} ↓** only |

| All guided sections reviewed | Delete (if any) + Save / Share / Submit |



Detection of “reviewed”:



- Continue tap (smooth scroll + highlight), or  

- Section ≥ ~35% visible after user scroll, or  

- Scroll past section, or  

- Interact with controls in section.



### Stepper behavior



- Prefer **existing** wizards (Quick Setup, Occupancy, Complete Profile).  

- Progressive footer **composes with** steppers: sticky Continue on each step; progressive **intra-step** only when a step itself is long (Contract).



### Section navigation (settings-style)



For Edit Space–class screens:



```

[ General ] [ Meals ] [ Polls ]

```



Sticky Save applies to current tab or whole form (product choice). Prefer tabs/segments from existing chip/tab patterns.



### Animations



- `LayoutAnimation.easeInEaseOut` on phase change.  

- Short opacity fade on footer body.  

- 1s highlight on target section.  

- Avoid Reanimated unless already required.



### Accessibility



- Announce “Next step: {section}”.  

- Continue and final actions keyboard/focus reachable.  

- Don’t rely on color alone for progress (include text “Step 1 of 2”).  

- Screen reader: section titles as headers.



### Mobile considerations



- Sticky footer above home indicator (`safe area`).  

- Keyboard: keep sticky actions usable or dismiss-on-drag (existing meal pattern).  

- Tablet: same phases; don’t switch to multi-column wizard unless needed.  

- No nested scroll views for detection.



### Analytics (only if already present)



Optional events: `progressive_continue`, `section_reviewed`, `section_skipped`, `final_action_after_review`. Do not add a new analytics framework.



---



## Implementation roadmap (suggestion only)



| Phase | Scope | Outcome |

|-------|--------|---------|

| **0** | Document + extract `ProgressiveWorkflowFooter` from meals | Shared primitive |

| **1** | Menu Share Preview; Quick Setup sticky CTAs | Fast wins |

| **2** | Occupancy contract sticky + sub-stages; Add Member (Mess) | Highest miss risk |

| **3** | Edit Space section nav; Create Space sticky; Raise Complaint sticky | Settings / intake |

| **4** | Payment/Complaint detail sticky actions; subscription request | Ops polish |



**Constraint for all phases:** no backend/API changes unless a separate product decision (e.g. rent on create).



---



## Final recommendation



1. **Adopt Progressive Guided Workflow as a Amico-wide UX pattern**, documented above, with meals as the reference implementation.  

2. **Do not** apply it to every form—use the When / When not rules.  

3. **Highest ROI next:** Occupancy contract step, Mess Add/Edit Member, Edit Space, Menu Share Preview, Quick Setup sticky Generate.  

4. **Reuse** Dashboard Design A tokens, lifecycle “Next step” language, and a generalized progressive footer hook/component—avoid one-off hacks per screen.  

5. **Success metric:** fewer saves/shares without reviewing contextual sections; no increase in forced friction for returning editors.



---



## Confirmation



- **Progressive Guided Workflow initiative is fully complete** (High + Medium + polish Phase 5).  

- **Lifecycle Phase 4 Coachmarks** completed separately — Progressive WF unchanged.  

- **Lifecycle Phase 5 Health Score** completed as secondary dashboard insight — does not replace Next Step / Pending Actions / Progressive WF.  

- Remaining optional: enterprise portfolio rollup; broader module empty-state expansion.  

- Reuse only (Progressive WF): `ProgressiveWorkflowFooter`, `StickyFormActions`, `useProgressiveSectionReview`, `resolveProgressivePhase`, `PricingAfterCreateHint`, Dashboard tokens, `BusinessProgressStepper`.



---



## Lifecycle Phase 4 — Coachmarks (related, not Progressive WF)



Shipped 2026-07-25. Full detail: `Space-Onboarding-And-Lifecycle-Design.md` § Coachmark Strategy + Phase 4.



| Tour | Landing | Steps |

|------|---------|-------|

| `setup.accommodation.v1` | Accommodation (empty) | Guidance → Continue setup → Property layout |

| `setup.mess.v1` | Dashboard | Next step → Primary CTA → Business progress |



Storage: `@amico/coachmarks/{spaceId}/{tourId}`. Gate: NEW / SETUP_IN_PROGRESS only.



### Manual smoke (coachmarks)



1. New PG empty Accommodation → ≤3 tips → Got it / Skip → restart app → no tips.  

2. New Mess Dashboard setup → ≤3 tips → no tips on READY.  

3. Progressive screens (Menu Edit, Create Space, etc.) behave as before.



---



## Lifecycle Phase 5 — Health Score (related, not Progressive WF)



Shipped 2026-07-25. Detail: `Space-Onboarding-And-Lifecycle-Design.md` § Space Health Score.



| Piece | Path |

|-------|------|

| Engine | `src/spaceLifecycle/health/` |

| Widget | `DashboardSpaceHealthCard` |

| Breakdown | `DashboardSpaceHealthScreen` |



Weights: Setup 50% · Operations 30% · Attention 20%. Secondary only — Progressive WF unchanged.



### Manual smoke (health)



1. New space → empty health copy.  

2. Setup progress → capped score + factors.  

3. Pending actions → Attention deduction explained.  

4. Breakdown opens without changing Next Step / Progressive footers.



---



## Phase 3 manual testing



### Happy path



1. **Menu Share Preview** — Select meal slots → Continue to message → review recipients/message → Share.  

2. **Quick Setup** — Complete steps; on Preview, Generate stays sticky below the tree; hint visible.  

3. **Occupancy Allocate** — Reach Contract → Continue to deposit & amenities → highlight → Continue to Review → Submit.  

4. **Add Member (Mess, Customer)** — Enter identity → Continue to meal settings → Save.  

5. **Edit Space (Mess owner)** — Switch General / Meals & billing / Poll defaults; Save stays sticky; save still persists all dirty domains.



### Edge cases



- Occupancy Transfer **KEEP** rent: still review amenities when present.  

- Add Member non-Mess / non-Customer: no progressive gate (in-scroll Save).  

- Share Preview past date: read-only, no share footer.  

- Edit Space non-owner / non-Mess: fewer tabs; sticky Save remains.



### Regression



- Dashboard lifecycle / Business Progress Stepper unchanged.  

- Daily Menu Edit progressive extras still works.  

- Payments, Members list, Accommodation home navigation unchanged.



---



## Phase 4 manual testing



### Happy path



1. **Create Space** — Fill essentials → (if amenities) Continue → amenities → Create; Create stays sticky with keyboard open.  

2. **Raise Complaint** — Fill title/description → Continue to photos → Submit sticky.  

3. **Payment Detail (owner)** — Approve / Needs update / Reject stay sticky while scrolling timeline.  

4. **Complaint Detail (operator)** — Start / Resolve / Close sticky; comments remain in scroll.  

5. **Create Unit/Room/Bed** — Pricing hint visible; Save sticky; rent fields only on edit.



### Validation / edges



- Create Space without type/name: validation; Create disabled/busy states.  

- Raise Complaint empty title: error; Submit still sticky.  

- Payment Detail non-actionable status: no sticky bar.  

- Complaint Detail tenant view: no operator sticky actions (unless reopen).  

- Hierarchy Building create: layout mode in scroll; Save sticky.



### Regression (Phase 3 + lifecycle)



- Lifecycle Engine / Dashboard / Business Progress Stepper unchanged.  

- Menu Planning progressive extras unchanged.  

- Occupancy / Members / Payments list / Complaints list / navigation / permissions unchanged.  

- No new steppers; Lucide icons only on new hints (`CircleDollarSign`).



### Remaining Low / deferred Medium



- ~~Customer subscription request progressive footer~~ → **Done in Phase 5**  

- ~~Complete Profile sticky polish~~ → **Done in Phase 5**  

- Meal combo quantities — Keep As Is  

- ~~Coachmarks~~ → Lifecycle Phase 4 **Done** (not Progressive WF)  

- ~~Health Score~~ → Lifecycle Phase 5 **Done** (secondary widget; enterprise portfolio deferred)





---



## Phase 5 manual testing



### Happy path



1. **Customer Subscription Plans** — Choose plan → Continue to payment details (highlight) → reference/proof/notes → Submit. Manual scroll into payment section also unlocks Submit.  

2. **Complete Profile** — Step through personal → address → emergency → documents; sticky Next/Back/Submit stay visible with keyboard.  

3. **Edit Space / Quick Setup / Occupancy** — Sticky bars match safe-area padding and chrome.  

4. **Unit/Room/Bed create** — Pricing hint wording: “Set rent after you save”.



### Edges



- Subscription: pending request locks catalog; empty plans shows business empty state (no generic “No data”).  

- Subscription: submit without reference or proof shows toast.  

- Complete Profile step 0: Back hidden; logout/cancel in footer extra.  

- Keyboard: footers remain above home indicator; no overlap of primary CTA.



### Regression



- Lifecycle Engine / Dashboard / Business Progress Stepper unchanged.  

- Menu Planning progressive extras unchanged.  

- Accommodation, Members, Payments, Complaints, Space Management, navigation, permissions unchanged.  

- No Coachmarks / Health Score / new APIs.

