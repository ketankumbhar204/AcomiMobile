import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../api/accommodationApi';
import type { AccommodationStatus, OccupancyResponse, SpaceType } from '../api/types';
import { updateUnitDetails } from '../utils/accommodationInlineRename';
import {
  hasBedPricingChange,
  isBedDraftUnchanged,
  type BedInteractionDraft,
} from '../utils/bedInteractionDraft';
import { buildUnitOccupancyTarget } from '../utils/buildOccupancyTarget';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';
import { invalidateStayPaymentCache } from '../utils/stayChargeIndex';
import { useToastStore } from '../store/toastStore';
import type { OccupancyTargetSelection } from '../utils/occupancyRules';

export type PersistedUnitTarget = {
  unitId: string;
  label: string;
  unitNumber: string;
  status: AccommodationStatus;
  rent?: number | null;
  deposit?: number | null;
  locationLine?: string;
  inactive?: boolean;
  occupancyTarget?: OccupancyTargetSelection;
  occupancy?: OccupancyResponse | null;
};

export function usePersistedUnitInteraction(options: {
  spaceId: string;
  buildingId: string;
  buildingName: string;
  spaceType?: SpaceType | null;
  canEditStructure: boolean;
  canManageOccupancy: boolean;
  onSuccess?: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [target, setTarget] = useState<PersistedUnitTarget | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const onSuccessRef = useRef(options.onSuccess);
  onSuccessRef.current = options.onSuccess;
  const requestId = useRef(0);

  const close = useCallback(() => {
    requestId.current += 1;
    setDetailsLoading(false);
    setTarget(null);
  }, []);

  const open = useCallback(
    (seed: { unitId: string; name: string; status: AccommodationStatus; active?: boolean }) => {
      const id = requestId.current + 1;
      requestId.current = id;
      setTarget({
        unitId: seed.unitId,
        label: seed.name,
        unitNumber: seed.name,
        status: seed.status,
        rent: null,
        deposit: null,
        locationLine: options.buildingName,
        inactive: seed.active === false,
        occupancyTarget: buildUnitOccupancyTarget({
          buildingId: options.buildingId,
          buildingName: options.buildingName,
          unitId: seed.unitId,
          unitName: seed.name,
        }),
      });
      setDetailsLoading(true);
      void accommodationApi
        .getUnitById(options.spaceId, seed.unitId)
        .then(unit => {
          if (requestId.current !== id) {
            return;
          }
          setTarget({
            unitId: unit.unitId,
            label: unit.name,
            unitNumber: unit.unitNumber,
            status: unit.status,
            rent: unit.defaultRent ?? null,
            deposit: unit.defaultDeposit ?? null,
            locationLine: options.buildingName,
            inactive: unit.active === false,
            occupancyTarget: buildUnitOccupancyTarget({
              buildingId: options.buildingId,
              buildingName: options.buildingName,
              unitId: unit.unitId,
              unitName: unit.name,
            }),
          });
        })
        .catch(err => {
          if (requestId.current !== id) {
            return;
          }
          setTarget(null);
          showToast(
            getAccommodationErrorMessage(err, 'accommodation.errors.loadUnits'),
            undefined,
            'error',
          );
        })
        .finally(() => {
          if (requestId.current === id) {
            setDetailsLoading(false);
          }
        });
    },
    [options.buildingId, options.buildingName, options.spaceId, showToast],
  );

  const save = useCallback(
    async (draft: BedInteractionDraft) => {
      if (!target || !options.canEditStructure || target.inactive || detailsLoading) {
        return;
      }
      const current: BedInteractionDraft = {
        bedNumber: target.unitNumber,
        rent: target.rent ?? null,
        deposit: target.deposit ?? null,
      };
      if (isBedDraftUnchanged(current, draft)) {
        return;
      }
      const nextNumber = draft.bedNumber.trim();
      if (!nextNumber) {
        showToast(t('accommodation.units.validationError', {
          defaultValue: 'Enter a unit number.',
        }), undefined, 'error');
        return;
      }
      setSaving(true);
      try {
        const saved = await updateUnitDetails(options.spaceId, target.unitId, {
          unitNumber: nextNumber,
          name: target.label.trim() === target.unitNumber.trim() ? nextNumber : target.label,
          ...(hasBedPricingChange(current, draft)
            ? { defaultRent: draft.rent, defaultDeposit: draft.deposit }
            : {}),
        });
        showToast(t('accommodation.units.updateSuccess'));
        setTarget(currentTarget =>
          currentTarget
            ? {
                ...currentTarget,
                label: saved.name,
                unitNumber: saved.unitNumber,
                rent: saved.defaultRent ?? null,
                deposit: saved.defaultDeposit ?? null,
                status: saved.status,
                occupancyTarget: currentTarget.occupancyTarget
                  ? { ...currentTarget.occupancyTarget, unitName: saved.name }
                  : currentTarget.occupancyTarget,
              }
            : currentTarget,
        );
        await onSuccessRef.current?.();
      } catch (err) {
        showToast(
          getAccommodationErrorMessage(err, 'accommodation.errors.saveUnit'),
          undefined,
          'error',
        );
      } finally {
        setSaving(false);
      }
    },
    [detailsLoading, options.canEditStructure, options.spaceId, showToast, t, target],
  );

  return {
    target,
    detailsLoading,
    open,
    close,
    save,
    saving,
    spaceType: options.spaceType,
    canEditStructure: options.canEditStructure,
    canManageOccupancy: options.canManageOccupancy,
    onOccupancySuccess: () => {
      invalidateStayPaymentCache();
      setTarget(null);
      void onSuccessRef.current?.();
    },
  };
}
