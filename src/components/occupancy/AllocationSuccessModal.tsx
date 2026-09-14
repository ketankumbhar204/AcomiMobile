import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type AllocationSuccessModalProps = {
  visible: boolean;
  memberName: string;
  locationLabel: string;
  onViewDetails: () => void;
  onDone: () => void;
};

export function AllocationSuccessModal({
  visible,
  memberName,
  locationLabel,
  onViewDetails,
  onDone,
}: AllocationSuccessModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.rings}>
            <View style={styles.ringOuter}>
              <View style={styles.ringMiddle}>
                <View style={styles.ringInner}>
                  <Check size={36} color={colors.white} strokeWidth={3} />
                </View>
              </View>
            </View>
          </View>
          <Text style={styles.title}>{t('occupancy.success.title')}</Text>
          <Text style={styles.headline}>{t('occupancy.success.allocatedHeadline')}</Text>
          <Text style={styles.detail}>
            {t('occupancy.success.allocatedDetail', {
              name: memberName,
              location: locationLabel,
            })}
          </Text>
          <Button
            label={t('occupancy.success.viewDetails')}
            onPress={onViewDetails}
            style={styles.primaryBtn}
          />
          <Pressable
            onPress={onDone}
            style={({ pressed }) => [styles.doneBtn, pressed && styles.donePressed]}
            accessibilityRole="button">
            <Text style={styles.doneLabel}>{t('common.done')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  rings: {
    marginBottom: spacing.lg,
  },
  ringOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringMiddle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${colors.primary}28`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headline: {
    ...typography.bodyStrong,
    fontSize: 16,
    textAlign: 'center',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  detail: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    marginBottom: spacing.sm,
  },
  doneBtn: {
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  donePressed: {
    backgroundColor: colors.successTint,
  },
  doneLabel: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
