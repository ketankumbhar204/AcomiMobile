import { useCallback, useState } from 'react';
import { mealsApi } from '../api/mealsApi';
import type {
  MealParticipationResponse,
  MemberMealParticipationSummary,
  UUID,
} from '../api/types';

function toSummary(row: MealParticipationResponse): MemberMealParticipationSummary {
  return {
    participationId: row.participationId,
    mealPlanId: row.mealPlanId,
    mealPlanCode: row.mealPlanCode,
    mealPlanName: row.mealPlanName,
    status: row.status,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
  };
}

function buildParticipationMap(
  rows: MealParticipationResponse[],
): Map<UUID, MemberMealParticipationSummary> {
  const map = new Map<UUID, MemberMealParticipationSummary>();
  for (const row of rows) {
    const current = map.get(row.memberId);
    if (!current || row.status === 'ACTIVE') {
      map.set(row.memberId, toSummary(row));
    }
  }
  return map;
}

export function useMealParticipationMap(spaceId: UUID | undefined, enabled: boolean) {
  const [participationByMemberId, setParticipationByMemberId] = useState<
    Map<UUID, MemberMealParticipationSummary>
  >(new Map());
  const [loading, setLoading] = useState(false);

  const reloadParticipations = useCallback(async () => {
    if (!spaceId || !enabled) {
      setParticipationByMemberId(new Map());
      return;
    }
    setLoading(true);
    try {
      const rows = await mealsApi.getMealParticipations(spaceId);
      setParticipationByMemberId(buildParticipationMap(rows));
    } catch {
      setParticipationByMemberId(new Map());
    } finally {
      setLoading(false);
    }
  }, [enabled, spaceId]);

  const upsertParticipation = useCallback(
    (memberId: UUID, participation: MemberMealParticipationSummary | null) => {
      setParticipationByMemberId(prev => {
        const next = new Map(prev);
        if (participation) {
          next.set(memberId, participation);
        } else {
          next.delete(memberId);
        }
        return next;
      });
    },
    [],
  );

  return {
    participationByMemberId,
    reloadParticipations,
    upsertParticipation,
    participationsLoading: loading,
  };
}
