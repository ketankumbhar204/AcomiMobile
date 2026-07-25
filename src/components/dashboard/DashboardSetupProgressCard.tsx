import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SpaceType } from '../../api/types';
import { CoachmarkAnchor } from '../coachmarks';
import { Button } from '../ui';
import type {
  MilestoneId,
  MilestoneStatus,
  RecommendedAction,
  SetupProgressSnapshot,
} from '../../spaceLifecycle';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { BusinessProgressStepper } from './shared/BusinessProgressStepper';
import {
  buildBusinessProgressSteps,
  businessProgressCurrentIndex,
  milestoneLabelKeyForSpace,
} from './shared/businessProgressSteps';

export type DashboardSetupProgressCardProps = {
  progress: SetupProgressSnapshot;
  recommendation: RecommendedAction | null;
  /** Profile milestones only (exclude derived OPS_READY). */
  milestones: MilestoneStatus[];
  onContinue: () => void;
  /** Skip optional next step (e.g. Mess Add customers). */
  onSkipOptional?: () => void;
  /** Jump to a setup step (tap stepper or Previous). */
  onStepPress?: (milestoneId: MilestoneId) => void;
  dismissedOptionalIds?: readonly MilestoneId[];
  /** When MESS, use business mess milestone labels / progress title. */
  spaceType?: SpaceType | null;
  /** Register coachmark spotlight targets (Mess setup tour). */
  enableCoachmarkAnchors?: boolean;
};

/**
 * Business-milestone setup card powered by the Space Lifecycle Engine.
 * Stepper on top (tappable); Next Step + CTA; Previous to revisit.
 */
export function DashboardSetupProgressCard({
  progress,
  recommendation,
  milestones,
  onContinue,
  onSkipOptional,
  onStepPress,
  dismissedOptionalIds = [],
  spaceType,
  enableCoachmarkAnchors = false,
}: DashboardSetupProgressCardProps) {
  const { t } = useTranslation();
  const isMess = spaceType === 'MESS';
  const anchorsOn = enableCoachmarkAnchors;

  const steps = useMemo(
    () =>
      buildBusinessProgressSteps(
        milestones,
        id => t(milestoneLabelKeyForSpace(id, spaceType)),
        { includeOptional: true },
      ),
    [milestones, spaceType, t],
  );

  const currentStepIndex = useMemo(
    () =>
      businessProgressCurrentIndex(milestones, steps, {
        dismissedOptionalIds,
        focusMilestoneId: recommendation?.milestoneId ?? null,
      }),
    [dismissedOptionalIds, milestones, recommendation?.milestoneId, steps],
  );

  const readinessPercent = Math.max(0, 100 - progress.percentRemaining);

  const nextTitle = recommendation
    ? t(recommendation.titleKey)
    : t('dashboard.setup.nextFallbackTitle');
  const nextReason = recommendation
    ? t(recommendation.reasonKey)
    : t('dashboard.setup.nextFallbackReason');
  const ctaLabel = recommendation
    ? t(recommendation.ctaLabelKey)
    : t('dashboard.setup.continue');

  const showSkip =
    isMess &&
    recommendation?.milestoneId === 'RESIDENTS_READY' &&
    recommendation.kind === 'optional' &&
    typeof onSkipOptional === 'function';

  const previousStep =
    currentStepIndex > 0 ? steps[currentStepIndex - 1] ?? null : null;
  const showPrevious =
    previousStep != null && typeof onStepPress === 'function';

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.eyebrow}>
        {isMess ? t('dashboard.setup.eyebrowMess') : t('dashboard.setup.eyebrow')}
      </Text>

      <Text style={styles.progressTitle}>
        {isMess
          ? t('dashboard.setup.readinessTitleMess')
          : t('dashboard.setup.readinessTitle')}
      </Text>
      <Text style={styles.remaining}>
        {t('dashboard.setup.readinessPercent', { percent: readinessPercent })}
      </Text>
      {onStepPress ? (
        <Text style={styles.stepperHint}>{t('dashboard.setup.tapStepHint')}</Text>
      ) : null}

      <CoachmarkAnchor id="businessProgress" active={anchorsOn}>
        <View style={styles.stepperWrap}>
          <BusinessProgressStepper
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStepPress={
              onStepPress
                ? (stepId) => onStepPress(stepId as MilestoneId)
                : undefined
            }
            accessibilityLabel={
              isMess
                ? t('dashboard.setup.readinessTitleMess')
                : t('dashboard.setup.readinessTitle')
            }
          />
        </View>
      </CoachmarkAnchor>

      <CoachmarkAnchor
        id="nextRecommendedStep"
        active={anchorsOn}
        style={styles.nextBlock}>
        <View>
          <Text style={styles.nextLabel}>{t('dashboard.setup.nextStepLabel')}</Text>
          <Text style={styles.nextTitle}>{nextTitle}</Text>
          <Text style={styles.hint}>{nextReason}</Text>
        </View>
      </CoachmarkAnchor>

      <CoachmarkAnchor id="primaryCta" active={anchorsOn}>
        {showSkip ? (
          <View style={styles.ctaRow}>
            <Button
              label={ctaLabel}
              onPress={onContinue}
              style={styles.ctaFlex}
            />
            <Button
              label={t('dashboard.setup.skipOptional')}
              variant="ghost"
              onPress={onSkipOptional}
              style={styles.ctaSkip}
            />
          </View>
        ) : (
          <View style={styles.ctaRow}>
            {showPrevious ? (
              <Button
                label={t('dashboard.setup.previousStep')}
                variant="ghost"
                onPress={() => onStepPress?.(previousStep.id as MilestoneId)}
                style={styles.ctaSkip}
              />
            ) : null}
            <Button
              label={ctaLabel}
              onPress={onContinue}
              style={showPrevious ? styles.ctaFlex : styles.cta}
            />
          </View>
        )}
      </CoachmarkAnchor>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.section,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    ...shadows.sm,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.xs,
  },
  nextBlock: {
    // Spacing lives on the anchor (outside measureInWindow) so the coachmark
    // highlight hugs the text instead of swallowing blank margins.
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  nextLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: 2,
  },
  nextTitle: {
    ...typography.h3,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
  },
  cta: {
    marginBottom: 0,
    alignSelf: 'stretch',
    flex: 1,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ctaFlex: {
    flex: 1,
  },
  ctaSkip: {
    minWidth: 88,
    paddingHorizontal: spacing.md,
  },
  progressTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  remaining: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  stepperHint: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  stepperWrap: {
    marginTop: spacing.xs,
  },
});
