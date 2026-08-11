import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UUID } from '../api/types';

/** Tour ids — bump version when step copy/targets change meaningfully. */
export type CoachmarkTourId = 'setup.accommodation.v1' | 'setup.mess.v1';

export type CoachmarkCompletionStatus = 'completed' | 'skipped';

export type CoachmarkRecord = {
  status: CoachmarkCompletionStatus;
  completedAt: string;
};

export function coachmarkStorageKey(
  spaceId: UUID,
  tourId: CoachmarkTourId,
): string {
  return `@amico/coachmarks/${spaceId}/${tourId}`;
}

export async function loadCoachmarkRecord(
  spaceId: UUID,
  tourId: CoachmarkTourId,
): Promise<CoachmarkRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(coachmarkStorageKey(spaceId, tourId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<CoachmarkRecord>;
    if (
      parsed.status !== 'completed' &&
      parsed.status !== 'skipped'
    ) {
      return null;
    }
    return {
      status: parsed.status,
      completedAt:
        typeof parsed.completedAt === 'string'
          ? parsed.completedAt
          : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export async function isCoachmarkFinished(
  spaceId: UUID,
  tourId: CoachmarkTourId,
): Promise<boolean> {
  const record = await loadCoachmarkRecord(spaceId, tourId);
  return record != null;
}

export async function saveCoachmarkRecord(
  spaceId: UUID,
  tourId: CoachmarkTourId,
  status: CoachmarkCompletionStatus,
): Promise<CoachmarkRecord> {
  const record: CoachmarkRecord = {
    status,
    completedAt: new Date().toISOString(),
  };
  try {
    await AsyncStorage.setItem(
      coachmarkStorageKey(spaceId, tourId),
      JSON.stringify(record),
    );
  } catch {
    // ignore persistence failures — still return the in-memory record
  }
  return record;
}

/** Future “Replay tips” clears this key so the tour can run again. */
export async function clearCoachmarkRecord(
  spaceId: UUID,
  tourId: CoachmarkTourId,
): Promise<void> {
  try {
    await AsyncStorage.removeItem(coachmarkStorageKey(spaceId, tourId));
  } catch {
    // ignore
  }
}
