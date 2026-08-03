import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, type LucideIcon } from 'lucide-react-native';
import { colors, shadows, spacing, typography } from '../../theme';

type OnboardingChoiceCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  onPress: () => void;
  accent?: string;
  soft?: string;
};

/** Large premium choice card for create / join onboarding. */
export function OnboardingChoiceCard({
  icon: Icon,
  title,
  description,
  benefits,
  onPress,
  accent = colors.primaryDark,
  soft = colors.lightGreen,
}: OnboardingChoiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: `${accent}18` }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}>
      <View style={[styles.iconWell, { backgroundColor: soft, borderColor: `${accent}33` }]}>
        <Icon size={22} color={accent} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.benefits}>
          {benefits.map(benefit => (
            <View key={benefit} style={styles.benefitRow}>
              <View style={[styles.benefitDot, { backgroundColor: accent }]} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[styles.arrowWell, { backgroundColor: soft }]}>
        <ArrowRight size={18} color={accent} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 120,
    ...shadows.sm,
  },
  cardPressed: {
    borderColor: `${colors.primary}66`,
    backgroundColor: colors.surface,
  },
  iconWell: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  benefits: {
    gap: 4,
    marginTop: 2,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  benefitText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
    flex: 1,
  },
  arrowWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
