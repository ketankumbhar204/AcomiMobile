import React, { type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Check,
  House,
  KeyRound,
  Users,
  UtensilsCrossed,
} from 'lucide-react-native';
import { getSpaceTypeDescription, getSpaceTypeLabel, SPACE_TYPE_VALUES } from '../../api/spaceTypes';
import type { SpaceType } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type SpaceTypePickerProps = {
  value: SpaceType | null;
  onChange: (type: SpaceType) => void;
  error?: string | null;
};

const TYPE_VISUAL: Record<
  SpaceType,
  { icon: ComponentType<IconProps>; accent: string }
> = {
  PG: { icon: House, accent: colors.primaryDark },
  MESS: { icon: UtensilsCrossed, accent: '#D97706' },
  HOSTEL: { icon: Building2, accent: '#7C3AED' },
  CO_LIVING: { icon: Users, accent: '#2563EB' },
  RENTAL: { icon: KeyRound, accent: '#CA8A04' },
};

/** Design A selectable space-type cards — icon + copy row, equal height, compact. */
export function SpaceTypePicker({ value, onChange, error }: SpaceTypePickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('spaces.types.label')}</Text>
      <View style={styles.grid}>
        {SPACE_TYPE_VALUES.map(type => {
          const isSelected = value === type;
          const { icon: Icon, accent } = TYPE_VISUAL[type];
          return (
            <Pressable
              key={type}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && !isSelected && styles.cardPressed,
              ]}
              onPress={() => onChange(type)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}>
              <View style={[styles.iconWrap, { backgroundColor: `${accent}1F` }]}>
                <Icon size={22} color={accent} strokeWidth={2.2} />
              </View>
              <View style={styles.copy}>
                <Text
                  style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}
                  numberOfLines={1}>
                  {getSpaceTypeLabel(type)}
                </Text>
                <Text
                  style={[styles.cardDesc, isSelected && styles.cardDescSelected]}
                  numberOfLines={2}>
                  {getSpaceTypeDescription(type)}
                </Text>
              </View>
              {isSelected ? (
                <View style={styles.checkBadge} accessibilityElementsHidden>
                  <Check size={11} color={colors.white} strokeWidth={3} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '47%',
    maxWidth: '47%',
    flexGrow: 0,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    position: 'relative',
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  cardPressed: {
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingRight: spacing.md,
  },
  cardLabel: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.textPrimary,
  },
  cardLabelSelected: {
    color: colors.primaryDark,
  },
  cardDesc: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 15,
    fontSize: 11,
  },
  cardDescSelected: {
    color: colors.primaryDark,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
});
