/**
 * Current-user enquiry listing ids from GET /enquiries/me/listing-ids.
 * One in-flight request is shared by every listing card.
 */

export type InquirySentVia = 'EMAIL' | 'APP' | 'BOTH';
export type InquiryRecord = {
  sentVia: InquirySentVia | null;
  sentToEmail: string | null;
  sentAt: string | null;
  contactViewed: boolean;
};
export type InquiredListingRef =
  | string
  | {
      id: string;
      sentVia?: InquirySentVia | null;
      sentToEmail?: string | null;
      sentAt?: string | null;
      contactViewed?: boolean;
    };

type Listener = () => void;

let ids = new Set<string>();
let records = new Map<string, InquiryRecord>();
let optimistic = new Set<string>();
let optimisticRecords = new Map<string, InquiryRecord>();
let loadedUserId: string | null = null;
let loadEpoch = 0;
let inflight: Promise<void> | null = null;
let snapshot = 0;
const listeners = new Set<Listener>();

function emit(): void {
  snapshot += 1;
  listeners.forEach(listener => listener());
}

export function getInquirySnapshot(): number {
  return snapshot;
}

export function getInquiredIds(): ReadonlySet<string> {
  return ids;
}

export function getInquiryRecord(listingId: string): InquiryRecord | null {
  return records.get(listingId) ?? null;
}

export function getInquirySentVia(listingId: string): InquirySentVia | null {
  return records.get(listingId)?.sentVia ?? null;
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
  optimisticRecords = new Map();
  records = new Map();
  ids = new Set();
  emit();
}

export function markInquired(
  listingId: string,
  sentVia?: InquirySentVia | null,
  details?: { sentToEmail?: string | null; sentAt?: string | null; contactViewed?: boolean },
): void {
  const id = listingId.trim();
  if (!id) return;
  const current = records.get(id);
  const via = asSentVia(sentVia) ?? current?.sentVia ?? null;
  const next: InquiryRecord = {
    sentVia: via,
    sentToEmail: details?.sentToEmail ?? current?.sentToEmail ?? null,
    sentAt: details?.sentAt ?? current?.sentAt ?? null,
    contactViewed: details?.contactViewed ?? current?.contactViewed ?? false,
  };
  records = new Map(records).set(id, next);
  const viewOnly = !via && next.contactViewed;
  if (!viewOnly) {
    optimistic = new Set(optimistic).add(id);
    optimisticRecords = new Map(optimisticRecords).set(id, next);
    if (!ids.has(id)) {
      ids = new Set(ids).add(id);
    }
  }
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
      const nextRecords = new Map<string, InquiryRecord>();
      for (const item of fetched) {
        const id = typeof item === 'string' ? item : item?.id;
        if (!id) continue;
        if (typeof item !== 'string') {
          const via = asSentVia(item.sentVia);
          nextRecords.set(id, {
            sentVia: via,
            sentToEmail: item.sentToEmail?.trim() || null,
            sentAt: item.sentAt?.trim() || null,
            contactViewed: item.contactViewed === true,
          });
          if (via) next.add(id);
        } else {
          next.add(id);
        }
      }
      const stillOptimistic = new Set<string>();
      for (const id of optimistic) {
        if (!optimisticBefore.has(id)) {
          next.add(id);
          stillOptimistic.add(id);
          const record = optimisticRecords.get(id);
          if (record) nextRecords.set(id, record);
        }
      }
      optimistic = stillOptimistic;
      optimisticRecords = new Map([...optimisticRecords].filter(([id]) => stillOptimistic.has(id)));
      records = nextRecords;
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
