import { useEffect, useState } from 'react';
import type { OccupancyResponse } from '../api/types';
import type { OccupantPaymentSummary } from '../utils/occupantPaymentSummary';
import {
  loadStayChargeIndex,
  stayPaymentRevision,
  subscribeStayPaymentCache,
  summaryForBed,
} from '../utils/stayChargeIndex';

export type OccupiedBedStayState = {
  loading: boolean;
  error: boolean;
  occupancy: OccupancyResponse | null;
  summary: OccupantPaymentSummary | null;
};

const idle: OccupiedBedStayState = {
  loading: false,
  error: false,
  occupancy: null,
  summary: null,
};

export function useOccupiedBedStay(
  spaceId: string | undefined,
  bedId: string | undefined,
  enabled: boolean,
): OccupiedBedStayState {
  const [revision, setRevision] = useState(stayPaymentRevision);
  const [state, setState] = useState<OccupiedBedStayState>(
    enabled && spaceId && bedId ? { ...idle, loading: true } : idle,
  );

  useEffect(() => subscribeStayPaymentCache(() => setRevision(stayPaymentRevision())), []);

  useEffect(() => {
    if (!enabled || !spaceId || !bedId) {
      setState(idle);
      return;
    }
    let cancelled = false;
    setState(current => ({ ...current, loading: true, error: false }));
    void loadStayChargeIndex(spaceId)
      .then(index => {
        if (cancelled) {
          return;
        }
        const next = summaryForBed(index, bedId);
        setState({
          loading: false,
          error: false,
          occupancy: next.occupancy,
          summary: next.summary,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ loading: false, error: true, occupancy: null, summary: null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bedId, enabled, revision, spaceId]);

  return state;
}
