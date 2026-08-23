import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Lock, ShieldCheck } from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';

type OnboardingTrustBannerProps = {
  title: string;
  body: string;
};

/** Compact security strip at the bottom of the onboarding choice screen. */
export function OnboardingTrustBanner({ title, body }: OnboardingTrustBannerProps) {
  return (
    <View style={styles.banner} accessibilityRole="text">
      <View style={styles.iconWell}>
        <ShieldCheck size={16} color={colors.primaryDark} strokeWidth={2.2} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <View style={styles.lockWell}>
        <Lock size={14} color={colors.primaryDark} strokeWidth={2.2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.lightGreen,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  iconWell: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    marginTop: 1,
  },
  lockWell: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
