# Acomi Web Architecture



> Source of truth: React Native mobile app (`K:/Acomi`).  

> Goal: same backend, APIs, business logic, permissions, workflows, validation, and terminology — different presentation layer only.



---



## 1. Recommended web architecture



```

Acomi-web/

├── src/

│   ├── app/                    # App shell, providers, router entry

│   ├── modules/                # Domain feature modules (pages + feature UI)

│   ├── shared/                 # Cross-cutting shared kernel

│   │   ├── components/         # Design-system + domain-agnostic UI

│   │   ├── layouts/            # AppShell, AuthLayout, SpaceLayout

│   │   ├── hooks/              # Shared hooks (auth, permissions, space)

│   │   ├── services/           # Non-HTTP services (storage, analytics)

│   │   ├── api/                # HTTP client + domain API clients

│   │   ├── contexts/           # React contexts (confirm, toast, overflow)

│   │   ├── theme/              # Design tokens (ported from mobile)

│   │   ├── types/              # Shared DTOs / domain types

│   │   └── utils/              # Permissions, validation, mappers

│   ├── store/                  # Zustand stores (session, space, UI)

│   ├── i18n/                   # Same locale keys as mobile

│   └── assets/                 # Icons, illustrations (web-optimized)

└── docs/                       # Keep linking to /docs/web blueprint

```



### Why this shape



| Folder | Why it exists | Mobile mapping |

|--------|---------------|----------------|

| `app/` | Bootstraps providers (auth, i18n, query/cache, router) | `App.tsx` + `RootNavigator` |

| `modules/` | Isolates product domains so teams can ship independently | `src/screens/<domain>/` + `src/features/` + domain components |

| `shared/components/` | One design system for web; primitives first | `src/components/ui/` |

| `shared/layouts/` | Desktop chrome (sidebar, top bar, content panes) | Tab bar + stack headers → AppShell |

| `shared/hooks/` | Reuse data/permission patterns without RN APIs | `src/hooks/` |

| `shared/services/` | Local storage, file pick, deep-link helpers | AsyncStorage, image picker, coachmark storage |

| `shared/api/` | **Port verbatim** Axios clients + unwrap helpers | `src/api/` |

| `shared/contexts/` | Imperative UI hosts (confirm, action menus) | ConfirmDialog, QuickActionSheet, OverflowMenu |

| `shared/theme/` | Acomi Material 3–inspired tokens | `src/theme/` |

| `shared/types/` | DTOs shared with backend contract | `src/api/types.ts`, `inventoryTypes.ts` |

| `shared/utils/` | Permissions, validation, caches, visuals | `src/utils/` |

| `store/` | Session + space selection + ephemeral UI | `src/store/` (Zustand) |

| `i18n/` | Identical keys/terminology | `src/i18n/` |



---



## 2. Module layout (inside `modules/`)



Each module follows the same internal pattern:



```

modules/<domain>/

├── pages/              # Route-level pages (1:1 or N:1 with mobile screens)

├── components/         # Domain-specific UI (cards, drawers, inspectors)

├── hooks/              # Domain data hooks (ported from mobile)

├── workflows/          # Multi-step flows (e.g. OccupancyWizard)

└── index.ts            # Public module exports

```



### Recommended modules



| Module | Mobile source |

|--------|---------------|

| `auth` | `screens/auth`, `components/auth` |

| `onboarding` | CompleteProfile, JoinSpace, AcceptInvitations, OnboardingChoice |

| `spaces` | MySpaces, Create/Edit/Details, GlobalAttention/Activity |

| `dashboard` | Dashboard + drill-downs |

| `members` | Members + detail tabs + invite/add/import |

| `accommodation` | Hierarchy, layouts, forms, builder, quick setup |

| `occupancy` | OccupancyWizard + occupancy components |

| `meals` | Meals hub, planning, library, polls, subscriptions |

| `payments` | Owner + tenant payments |

| `complaints` | List, raise, detail |

| `inventory` | Dashboard, items, categories, suppliers, transactions |

| `notifications` | Space notifications |

| `profile` | Profile + language + document settings |

| `settings` | Space-level meal billing / poll closing (from EditSpace) |



---



## 3. Layering rules (must preserve)



```

Pages / Layouts

      ↓

Domain hooks + workflows (business rules)

      ↓

Utils (permissions, validation, mappers)

      ↓

API clients (Axios)

      ↓

Shared Acomi backend

```



**Do not** put business rules in React components or route loaders.  

**Do** port `utils/*Permissions.ts`, `validate*`, `occupancyRules`, `occupancyContract`, and similar helpers first — then build UI on top.



---



## 4. Recommended technology choices



| Concern | Recommendation | Rationale |

|---------|----------------|-----------|

| Framework | **React 19 + Vite** (or Next.js App Router if SSR/SEO needed later) | Closest mental model to RN React; SPA is enough for authenticated ops tool |

| UI library | **MUI (Material UI) v6** with custom Acomi theme | Mobile already follows Material 3 patterns; MUI tables, drawers, dialogs map cleanly |

