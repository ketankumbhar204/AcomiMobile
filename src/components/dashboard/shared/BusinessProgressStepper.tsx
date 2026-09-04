import React, { useEffect, useRef } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type BusinessProgressStep = {
  id: string;
  label: string;
};

export type BusinessProgressStepperProps = {
  steps: BusinessProgressStep[];
  /**
   * Index of the current (first incomplete) step.
   * Use `steps.length` when all steps are complete.
   */
  currentStepIndex: number;
  accessibilityLabel?: string;
  /** Tap a step to revisit / jump (completed + current + previous). */
  onStepPress?: (stepId: string, index: number) => void;
};

type StepVisualState = 'completed' | 'current' | 'future';

function stepState(index: number, currentStepIndex: number): StepVisualState {
  if (index < currentStepIndex) {
    return 'completed';
  }
  if (index === currentStepIndex) {
    return 'current';
  }
  return 'future';
}

/**
 * Shared horizontal business progress stepper for guided setup.
 * Space-type agnostic — callers supply labels and current index.
 */
export function BusinessProgressStepper({
  steps,
  currentStepIndex,
  accessibilityLabel,
  onStepPress,
}: BusinessProgressStepperProps) {
  const { t } = useTranslation();
  const prevIndex = useRef(currentStepIndex);

  useEffect(() => {
    if (prevIndex.current !== currentStepIndex) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      prevIndex.current = currentStepIndex;
    }
  }, [currentStepIndex]);

  if (steps.length === 0) {
    return null;
  }

  const content = (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}>
      {steps.map((step, index) => {
        const state = stepState(index, currentStepIndex);
        const lineBeforeDone = index > 0 && index - 1 < currentStepIndex;
        const lineAfterDone = index < currentStepIndex;
        // Allow revisiting any step up to current, and completed ones after skip.
        const pressable =
          typeof onStepPress === 'function' &&
          (index <= currentStepIndex || state === 'completed');

        const body = (
          <>
            <View style={styles.circleBand}>
              {index > 0 ? (
                <View
                  style={[
                    styles.lineHalf,
                    styles.lineLeft,
                    lineBeforeDone && styles.lineDone,
                  ]}
                />
              ) : (
                <View style={styles.lineSpacer} />
              )}
              <StepCircle index={index} state={state} />
              {index < steps.length - 1 ? (
                <View
                  style={[
                    styles.lineHalf,
                    styles.lineRight,
                    lineAfterDone && styles.lineDone,
                  ]}
                />
              ) : (
                <View style={styles.lineSpacer} />
              )}
            </View>
            <Text
              style={[
                styles.label,
                state === 'completed' && styles.labelDone,
                state === 'current' && styles.labelCurrent,
                state === 'future' && styles.labelFuture,
                pressable && styles.labelPressable,
              ]}
              numberOfLines={2}>
              {step.label}
            </Text>
          </>
        );

        if (pressable) {
          return (
            <Pressable
              key={step.id}
              style={({ pressed }) => [styles.stepCol, pressed && styles.stepPressed]}
              onPress={() => onStepPress(step.id, index)}
              accessibilityRole="button"
              accessibilityLabel={step.label}
              accessibilityHint={t('dashboard.setup.openStepA11y')}>
              {body}
            </Pressable>
          );
        }

        return (
          <View key={step.id} style={styles.stepCol}>
            {body}
          </View>
        );
      })}
    </View>
  );

  if (steps.length > 5) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {content}
      </ScrollView>
    );
  }

  return content;
}

function StepCircle({ index, state }: { index: number; state: StepVisualState }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'completed') {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [scale, state]);

  return (
    <Animated.View
      style={[
        styles.circle,
        state === 'completed' && styles.circleDone,
        state === 'current' && styles.circleCurrent,
        state === 'future' && styles.circleFuture,
        { transform: [{ scale }] },
      ]}>
      {state === 'completed' ? (
        <Check size={14} color={colors.white} strokeWidth={3} />
      ) : (
        <Text
          style={[
            styles.circleNumber,
            state === 'current' && styles.circleNumberCurrent,
            state === 'future' && styles.circleNumberFuture,
          ]}>
          {index + 1}
        </Text>
      )}
    </Animated.View>
  );
}

const CIRCLE = 28;

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: spacing.xs,
    minWidth: '100%',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  stepCol: {
    flex: 1,
    minWidth: 64,
    alignItems: 'center',
  },
  stepPressed: {
    opacity: 0.75,
  },
  circleBand: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xs,
  },
  lineHalf: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    // Keep connectors under the circles (Android ignores zIndex without elevation).
    zIndex: 0,
  },
  lineLeft: {
    // Gap so the track never meets / cuts through the circle edge.
    marginRight: 4,
  },
  lineRight: {
    marginLeft: 4,
  },
  lineDone: {
    backgroundColor: colors.primary,
  },
  lineSpacer: {
    flex: 1,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    zIndex: 2,
    // Required on Android so the opaque circle paints above the connector.
    elevation: 2,
  },
  circleDone: {
    backgroundColor: colors.primary,
  },
  circleCurrent: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  circleFuture: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  circleNumber: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  circleNumberCurrent: {
    color: colors.primaryDark,
  },
  circleNumberFuture: {
    color: colors.muted,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    color: colors.textSecondary,
    paddingHorizontal: 2,
  },
  labelDone: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  labelCurrent: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  labelFuture: {
    color: colors.muted,
  },
  labelPressable: {
    textDecorationLine: 'underline',
  },
});
