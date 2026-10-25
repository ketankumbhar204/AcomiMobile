import { useCallback, useState } from 'react';
import { PaymentServiceUnavailableError, paymentsApi } from '../api/paymentsApi';
import { ApiError, type SpacePaymentResponse, type UUID } from '../api/types';
import { useToastStore } from '../store/toastStore';
import { invalidateDashboardQueries } from '../utils/dashboardQueryCache';
import {
  receivablePayments,
  reminderEligiblePayments,
} from '../utils/ownerPaymentCardActions';
import { paymentReminderToastKey } from '../utils/paymentReminderFeedback';
import { firstWhatsAppPhone } from '../utils/photoRequest';
import { buildPaymentReminderMessage } from '../utils/paymentReminderMessage';
import { openReminderWhatsApp } from '../utils/paymentReminderLaunch';
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
  const [reminderQueue, setReminderQueue] = useState<SpacePaymentResponse[]>([]);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderNotice, setReminderNotice] = useState('');

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

  const beginReminders = useCallback(
    (payments: SpacePaymentResponse[]) => {
      const first = payments[0];
      if (!first) {
        showToast(t('paymentCollection.reminder.noneActionable'));
        return;
      }
      setReminderNotice('');
      setReminderMessage(buildPaymentReminderMessage(first));
      setReminderQueue(payments);
    },
    [showToast, t],
  );

  const confirmReminder = useCallback(async () => {
    const payment = reminderQueue[0];
    const message = reminderMessage.trim();
    if (!payment || !message) {
      return;
    }
    setProcessingKey(payment.paymentId);
    setProcessingAction('reminder');
    setReminderNotice('');
    try {
      const result = await paymentsApi.sendPaymentReminder(spaceId, payment.paymentId);
      let launch: Awaited<ReturnType<typeof openReminderWhatsApp>> = 'invalid';
      try {
        launch = await openReminderWhatsApp(
          {
            ...result,
            internationalPhone:
              result.internationalPhone || firstWhatsAppPhone([payment.memberMobile]),
          },
          message,
        );
      } catch {
        launch = 'failed';
      }
      if (result.inAppFailureCode === 'NOTIFICATION_FAILED') {
        showToast(t('paymentCollection.reminder.notificationFailed'));
      } else if (result.inAppFailureCode === 'MEMBER_NOT_ON_ACOMI') {
        showToast(t('paymentCollection.reminder.memberNotOnAcomi'));
      } else if (result.inAppRecorded && launch !== 'opened') {
        showToast(t('paymentCollection.reminder.inAppSaved'));
      }
      if (launch === 'opened') {
        showToast(
          t(
            result.inAppRecorded
              ? 'paymentCollection.reminder.openedWhatsApp'
              : 'paymentCollection.reminder.whatsAppReady',
          ),
        );
      } else if (launch === 'copied') {
        showToast(t('paymentCollection.reminder.copied'));
      } else if (launch === 'invalid') {
        setReminderNotice(
          t('paymentCollection.reminder.whatsAppUnavailable', {
            defaultValue:
              'This number can’t be opened in WhatsApp. You can still save the in-app reminder.',
          }),
        );
        if (result.inAppFailureCode !== 'NOTIFICATION_FAILED') {
          showToast(t(paymentReminderToastKey('invalidRecipient')));
        }
      } else {
        showToast(t('paymentCollection.reminder.whatsAppFailed'));
      }
      if (launch === 'invalid') {
        return;
      }
      const rest = reminderQueue.slice(1);
      setReminderQueue(rest);
      setReminderMessage(rest[0] ? buildPaymentReminderMessage(rest[0]) : '');
      setReminderNotice('');
    } catch (err) {
      if (err instanceof PaymentServiceUnavailableError) {
        showToast(t('paymentCollection.serviceUnavailable.title'));
      } else if (err instanceof ApiError && err.status === 409 && err.message) {
        showToast(err.message);
      } else {
        showToast(t('paymentCollection.reminder.failed'));
      }
    } finally {
      setProcessingKey(null);
      setProcessingAction(null);
    }
  }, [reminderMessage, reminderQueue, showToast, spaceId, t]);

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
      beginReminders([payment]);
    },
    [beginReminders],
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
        beginReminders(targets);
      } catch {
        setProcessingKey(null);
        setProcessingAction(null);
        showToast(t('paymentCollection.reminder.failed'));
      }
    },
    [beginReminders, month, showToast, spaceId, t],
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
    reminderDraft: reminderQueue[0] ?? null,
    reminderPhone: firstWhatsAppPhone([reminderQueue[0]?.memberMobile]),
    reminderMessage,
    setReminderMessage,
    reminderNotice,
    confirmReminder: () => void confirmReminder(),
    cancelReminder: () => {
      setReminderQueue([]);
      setReminderNotice('');
    },
    confirmReceived: () => void markPaymentsReceived(confirmPayments),
    cancelConfirm: () => setConfirmPayments([]),
    receivedConfirmLoading:
      processingAction === 'received' &&
      confirmPayments.length > 0 &&
      processingKey != null,
  };
}