| Icons | **Lucide React** | Mobile uses `lucide-react-native` |

| Routing | **React Router v7** (data routers) or Next.js file routes | Nested routes mirror Main stack + tabs |

| State | **Zustand** (same as mobile) | Direct port of `authStore`, `spaceStore`, etc. |

| Server cache | **TanStack Query** (new for web) | Desktop benefits from caching, prefetch, background refresh; wrap existing API clients |

| HTTP | **Axios** | Reuse `apiClient`, interceptors, token helpers |

| Forms | **React Hook Form** + same imperative validators | Keep validation messages/keys identical |

| i18n | **i18next + react-i18next** | Same locale JSON |

| Tables | MUI DataGrid or TanStack Table | Desktop lists |

| DnD (later) | `@dnd-kit` | Accommodation builder / menu planning enhancements |



---



## 5. Mapping React Native concepts → Web



| React Native | Web equivalent |

|--------------|----------------|

| `NavigationContainer` + stacks | React Router nested routes |

| Bottom tabs (`SpaceTabNavigator`) | Left sidebar (primary nav) |

| Native stack push | Nested route / detail panel / drawer |

| Modal / BottomSheet | Dialog / right Drawer / Inspector |

| FAB | Toolbar primary button |

| `Screen` scroll chrome | Page layout + scrollable main |

| Header overflow menu | Top-bar overflow / kebab |

| Pull-to-refresh | Query refetch + “Refresh” control |

| AsyncStorage | `localStorage` / IndexedDB |

| Image picker | `<input type="file">` / drag-drop upload |

| Safe area / keyboard | CSS viewport + focus management |

| Coachmarks | Optional product tours (Shepherd / custom) |



---



## 6. Shared kernel vs presentation



### Port with minimal change (shared kernel)



- `src/api/*` (all domain clients + types + mappers)

- `src/utils/*Permissions*.ts` and validation helpers

- `src/utils/occupancyRules.ts`, `occupancyContract.ts`, meal/payment helpers

- `src/store/authStore.ts`, `spaceStore.ts` (swap storage adapter)

- `src/i18n/locales/*.json`

- `src/theme/*` tokens (colors, spacing, typography, radius)

- Hook **logic** (fetch, mutate, permission gates) — rewrite only RN navigation/UI glue



### Rebuild for web (presentation)



- Navigators → layouts + routes

- Every `*.tsx` screen → page + responsive layout

- RN primitives (`View`, `Text`, `ScrollView`, `Pressable`) → HTML/MUI

- Bottom sheets / FABs / stack headers → desktop patterns

- Accommodation illustrated layout views → canvas/SVG or denser tables + floor plans



---



## 7. Auth & space shell



```

/login, /otp

/onboarding/*

/spaces                    → My Spaces (global)

/spaces/:spaceId/*         → Space AppShell

    ├── /                  → Dashboard

    ├── /members

    ├── /accommodation/...

    ├── /meals/...

    ├── /payments/...

    ├── /complaints/...

    ├── /inventory/...

    ├── /notifications

    └── /settings

/profile

```



Space context (`spaceId`) is a **route param**, same as mobile `SpaceTabs` params. Permissions from `useSpacePermissions(spaceId)` gate sidebar items exactly like tab visibility.



---



## 8. Permission-driven UI (unchanged contract)



Roles: `OWNER` | `MANAGER` | `STAFF` | `TENANT` | `CUSTOMER`



Use the same resolution path:



1. `spaceStore.mySpaces` entry  

2. `resolveSpacePermissions(entry)` (`utils/spacePermissions.ts`)  

3. Domain helpers (`mealPermissions`, `inventoryPermissions`, …)



Sidebar, routes, and action buttons must call the same flags (`canManageMembers`, `canViewAccommodation`, `canManageInventory`, etc.).



---



## 9. Empty / thin mobile folders → web intent



| Mobile | Web approach |

|--------|--------------|

| `src/services/` (empty) | Introduce web `shared/services` for storage/file/deep-links only |

| `src/types/` (empty) | Prefer `shared/types` re-exporting API DTOs |

| `src/features/` (only OccupancyWizard) | Expand `modules/*/workflows` for wizards |

| `src/modules/orchestrator/` | Port as shared request orchestration helpers |



---



## 10. Architecture principles for Acomi Web



1. **Mobile is the product contract** — workflows and copy stay aligned.  

2. **Backend is shared** — no web-only endpoints unless additive and used by both clients later.  

3. **Desktop is denser, not different** — more columns, panels, shortcuts; same steps.  

4. **Port utils before UI** — prevents permission/validation drift.  

5. **One design language** — primary `#25D366`, Plus Jakarta Sans, existing radius/spacing.  

6. **Role-aware shells** — owner ops vs tenant/customer surfaces remain distinct.



---



## Related docs



- [module-mapping.md](./module-mapping.md)

- [navigation-mapping.md](./navigation-mapping.md)

- [api-reuse.md](./api-reuse.md)

- [implementation-roadmap.md](./implementation-roadmap.md)

- [final-report.md](./final-report.md)

