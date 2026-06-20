import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealDeliveryLocation, UUID } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';

type MealDeliveryLocationPickerProps = {
  locations: MealDeliveryLocation[];
  selectedId?: UUID | null;
  lastUsedLocationId?: UUID | null;
  onSelect: (locationId: UUID) => void;
  readOnly?: boolean;
};

export function MealDeliveryLocationPicker({
  locations,
  selectedId,
  lastUsedLocationId,
  onSelect,
  readOnly = false,
}: MealDeliveryLocationPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (locations.length === 0) {
    return null;
  }

  const selectedLocation = locations.find(row => row.id === selectedId);
  const isLastUsed = selectedId != null && selectedId === lastUsedLocationId;

  const handleSelect = (locationId: UUID) => {
    setOpen(false);
    onSelect(locationId);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          !readOnly && pressed && styles.triggerPressed,
          readOnly && styles.triggerReadOnly,
        ]}
        onPress={readOnly ? undefined : () => setOpen(true)}
        disabled={readOnly}
        accessibilityRole="button"
        accessibilityLabel={t('meals.poll.deliverTo')}
        accessibilityState={{ expanded: open }}>
        <View style={styles.triggerContent}>
          {selectedLocation ? (
            <>
              <View style={styles.nameRow}>
                <Text style={styles.triggerValue} numberOfLines={1}>
                  {selectedLocation.name}
                </Text>
                {isLastUsed ? (
                  <Text style={styles.lastUsedBadge}>{t('meals.poll.lastUsedDelivery')}</Text>
                ) : null}
              </View>
              {selectedLocation.description ? (
                <Text style={styles.triggerHint} numberOfLines={1}>
                  {selectedLocation.description}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.placeholder}>{t('meals.poll.selectDeliveryLocation')}</Text>
          )}
        </View>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>{t('meals.poll.selectDeliveryLocationTitle')}</Text>
            <ScrollView style={styles.optionList} keyboardShouldPersistTaps="handled">
              {locations.map(location => {
                const selected = selectedId === location.id;
                const isOptionLastUsed = location.id === lastUsedLocationId;
                return (
                  <Pressable
                    key={location.id}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && !selected && styles.optionPressed,
                    ]}
                    onPress={() => handleSelect(location.id)}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected }}>
                    <View style={styles.optionContent}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.optionName, selected && styles.optionNameSelected]}>
                          {location.name}
                        </Text>
                        {isOptionLastUsed ? (
                          <Text style={styles.optionLastUsed}>{t('meals.poll.lastUsedDelivery')}</Text>
                        ) : null}
                      </View>
                      {location.description ? (
                        <Text style={styles.optionDescription} numberOfLines={2}>
                          {location.description}
                        </Text>
                      ) : null}
                    </View>
                    {selected ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  triggerPressed: {
    backgroundColor: colors.surface,
  },
  triggerReadOnly: {
    opacity: 0.85,
  },
  triggerContent: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  triggerValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  triggerHint: {
    ...typography.caption,
    color: colors.muted,
  },
  placeholder: {
    ...typography.body,
    color: colors.muted,
  },
  lastUsedBadge: {
    ...typography.caption,
    color: colors.primaryDark,
    backgroundColor: `${colors.primary}18`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  chevron: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  sheetTitle: {
    ...typography.bodyStrong,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  optionList: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  optionSelected: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary,
  },
  optionPressed: {
    backgroundColor: colors.surface,
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  optionNameSelected: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  optionLastUsed: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  optionDescription: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
  check: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
