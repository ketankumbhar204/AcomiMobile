import React, { useEffect, useRef } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { Button } from '../ui';
import type { ButtonTint } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';
import {
  stickyBarKeyboardDock,
  stickyBarKeyboardSlot,
  useKeyboardScreenLift,
  useStickyBarPaddingBottom,
} from './stickyBarStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Shared progressive footer phases across Acomi workflows. */
export type ProgressiveWorkflowPhase = 'start' | 'continue' | 'ready';

export type ProgressiveWorkflowAction = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

type ProgressiveWorkflowFooterProps = {
  phase: ProgressiveWorkflowPhase;
  /** Shown for continue + ready. */
  stepLabel?: string;
  /** 1-based step index. Draws the progress dots when paired with stepTotal. */
  stepCurrent?: number;
  stepTotal?: number;
  progressLine?: string;
  showProgress?: boolean;
  /** Continue phase copy + CTA. */
  continueEyebrow?: string;
  continueTitle?: string;
  continueHint?: string;
  continueLabel?: string;
  continueA11yLabel?: string;
  onContinue?: () => void;
  /** Final / start phase actions. */
  primaryAction?: ProgressiveWorkflowAction;
  secondaryAction?: ProgressiveWorkflowAction;
  destructiveLink?: ProgressiveWorkflowAction;
  /** Optional custom final row (overrides primary/secondary). */
  finalActions?: React.ReactNode;
  style?: ViewStyle;
  minHeight?: number;
  /**
   * Meal-planning bar: status line plus side-by-side actions.
   * Omits the continue title, hint, and stacked full-width buttons.
   */
  compact?: boolean;
  /** Completed work while a long action is running, such as sharing to many spaces. */
  meter?: { completed: number; total: number };
};

/**
 * Sticky progressive footer — Continue → final Save/Share/Submit.
 * Stable min height reduces layout jump across phases.
 */
export function ProgressiveWorkflowFooter({
  phase,
  stepLabel,
  stepCurrent,
  stepTotal,
  progressLine,
  showProgress,
  continueEyebrow,
  continueTitle,
  continueHint,
  continueLabel,
  continueA11yLabel,
  onContinue,
  primaryAction,
  secondaryAction,
  destructiveLink,
  finalActions,
  style,
  minHeight = 148,
  compact = false,
  meter,
}: ProgressiveWorkflowFooterProps) {
  const fade = useRef(new Animated.Value(1)).current;
  const prevPhase = useRef(phase);
  const paddingBottom = useStickyBarPaddingBottom();
  const keyboardLift = useKeyboardScreenLift();
  const keyboardOpen = keyboardLift > 0;
  const { width } = useWindowDimensions();
  const stackActions = width < 340;

  useEffect(() => {
    if (prevPhase.current === phase) {
      return;
    }
    prevPhase.current = phase;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    fade.setValue(0.35);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [fade, phase]);

  const progressVisible =
    showProgress ?? (phase === 'continue' || phase === 'ready');
  const showContinue = phase === 'continue';
  const showFinal = phase === 'start' || phase === 'ready';
  const showDots =
    stepCurrent != null && stepTotal != null && stepTotal > 1 && stepCurrent >= 1;
  const guidanceLabel = [stepLabel, progressLine, continueTitle, continueHint]
    .filter(Boolean)
    .join('. ');

  return (
    <View pointerEvents={keyboardOpen ? 'none' : 'auto'} style={keyboardOpen ? stickyBarKeyboardSlot : undefined}>
    <View
      style={[
        styles.stickyFooter,
        compact && styles.stickyFooterCompact,
        { paddingBottom },
        stickyBarKeyboardDock(keyboardLift),
        style,
      ]}>
      <View
        style={[
          styles.panel,
          compact ? styles.panelCompact : { minHeight },
        ]}
        accessibilityRole="summary"
        accessibilityLabel={guidanceLabel || stepLabel}>
      {progressVisible && (stepLabel || progressLine) ? (
        <View style={styles.progressBlock} accessibilityRole="text">
          <View style={styles.progressHead}>
            {stepLabel ? <Text style={styles.stepLabel}>{stepLabel}</Text> : <View />}
            {showDots && stepCurrent != null && stepTotal != null ? (
              <StepDots current={stepCurrent} total={stepTotal} />
            ) : null}
          </View>
          {progressLine ? (
            <Text style={styles.progressLine} numberOfLines={2}>
              {progressLine}
            </Text>
          ) : null}
        </View>
      ) : null}

      {meter && meter.total > 0 ? (
        <View
          style={styles.meterTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: meter.total, now: meter.completed }}>
          <View
            style={[
              styles.meterFill,
              { width: `${Math.min(100, Math.round((meter.completed / meter.total) * 100))}%` },
            ]}
          />
        </View>
      ) : null}

      <Animated.View style={[styles.body, { opacity: fade }]}>
        {showContinue && onContinue && continueLabel ? (
          <View
            style={styles.nextStepBlock}
            accessibilityLabel={continueA11yLabel ?? continueTitle}>
            {!compact && (stepLabel || progressLine) ? <View style={styles.divider} /> : null}
            {!compact && continueEyebrow ? (
              <Text style={styles.nextStepEyebrow}>{continueEyebrow}</Text>
            ) : null}
            {!compact && continueTitle ? (
              <Text style={styles.nextStepTitle}>{continueTitle}</Text>
            ) : null}
            {!compact && continueHint ? (
              <Text style={styles.nextStepHint}>{continueHint}</Text>
            ) : null}
            <View
              style={
                compact
                  ? [styles.actionRow, stackActions && styles.actionRowStacked]
                  : styles.footerActions
              }>
              <Button
                label={continueLabel}
                onPress={onContinue}
                tint={primaryOnGuidanceTint}
                style={compact ? styles.rowButtonPrimary : styles.fullButton}
              />
              {secondaryAction ? (
                <Button
                  label={secondaryAction.label}
                  variant="ghost"
                  loading={secondaryAction.loading}
                  disabled={secondaryAction.disabled}
                  onPress={secondaryAction.onPress}
                  tint={secondaryOnGuidanceTint}
                  style={compact ? styles.rowButtonSecondary : styles.fullButton}
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {showFinal ? (
          <>
            {destructiveLink ? (
              <Pressable
                style={styles.deleteLink}
                disabled={destructiveLink.disabled || destructiveLink.loading}
                onPress={destructiveLink.onPress}
                accessibilityRole="button">
                <Text style={styles.deleteLinkText}>{destructiveLink.label}</Text>
              </Pressable>
            ) : null}
            {finalActions ? (
              finalActions
            ) : (
              <View
                style={[
                  compact ? styles.actionRow : styles.footerActions,
                  compact && stackActions && styles.actionRowStacked,
                ]}>
                {primaryAction ? (
                  <Button
                    label={primaryAction.label}
                    loading={primaryAction.loading}
                    disabled={primaryAction.disabled}
                    onPress={primaryAction.onPress}
                    tint={
                      primaryAction.loading ? loadingOnGuidanceTint : primaryOnGuidanceTint
                    }
                    style={compact ? styles.rowButtonPrimary : styles.fullButton}
                  />
                ) : null}
                {secondaryAction ? (
                  <Button
                    label={secondaryAction.label}
                    variant="ghost"
                    loading={secondaryAction.loading}
                    disabled={secondaryAction.disabled}
                    onPress={secondaryAction.onPress}
                    tint={secondaryOnGuidanceTint}
                    style={compact ? styles.rowButtonSecondary : styles.fullButton}
                  />
                ) : null}
              </View>
            )}
          </>
        ) : null}
      </Animated.View>
      </View>
    </View>
    </View>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dots} accessibilityElementsHidden>
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const on = step <= current;
        return (
          <View key={step} style={styles.dotSlot}>
            {index > 0 ? (
              <View style={[styles.dotTrack, step <= current && styles.dotTrackOn]} />
            ) : null}
            <View style={[styles.dot, on && styles.dotOn]} />
          </View>
        );
      })}
    </View>
  );
}

