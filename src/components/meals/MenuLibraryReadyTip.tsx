import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ChevronRight, CircleCheck, X } from 'lucide-react-native';
import type { UUID } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';

function tipStorageKey(spaceId: UUID): string {
  return `@acomi/menu-library-ready-tip:${spaceId}`;
}

type MenuLibraryReadyTipProps = {
  spaceId: UUID;
  /** Show when library already has items/combos (including samples). */
  visible: boolean;
  onContinuePlanning: () => void;
};

/**
 * Compact first-visit tip. Dismissal is stored per space and does not change library data.
 * Continuing to menu planning dismisses the tip the same way as the close action.
 */
export function MenuLibraryReadyTip({
  spaceId,
  visible,
  onContinuePlanning,
}: MenuLibraryReadyTipProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(tipStorageKey(spaceId)).then(value => {
      if (!cancelled) {
        setDismissed(value === '1');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    void AsyncStorage.setItem(tipStorageKey(spaceId), '1');
  }, [spaceId]);

  if (!visible || dismissed) {
    return null;
  }

  return (
    <View style={styles.card} accessibilityRole="summary" testID="library-ready-tip">
      <View style={styles.header}>
        <CircleCheck size={18} color={colors.success} strokeWidth={2.2} />
        <View style={styles.copy}>
          <Text style={styles.title}>{t('meals.library.readyTipTitle')}</Text>
          <Text style={styles.body}>{t('meals.library.readyTipBody')}</Text>
        </View>
        <Pressable
          onPress={dismiss}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('common.dismiss', { defaultValue: 'Dismiss' })}
          testID="library-ready-dismiss">
          <X size={18} color={colors.muted} strokeWidth={2.2} />
        </Pressable>
      </View>
      <Pressable
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
        onPress={() => {
          dismiss();
          onContinuePlanning();
        }}
        accessibilityRole="button"
        testID="library-ready-continue">
        <CalendarDays size={16} color={colors.white} strokeWidth={2.2} />
        <Text style={styles.primaryLabel} numberOfLines={1}>
          {t('meals.library.readyTipContinue')}
        </Text>
        <ChevronRight size={16} color={colors.white} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.mintSubtle,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    fontWeight: '700',
  },
  body: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  primaryBtn: {
    minHeight: 40,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
  },
  primaryLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.88,
  },
});
