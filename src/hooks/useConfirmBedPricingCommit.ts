import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { accommodationApi } from '../api/accommodationApi';
import { useToastStore } from '../store/toastStore';
import {
  BedPricingCommitController,
  type BedPricingRequestInput,
  type PendingBedPricing,
} from '../utils/bedPricingCommitController';
import { updateBedDetails } from '../utils/accommodationInlineRename';

export function useConfirmBedPricingCommit(options: {
  spaceId: string;
  onSuccess?: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick(value => value + 1), []);
  const onSuccessRef = useRef(options.onSuccess);
  onSuccessRef.current = options.onSuccess;
  const spaceIdRef = useRef(options.spaceId);
  spaceIdRef.current = options.spaceId;

  const controller = useMemo(
    () =>
      new BedPricingCommitController({
        preview: async pending => {
          const result = await accommodationApi.previewBedPricing(
            pending.spaceId,
            pending.roomId,
            pending.bedId,
            {
              defaultRent: pending.defaultRent,
              defaultDeposit: pending.defaultDeposit,
            },
          );
          return {
            affectedBedCount: result.affectedBedCount,
            affectedLocations: result.affectedLocations ?? [],
          };
        },
        update: pending =>
          updateBedDetails(pending.spaceId, pending.roomId, pending.bedId, {
            name: pending.name,
            bedNumber: pending.bedNumber,
            status: pending.status,
            defaultRent: pending.defaultRent,
            defaultDeposit: pending.defaultDeposit,
          }),
      }),
    [],
  );

  const request = useCallback(
    (
      input: Omit<BedPricingRequestInput, 'spaceId'> & {
        spaceId?: string;
      },
    ) => {
      const done = controller.request({
        ...input,
        spaceId: input.spaceId ?? spaceIdRef.current,
      } as BedPricingRequestInput);
      rerender();
      void done.then(() => rerender());
    },
    [controller, rerender],
  );

  const close = useCallback(() => {
    controller.cancel();
    rerender();
  }, [controller, rerender]);

  const confirm = useCallback(async () => {
    const pending = controller.pending;
    const result = await controller.confirm();
    if (result === 'error') {
      controller.error = t('accommodation.pricingConfirm.updateFailed', {
        defaultValue: 'Unable to update pricing. No changes were applied.',
      });
    }
    rerender();
    if (result === 'success') {
      const count = pending?.affectedBedCount;
      const both =
        (pending?.changedFields.length ?? 0) > 1 ||
        (pending != null &&
          pending.changedFields.includes('defaultRent') &&
          pending.changedFields.includes('defaultDeposit'));
      showToast(
        count != null && count > 1
          ? t('accommodation.pricingConfirm.successCount', {
              count,
              defaultValue: '{{field}} updated for {{count}} beds.',
              field: both
                ? t('accommodation.pricingConfirm.price', { defaultValue: 'price' })
                : pending?.field === 'defaultDeposit'
                  ? t('accommodation.fields.deposit')
                  : t('accommodation.fields.rent'),
            })
          : t('accommodation.pricingConfirm.success', {
              defaultValue: 'Bed pricing updated.',
            }),
      );
      await onSuccessRef.current?.();
    }
  }, [controller, rerender, showToast, t]);

  return {
    pending: controller.pending as PendingBedPricing | null,
    confirming: controller.confirming,
    error: controller.error,
    busy: controller.busy,
    request,
    close,
    confirm,
  };
}
