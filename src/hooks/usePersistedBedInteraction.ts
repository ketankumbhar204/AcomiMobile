import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AccommodationStatus, OccupancyResponse, SpaceType } from '../api/types';
import { updateBedDetails } from '../utils/accommodationInlineRename';
import {
  hasBedPricingChange,
  isBedDraftUnchanged,
  type BedInteractionDraft,
} from '../utils/bedInteractionDraft';
import { formatBedDisplayLabel } from '../utils/formatBedDisplayLabel';
import type { OccupancyTargetSelection } from '../utils/occupancyRules';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';
import { useToastStore } from '../store/toastStore';
import { useConfirmBedPricingCommit } from './useConfirmBedPricingCommit';

export type PersistedBedTarget = {
  roomId: string;
  bedId: string;
  label: string;
  bedNumber: string;
  status: AccommodationStatus;
  rent?: number | null;
  deposit?: number | null;
  locationLine?: string;
  inactive?: boolean;
  occupancyTarget?: OccupancyTargetSelection;
  occupancy?: OccupancyResponse | null;
};

export function usePersistedBedInteraction(options: {
  spaceId: string;
  spaceType?: SpaceType | null;
  canEditStructure: boolean;
  canManageOccupancy: boolean;
  onSuccess?: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [target, setTarget] = useState<PersistedBedTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const onSuccessRef = useRef(options.onSuccess);
  onSuccessRef.current = options.onSuccess;

  const close = useCallback(() => {
    setTarget(null);
  }, []);

  const pricingCommit = useConfirmBedPricingCommit({
    spaceId: options.spaceId,
    onSuccess: async () => {
      setTarget(null);
      await onSuccessRef.current?.();
    },
  });

  const open = useCallback((next: PersistedBedTarget) => {
    setTarget(next);
  }, []);

  const save = useCallback(
    async (draft: BedInteractionDraft) => {
      if (!target || !options.canEditStructure || target.inactive) {
        return;
      }
      const current: BedInteractionDraft = {
        bedNumber: target.bedNumber,
        rent: target.rent ?? null,
        deposit: target.deposit ?? null,
      };
      if (isBedDraftUnchanged(current, draft)) {
        return;
      }
      const nextNumber = draft.bedNumber.trim();
      if (!nextNumber) {
        showToast(t('accommodation.beds.validationError'));
        return;
      }

      if (!hasBedPricingChange(current, draft)) {
        setSaving(true);
        try {
          await updateBedDetails(options.spaceId, target.roomId, target.bedId, {
            name: nextNumber,
            bedNumber: nextNumber,
          });
          showToast(t('accommodation.beds.updateSuccess'));
          setTarget(null);
          await onSuccessRef.current?.();
        } catch (err) {
          showToast(getAccommodationErrorMessage(err, 'accommodation.errors.saveBed'));
        } finally {
          setSaving(false);
        }
        return;
      }

      pricingCommit.request({
        roomId: target.roomId,
        bedId: target.bedId,
        bedLabel: formatBedDisplayLabel(target.label || nextNumber, t),
        currentRent: target.rent,
        currentDeposit: target.deposit,
        nextRent: draft.rent,
        nextDeposit: draft.deposit,
        name: nextNumber,
        bedNumber: nextNumber,
      });
    },
    [options, pricingCommit, showToast, t, target],
  );

  return {
    target,
    open,
    close,
    save,
    saving,
    pricingCommit,
    spaceType: options.spaceType,
    canEditStructure: options.canEditStructure,
    canManageOccupancy: options.canManageOccupancy,
    onOccupancySuccess: () => {
      setTarget(null);
      void onSuccessRef.current?.();
    },
  };
}
