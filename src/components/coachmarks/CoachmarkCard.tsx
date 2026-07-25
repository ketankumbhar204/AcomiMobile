import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Button } from '../ui/Button';

export type CoachmarkCardProps = {
  stepIndex: number;
  stepCount: number;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  onSkip: () => void;
  style?: object;
};

export function CoachmarkCard({
  stepIndex,
  stepCount,
  body,
  primaryLabel,
  onPrimary,
  onSkip,
  style,
}: CoachmarkCardProps) {
  const { t } = useTranslation();
  const progressLabel = t('coachmarks.a11y.stepOf', {
    current: stepIndex + 1,
    total: stepCount,
  });

  return (
    <View
      style={[styles.card, style]}
      accessibilityRole="summary"
      accessibilityLabel={`${progressLabel}. ${body}`}
      accessible>
      <Text style={styles.progress} accessibilityLiveRegion="polite">
        {progressLabel}
      </Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.actions}>
        <Pressable
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel={t('coachmarks.actions.skip')}
          hitSlop={12}
          style={styles.skipHit}>
          <Text style={styles.skip}>{t('coachmarks.actions.skip')}</Text>
        </Pressable>
        <Button
          label={primaryLabel}
          onPress={onPrimary}
          style={styles.primary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.section,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    ...shadows.md,
    maxWidth: 360,
    width: '100%',
  },
  progress: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  skipHit: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  skip: {
    ...typography.bodyStrong,
    color: colors.muted,
  },
  primary: {
    flex: 1,
    maxWidth: 160,
    marginBottom: 0,
  },
});
