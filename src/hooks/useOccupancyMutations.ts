import { useCallback, useState } from 'react';
import { occupancyApi } from '../api/occupancyApi';
import type {
  AllocateOccupancyRequest,
  CancelReservationRequest,
  MoveInOccupancyRequest,
  ReserveOccupancyRequest,
  TransferOccupancyRequest,
  UUID,
  VacateOccupancyRequest,
} from '../api/types';
import { getOccupancyErrorMessage } from '../utils/occupancyErrors';
import { invalidateAfterOccupancyChange } from '../utils/occupancyQueryCache';

export function useOccupancyMutations(spaceId: UUID) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allocate = useCallback(
    async (body: AllocateOccupancyRequest) => {
      setLoading(true);
      setError(null);
      try {
        const result = await occupancyApi.allocateMember(spaceId, body);
        invalidateAfterOccupancyChange();
        return result;
      } catch (err) {
        const message = getOccupancyErrorMessage(err, 'occupancy.errors.allocate');
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [spaceId],
  );

  const reserve = useCallback(
    async (body: ReserveOccupancyRequest) => {
      setLoading(true);
      setError(null);
      try {
        const result = await occupancyApi.reserveOccupancy(spaceId, body);
        invalidateAfterOccupancyChange();
        return result;
      } catch (err) {
        const message = getOccupancyErrorMessage(err, 'occupancy.errors.reserve');
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [spaceId],
  );

  const moveIn = useCallback(
    async (occupancyId: UUID, body?: MoveInOccupancyRequest) => {
      setLoading(true);
      setError(null);
      try {
        const result = await occupancyApi.moveInOccupancy(spaceId, occupancyId, body);
        invalidateAfterOccupancyChange();
        return result;
      } catch (err) {
        const message = getOccupancyErrorMessage(err, 'occupancy.errors.moveIn');
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [spaceId],
  );

  const cancelReservation = useCallback(
    async (occupancyId: UUID, body?: CancelReservationRequest) => {
      setLoading(true);
      setError(null);
      try {
        const result = await occupancyApi.cancelReservation(spaceId, occupancyId, body);
        invalidateAfterOccupancyChange();
        return result;
      } catch (err) {
        const message = getOccupancyErrorMessage(err, 'occupancy.errors.cancelReservation');
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [spaceId],
  );

  const transfer = useCallback(
    async (occupancyId: UUID, body: TransferOccupancyRequest) => {
      setLoading(true);
      setError(null);
      try {
        const result = await occupancyApi.transferOccupancy(spaceId, occupancyId, body);
        invalidateAfterOccupancyChange();
        return result;
      } catch (err) {
        const message = getOccupancyErrorMessage(err, 'occupancy.errors.transfer');
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [spaceId],
  );

  const vacate = useCallback(
    async (occupancyId: UUID, body?: VacateOccupancyRequest) => {
      setLoading(true);
      setError(null);
      try {
        const result = await occupancyApi.vacateOccupancy(spaceId, occupancyId, body);
        invalidateAfterOccupancyChange();
        return result;
      } catch (err) {
        const message = getOccupancyErrorMessage(err, 'occupancy.errors.vacate');
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [spaceId],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    allocate,
    reserve,
    moveIn,
    cancelReservation,
    transfer,
    vacate,
    loading,
    error,
    clearError,
  };
}
