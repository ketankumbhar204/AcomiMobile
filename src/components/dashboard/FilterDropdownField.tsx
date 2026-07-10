import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';

export type FilterDropdownOption = {
  value?: string;
  label: string;
};

type FilterDropdownFieldProps = {
  label: string;
  valueLabel: string;
  options: FilterDropdownOption[];
  onSelect: (value?: string) => void;
  disabled?: boolean;
  compact?: boolean;
  selectedValue?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function isFilterOptionSelected(
  option: FilterDropdownOption,
  selectedValue?: string,
): boolean {
  const optionValue = option.value ?? undefined;
  const currentValue = selectedValue ?? undefined;
  return optionValue === currentValue;
}

export function FilterDropdownField({
  label,
  valueLabel,
  options,
  onSelect,
  disabled = false,
  compact = false,
  selectedValue,
  containerStyle,
}: FilterDropdownFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <View style={[styles.field, containerStyle]}>
        <Text style={[styles.label, compact && styles.labelCompact]} numberOfLines={1}>
          {label}
        </Text>
        <Pressable
          onPress={() => !disabled && setOpen(true)}
          disabled={disabled}
          style={({ pressed }) => [
            styles.trigger,
            compact && styles.triggerCompact,
            disabled && styles.triggerDisabled,
            pressed && !disabled && styles.triggerPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${valueLabel}`}>
          <Text
            style={[styles.value, compact && styles.valueCompact, disabled && styles.valueDisabled]}
            numberOfLines={1}>
            {valueLabel}
          </Text>
          <Text style={styles.chevron}>▾</Text>
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, compact ? styles.sheetBottom : styles.sheetCentered]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <Text style={styles.close}>{t('common.close')}</Text>
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={item => item.value ?? '__all__'}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const selected = isFilterOptionSelected(item, selectedValue);
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}>
                  <Text
                    style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                    numberOfLines={1}>
                    {item.label}
                  </Text>
                  {selected ? <Text style={styles.optionCheck}>✓</Text> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xxs,
    minWidth: 0,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  labelCompact: {
    fontSize: 11,
    textAlign: 'center',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  triggerCompact: {
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  triggerDisabled: {
    opacity: 0.5,
    backgroundColor: colors.surface,
  },
  triggerPressed: {
    backgroundColor: colors.surface,
  },
  value: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  valueCompact: {
    fontSize: 13,
  },
  valueDisabled: {
    color: colors.muted,
  },
  chevron: {
    ...typography.caption,
    color: colors.muted,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetCentered: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '25%',
    maxHeight: '55%',
    borderRadius: radius.card,
  },
  sheetBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '55%',
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderBottomWidth: 0,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  close: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  optionSelected: {
    backgroundColor: colors.lightGreen,
  },
  optionPressed: {
    backgroundColor: colors.surface,
  },
  optionLabel: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  optionCheck: {
    ...typography.bodyStrong,
    color: colors.primary,
    fontSize: 16,
  },
});
