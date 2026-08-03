import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, TriangleAlert } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ComplaintPriority } from '../../api/types';
import { colors, shadows, spacing, typography } from '../../theme';
import {
  getComplaintPriorityIcon,
  getComplaintPriorityPickerColor,
} from '../../utils/complaintVisuals';

export type ComplaintPriorityOption = {
  id: ComplaintPriority;
  label: string;
  description: string;
};

type ComplaintPriorityPickerProps = {
  options: ComplaintPriorityOption[];
  value: ComplaintPriority;
  onChange: (value: ComplaintPriority) => void;
  title: string;
  helper: string;
  TitleIcon?: LucideIcon;
};

function PriorityCard({
  label,
  description,
  selected,
  accent,
  Icon,
  onPress,
}: {
  label: string;
  description: string;
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
    <Animated.View style={[styles.cardSlot, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: `${accent}22` }}
        style={({ pressed }) => [
          styles.card,
          selected
            ? {
                backgroundColor: accent,
                borderColor: accent,
                ...shadows.md,
              }
            : {
                backgroundColor: colors.white,
                borderColor: `${accent}66`,
              },
          pressed && !selected && styles.cardPressed,
        ]}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label}. ${description}`}>
        <View
          style={[
            styles.iconWell,
            {
              backgroundColor: selected ? 'rgba(255,255,255,0.22)' : `${accent}14`,
            },
          ]}>
          <Icon size={14} color={selected ? colors.white : accent} strokeWidth={2.4} />
        </View>
        <View style={styles.cardText}>
          <Text
            style={[
              styles.cardLabel,
              { color: selected ? colors.white : colors.textPrimary },
            ]}
            numberOfLines={1}>
            {label}
          </Text>
          <Text
            style={[
              styles.cardDescription,
              { color: selected ? 'rgba(255,255,255,0.9)' : colors.muted },
            ]}
            numberOfLines={1}>
            {description}
          </Text>
        </View>
        {selected ? (
          <View style={styles.checkBadge}>
            <Check size={11} color={accent} strokeWidth={2.8} />
          </View>
        ) : (
          <View style={[styles.dot, { backgroundColor: `${accent}66` }]} />
        )}
      </Pressable>
    </Animated.View>
  );
}

export function ComplaintPriorityPicker({
  options,
  value,
  onChange,
  title,
  helper,
  TitleIcon = TriangleAlert,
}: ComplaintPriorityPickerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <TitleIcon size={16} color="#B45309" strokeWidth={2.2} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.helper}>{helper}</Text>
      <View style={styles.grid} accessibilityRole="radiogroup">
        {options.map(option => {
          const accent = getComplaintPriorityPickerColor(option.id);
          const Icon = getComplaintPriorityIcon(option.id);
          return (
            <PriorityCard
              key={option.id}
              label={option.label}
              description={option.description}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  cardSlot: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '48%',
  },
  card: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  cardPressed: {
    backgroundColor: colors.surface,
  },
  iconWell: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardLabel: {
    ...typography.bodyStrong,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  cardDescription: {
    ...typography.caption,
    fontSize: 10.5,
    lineHeight: 14,
  },
});
