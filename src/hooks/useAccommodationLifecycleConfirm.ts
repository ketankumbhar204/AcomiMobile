import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToastStore } from '../store/toastStore';
import { getAccommodationErrorMessage } from '../utils/accommodationErrors';

export type LifecycleDeleteEntityType =
  | 'building'
  | 'floor'
  | 'unit'
  | 'room'
  | 'bed';

type ConfirmConfig = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
  onSuccess?: () => void;
};

export function useAccommodationLifecycleConfirm() {
  const { t } = useTranslation();
  const { showConfirm } = useConfirmDialog();
  const showToast = useToastStore(state => state.showToast);

  const confirmAction = useCallback(
    ({
      title,
      message,
      confirmLabel,
      destructive = false,
      onConfirm,
      onSuccess,
    }: ConfirmConfig) => {
      showConfirm({
        title,
        message,
        confirmLabel,
        destructive,
        onConfirm: async () => {
          try {
            await onConfirm();
            onSuccess?.();
          } catch (err) {
            showToast(getAccommodationErrorMessage(err, 'accommodation.errors.generic'));
          }
        },
      });
    },
    [showConfirm, showToast],
  );

  const confirmDeactivate = useCallback(
    (onConfirm: () => Promise<void>, onSuccess?: () => void) => {
      confirmAction({
        title: t('accommodation.lifecycle.deactivateTitle'),
        message: t('accommodation.lifecycle.deactivateMessage'),
        confirmLabel: t('accommodation.lifecycle.deactivateConfirm'),
        destructive: true,
        onConfirm,
        onSuccess,
      });
    },
    [confirmAction, t],
  );

  const confirmRestore = useCallback(
    (onConfirm: () => Promise<void>, onSuccess?: () => void) => {
      confirmAction({
        title: t('accommodation.lifecycle.restoreTitle'),
        message: t('accommodation.lifecycle.restoreMessage'),
        confirmLabel: t('accommodation.lifecycle.restoreConfirm'),
        onConfirm,
        onSuccess,
      });
    },
    [confirmAction, t],
  );

  const confirmDelete = useCallback(
    (
      entityType: LifecycleDeleteEntityType,
      onConfirm: () => Promise<void>,
      onSuccess?: () => void,
    ) => {
      confirmAction({
        title: t(`accommodation.lifecycle.delete.${entityType}.title`),
        message: t(`accommodation.lifecycle.delete.${entityType}.message`),
        confirmLabel: t('accommodation.lifecycle.deleteConfirm'),
        destructive: true,
        onConfirm,
        onSuccess,
      });
    },
    [confirmAction, t],
  );

  return { confirmDeactivate, confirmRestore, confirmDelete };
}
