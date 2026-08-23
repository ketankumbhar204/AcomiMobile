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
  { icon: ComponentType<IconProps>; accent: string; tint: string; selectedTint: string }
> = {
  PG: {
    icon: House,
    accent: colors.teal,
    tint: '#E7F7F1',
    selectedTint: '#D4F0E6',
  },
  MESS: {
    icon: UtensilsCrossed,
    accent: '#C2410C',
    tint: '#FFF4E5',
    selectedTint: '#FFE8C8',
  },
  HOSTEL: {
    icon: Building2,
    accent: '#7C3AED',
    tint: '#F3E8FF',
    selectedTint: '#E9D5FF',
  },
  CO_LIVING: {
    icon: Users,
    accent: '#4F46E5',
    tint: '#EEF2FF',
    selectedTint: '#E0E7FF',
  },
  RENTAL: {
    icon: KeyRound,
    accent: '#0284C7',
    tint: '#E8F4FF',
    selectedTint: '#D6ECFC',
  },
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
          const { icon: Icon, accent, tint, selectedTint } = TYPE_VISUAL[type];
          return (
            <Pressable
              key={type}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: isSelected || pressed ? selectedTint : tint,
                  borderColor: isSelected ? colors.primary : `${accent}33`,
                },
              ]}
              onPress={() => onChange(type)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}>
              <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
                <Icon size={22} color={accent} strokeWidth={2.2} />
              </View>
              <View style={styles.copy}>
                <Text
                  style={[styles.cardLabel, isSelected && { color: accent }]}
                  numberOfLines={1}>
                  {getSpaceTypeLabel(type)}
                </Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {getSpaceTypeDescription(type)}
                </Text>
              </View>
              {isSelected ? (
                <View
                  style={[styles.checkBadge, { backgroundColor: colors.primary }]}
                  accessibilityElementsHidden>
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
    position: 'relative',
    overflow: 'hidden',
    ...shadows.sm,
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
  cardDesc: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 15,
    fontSize: 11,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
});
