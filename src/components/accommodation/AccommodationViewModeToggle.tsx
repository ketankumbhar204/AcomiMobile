import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';
import type { AccommodationViewMode } from '../../store/accommodationViewModeStore';

type AccommodationViewModeToggleProps = {
  value: AccommodationViewMode;
  onChange: (mode: AccommodationViewMode) => void;
};

export function AccommodationViewModeToggle({
  value,
  onChange,
}: AccommodationViewModeToggleProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange('list')}
        style={[styles.segment, value === 'list' && styles.segmentActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: value === 'list' }}>
        <Text style={[styles.label, value === 'list' && styles.labelActive]}>
          {t('accommodation.viewMode.list')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('layout')}
        style={[styles.segment, value === 'layout' && styles.segmentActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: value === 'layout' }}>
        <Text style={[styles.label, value === 'layout' && styles.labelActive]}>
          {t('accommodation.viewMode.layout')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.white,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.muted,
  },
  labelActive: {
    color: colors.primary,
  },
});
