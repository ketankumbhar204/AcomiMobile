import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Check, type LucideIcon } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme';

const ownerBuilding = require('../../assets/onboarding/owner-building.png');
const ownerMeal = require('../../assets/onboarding/owner-meal.png');
const memberPerson = require('../../assets/onboarding/member-person.png');

type OnboardingChoiceCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  onPress: () => void;
  accent?: string;
  soft?: string;
  illustration?: 'owner' | 'member';
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
  illustration,
}: OnboardingChoiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: `${accent}18` }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}>
      <View style={styles.header}>
        <View style={[styles.iconWell, { backgroundColor: soft }]}>
          <Icon size={20} color={accent} strokeWidth={2.2} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.description, { color: accent }]}>{description}</Text>
        </View>
        <View style={[styles.arrowWell, { backgroundColor: accent }]}>
          <ArrowRight size={16} color={colors.white} strokeWidth={2.6} />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.benefits}>
          {benefits.map(benefit => (
            <View key={benefit} style={styles.benefitRow}>
              <View style={[styles.checkWell, { backgroundColor: accent }]}>
                <Check size={10} color={colors.white} strokeWidth={3.2} />
              </View>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {illustration === 'owner' ? (
          <View style={styles.ownerArt} pointerEvents="none">
            <View style={styles.ownerBuildingWrap}>
              <Image
                source={ownerBuilding}
                style={styles.ownerBuilding}
                resizeMode="cover"
              />
            </View>
            <View style={styles.ownerMealWrap}>
              <Image source={ownerMeal} style={styles.ownerMeal} resizeMode="cover" />
            </View>
          </View>
        ) : null}

        {illustration === 'member' ? (
          <View style={styles.memberArtWrap} pointerEvents="none">
            <Image
              source={memberPerson}
              style={styles.memberArt}
              resizeMode="cover"
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardPressed: {
    borderColor: `${colors.primary}66`,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  description: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  arrowWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 12,
    minHeight: 88,
  },
  benefits: {
    flex: 1,
    minWidth: 0,
    gap: 8,
    paddingBottom: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkWell: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
    flex: 1,
  },
  ownerArt: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  ownerBuildingWrap: {
    width: 76,
    height: 88,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  ownerBuilding: {
    width: '100%',
    height: '100%',
    borderRadius: radius.card,
  },
  ownerMealWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
    marginBottom: 2,
  },
  ownerMeal: {
    width: '100%',
    height: '100%',
    borderRadius: radius.card,
  },
  memberArtWrap: {
    width: 92,
    height: 96,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  memberArt: {
    width: '100%',
    height: '100%',
    borderRadius: radius.card,
  },
});
