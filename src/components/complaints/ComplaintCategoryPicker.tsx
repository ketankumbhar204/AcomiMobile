import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Wrench } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ComplaintCategory } from '../../api/types';
import { colors, shadows, spacing, typography } from '../../theme';
import {
  getComplaintCategoryColor,
  getComplaintCategoryIcon,
} from '../../utils/complaintVisuals';

export type ComplaintCategoryOption = {
  id: ComplaintCategory;
  label: string;
};

type ComplaintCategoryPickerProps = {
  options: ComplaintCategoryOption[];
  value: ComplaintCategory;
  onChange: (value: ComplaintCategory) => void;
  title: string;
  helper: string;
  TitleIcon?: LucideIcon;
};

function CategoryPill({
  label,
  selected,
  accent,
  Icon,
  onPress,
}: {
  label: string;
  selected: boolean;
  accent: string;
  Icon: LucideIcon;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(selected ? 1.03 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.03 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
  }, [scale, selected]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: `${accent}22` }}
        hitSlop={8}
        style={({ pressed }) => [
          styles.pill,
          selected
            ? {
                backgroundColor: accent,
                borderColor: accent,
                ...shadows.md,
              }
            : {
                backgroundColor: colors.white,
                borderColor: accent,
              },
          pressed && !selected && styles.pillPressed,
        ]}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={label}>
        {selected ? <Check size={13} color={colors.white} strokeWidth={2.8} /> : null}
        <Icon
          size={13}
          color={selected ? colors.white : accent}
          strokeWidth={2.4}
        />
        <Text
          style={[
            styles.pillLabel,
            { color: selected ? colors.white : accent },
            selected && styles.pillLabelSelected,
          ]}
          numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function ComplaintCategoryPicker({
  options,
  value,
  onChange,
  title,
  helper,
  TitleIcon = Wrench,
}: ComplaintCategoryPickerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <TitleIcon size={16} color="#B45309" strokeWidth={2.2} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.helper}>{helper}</Text>
      <View style={styles.row} accessibilityRole="radiogroup">
        {options.map(option => {
          const accent = getComplaintCategoryColor(option.id);
          const Icon = getComplaintCategoryIcon(option.id);
          return (
            <CategoryPill
              key={option.id}
              label={option.label}
              selected={option.id === value}
              accent={accent}
              Icon={Icon}
              onPress={() => onChange(option.id)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xxs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  helper: {
    ...typography.caption,
    fontSize: 11,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  pill: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  pillPressed: {
    backgroundColor: colors.surface,
  },
  pillLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  pillLabelSelected: {
    fontWeight: '700',
  },
});
