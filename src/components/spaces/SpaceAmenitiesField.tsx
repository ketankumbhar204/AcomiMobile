import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AmenityAssignment } from '../../api/types';
import {
  MAX_CUSTOM_AMENITY_LABEL_LENGTH,
  MAX_SPACE_AMENITIES,
  PRESET_AMENITY_CODES,
  amenityKey,
  buildAllPresetAmenities,
  normalizeAmenityAssignments,
  presetAmenityLabelKey,
  type AmenityCode,
} from '../../utils/amenities';
import { colors, radius, spacing, typography } from '../../theme';

type SpaceAmenitiesFieldProps = {
  value: AmenityAssignment[];
  onChange: (value: AmenityAssignment[]) => void;
  disabled?: boolean;
  /** When true, all preset amenities start checked if the list is empty (create flow). */
  selectAllByDefault?: boolean;
};

type AmenityCheckboxProps = {
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onToggle: () => void;
  bold?: boolean;
};

function AmenityCheckbox({
  label,
  checked,
  indeterminate = false,
  disabled,
  onToggle,
  bold = false,
}: AmenityCheckboxProps) {
  const showCheck = checked && !indeterminate;
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      style={styles.checkboxRow}
      accessibilityRole="checkbox"
      accessibilityState={{
        checked: indeterminate ? 'mixed' : checked,
        disabled: Boolean(disabled),
      }}>
      <View
        style={[
          styles.checkboxBox,
          (checked || indeterminate) && styles.checkboxBoxChecked,
        ]}>
        {showCheck ? <Text style={styles.checkboxMark}>✓</Text> : null}
        {indeterminate ? <Text style={styles.checkboxMark}>−</Text> : null}
      </View>
      <Text
        style={[styles.checkboxLabel, bold && styles.checkboxLabelBold]}
        numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SpaceAmenitiesField({
  value,
  onChange,
  disabled = false,
  selectAllByDefault = false,
}: SpaceAmenitiesFieldProps) {
  const { t } = useTranslation();
  const [customLabel, setCustomLabel] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  const selectedKeys = useMemo(() => new Set(value.map(amenityKey)), [value]);
  const customAmenities = useMemo(
    () => value.filter(item => item.code === 'CUSTOM'),
    [value],
  );

  const allToggleable = useMemo(
    () =>
      normalizeAmenityAssignments([
        ...buildAllPresetAmenities(code => t(presetAmenityLabelKey(code))),
        ...customAmenities,
      ]),
    [customAmenities, t],
  );

  const allSelected = useMemo(
    () => allToggleable.every(item => selectedKeys.has(amenityKey(item))),
    [allToggleable, selectedKeys],
  );

  const someSelected = useMemo(
    () => allToggleable.some(item => selectedKeys.has(amenityKey(item))),
    [allToggleable, selectedKeys],
  );

  const allIndeterminate = someSelected && !allSelected;
  const hasAppliedDefaultRef = useRef(false);

  useEffect(() => {
    if (!selectAllByDefault || disabled || value.length > 0) {
      return;
    }
    if (hasAppliedDefaultRef.current) {
      return;
    }
    hasAppliedDefaultRef.current = true;
    onChange(
      buildAllPresetAmenities(code => t(presetAmenityLabelKey(code))),
    );
  }, [disabled, onChange, selectAllByDefault, t, value.length]);

  function toggleAll() {
    if (disabled) {
      return;
    }
    if (allSelected) {
      onChange([]);
      return;
    }
    onChange(allToggleable);
  }

  function togglePreset(code: AmenityCode) {
    if (disabled) {
      return;
    }
    const key = code;
    if (selectedKeys.has(key)) {
      onChange(value.filter(item => amenityKey(item) !== key));
      return;
    }
    if (value.length >= MAX_SPACE_AMENITIES) {
      return;
    }
    onChange(
      normalizeAmenityAssignments([
        ...value,
        { code, label: t(presetAmenityLabelKey(code)) },
      ]),
    );
  }

  function toggleCustom(item: AmenityAssignment) {
    if (disabled) {
      return;
    }
    const key = amenityKey(item);
    if (selectedKeys.has(key)) {
      onChange(value.filter(entry => amenityKey(entry) !== key));
      return;
    }
    onChange(normalizeAmenityAssignments([...value, item]));
  }

  function addCustomAmenity() {
    if (disabled) {
      return;
    }
    const label = customLabel.trim();
    if (!label) {
      setCustomError(t('spaces.amenities.customRequired'));
      return;
    }
    if (label.length > MAX_CUSTOM_AMENITY_LABEL_LENGTH) {
      setCustomError(t('spaces.amenities.customTooLong'));
      return;
    }
    const next = { code: 'CUSTOM' as const, label };
    const key = amenityKey(next);
    if (selectedKeys.has(key)) {
      setCustomLabel('');
      setCustomError(null);
      return;
    }
    if (value.length >= MAX_SPACE_AMENITIES) {
      setCustomError(t('spaces.amenities.maxReached'));
      return;
    }
    onChange(normalizeAmenityAssignments([...value, next]));
    setCustomLabel('');
    setCustomError(null);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('spaces.amenities.title')}</Text>
      <Text style={styles.hint}>{t('spaces.amenities.hint')}</Text>

      <View style={styles.grid}>
        <View style={styles.gridItemFull}>
          <AmenityCheckbox
            label={t('spaces.amenities.selectAll')}
            checked={allSelected}
            indeterminate={allIndeterminate}
            disabled={disabled}
            onToggle={toggleAll}
            bold
          />
        </View>

        {PRESET_AMENITY_CODES.map(code => (
          <View key={code} style={styles.gridItem}>
            <AmenityCheckbox
              label={t(presetAmenityLabelKey(code))}
              checked={selectedKeys.has(code)}
              disabled={disabled}
              onToggle={() => togglePreset(code)}
            />
          </View>
        ))}

        {customAmenities.map(item => (
          <View key={amenityKey(item)} style={styles.gridItemFull}>
            <AmenityCheckbox
              label={item.label}
              checked={selectedKeys.has(amenityKey(item))}
              disabled={disabled}
              onToggle={() => toggleCustom(item)}
            />
          </View>
        ))}
      </View>

      <View style={styles.customSection}>
        <Text style={styles.customLabel}>{t('spaces.amenities.customLabel')}</Text>
        <View style={styles.customInlineRow}>
          <TextInput
            style={[styles.customInput, customError ? styles.customInputError : null]}
            placeholder={t('spaces.amenities.customPlaceholder')}
            placeholderTextColor={colors.muted}
            value={customLabel}
            onChangeText={text => {
              setCustomLabel(text);
              if (customError) {
                setCustomError(null);
              }
            }}
            editable={!disabled}
            maxLength={MAX_CUSTOM_AMENITY_LABEL_LENGTH}
            returnKeyType="done"
            onSubmitEditing={addCustomAmenity}
          />
          <Pressable
            disabled={disabled}
            onPress={addCustomAmenity}
            style={[styles.addButton, disabled && styles.addButtonDisabled]}>
            <Text style={styles.addButtonText}>{t('spaces.amenities.addCustom')}</Text>
          </Pressable>
        </View>
        {customError ? <Text style={styles.customErrorText}>{customError}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  gridItemFull: {
    width: '100%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginTop: 1,
  },
  checkboxBoxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  checkboxLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
    flexShrink: 1,
  },
  checkboxLabelBold: {
    fontWeight: '600',
  },
  customSection: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  customLabel: {
    ...typography.label,
    color: colors.textPrimary,
  },
  customInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customInput: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
  },
  customInputError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  customErrorText: {
    ...typography.caption,
    color: '#DC2626',
  },
  addButton: {
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
});
