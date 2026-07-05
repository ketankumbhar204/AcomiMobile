import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

const MIN_SHEET_RATIO = 0.5;
const MAX_SHEET_RATIO = 0.85;
/** Ignore backdrop taps briefly so the opening press does not instantly dismiss the sheet. */
const BACKDROP_DELAY_MS = 450;

type MenuPlanningBottomSheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onBack?: () => void;
  stickyHeader?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollContentStyle?: ViewStyle;
};

export function MenuPlanningBottomSheet({
  visible,
  title,
  subtitle,
  onClose,
  onBack,
  stickyHeader,
  children,
  footer,
  scrollContentStyle,
}: MenuPlanningBottomSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [backdropDismissible, setBackdropDismissible] = useState(false);
  const backdropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRequestClose = onBack ?? onClose;

  useEffect(() => {
    if (!visible) {
      setContentHeight(0);
      setFooterHeight(0);
      setBackdropDismissible(false);
      if (backdropTimerRef.current) {
        clearTimeout(backdropTimerRef.current);
        backdropTimerRef.current = null;
      }
      return;
    }

    backdropTimerRef.current = setTimeout(() => {
      setBackdropDismissible(true);
      backdropTimerRef.current = null;
    }, BACKDROP_DELAY_MS);

    return () => {
      if (backdropTimerRef.current) {
        clearTimeout(backdropTimerRef.current);
        backdropTimerRef.current = null;
      }
    };
  }, [visible]);

  const minSheetHeight = windowHeight * MIN_SHEET_RATIO;
  const maxSheetHeight = windowHeight * MAX_SHEET_RATIO;
  const sheetBottomPadding = spacing.lg;

  const chromeHeight = headerHeight + footerHeight + sheetBottomPadding;
  const naturalHeight = chromeHeight + contentHeight;

  const sheetHeight = useMemo(() => {
    if (headerHeight === 0) {
      return minSheetHeight;
    }
    return Math.min(Math.max(naturalHeight, minSheetHeight), maxSheetHeight);
  }, [headerHeight, maxSheetHeight, minSheetHeight, naturalHeight]);

  const scrollEnabled = naturalHeight > maxSheetHeight;

  const handleHeaderLayout = useCallback((height: number) => {
    setHeaderHeight(height);
  }, []);

  const handleFooterLayout = useCallback((height: number) => {
    setFooterHeight(height);
  }, []);

  const handleContentSizeChange = useCallback((_width: number, height: number) => {
    setContentHeight(height);
  }, []);

  const handleBackdropPress = useCallback(() => {
    if (backdropDismissible) {
      onClose();
    }
  }, [backdropDismissible, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={handleRequestClose}
      statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropFill}
          onPress={handleBackdropPress}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetKeyboard}
          pointerEvents="box-none">
          <View style={[styles.sheet, { height: sheetHeight, paddingBottom: sheetBottomPadding }]}>
            <View onLayout={event => handleHeaderLayout(event.nativeEvent.layout.height)}>
              <View style={styles.handle} />
              <View style={styles.sheetHeader}>
                {onBack ? (
                  <Pressable onPress={onBack} hitSlop={12} style={styles.backBtnWrap}>
                    <Text style={styles.backBtn}>←</Text>
                  </Pressable>
                ) : (
                  <View style={styles.headerSide} />
                )}
                <View style={styles.titleWrap}>
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text style={styles.sheetSubtitle} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
                <Pressable onPress={onClose} hitSlop={12} style={styles.headerSide}>
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>
            </View>

            {stickyHeader ? (
              <View style={styles.stickyHeader}>{stickyHeader}</View>
            ) : null}

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                scrollContentStyle,
              ]}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={scrollEnabled}
              bounces={scrollEnabled}
              onContentSizeChange={handleContentSizeChange}
              showsVerticalScrollIndicator={scrollEnabled}>
              {children}
            </ScrollView>

            {footer ? (
              <View
                style={styles.footer}
                onLayout={event => handleFooterLayout(event.nativeEvent.layout.height)}>
                {footer}
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
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
  backdropFill: {
    ...StyleSheet.absoluteFill,
  },
  sheetKeyboard: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    flexDirection: 'column',
  },
  scrollView: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 160,
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
  titleWrap: { flex: 1, alignItems: 'center', gap: 2 },
  sheetTitle: { ...typography.bodyStrong, fontSize: 16, textAlign: 'center' },
  sheetSubtitle: { ...typography.caption, color: colors.muted, textAlign: 'center', fontWeight: '600' },
  closeBtn: { ...typography.body, color: colors.muted, fontSize: 18 },
  stickyHeader: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
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
