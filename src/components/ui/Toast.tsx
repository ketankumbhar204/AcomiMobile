import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const TOAST_DURATION_MS = 3000;

export function Toast() {
  const insets = useSafeAreaInsets();
  const message = useToastStore(state => state.message);
  const hideToast = useToastStore(state => state.hideToast);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(hideToast, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [hideToast, message]);

  if (!message) {
    return null;
  }

  return (
    <View style={[styles.container, { bottom: insets.bottom + spacing.xl }]} pointerEvents="none">
      <View style={styles.toast}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: '100%',
    ...shadows.md,
  },
  text: {
    ...typography.bodyStrong,
    color: colors.white,
    textAlign: 'center',
  },
});
