import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UUID } from '../api/types';
import type { MilestoneId } from '../spaceLifecycle/types';

function storageKey(spaceId: UUID): string {
  return `Amico:setupDismissedOptional:${spaceId}`;
}

export async function loadDismissedOptionalMilestones(
  spaceId: UUID,
): Promise<MilestoneId[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(spaceId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as MilestoneId[]) : [];
  } catch {
    return [];
  }
}

export async function saveDismissedOptionalMilestones(
  spaceId: UUID,
  ids: readonly MilestoneId[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(spaceId), JSON.stringify([...ids]));
  } catch {
    // ignore persistence failures
  }
}

export async function dismissOptionalMilestone(
  spaceId: UUID,
  milestoneId: MilestoneId,
): Promise<MilestoneId[]> {
  const current = await loadDismissedOptionalMilestones(spaceId);
  if (current.includes(milestoneId)) {
    return current;
  }
  const next = [...current, milestoneId];
  await saveDismissedOptionalMilestones(spaceId, next);
  return next;
}

/** Re-open a skipped optional milestone (e.g. user taps Add customers again). */
export async function undismissOptionalMilestone(
  spaceId: UUID,
  milestoneId: MilestoneId,
): Promise<MilestoneId[]> {
  const current = await loadDismissedOptionalMilestones(spaceId);
  const next = current.filter(id => id !== milestoneId);
  await saveDismissedOptionalMilestones(spaceId, next);
  return next;
}
