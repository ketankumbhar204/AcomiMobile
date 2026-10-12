import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import type { SpacePaymentResponse } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import {
  canOwnerMarkPaymentReceived,
  canOwnerSendPaymentReminder,
} from '../../utils/ownerPaymentCardActions';
import { OwnerPaymentCardActions } from './OwnerPaymentCardActions';
import { PaymentRecordDetails } from './PaymentRecordDetails';

type PaymentDetailsSheetProps = {
  payment: SpacePaymentResponse | null;
  spaceName?: string | null;
  receivedLoading?: boolean;
  reminderLoading?: boolean;
  onClose: () => void;
  onReceived: (payment: SpacePaymentResponse) => void;
  onReminder: (payment: SpacePaymentResponse) => void;
  onOpenFull?: (payment: SpacePaymentResponse) => void;
};

export function PaymentDetailsSheet({
  payment,
  spaceName,
  receivedLoading = false,
  reminderLoading = false,
  onClose,
  onReceived,
  onReminder,
  onOpenFull,
}: PaymentDetailsSheetProps) {
  const { t } = useTranslation();
  const visible = payment != null;
  const showReceived = payment != null && canOwnerMarkPaymentReceived(payment.paymentStatus);
  const showReminder = payment != null && canOwnerSendPaymentReminder(payment.reminderEligible);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('paymentCollection.detail.title', { defaultValue: 'Payment details' })}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', { defaultValue: 'Close' })}>
              <X size={20} color={colors.textPrimary} strokeWidth={2.2} />
            </Pressable>
          </View>
          {payment ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <PaymentRecordDetails payment={payment} spaceName={spaceName} />
              <OwnerPaymentCardActions
                showReceived={showReceived}
                showReminder={showReminder}
                receivedLoading={receivedLoading}
                reminderLoading={reminderLoading}
                onReceived={() => onReceived(payment)}
                onReminder={() => onReminder(payment)}
              />
              {onOpenFull ? (
                <Pressable
                  onPress={() => onOpenFull(payment)}
                  accessibilityRole="button"
                  style={styles.more}>
                  <Text style={styles.moreLabel}>
                    {t('paymentCollection.timeline.viewFull', { defaultValue: 'View full history' })}
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingBottom: spacing.lg,
    ...shadows.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  more: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  moreLabel: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 14,
  },
});
