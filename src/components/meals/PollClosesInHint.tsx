import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Clock3 } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';
import {
  earliestOpenPollCloseAt,
  formatPollDeadline,
  formatPollRemaining,
  timezoneForPollClose,
  type PollCloseSource,
} from '../../utils/pollCountdown';

type PollClosesInHintProps = {
  polls: PollCloseSource[];
  style?: StyleProp<ViewStyle>;
};

export function PollClosesInHint({ polls, style }: PollClosesInHintProps) {
  const { t, i18n } = useTranslation();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [reduceMotion, setReduceMotion] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onChange = (enabled: boolean) => setReduceMotion(enabled);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', onChange);
    void AccessibilityInfo.isReduceMotionEnabled().then(onChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse, reduceMotion]);

  const closeAt = useMemo(() => earliestOpenPollCloseAt(polls), [polls]);
  const timezone = useMemo(() => timezoneForPollClose(polls, closeAt), [closeAt, polls]);
  const remaining = closeAt ? formatPollRemaining(closeAt, t, nowMs, timezone) : null;
  const deadline = closeAt ? formatPollDeadline(closeAt, i18n.language, timezone) : null;

  if (!remaining) {
    return null;
  }

  const a11yLabel = deadline
    ? `${t('meals.poll.pollClosesIn', { defaultValue: 'Poll closes in' })} ${remaining}. ${deadline}`
    : `${t('meals.poll.pollClosesIn', { defaultValue: 'Poll closes in' })} ${remaining}`;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          backgroundColor: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: ['#E8F8EF', '#C6EBD7'],
          }),
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}>
      <View style={styles.titleRow}>
        <View style={styles.iconWell}>
          <Clock3 size={16} color={colors.success} strokeWidth={2.4} />
        </View>
        <Text style={styles.label}>
          {t('meals.poll.pollClosesIn', { defaultValue: 'Poll closes in' })}
        </Text>
      </View>
      <Text style={styles.remaining}>{remaining}</Text>
      {deadline ? <Text style={styles.deadline}>{deadline}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  iconWell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    flex: 1,
  },
  remaining: {
    ...typography.h1,
    color: colors.success,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    marginTop: spacing.xxs,
  },
  deadline: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
