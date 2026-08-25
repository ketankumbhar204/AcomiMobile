import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Button } from '../ui';

type DeleteAccountConfirmModalProps = {
  visible: boolean;
  confirmed: boolean;
  deleting: boolean;
  canDelete: boolean;
  error: string | null;
  onConfirmedChange: (confirmed: boolean) => void;
  onCancel: () => void;
  onDelete: () => void;
};

export function DeleteAccountConfirmModal({
  visible,
  confirmed,
  deleting,
  canDelete,
  error,
  onConfirmedChange,
  onCancel,
  onDelete,
}: DeleteAccountConfirmModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={deleting ? undefined : onCancel}
      statusBarTranslucent
      presentationStyle="overFullScreen">
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropTap}
          onPress={deleting ? undefined : onCancel}
          accessibilityRole="button"
        />
        <View style={styles.card}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.titleRow}>
              <TriangleAlert size={18} color={colors.danger} strokeWidth={2.2} />
              <Text style={styles.title}>{t('settings.profile.deleteAccountTitle')}</Text>
            </View>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            <Text style={styles.warning}>{t('settings.profile.deleteAccountPermanentWarning')}</Text>
            <Text style={styles.body}>{t('settings.profile.deleteAccountPersonalData')}</Text>
            <Text style={styles.body}>{t('settings.profile.deleteAccountRecordsKept')}</Text>
            <Pressable
              style={({ pressed }) => [styles.confirmRow, pressed && styles.pressed]}
              onPress={() => {
                if (!deleting) {
                  onConfirmedChange(!confirmed);
                }
              }}
              disabled={deleting}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: confirmed }}>
              <View style={[styles.checkbox, confirmed && styles.checkboxChecked]} />
              <Text style={styles.confirmLabel}>
                {t('settings.profile.deleteAccountUnderstand')}
              </Text>
            </Pressable>
          </ScrollView>
          <View style={styles.actions}>
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={onCancel}
              disabled={deleting}
              style={styles.actionButton}
            />
            <Button
              label={
                deleting
                  ? t('common.pleaseWait')
                  : t('settings.profile.deleteAccountFinalConfirm')
              }
              onPress={onDelete}
              loading={deleting}
              disabled={!canDelete}
              style={[styles.actionButton, styles.destructiveButton]}
            />
          </View>
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
    alignItems: 'center',
    padding: spacing.xl,
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    maxHeight: '86%',
    zIndex: 1,
    elevation: 8,
    ...shadows.md,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    flex: 1,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  warning: {
    ...typography.bodyStrong,
    color: colors.danger,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
  },
  confirmRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  confirmLabel: {
    ...typography.body,
    flex: 1,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  destructiveButton: {
    backgroundColor: colors.danger,
  },
});
