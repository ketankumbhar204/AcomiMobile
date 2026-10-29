import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react-native';
import { Button } from '../components/ui';
import { colors, spacing, typography } from '../theme';

type StartupOfflineScreenProps = {
  onRetry: () => void;
};

/** Full-screen state when a logged-in launch cannot reach the server. */
export function StartupOfflineScreen({ onRetry }: StartupOfflineScreenProps) {
  const { t } = useTranslation();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0],
  });

  return (
    <View style={styles.screen}>
      <View style={styles.markWrap}>
        <Animated.View
          style={[
            styles.ring,
            { opacity: ringOpacity, transform: [{ scale: ringScale }] },
          ]}
        />
        <Animated.View style={[styles.mark, { transform: [{ scale }] }]}>
          <WifiOff size={36} color={colors.tealDark} strokeWidth={2.2} />
        </Animated.View>
      </View>
      <Text style={styles.title}>
        {t('common.errors.startupOfflineTitle', {
          defaultValue: "Can't reach ACOMI",
        })}
      </Text>
      <Text style={styles.message}>
        {t('common.errors.startupOfflineMessage', {
          defaultValue:
            'The server is unavailable right now. Check your connection and try again.',
        })}
      </Text>
      <Button
        label={t('common.retry', { defaultValue: 'Try again' })}
        onPress={onRetry}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  markWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  ring: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.lightGreen,
  },
  mark: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  message: {
    ...typography.body,
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});
