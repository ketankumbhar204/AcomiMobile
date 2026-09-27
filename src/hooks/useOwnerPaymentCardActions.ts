import { useCallback, useState } from 'react';
import { PaymentServiceUnavailableError, paymentsApi } from '../api/paymentsApi';
import type { SpacePaymentResponse, UUID } from '../api/types';
import { useToastStore } from '../store/toastStore';
import { invalidateDashboardQueries } from '../utils/dashboardQueryCache';
import {
  receivablePayments,
  reminderEligiblePayments,
} from '../utils/ownerPaymentCardActions';
import {
  paymentReminderToastKey,
  resolvePaymentReminderToastKind,
} from '../utils/paymentReminderFeedback';
import { invalidatePaymentsMonthCaches } from '../utils/paymentsMonthCache';
import { useTranslation } from 'react-i18next';

export type OwnerCardProcessingAction = 'received' | 'reminder';

type UseOwnerPaymentCardActionsArgs = {
  spaceId: UUID;
  month: string;
  onSettled?: () => void | Promise<void>;
};

export function useOwnerPaymentCardActions({
  spaceId,
  month,
  onSettled,
}: UseOwnerPaymentCardActionsArgs) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<OwnerCardProcessingAction | null>(
    null,
  );
  const [confirmPayments, setConfirmPayments] = useState<SpacePaymentResponse[]>([]);

  const refreshAfterChange = useCallback(async () => {
    invalidateDashboardQueries();
    invalidatePaymentsMonthCaches(spaceId, month);
    await onSettled?.();
  }, [month, onSettled, spaceId]);

  const isProcessing = useCallback(
    (key: string, action: OwnerCardProcessingAction) =>
      processingKey === key && processingAction === action,
    [processingAction, processingKey],
  );

  const markPaymentsReceived = useCallback(
    async (payments: SpacePaymentResponse[]) => {
      const first = payments[0];
      if (!first) {
        return;
      }
      const key = payments.length === 1 ? first.paymentId : `member:${first.memberId}`;
      setProcessingKey(key);
      setProcessingAction('received');
      try {
        for (const payment of payments) {
          await paymentsApi.markPaymentReceived(spaceId, payment.paymentId);
        }
        setConfirmPayments([]);
        showToast(t('paymentCollection.received.success'));
        await refreshAfterChange();
      } catch (err) {
        if (err instanceof PaymentServiceUnavailableError) {
          showToast(t('paymentCollection.serviceUnavailable.title'));
        } else {
          showToast(t('paymentCollection.received.failed'));
        }
      } finally {
        setProcessingKey(null);
        setProcessingAction(null);
      }
    },
    [refreshAfterChange, showToast, spaceId, t],
  );

  const sendReminders = useCallback(
    async (payments: SpacePaymentResponse[], key: string) => {
      if (payments.length === 0) {
        showToast(t('paymentCollection.reminder.noneActionable'));
        return;
      }
      setProcessingKey(key);
      setProcessingAction('reminder');
      try {
        let lastKind: ReturnType<typeof resolvePaymentReminderToastKind> = 'failed';
        for (const payment of payments) {
          const result = await paymentsApi.sendPaymentReminder(spaceId, payment.paymentId);
          lastKind = resolvePaymentReminderToastKind(result);
        }
        showToast(t(paymentReminderToastKey(lastKind)));
      } catch (err) {
        if (err instanceof PaymentServiceUnavailableError) {
          showToast(t('paymentCollection.serviceUnavailable.title'));
        } else {
          showToast(t('paymentCollection.reminder.failed'));
        }
      } finally {
        setProcessingKey(null);
        setProcessingAction(null);
      }
    },
    [showToast, spaceId, t],
  );

  const requestReceivedForPayment = useCallback((payment: SpacePaymentResponse) => {
    setConfirmPayments([payment]);
  }, []);

  const requestReceivedForMember = useCallback(
    async (memberId: UUID, memberName: string) => {
      const key = `member:${memberId}`;
      setProcessingKey(key);
      setProcessingAction('received');
      try {
        const response = await paymentsApi.listPayments(spaceId, {
          memberId,
          month,
          sync: false,
        });
        const targets = receivablePayments(response.payments ?? []);
        if (targets.length === 0) {
          showToast(t('paymentCollection.received.noneActionable', { name: memberName }));
          return;
        }
        setConfirmPayments(targets);
      } catch {
        showToast(t('paymentCollection.errors.loadPayment'));
      } finally {
        setProcessingKey(null);
        setProcessingAction(null);
      }
    },
    [month, showToast, spaceId, t],
  );

  const sendReminderForPayment = useCallback(
    (payment: SpacePaymentResponse) => {
      void sendReminders([payment], payment.paymentId);
    },
    [sendReminders],
  );

  const sendReminderForMember = useCallback(
    async (memberId: UUID) => {
      const key = `member:${memberId}`;
      setProcessingKey(key);
      setProcessingAction('reminder');
      try {
        const response = await paymentsApi.listPayments(spaceId, {
          memberId,
          month,
          sync: false,
        });
        const targets = reminderEligiblePayments(response.payments ?? []);
        setProcessingKey(null);
        setProcessingAction(null);
        await sendReminders(targets, key);
      } catch {
        setProcessingKey(null);
        setProcessingAction(null);
        showToast(t('paymentCollection.reminder.failed'));
      }
    },
    [month, sendReminders, showToast, spaceId, t],
  );

  return {
    processingKey,
    processingAction,
    confirmPayments,
    isProcessing,
    requestReceivedForPayment,
    requestReceivedForMember,
    sendReminderForPayment,
    sendReminderForMember,
    confirmReceived: () => void markPaymentsReceived(confirmPayments),
    cancelConfirm: () => setConfirmPayments([]),
    receivedConfirmLoading:
      processingAction === 'received' &&
      confirmPayments.length > 0 &&
      processingKey != null,
  };
}
