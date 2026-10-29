import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle } from 'lucide-react-native';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const TOAST_DURATION_MS = 3000;

export function Toast() {
  const insets = useSafeAreaInsets();
  const message = useToastStore(state => state.message);
  const onPress = useToastStore(state => state.onPress);
  const tone = useToastStore(state => state.tone);
  const hideToast = useToastStore(state => state.hideToast);
  const isError = tone === 'error';

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
    <View
      style={[styles.container, { bottom: insets.bottom + spacing.xl }]}
      pointerEvents={onPress ? 'box-none' : 'none'}>
      <Pressable
        style={[styles.toast, isError && styles.toastError]}
        disabled={!onPress}
        onPress={() => {
          const action = onPress;
          hideToast();
          action?.();
        }}
        accessibilityRole={onPress ? 'button' : isError ? 'alert' : 'text'}>
        {isError ? (
          <AlertCircle size={18} color={colors.danger} strokeWidth={2.4} />
        ) : null}
        <Text style={[styles.text, isError && styles.textError]}>{message}</Text>
      </Pressable>
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
    backgroundColor: colors.guidance.surface,
    borderRadius: radius.section,
    borderWidth: 1,
    borderColor: colors.guidance.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: '100%',
    ...shadows.md,
  },
  toastError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  text: {
    ...typography.bodyStrong,
    color: colors.guidance.text,
    textAlign: 'center',
  },
  textError: {
    flex: 1,
    color: '#991B1B',
    textAlign: 'left',
  },
});
