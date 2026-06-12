# Accommodation navigation fix — UI prompt

Use this when rooms/beds show **404**, **"Room not found"**, or **"This room is not in the current space"** even though data exists in the DB.

**Backend is not missing rows.** Failures happen when the app mixes `spaceId`, `buildingId`, `floorId`, and `roomId` from different navigation paths or stale React Query caches.

---

## Root causes (dev data)

### 1. Similar floor names across buildings (same space)

| Floor ID | Name | Building | Notes |
|----------|------|----------|-------|
| `4da6df19-28fe-4417-be78-53a751b6d5a6` | **Floor 1** | Building B `8c1b6b59…` | Room 101, 102, … live here |
| `ffb65b1b-c38b-4dfb-bc60-b491c61d95c3` | **floor-1** | Building A `d8f4331b…` | Only `room 1` — **not** Room 101 |

**Bug:** Room 101 listed under **floor-1 / Building A** → stale or cross-floor cache. Opening it triggers space/floor mismatch guard.

**Correct path for Room 101:**

```
Space 04bef4a9… → Building B → Floor 1 (4da6df19…) → Room 101 (5d017979…) → beds
```

### 2. Duplicate space name `test pg1`

| Space ID | Owner | Buildings |
|----------|-------|-----------|
| `04bef4a9-de63-4f28-9206-52c67d31dd74` | User | Building A + B |
| `c734c608-3c47-4ac1-bd1a-951466a7c1d2` | Ketan | (empty) |

Same JWT user must match space membership. Ketan's token on `04bef4a9…` → 403. Wrong space + valid roomId → **404**.

**Backend now returns `address` on `MySpaceResponse`** — show `"{spaceName} · {address}"` in the space switcher.

### 3. Room list API is floor-scoped

`GET .../floors/{floorId}/rooms` only returns rooms **on that floor**. Never reuse another floor's cached list.

---

## Test IDs (copy into tests / manual QA)

```
CORRECT_SPACE     = 04bef4a9-de63-4f28-9206-52c67d31dd74
WRONG_SPACE       = c734c608-3c47-4ac1-bd1a-951466a7c1d2
BUILDING_B        = 8c1b6b59-21c5-4c54-b6c2-88a5b57e35ed
BUILDING_A        = d8f4331b-8a7d-44a0-9c17-3dbd7c323f14
FLOOR_1_B         = 4da6df19-28fe-4417-be78-53a751b6d5a6   // "Floor 1"
FLOOR_1_A         = ffb65b1b-c38b-4dfb-bc60-b491c61d95c3   // "floor-1"
ROOM_101          = 5d017979-7b8a-4f26-b18d-df8ab56aa92f
ROOM_102          = 62142caa-cf2b-4edb-bd3a-7147d940caef
USER_ID           = fc9c6cd4-b538-47e5-b53b-f58b220c7353   // owns CORRECT_SPACE
```

---

## APIs to verify (User JWT, CORRECT_SPACE)

| Call | Expected |
|------|----------|
| `GET .../rooms/5d017979-7b8a-4f26-b18d-df8ab56aa92f` | 200, `floorId=4da6df19…`, `buildingId=8c1b6b59…` |
| `GET .../floors/4da6df19…/rooms` | 200, includes Room 101 |
| `GET .../floors/ffb65b1b…/rooms` | 200, **does not** include Room 101 |
| `GET .../rooms/5d017979…/beds` | 200, 3 beds |
| `GET .../rooms/5d017979…/beds` with WRONG_SPACE | 404, message contains **"not in this space"** |

---

## Frontend implementation prompt (copy to mobile repo)

> Fix accommodation navigation so rooms and beds never load with mismatched hierarchy IDs.
>
> ### Required changes
>
> 1. **Navigation params bundle** — When opening a room/beds screen, pass all IDs from the list row at tap time (never from a global store alone):
>    ```ts
>    type RoomNavParams = {
>      spaceId: string;
>      buildingId: string;
>      floorId: string;   // or unitId for co-living
>      roomId: string;
>      roomName: string;
>    };
>    ```
>
> 2. **React Query keys** — Include full path in every key:
>    ```ts
>    ['rooms', spaceId, floorId]
>    ['beds', spaceId, roomId]
>    ```
>    Never `['rooms']` or `['beds', roomId]` alone.
>
> 3. **Invalidate on space switch** — When `currentSpaceId` changes:
>    - `queryClient.removeQueries({ queryKey: ['rooms'] })`
>    - `queryClient.removeQueries({ queryKey: ['beds'] })`
>    - Reset navigation stack to Accommodation home (pop room/floor screens).
>
> 4. **Pre-flight before beds** — In `useBeds` / room detail:
>    ```ts
>    const room = await getRoom(spaceId, roomId);
>    if (room.floorId !== params.floorId) {
>      throw new RoomContextError('Room is not on this floor');
>    }
>    if (room.buildingId !== params.buildingId) {
>      throw new RoomContextError('Room is not in this building');
>    }
>    ```
>    `RoomResponse` now includes `buildingId` from the API.
>
> 5. **Space switcher** — Use `GET /api/v1/spaces/my`. Display:
>    ```ts
>    `${spaceName} · ${address ?? spaceId.slice(0, 8)}`
>    ```
>    Store selected `spaceId` in context; all accommodation hooks read from that context + route params.
>
> 6. **Floor list UI** — Show building name in floor header: `"Building B · Floor 1"` vs `"Building A · floor-1"` to avoid confusion.
>
> 7. **404 handling** — If error message includes `"not in this space"`, show:
>    > This room is not in the current space. Go back and open it again from the property list.
>    Do **not** show "No beds yet" on 404.
>
> 8. **Membership** — Only call accommodation APIs for spaces returned from `GET /api/v1/spaces/my`. Do not hard-code space IDs.
>
> ### Acceptance tests
>
> - [ ] User → space `04bef4a9…` → Building B → Floor 1 → Room 101 → 3 beds, no error
> - [ ] Same flow for Room 102
> - [ ] Building A → floor-1 → list shows only `room 1`, not Room 101
> - [ ] Switch space → previous room screen cannot still show Room 101
> - [ ] Network tab: beds URL uses same `spaceId` as floor rooms list
>
> ### Files to search
>
> `useBeds`, `useRooms`, `RoomDetail`, `BedsScreen`, `SpaceContext`, `currentSpaceId`, React Query `queryKey`, navigation `navigate(` calls for room routes.

---

## Related

- [accommodation-ui-integration.md](./accommodation-ui-integration.md) — Phase 4.1 CRUD
- [my-spaces-ui-integration.md](./my-spaces-ui-integration.md) — space list (`address` field)
