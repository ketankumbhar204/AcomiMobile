import React, { useEffect, useRef } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
  type ViewStyle,
} from 'react-native';
import { Button } from '../ui';
import { colors, spacing, typography } from '../../theme';
import {
  stickyBarChrome,
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
};

/**
 * Sticky progressive footer — Continue → final Save/Share/Submit.
 * Stable min height reduces layout jump across phases.
 */
export function ProgressiveWorkflowFooter({
  phase,
  stepLabel,
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
}: ProgressiveWorkflowFooterProps) {
  const fade = useRef(new Animated.Value(1)).current;
  const prevPhase = useRef(phase);
  const paddingBottom = useStickyBarPaddingBottom();

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

  return (
    <View
      style={[styles.stickyFooter, { minHeight, paddingBottom }, style]}
      accessibilityRole="summary">
      {progressVisible && (stepLabel || progressLine) ? (
        <View style={styles.progressBlock} accessibilityRole="text">
          {stepLabel ? <Text style={styles.stepLabel}>{stepLabel}</Text> : null}
          {progressLine ? (
            <Text style={styles.progressLine}>{progressLine}</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.progressPlaceholder} />
      )}

      <Animated.View style={[styles.body, { opacity: fade }]}>
        {showContinue && onContinue && continueLabel ? (
          <View
            style={styles.nextStepBlock}
            accessibilityLabel={continueA11yLabel ?? continueTitle}>
            {continueEyebrow ? (
              <Text style={styles.nextStepEyebrow}>{continueEyebrow}</Text>
            ) : null}
            {continueTitle ? (
              <Text style={styles.nextStepTitle}>{continueTitle}</Text>
            ) : null}
            {continueHint ? (
              <Text style={styles.nextStepHint}>{continueHint}</Text>
            ) : null}
            <Button
              label={continueLabel}
              onPress={onContinue}
              style={styles.fullButton}
            />
            {secondaryAction ? (
              <Button
                label={secondaryAction.label}
                variant="ghost"
                loading={secondaryAction.loading}
                disabled={secondaryAction.disabled}
                onPress={secondaryAction.onPress}
                style={styles.fullButton}
              />
            ) : null}
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
            ) : (
              <View style={styles.deletePlaceholder} />
            )}
            {finalActions ? (
              finalActions
            ) : (
              <View style={styles.footerActions}>
                {secondaryAction ? (
                  <Button
                    label={secondaryAction.label}
                    variant="secondary"
                    loading={secondaryAction.loading}
                    disabled={secondaryAction.disabled}
                    onPress={secondaryAction.onPress}
                    style={styles.footerButton}
                  />
                ) : null}
                {primaryAction ? (
                  <Button
                    label={primaryAction.label}
                    loading={primaryAction.loading}
                    disabled={primaryAction.disabled}
                    onPress={primaryAction.onPress}
                    style={styles.footerButton}
                  />
                ) : null}
              </View>
            )}
          </>
        ) : null}
      </Animated.View>
    </View>
  );
}

/** Amber highlight used when Continue scrolls to a section (Dashboard Design A). */
export const progressiveSectionHighlightStyle = {
  borderColor: '#F59E0B',
  backgroundColor: colors.warningTint,
} as const;

const styles = StyleSheet.create({
  stickyFooter: {
    ...stickyBarChrome,
    gap: spacing.sm,
  },
  progressBlock: { gap: 2, minHeight: 36, justifyContent: 'center' },
  progressPlaceholder: { minHeight: 36 },
  stepLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  progressLine: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  body: { flexGrow: 1, justifyContent: 'flex-end' },
  nextStepBlock: { gap: spacing.xs },
  nextStepEyebrow: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  nextStepTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  nextStepHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fullButton: { alignSelf: 'stretch' },
  deleteLink: { alignItems: 'center', paddingVertical: spacing.xs, minHeight: 28 },
  deletePlaceholder: { minHeight: 28 },
  deleteLinkText: { ...typography.caption, color: '#DC2626', fontWeight: '600' },
  footerActions: { flexDirection: 'row', gap: spacing.sm },
  footerButton: { flex: 1 },
});
