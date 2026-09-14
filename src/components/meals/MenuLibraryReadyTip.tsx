import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookOpen, CalendarDays, X } from 'lucide-react-native';
import type { UUID } from '../../api/types';
import { colors, shadows, spacing, typography } from '../../theme';

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
 * First-visit tip: seeded library is enough to plan — edit or continue.
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
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <BookOpen size={16} color={colors.primaryDark} strokeWidth={2.2} />
        </View>
        <Text style={styles.title}>{t('meals.library.readyTipTitle')}</Text>
        <Pressable
          onPress={dismiss}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('common.dismiss', { defaultValue: 'Dismiss' })}>
          <X size={18} color={colors.muted} strokeWidth={2.2} />
        </Pressable>
      </View>
      <Text style={styles.body}>{t('meals.library.readyTipBody')}</Text>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          onPress={() => {
            dismiss();
            onContinuePlanning();
          }}
          accessibilityRole="button">
          <CalendarDays size={16} color={colors.white} strokeWidth={2.2} />
          <Text style={styles.primaryLabel}>{t('meals.library.readyTipContinue')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          onPress={dismiss}
          accessibilityRole="button">
          <Text style={styles.secondaryLabel}>{t('meals.library.readyTipStay')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.mintSubtle,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.body,
    flex: 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryBtn: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  primaryLabel: {
    ...typography.body,
    fontWeight: '700',
    color: colors.white,
  },
  secondaryBtn: {
    minHeight: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  secondaryLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  pressed: {
    opacity: 0.85,
  },
});