/** Amber highlight used when Continue scrolls to a section (Dashboard Design A). */
export const progressiveSectionHighlightStyle = {
  borderColor: '#F59E0B',
  backgroundColor: colors.warningTint,
} as const;

const guidance = colors.guidance;

const primaryOnGuidanceTint: ButtonTint = {
  bg: colors.primary,
  border: colors.primary,
  fg: guidance.ctaText,
};

/** Solid deep green so loader copy stays light on the dark guidance panel. */
const loadingOnGuidanceTint: ButtonTint = {
  bg: colors.tealDark,
  border: colors.tealDark,
  fg: colors.white,
};

const secondaryOnGuidanceTint: ButtonTint = {
  bg: 'transparent',
  border: guidance.outline,
  fg: guidance.text,
};

const styles = StyleSheet.create({
  stickyFooter: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  stickyFooterCompact: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  panel: {
    backgroundColor: guidance.surface,
    borderRadius: radius.section,
    borderWidth: 1,
    borderColor: guidance.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  panelCompact: {
    minHeight: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  progressBlock: { gap: spacing.xs },
  progressHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  stepLabel: {
    ...typography.caption,
    flex: 1,
    color: guidance.label,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  progressLine: {
    ...typography.caption,
    color: guidance.text,
  },
  meterTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: guidance.track,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  dots: { flexDirection: 'row', alignItems: 'center' },
  dotSlot: { flexDirection: 'row', alignItems: 'center' },
  dotTrack: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: guidance.track,
  },
  dotTrackOn: { backgroundColor: colors.primary },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: guidance.track,
    backgroundColor: 'transparent',
  },
  dotOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: guidance.divider,
    marginBottom: spacing.xs,
  },
  body: { gap: spacing.sm },
  nextStepBlock: { gap: spacing.xs },
  nextStepEyebrow: {
    ...typography.caption,
    color: guidance.label,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  nextStepTitle: { ...typography.bodyStrong, color: guidance.text },
  nextStepHint: {
    ...typography.caption,
    color: guidance.textMuted,
    marginBottom: spacing.xs,
  },
  fullButton: { alignSelf: 'stretch' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  actionRowStacked: {
    flexDirection: 'column',
  },
  rowButtonPrimary: {
    flex: 1.6,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowButtonSecondary: {
    flex: 0.9,
    minWidth: 88,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  deleteLink: { alignItems: 'center', paddingVertical: spacing.xs, minHeight: 28 },
  deleteLinkText: { ...typography.caption, color: '#FCA5A5', fontWeight: '600' },
  footerActions: { gap: spacing.sm },
});
