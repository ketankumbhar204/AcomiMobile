import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
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

const DEFAULT_MIN_SHEET_RATIO = 0.5;
const DEFAULT_MAX_SHEET_RATIO = 0.85;
/** Ignore backdrop taps briefly so the opening press does not instantly dismiss the sheet. */
const BACKDROP_DELAY_MS = 700;

type MenuPlanningBottomSheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  /** Replaces title/subtitle in the header center (e.g. date navigator). */
  headerCenter?: React.ReactNode;
  onClose: () => void;
  onBack?: () => void;
  stickyHeader?: React.ReactNode;
  /** Optional actions in the header trailing area (before close). */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollContentStyle?: ViewStyle;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  /** Blocks interaction with a loading overlay (e.g. in-flight API save). */
  busy?: boolean;
  /** Minimum sheet height as a fraction of available height (default 0.5). */
  minHeightRatio?: number;
  /** Maximum sheet height as a fraction of available height (default 0.85). */
  maxHeightRatio?: number;
};

export function MenuPlanningBottomSheet({
  visible,
  title,
  subtitle,
  headerCenter,
  onClose,
  onBack,
  stickyHeader,
  headerActions,
  children,
  footer,
  scrollContentStyle,
  scrollViewRef,
  busy = false,
  minHeightRatio = DEFAULT_MIN_SHEET_RATIO,
  maxHeightRatio = DEFAULT_MAX_SHEET_RATIO,
}: MenuPlanningBottomSheetProps) {
  const { height: windowHeightRaw } = useWindowDimensions();
  // Modal first paint on Android can report 0 — fall back to screen size.
  const windowHeight =
    windowHeightRaw > 0 ? windowHeightRaw : Dimensions.get('window').height;
  const [headerHeight, setHeaderHeight] = useState(0);
  const [stickyHeight, setStickyHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [backdropDismissible, setBackdropDismissible] = useState(false);
  const backdropTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const internalScrollRef = useRef<ScrollView>(null);
  const resolvedScrollRef = scrollViewRef ?? internalScrollRef;

  const handleRequestClose = () => {
    if (busy) {
      return;
    }
    (onBack ?? onClose)();
  };

  useEffect(() => {
    if (!visible) {
      setContentHeight(0);
      setFooterHeight(0);
      setStickyHeight(0);
      setKeyboardHeight(0);
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

  useEffect(() => {
    if (!visible) {
      return;
    }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, event => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  // Keep the sheet within the visible area above the keyboard so header/search are not clipped.
  const availableHeight = Math.max(windowHeight - keyboardHeight, 300);
  const minSheetHeight = Math.min(Math.max(availableHeight * minHeightRatio, 240), availableHeight);
  const maxSheetHeight = Math.min(
    Math.max(availableHeight * Math.max(maxHeightRatio, minHeightRatio), 280),
    availableHeight,
  );
  const sheetBottomPadding = spacing.lg;

  const chromeHeight = headerHeight + stickyHeight + footerHeight + sheetBottomPadding;
  const naturalHeight = chromeHeight + contentHeight;

  const sheetHeight = useMemo(() => {
    if (headerHeight === 0) {
      return Math.min(minSheetHeight, maxSheetHeight);
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
    if (busy || !backdropDismissible) {
      return;
    }
    onClose();
  }, [backdropDismissible, busy, onClose]);

  // Unmount when closed. A hidden Modal can still intercept touches on Android and
  // block buttons behind it (e.g. Menu Library "Add or remove extras").
  // This sheet is rendered as a Screen sibling (not inside ScrollView), so mounting
  // on open is safe for paint.
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={handleRequestClose}
      statusBarTranslucent>
      <View style={styles.backdrop} pointerEvents="auto">
        <Pressable
          style={styles.backdropTap}
          disabled={!backdropDismissible}
          onPress={handleBackdropPress}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetKeyboard}
          pointerEvents="box-none">
          <View
            style={[
              styles.sheet,
              { height: sheetHeight, maxHeight: availableHeight, paddingBottom: sheetBottomPadding },
            ]}>
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
                  {headerCenter ? (
                    headerCenter
                  ) : (
                    <>
                      <Text style={styles.sheetTitle} numberOfLines={1}>
                        {title}
                      </Text>
                      {subtitle ? (
                        <Text style={styles.sheetSubtitle} numberOfLines={1}>
                          {subtitle}
                        </Text>
                      ) : null}
                    </>
                  )}
                </View>
                <View style={styles.headerTrailing}>
                  {headerActions}
                  <Pressable
                    onPress={busy ? undefined : onClose}
                    hitSlop={12}
                    style={styles.headerSide}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel="Close">
                    <Text style={[styles.closeBtn, busy && styles.closeBtnDisabled]}>✕</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {stickyHeader ? (
              <View
                style={styles.stickyHeader}
                onLayout={event => setStickyHeight(event.nativeEvent.layout.height)}>
                {stickyHeader}
              </View>
            ) : null}

            <View style={styles.body}>
              <ScrollView
                ref={resolvedScrollRef}
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                scrollEnabled={scrollEnabled && !busy}
                bounces={scrollEnabled}
                onContentSizeChange={handleContentSizeChange}
                showsVerticalScrollIndicator={scrollEnabled}>
                {children}
              </ScrollView>
              {busy ? (
                <View style={styles.busyOverlay} pointerEvents="auto">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : null}
            </View>

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
  /**
   * Dimmed area only — zIndex below the sheet so it cannot cover / steal touches
   * from the drawer (same pattern as MemberMealActivityDaySheet).
   */
  backdropTap: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  sheetKeyboard: {
    width: '100%',
    zIndex: 2,
    elevation: 24,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 24,
    zIndex: 2,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    flexDirection: 'column',
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
  headerTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 32,
    gap: spacing.xs,
  },
  backBtnWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: { ...typography.bodyStrong, color: colors.primaryDark, fontSize: 22 },
  titleWrap: { flex: 1, alignItems: 'stretch', justifyContent: 'center', gap: 2, minWidth: 0 },
  sheetTitle: { ...typography.bodyStrong, fontSize: 16, textAlign: 'center' },
  sheetSubtitle: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
  },
  closeBtn: { ...typography.body, color: colors.muted, fontSize: 18 },
  closeBtnDisabled: { opacity: 0.4 },
  stickyHeader: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    flexShrink: 0,
  },
  body: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 120,
  },
  scrollView: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  scrollContent: { padding: spacing.xxl, paddingBottom: spacing.md },
  busyOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    flexShrink: 0,
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
