import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BuildingResponse } from '../../api/types';
import { OccupancyWizardTopBar } from '../occupancy/OccupancyWizardTopBar';
import { useBuildings } from '../../hooks/useBuildings';
import { colors, radius, spacing, typography } from '../../theme';

type BuildingPickerModalProps = {
  visible: boolean;
  spaceId: string;
  title: string;
  onClose: () => void;
  onSelect: (building: BuildingResponse) => void;
};

function BuildingSelectRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && !selected && styles.rowPressed,
      ]}>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
    </Pressable>
  );
}

export function BuildingPickerModal({
  visible,
  spaceId,
  title,
  onClose,
  onSelect,
}: BuildingPickerModalProps) {
  const { t } = useTranslation();
  const { buildings, loading, error } = useBuildings(spaceId, { enabled: visible });
  const autoSelectedRef = useRef(false);
  const activeBuildings = buildings.filter(building => building.active !== false);

  useEffect(() => {
    if (!visible) {
      autoSelectedRef.current = false;
      return;
    }
    if (!loading && activeBuildings.length === 1 && !autoSelectedRef.current) {
      autoSelectedRef.current = true;
      onSelect(activeBuildings[0]);
    }
  }, [activeBuildings, loading, onSelect, visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <OccupancyWizardTopBar title={title} onBack={onClose} onCancel={onClose} />

        <View style={styles.intro}>
          <Text style={styles.stepTitle}>{t('occupancy.hierarchy.selectBuildingTitle')}</Text>
          <Text style={styles.hint}>{t('occupancy.hierarchy.selectBuildingHint')}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
          {activeBuildings.map(building => (
            <BuildingSelectRow
              key={building.buildingId}
              label={building.name}
              selected={false}
              onPress={() => onSelect(building)}
            />
          ))}
          {!loading && activeBuildings.length === 0 ? (
            <Text style={styles.empty}>{t('accommodation.buildings.emptyTitle')}</Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button label={t('common.back')} variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
  },
  close: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  intro: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  stepTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
  },
  error: {
    ...typography.body,
    color: '#DC2626',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  rowSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.lightGreen,
  },
  rowPressed: {
    opacity: 0.88,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  rowLabel: {
    ...typography.bodyStrong,
    flex: 1,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
});
