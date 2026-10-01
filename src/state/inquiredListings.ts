/**
 * Current-user enquiry listing ids from GET /enquiries/me/listing-ids.
 * One in-flight request is shared by every listing card.
 */

export type InquirySentVia = 'EMAIL' | 'APP' | 'BOTH';
export type InquiredListingRef = string | { id: string; sentVia?: InquirySentVia | null };

type Listener = () => void;

let ids = new Set<string>();
let sentViaById = new Map<string, InquirySentVia>();
let optimistic = new Set<string>();
let optimisticVia = new Map<string, InquirySentVia>();
let loadedUserId: string | null = null;
let loadEpoch = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach(listener => listener());
}

export function getInquiredIds(): ReadonlySet<string> {
  return ids;
}

export function getInquirySentVia(listingId: string): InquirySentVia | null {
  return sentViaById.get(listingId) ?? null;
}

function asSentVia(value: string | null | undefined): InquirySentVia | null {
  if (value === 'EMAIL' || value === 'APP' || value === 'BOTH') return value;
  return null;
}

export function subscribeInquired(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function listingAlreadyInquired(listingIds: Iterable<string>, listingId: string): boolean {
  for (const id of listingIds) {
    if (id === listingId) return true;
  }
  return false;
}

export function resetInquiredListings(): void {
  loadEpoch += 1;
  loadedUserId = null;
  inflight = null;
  optimistic = new Set();
  optimisticVia = new Map();
  sentViaById = new Map();
  ids = new Set();
  emit();
}

export function markInquired(listingId: string, sentVia?: InquirySentVia | null): void {
  const id = listingId.trim();
  if (!id) return;
  optimistic = new Set(optimistic).add(id);
  const via = asSentVia(sentVia);
  if (via) {
    optimisticVia = new Map(optimisticVia).set(id, via);
    sentViaById = new Map(sentViaById).set(id, via);
  }
  if (ids.has(id)) {
    emit();
    return;
  }
  ids = new Set(ids).add(id);
  emit();
}

export async function loadInquiredListings(
  userId: string,
  fetchIds: () => Promise<InquiredListingRef[]>,
): Promise<void> {
  if (!userId) {
    resetInquiredListings();
    return;
  }
  if (inflight) return inflight;

  const epoch = loadEpoch;
  const optimisticBefore = optimistic;
  const request = (async () => {
    try {
      const fetched = await fetchIds();
      if (epoch !== loadEpoch) return;
      const next = new Set<string>();
      const nextVia = new Map<string, InquirySentVia>();
      for (const item of fetched) {
        const id = typeof item === 'string' ? item : item?.id;
        if (!id) continue;
        next.add(id);
        const via = typeof item === 'string' ? null : asSentVia(item.sentVia);
        if (via) nextVia.set(id, via);
      }
      const stillOptimistic = new Set<string>();
      for (const id of optimistic) {
        if (!optimisticBefore.has(id)) {
          next.add(id);
          stillOptimistic.add(id);
          const via = optimisticVia.get(id);
          if (via) nextVia.set(id, via);
        }
      }
      optimistic = stillOptimistic;
      optimisticVia = new Map([...optimisticVia].filter(([id]) => stillOptimistic.has(id)));
      sentViaById = nextVia;
      ids = next;
      loadedUserId = userId;
      emit();
    } catch {
      if (epoch === loadEpoch) loadedUserId = null;
    }
  })();

  inflight = request;
  try {
    await request;
  } finally {
    if (inflight === request) inflight = null;
  }
}
