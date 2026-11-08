import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { SelectedInventorySummaryCard } from './SelectedInventorySummaryCard';
import type { OccupancyHierarchyContext } from './HierarchyBreadcrumbCard';
import { colors, radius, spacing, typography } from '../../theme';
import {
  stayChoiceDefaultLabel,
  stayChoiceLabelKey,
  type StayChoice,
} from '../../utils/shortStay';

type OccupancyWizardStepHeaderProps = {
  stepProgress?: { current: number; total: number };
  /** Short labels for each step (completed / current / upcoming). */
  stepLabels?: string[];
  stepTitle: string;
  stepHint?: string | null;
  Icon?: LucideIcon;
  hierarchyContext: OccupancyHierarchyContext;
  /** Hide full hierarchy rows; show compact inventory card instead (mock design). */
  compactInventory?: boolean;
  onChangeInventory?: () => void;
  memberName?: string | null;
  memberMobile?: string | null;
  showMemberSummary?: boolean;
  /** Selected stay type — compact chip shown on every wizard step. */
  stayChoice?: StayChoice | null;
  showStayChoiceBadge?: boolean;
  bulkProgress?: string | null;
  bulkHint?: string | null;
  /** Hide step title row when the step body already has its own heading. */
  hideStepTitle?: boolean;
};

export function OccupancyWizardStepHeader({
  stepProgress,
  stepLabels,
  stepTitle,
  stepHint,
  Icon,
  hierarchyContext,
  compactInventory = true,
  onChangeInventory,
  memberName,
  memberMobile,
  showMemberSummary = false,
  stayChoice = null,
  showStayChoiceBadge = false,
  bulkProgress,
  bulkHint,
  hideStepTitle = false,
}: OccupancyWizardStepHeaderProps) {
  const { t } = useTranslation();
  const progressRatio =
    stepProgress && stepProgress.total > 0
      ? Math.min(1, Math.max(0, stepProgress.current / stepProgress.total))
      : 0;

  const hasNamedSteps = Boolean(stepLabels && stepProgress && stepLabels.length === stepProgress.total);
  const stayLabel =
    stayChoice != null
      ? t(stayChoiceLabelKey(stayChoice), {
          defaultValue: stayChoiceDefaultLabel(stayChoice),
        })
      : null;

  return (
    <View style={styles.wrap}>
      {stepProgress ? (
        <View style={styles.progressBlock}>
          {hasNamedSteps ? (
            <View style={styles.stepRow} accessibilityRole="summary">
              <View style={styles.connectorTrack} pointerEvents="none">
                <View
                  style={[
                    styles.connectorFill,
                    {
                      width: `${Math.max(
                        0,
                        Math.min(1, (stepProgress.current - 1) / Math.max(1, stepProgress.total - 1)),
                      ) * 100}%`,
                    },
                  ]}
                />
              </View>
              {stepLabels!.map((label, index) => {
                const stepNumber = index + 1;
                const completed = stepNumber < stepProgress.current;
                const current = stepNumber === stepProgress.current;
                return (
                  <View key={`${label}-${index}`} style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepDot,
                        completed && styles.stepDotCompleted,
                        current && styles.stepDotCurrent,
                      ]}>
                      {completed ? (
                        <Check size={12} color={colors.white} strokeWidth={3} />
                      ) : (
                        <Text
                          style={[
                            styles.stepDotText,
                            (completed || current) && styles.stepDotTextActive,
                          ]}>
                          {stepNumber}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[styles.stepLabel, current && styles.stepLabelCurrent]}
                      numberOfLines={2}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <>
              <Text style={styles.stepProgress}>
                {t('occupancyWizard.stepProgress', {
                  current: stepProgress.current,
                  total: stepProgress.total,
                })}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
              </View>
            </>
          )}
        </View>
      ) : null}

      {showStayChoiceBadge && stayLabel ? (
        <View
          style={styles.stayTypeBadge}
          accessibilityRole="text"
          accessibilityLabel={t('occupancy.section.stayTypeSelected', {
            label: stayLabel,
            defaultValue: `Stay Type: ${stayLabel}`,
          })}>
          <Text style={styles.stayTypeBadgeText} numberOfLines={1}>
            {t('occupancy.section.stayTypeSelected', {
              label: stayLabel,
              defaultValue: `Stay Type: ${stayLabel}`,
            })}
          </Text>
        </View>
      ) : null}

      {compactInventory ? (
        <SelectedInventorySummaryCard
          context={hierarchyContext}
          onChangePress={onChangeInventory}
          memberName={memberName}
          memberMobile={memberMobile}
          showMember={showMemberSummary}
        />
      ) : null}

      {!hideStepTitle ? (
        <View style={styles.titleRow}>
          {Icon ? (
            <View style={styles.iconWrap} accessibilityElementsHidden>
              <Icon size={18} color={colors.primaryDark} strokeWidth={2.2} />
            </View>
          ) : null}
          <View style={styles.titleBlock}>
            <Text style={styles.stepTitle}>{stepTitle}</Text>
            {stepHint ? <Text style={styles.stepHint}>{stepHint}</Text> : null}
          </View>
        </View>
      ) : null}
      {bulkProgress ? (
        <Text style={styles.bulkProgress}>
          {t('occupancy.hierarchy.bulkProgress', { progress: bulkProgress })}
        </Text>
      ) : null}
      {bulkHint ? <Text style={styles.bulkHint}>{bulkHint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // Horizontal padding comes from the wizard page container so stepper
    // and body share the same left/right edges.
    marginBottom: spacing.sm,
    paddingHorizontal: 0,
  },
  progressBlock: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  stayTypeBadge: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}14`,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  stayTypeBadgeText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}18`,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  stepProgress: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: colors.muted,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
    position: 'relative',
    paddingTop: 2,
  },
  connectorTrack: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: 13,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
    overflow: 'hidden',
  },
  connectorFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
    zIndex: 1,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  stepDotTextActive: {
    color: colors.white,
  },
  stepLabel: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: colors.muted,
  },
  stepLabelCurrent: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.successTint,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    ...typography.h3,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  stepHint: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
  bulkProgress: {
    ...typography.caption,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  bulkHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});

export const occupancyWizardStepHeaderStyles = styles;
