import React, { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  BedDouble,
  BatteryCharging,
  BrushCleaning,
  Camera,
  Car,
  Check,
  Droplets,
  GlassWater,
  Plus,
  Refrigerator,
  Shirt,
  SquareCheck,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
} from 'lucide-react-native';
import type { AmenityAssignment } from '../../api/types';
import {
  MAX_CUSTOM_AMENITY_LABEL_LENGTH,
  MAX_SPACE_AMENITIES,
  PRESET_AMENITY_CODES,
  amenityKey,
  buildAllPresetAmenities,
  normalizeAmenityAssignments,
  resolvePresetAmenityLabel,
  type AmenityCode,
} from '../../utils/amenities';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type SpaceAmenitiesFieldProps = {
  value: AmenityAssignment[];
  onChange: (value: AmenityAssignment[]) => void;
  disabled?: boolean;
  /** When true, all preset amenities start checked if the list is empty (create flow). */
  selectAllByDefault?: boolean;
};

const AMENITY_ICON: Record<AmenityCode, ComponentType<IconProps>> = {
  WIFI: Wifi,
  FOOD_INCLUDED: UtensilsCrossed,
  WASHING_MACHINE: WashingMachine,
  HOT_WATER: Droplets,
  PARKING: Car,
  REFRIGERATOR: Refrigerator,
  HOUSEKEEPING: BrushCleaning,
  CCTV: Camera,
  POWER_BACKUP: BatteryCharging,
  RO_WATER: GlassWater,
  BEDS: BedDouble,
  WARDROBE: Shirt,
  CUSTOM: Plus,
};

function AmenityTile({
  label,
  checked,
  indeterminate = false,
  disabled,
  onToggle,
  icon: Icon,
  fullWidth = false,
}: {
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onToggle: () => void;
  icon: ComponentType<IconProps>;
  fullWidth?: boolean;
}) {
  const selected = checked || indeterminate;
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      style={({ pressed }) => [
        styles.tile,
        fullWidth && styles.tileFull,
        selected && styles.tileSelected,
        pressed && !selected && styles.tilePressed,
        disabled && styles.tileDisabled,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{
        checked: indeterminate ? 'mixed' : checked,
        disabled: Boolean(disabled),
      }}>
      <View style={[styles.tileIconWrap, selected && styles.tileIconWrapSelected]}>
        <Icon
          size={18}
          color={selected ? colors.primaryDark : colors.muted}
          strokeWidth={2.2}
        />
      </View>
      <Text style={[styles.tileLabel, selected && styles.tileLabelSelected]} numberOfLines={2}>
        {label}
      </Text>
      <View style={[styles.tileCheck, selected && styles.tileCheckSelected]}>
        {selected ? <Check size={11} color={colors.white} strokeWidth={3} /> : null}
      </View>
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
        ...buildAllPresetAmenities(code => resolvePresetAmenityLabel(code, t)),
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
    onChange(buildAllPresetAmenities(code => resolvePresetAmenityLabel(code, t)));
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

  function togglePreset(code: Exclude<AmenityCode, 'CUSTOM'>) {
    if (disabled) {
      return;
    }
    if (selectedKeys.has(code)) {
      onChange(value.filter(item => amenityKey(item) !== code));
      return;
    }
    if (value.length >= MAX_SPACE_AMENITIES) {
      return;
    }
    onChange(
      normalizeAmenityAssignments([
        ...value,
        { code, label: resolvePresetAmenityLabel(code, t) },
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
        <AmenityTile
          label={t('spaces.amenities.selectAll')}
          checked={allSelected}
          indeterminate={allIndeterminate}
          disabled={disabled}
          onToggle={toggleAll}
          icon={SquareCheck}
          fullWidth
        />

        {PRESET_AMENITY_CODES.map(code => (
          <AmenityTile
            key={code}
            label={resolvePresetAmenityLabel(code, t)}
            checked={selectedKeys.has(code)}
            disabled={disabled}
            onToggle={() => togglePreset(code)}
            icon={AMENITY_ICON[code]}
          />
        ))}

        {customAmenities.map(item => (
          <AmenityTile
            key={amenityKey(item)}
            label={item.label}
            checked={selectedKeys.has(amenityKey(item))}
            disabled={disabled}
            onToggle={() => toggleCustom(item)}
            icon={Plus}
            fullWidth
          />
        ))}
      </View>

      <View style={styles.customSection}>
        <Text style={styles.customLabel}>{t('spaces.amenities.customLabel')}</Text>
        <View style={styles.customInlineRow}>
          <View style={[styles.customInputWrap, customError ? styles.customInputWrapError : null]}>
            <Plus size={16} color={colors.muted} strokeWidth={2.2} />
            <TextInput
              style={styles.customInput}
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
          </View>
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
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tile: {
    width: '48.5%',
    flexGrow: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  tileFull: {
    width: '100%',
    minWidth: '100%',
  },
  tileSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  tilePressed: {
    backgroundColor: colors.surface,
  },
  tileDisabled: {
    opacity: 0.5,
  },
  tileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tileIconWrapSelected: {
    backgroundColor: `${colors.primary}22`,
  },
  tileLabel: {
    ...typography.caption,
    flex: 1,
    minWidth: 0,
    fontWeight: '600',
    color: colors.textPrimary,
    fontSize: 12,
  },
  tileLabelSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  tileCheck: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tileCheckSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  customSection: {
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
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
  customInputWrap: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  customInputWrapError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  customInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
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
    backgroundColor: colors.lightGreen,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
