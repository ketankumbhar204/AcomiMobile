import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TransferRentPolicy, OccupancyResponse } from '../../../api/types';
import { useOccupancyMutations } from '../../../hooks/useOccupancyMutations';
import { useToastStore } from '../../../store/toastStore';
import {
  buildAllocateRequest,
  buildReserveRequest,
  buildTransferRequest,
  type OccupancyTargetSelection,
} from '../../../utils/occupancyRules';
import {
  buildContractSnapshotPayload,
  buildTransferContractPayload,
  validateContractTerms,
  type ContractTermsFormValues,
} from '../../../utils/occupancyContract';
import { shouldCreateMealParticipationFromContract } from '../../../utils/mealAccess';
import { getOccupancyErrorMessage } from '../../../utils/occupancyErrors';
import type { SpaceFoodPolicy } from '../../../utils/fetchSpaceFoodPolicy';
import type { SpaceType } from '../../../api/types';
import type { OccupancyWizardMode } from './types';
import { isMoveInDateInFuture } from '../../../utils/occupancyRules';

type SubmitContext = {
  mode: OccupancyWizardMode;
  spaceType: SpaceType;
  memberId: string;
  target: OccupancyTargetSelection;
  catalogRent?: number | null;
  contractValues?: ContractTermsFormValues;
  foodPolicy?: SpaceFoodPolicy;
  rentPolicy?: TransferRentPolicy;
  moveInDate?: string;
  expectedExitDate?: string;
  remarks?: string;
  agreementSigned?: boolean;
  allowEarlyMoveIn?: boolean;
  occupancyId?: string;
  currentOccupancy?: OccupancyResponse | null;
  onSuccess: () => void;
};

export function useOccupancyWizardSubmit(spaceId: string) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const { allocate, reserve, moveIn, transfer, vacate, loading } =
    useOccupancyMutations(spaceId);

  const submit = useCallback(
    async (ctx: SubmitContext) => {
      const {
        mode,
        spaceType,
        memberId,
        target,
        catalogRent,
        contractValues,
        foodPolicy,
        rentPolicy = 'APPLY_NEW',
        moveInDate,
        expectedExitDate,
        remarks,
        agreementSigned = false,
        allowEarlyMoveIn = false,
        occupancyId,
        currentOccupancy,
        onSuccess,
      } = ctx;

      try {
        if (mode === 'ALLOCATE') {
          if (!contractValues) {
            showToast(t('occupancy.errors.generic'));
            return;
          }
          const validationError = validateContractTerms(contractValues, {
            rentRequired: true,
            catalogDefaultRent: catalogRent,
            foodPolicy,
          });
          if (validationError) {
            showToast(t(validationError));
            return;
          }
          const contract = buildContractSnapshotPayload(contractValues, { foodPolicy });
          const { body, errorKey } = buildAllocateRequest(
            memberId,
            spaceType,
            target.targetType,
            {
              bedId: target.bedId,
              roomId: target.roomId,
              unitId: target.unitId,
            },
            { remarks, contract },
          );
          if (!body || errorKey) {
            showToast(t(errorKey ?? 'occupancy.errors.generic'));
            return;
          }
          if (shouldCreateMealParticipationFromContract(contract)) {
            body.createMealParticipation = true;
          }
          await allocate(body);
        } else if (mode === 'RESERVE') {
          const { body, errorKey } = buildReserveRequest(
            memberId,
            spaceType,
            target.targetType,
            {
              bedId: target.bedId,
              roomId: target.roomId,
              unitId: target.unitId,
            },
            {
              moveInDate: moveInDate ?? '',
              expectedExitDate,
              remarks,
            },
          );
          if (!body || errorKey) {
            showToast(t(errorKey ?? 'occupancy.errors.generic'));
            return;
          }
          await reserve(body);
        } else if (mode === 'MOVE_IN') {
          if (!occupancyId || !contractValues) {
            showToast(t('occupancy.errors.noReserved'));
            return;
          }
          if (
            isMoveInDateInFuture(currentOccupancy?.moveInDate) &&
            !allowEarlyMoveIn
          ) {
            showToast(t('occupancy.errors.moveInDateNotReached'));
            return;
          }
          const validationError = validateContractTerms(contractValues, {
            rentRequired: true,
            catalogDefaultRent: catalogRent,
            foodPolicy,
          });
          if (validationError) {
            showToast(t(validationError));
            return;
          }
          const contract = buildContractSnapshotPayload(contractValues, { foodPolicy });
          await moveIn(occupancyId, {
            expectedExitDate: expectedExitDate ?? null,
            allowEarlyMoveIn,
            agreementSigned,
            remarks: remarks ?? null,
            ...contract,
            createMealParticipation: shouldCreateMealParticipationFromContract(contract),
          });
        } else if (mode === 'TRANSFER') {
          if (!occupancyId || !contractValues) {
            showToast(t('occupancy.errors.noActive'));
            return;
          }
          const rentRequired =
            rentPolicy === 'CUSTOM' ||
            (rentPolicy === 'APPLY_NEW');
          const validationError = validateContractTerms(contractValues, {
            rentRequired,
            catalogDefaultRent: catalogRent,
            foodPolicy,
          });
          if (validationError) {
            showToast(t(validationError));
            return;
          }
          const contract = buildTransferContractPayload(
            rentPolicy,
            contractValues,
            foodPolicy,
          );
          const { body, errorKey } = buildTransferRequest(
            spaceType,
            target.targetType,
            {
              bedId: target.bedId,
              roomId: target.roomId,
              unitId: target.unitId,
            },
            { remarks, rentPolicy, contract },
          );
          if (!body || errorKey) {
            showToast(t(errorKey ?? 'occupancy.errors.generic'));
            return;
          }
          await transfer(occupancyId, body);
        } else if (mode === 'VACATE') {
          if (!occupancyId) {
            showToast(t('occupancy.errors.noActive'));
            return;
          }
          await vacate(occupancyId, { remarks: remarks ?? null });
        }

        showToast(t('occupancy.success.updated'));
        onSuccess();
      } catch (err) {
        showToast(getOccupancyErrorMessage(err));
      }
    },
    [allocate, moveIn, reserve, showToast, t, transfer, vacate],
  );

  return { submit, loading };
}
