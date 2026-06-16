import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

type MenuPlanningBottomSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollContentStyle?: ViewStyle;
};

export function MenuPlanningBottomSheet({
  visible,
  title,
  onClose,
  onBack,
  children,
  footer,
  scrollContentStyle,
}: MenuPlanningBottomSheetProps) {
  const handleRequestClose = onBack ?? onClose;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleRequestClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            {onBack ? (
              <Pressable onPress={onBack} hitSlop={12} style={styles.backBtnWrap}>
                <Text style={styles.backBtn}>←</Text>
              </Pressable>
            ) : (
              <View style={styles.headerSide} />
            )}
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.headerSide}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SheetPrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      style={[sheetButtonStyles.saveButton, disabled && sheetButtonStyles.saveButtonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}>
      <Text style={sheetButtonStyles.saveButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SheetSecondaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[sheetButtonStyles.secondaryButton, disabled && sheetButtonStyles.saveButtonDisabled]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={sheetButtonStyles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdropTouch: { flex: 1 },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: spacing.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerSide: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: { ...typography.bodyStrong, color: colors.primaryDark, fontSize: 22 },
  sheetTitle: { ...typography.bodyStrong, fontSize: 16, flex: 1, textAlign: 'center' },
  closeBtn: { ...typography.body, color: colors.muted, fontSize: 18 },
  scroll: { flexShrink: 1 },
  scrollContent: { padding: spacing.xxl, paddingBottom: spacing.md },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
});

const sheetButtonStyles = StyleSheet.create({
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { ...typography.bodyStrong, color: colors.white, fontSize: 14 },
  secondaryButton: {
    backgroundColor: colors.lightGreen,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  secondaryButtonText: { ...typography.bodyStrong, color: colors.primaryDark, fontSize: 14 },
});
