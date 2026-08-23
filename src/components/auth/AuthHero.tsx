import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type AuthHeroProps = {
  icon: LucideIcon;
  eyebrow: string;
  heading: string;
  headingHighlight?: string;
  subheading?: string;
  accent?: string;
  soft?: string;
  border?: string;
  illustration?: ImageSourcePropType;
};

/** Soft green CreateSpace-style hero for auth & onboarding. */
export function AuthHero({
  icon: Icon,
  eyebrow,
  heading,
  headingHighlight,
  subheading,
  accent = colors.primaryDark,
  soft = colors.lightGreen,
  border = `${colors.primary}33`,
  illustration,
}: AuthHeroProps) {
  return (
    <View
      style={[styles.hero, { backgroundColor: soft, borderColor: border }]}
      accessibilityRole="header">
      {illustration ? null : (
        <>
          <View
            style={[styles.decorBlob, { backgroundColor: `${accent}1F` }]}
            pointerEvents="none"
          />
          <View
            style={[styles.decorRing, { borderColor: `${accent}14` }]}
            pointerEvents="none"
          />
        </>
      )}
      <View style={styles.row}>
        <View style={styles.copy}>
          <View
            style={[styles.heroIconWrap, { borderColor: border }]}
            accessibilityElementsHidden>
            <Icon size={16} color={accent} strokeWidth={2.2} />
          </View>
          <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
          <Text
            style={[
              styles.heading,
              { color: illustration ? colors.textPrimary : accent },
            ]}>
            {heading}
            {headingHighlight ? (
              <Text style={{ color: accent }}>{headingHighlight}</Text>
            ) : null}
          </Text>
          {subheading ? <Text style={styles.subheading}>{subheading}</Text> : null}
        </View>
        {illustration ? (
          <View style={styles.illustrationWrap} pointerEvents="none">
            <Image
              source={illustration}
              style={styles.illustration}
              resizeMode="cover"
              accessibilityElementsHidden
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 132,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.xs,
    zIndex: 1,
  },
  illustrationWrap: {
    width: 128,
    height: 116,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginRight: 4,
  },
  illustration: {
    width: '100%',
    height: '100%',
    borderRadius: radius.card,
  },
  decorBlob: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -48,
    right: -28,
  },
  decorRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 8,
    bottom: -16,
    right: 40,
  },
  heroIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  eyebrow: {
    ...typography.eyebrow,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
  },
  heading: {
    ...typography.h2,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  subheading: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 4,
  },
});
