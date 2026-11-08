import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TransferRentPolicy, OccupancyResponse, AmenityAssignment } from '../../../api/types';
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
import { applyStayChoice, type StayChoice } from '../../../utils/shortStay';
import { supportsSpaceAmenities } from '../../../utils/amenities';

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
  stayChoice?: StayChoice;
  agreedTotal?: number | null;
  shortStayEnabled?: boolean;
  remarks?: string;
  agreementSigned?: boolean;
  allowEarlyMoveIn?: boolean;
  occupancyId?: string;
  currentOccupancy?: OccupancyResponse | null;
  assignedAmenities?: AmenityAssignment[];
  onSuccess: () => void;
  onInvalidContract?: (errorKey: string) => void;
};

export function useOccupancyWizardSubmit(spaceId: string) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const showError = useCallback(
    (message: string) => showToast(message, undefined, 'error'),
    [showToast],
  );
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
        stayChoice = 'MONTHLY',
        agreedTotal,
        remarks,
        agreementSigned = false,
        allowEarlyMoveIn = false,
        occupancyId,
        currentOccupancy,
        assignedAmenities,
        onSuccess,
        onInvalidContract,
      } = ctx;

      const amenitiesPayload =
        supportsSpaceAmenities(spaceType) && assignedAmenities
          ? assignedAmenities
          : undefined;

      // Destination stay type is always the wizard choice (Transfer may differ from source).
      const shortStay = stayChoice === 'SHORT';

      const withStay = <T extends Parameters<typeof applyStayChoice>[0]>(body: T) => {
        const dailyFromContract =
          stayChoice === 'SHORT'
            ? (() => {
                const raw = contractValues?.rentSnapshot?.trim();
                if (!raw) {
                  return null;
                }
                const n = Number(raw.replace(/,/g, ''));
                return Number.isFinite(n) && n > 0 ? n : null;
              })()
            : null;
        const stayed = applyStayChoice(body, {
          enabled: true,
          choice: stayChoice,
          dailyRent: dailyFromContract,
          agreedTotal:
            agreedTotal ??
            (stayChoice === 'SHORT' ? currentOccupancy?.agreedTotal ?? null : null),
          expectedExitDate:
            expectedExitDate ??
            (stayChoice === 'SHORT'
              ? currentOccupancy?.expectedExitDate ??
                currentOccupancy?.expectedCheckoutDate ??
                null
              : expectedExitDate ?? null),
          checkInDate: moveInDate,
        });
        if (stayed.errorKey) {
          showError(
            t(stayed.errorKey, {
              defaultValue:
                stayed.errorKey === 'occupancy.section.expectedMoveOut'
                  ? 'A short stay needs a checkout date.'
                  : stayed.errorKey === 'occupancy.errors.codes.SHORT_STAY_SAME_DAY'
                    ? 'A short stay checkout must be after the check-in date. The same date is not a stay.'
                    : stayed.errorKey === 'occupancy.errors.codes.SHORT_STAY_CROSSES_MONTH'
                      ? 'A short stay cannot cover nights in more than one calendar month.'
                      : stayed.errorKey === 'occupancy.contract.dailyRent'
                        ? 'Enter a daily rent greater than zero.'
                        : 'Enter a daily rent greater than zero.',
            }),
          );
          return null;
        }
        return stayed.body;
      };

      try {
        if (mode === 'ALLOCATE') {
          if (!contractValues) {
            showError(t('occupancy.errors.generic'));
            return;
          }
          const validationError = validateContractTerms(contractValues, {
            rentRequired: !shortStay,
            catalogDefaultRent: catalogRent,
            foodPolicy,
          });
          if (validationError) {
            showError(t(validationError));
            onInvalidContract?.(validationError);
            return;
          }
          const contract = buildContractSnapshotPayload(contractValues, { foodPolicy });
          // SHORT: rentSnapshot is daily ₹/night; stay rent = daily × nights (agreedTotal via withStay).
          if (!moveInDate?.trim()) {
            showError(
              t('occupancy.errors.moveInDateRequired', {
                defaultValue: 'Choose a move-in date.',
              }),
            );
            return;
          }
          const { body, errorKey } = buildAllocateRequest(
            memberId,
            spaceType,
            target.targetType,
            {
              bedId: target.bedId,
              roomId: target.roomId,
              unitId: target.unitId,
            },
            {
              moveInDate: moveInDate.trim(),
              remarks,
              contract,
              amenities: amenitiesPayload,
            },
          );
          if (!body || errorKey) {
            showError(t(errorKey ?? 'occupancy.errors.generic'));
            return;
          }
          const stayedBody = withStay(body);
          if (!stayedBody) {
            return;
          }
          if (shouldCreateMealParticipationFromContract(contract)) {
            stayedBody.createMealParticipation = true;
          }
          await allocate(stayedBody);
        } else if (mode === 'RESERVE') {
          if (!shortStay) {
            if (!contractValues) {
              showError(t('occupancy.errors.generic'));
              return;
            }
            const validationError = validateContractTerms(contractValues, {
              rentRequired: true,
              catalogDefaultRent: catalogRent,
              foodPolicy,
            });
            if (validationError) {
              showError(t(validationError));
              onInvalidContract?.(validationError);
              return;
            }
          } else if (contractValues) {
            // Deposit/food optional for SHORT; agreed total validated in withStay.
          }
          const contract = contractValues
            ? buildContractSnapshotPayload(contractValues, { foodPolicy })
            : null;
          const advanceRaw = contractValues?.bookingAdvanceAmount?.trim()
            ? Number(contractValues.bookingAdvanceAmount)
            : null;
          const bookingAdvanceAmount =
            advanceRaw != null && Number.isFinite(advanceRaw) && advanceRaw > 0
              ? advanceRaw
              : null;
          if (
            bookingAdvanceAmount != null &&
            contract?.rentSnapshot != null &&
            stayChoice !== 'SHORT' &&
            bookingAdvanceAmount > contract.rentSnapshot
          ) {
            showError(
              t('occupancy.bookingAdvance.errors.exceedsRent', {
                defaultValue: 'Booking advance cannot exceed the first-period rent.',
              }),
            );
            return;
          }
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
              // SHORT: daily ₹/night; MONTHLY/OPEN_ENDED: monthly or daily rent snapshot.
              rentSnapshot: contract?.rentSnapshot,
              bookingAdvanceAmount,
              bookingAdvanceCollected: bookingAdvanceAmount
                ? Boolean(contractValues?.bookingAdvanceCollected)
                : undefined,
              depositSnapshot: contract?.depositSnapshot,
              foodEnabled: contract?.foodEnabled,
              foodIncludedInRent: contract?.foodIncludedInRent,
              foodChargeSnapshot: contract?.foodChargeSnapshot,
            },
          );
          if (!body || errorKey) {
            showError(t(errorKey ?? 'occupancy.errors.generic'));
            return;
          }
          const stayedBody = withStay(body);
          if (!stayedBody) {
            return;
          }
          await reserve(stayedBody);
        } else if (mode === 'MOVE_IN') {
          // MOVE_IN = activate existing RESERVED occupancy (not walk-in ALLOCATE).
          if (!occupancyId || !contractValues) {
            showError(t('occupancy.errors.noReserved'));
            return;
          }
          if (
            isMoveInDateInFuture(currentOccupancy?.moveInDate) &&
            !allowEarlyMoveIn
          ) {
            showError(t('occupancy.errors.moveInDateNotReached'));
            return;
          }
          const validationError = validateContractTerms(contractValues, {
            rentRequired: !shortStay,
            catalogDefaultRent: catalogRent,
            foodPolicy,
          });
          if (validationError) {
            showError(t(validationError));
            onInvalidContract?.(validationError);
            return;
          }
          const contract = buildContractSnapshotPayload(contractValues, { foodPolicy });
          const stayedBody = withStay({
            expectedExitDate: expectedExitDate ?? null,
            allowEarlyMoveIn,
            agreementSigned,
            remarks: remarks ?? null,
            ...contract,
            createMealParticipation: shouldCreateMealParticipationFromContract(contract),
            amenities: amenitiesPayload,
          });
          if (!stayedBody) {
            return;
          }
          await moveIn(occupancyId, stayedBody);
        } else if (mode === 'TRANSFER') {
          if (!occupancyId || !contractValues) {
            showError(t('occupancy.errors.noActive'));
            return;
          }
          const rentRequired =
            !shortStay && (rentPolicy === 'CUSTOM' || rentPolicy === 'APPLY_NEW');
          const validationError = validateContractTerms(contractValues, {
            rentRequired,
            catalogDefaultRent: catalogRent,
            foodPolicy,
          });
          if (validationError) {
            showError(t(validationError));
            onInvalidContract?.(validationError);
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
            { remarks, rentPolicy, contract, amenities: amenitiesPayload },
          );
          if (!body || errorKey) {
            showError(t(errorKey ?? 'occupancy.errors.generic'));
            return;
          }
          const stayedBody = withStay(body);
          if (!stayedBody) {
            return;
          }
          await transfer(occupancyId, stayedBody);
        } else if (mode === 'VACATE') {
          if (!occupancyId) {
            showError(t('occupancy.errors.noActive'));
            return;
          }
          await vacate(occupancyId, { remarks: remarks ?? null });
        }

        // ALLOCATE / RESERVE / TRANSFER / MOVE_IN use AllocationSuccessModal; avoid duplicate toast.
        if (mode === 'VACATE') {
          showToast(t('occupancy.success.updated'));
        }
        onSuccess();
      } catch (err) {
        showError(getOccupancyErrorMessage(err));
        throw err;
      }
    },
    [allocate, moveIn, reserve, showError, showToast, t, transfer, vacate],
  );

  return { submit, loading };
}
