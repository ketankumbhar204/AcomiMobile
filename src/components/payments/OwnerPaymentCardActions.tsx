import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Send } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';

type OwnerPaymentCardActionsProps = {
  showReceived: boolean;
  showReminder: boolean;
  receivedLoading?: boolean;
  reminderLoading?: boolean;
  disabled?: boolean;
  onReceived: () => void;
  onReminder: () => void;
};

function ActionButton({
  label,
  icon: Icon,
  variant,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  icon: typeof Check;
  variant: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={event => {
        event.stopPropagation?.();
        onPress();
      }}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnSecondary,
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && !loading && styles.btnPressed,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? colors.white : colors.primaryDark}
        />
      ) : (
        <Icon
          size={14}
          color={isPrimary ? colors.white : colors.primaryDark}
          strokeWidth={2.3}
        />
      )}
      <Text
        style={[styles.btnLabel, isPrimary ? styles.btnLabelPrimary : styles.btnLabelSecondary]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function OwnerPaymentCardActions({
  showReceived,
  showReminder,
  receivedLoading = false,
  reminderLoading = false,
  disabled = false,
  onReceived,
  onReminder,
}: OwnerPaymentCardActionsProps) {
  const { t } = useTranslation();
  if (!showReceived && !showReminder) {
    return null;
  }

  return (
    <View style={styles.row}>
      {showReceived ? (
        <ActionButton
          label={t('paymentCollection.received.action')}
          icon={Check}
          variant="primary"
          loading={receivedLoading}
          disabled={disabled || reminderLoading}
          onPress={onReceived}
        />
      ) : null}
      {showReminder ? (
        <ActionButton
          label={t('paymentCollection.reminder.send')}
          icon={Send}
          variant="secondary"
          loading={reminderLoading}
          disabled={disabled || receivedLoading}
          onPress={onReminder}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPressed: {
    opacity: 0.92,
  },
  btnLabel: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 13,
  },
  btnLabelPrimary: {
    color: colors.white,
  },
  btnLabelSecondary: {
    color: colors.primaryDark,
  },
});
