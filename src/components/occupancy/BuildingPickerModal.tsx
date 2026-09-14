import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { Building2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { BuildingResponse, BuildingSummaryResponse, SpaceType } from '../../api/types';
import { accommodationApi } from '../../api/accommodationApi';
import { OccupancyWizardTopBar } from '../occupancy/OccupancyWizardTopBar';
import { Button } from '../ui';
import { useBuildings } from '../../hooks/useBuildings';
import { colors, radius, spacing, typography } from '../../theme';
import {
  getHierarchySteps,
  getTotalAllocationFlowSteps,
} from '../../utils/hierarchyOccupancySteps';

type BuildingPickerModalProps = {
  visible: boolean;
  spaceId: string;
  spaceType: SpaceType;
  wizardMode: 'ALLOCATE' | 'RESERVE';
  title: string;
  onClose: () => void;
  onSelect: (building: BuildingResponse) => void;
};

type BuildingRow = BuildingResponse & {
  summary?: BuildingSummaryResponse | null;
};

export function BuildingPickerModal({
  visible,
  spaceId,
  spaceType,
  wizardMode,
  title,
  onClose,
  onSelect,
}: BuildingPickerModalProps) {
  const { t } = useTranslation();
  const { buildings, loading, error } = useBuildings(spaceId, { enabled: visible });
  const autoSelectedRef = useRef(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, BuildingSummaryResponse>>({});
  const [summariesLoading, setSummariesLoading] = useState(false);

  const activeBuildings = useMemo(
    () => buildings.filter(building => building.active !== false),
    [buildings],
  );

  const totalSteps = useMemo(() => {
    const hierarchy = getHierarchySteps(spaceType, 'CORRIDOR_PG', {
      buildingId: '',
      buildingName: '',
    });
    return 1 + getTotalAllocationFlowSteps(hierarchy, wizardMode);
  }, [spaceType, wizardMode]);

  useEffect(() => {
    if (!visible) {
      autoSelectedRef.current = false;
      setSelectedId(null);
      setSummaries({});
      return;
    }
    if (!loading && activeBuildings.length === 1 && !autoSelectedRef.current) {
      autoSelectedRef.current = true;
      onSelect(activeBuildings[0]);
    }
  }, [activeBuildings, loading, onSelect, visible]);

  useEffect(() => {
    if (!visible || loading || activeBuildings.length <= 1) {
      return;
    }
    let cancelled = false;
    setSummariesLoading(true);
    void (async () => {
      const entries = await Promise.all(
        activeBuildings.map(async building => {
          try {
            const summary = await accommodationApi.getBuildingSummary(
              spaceId,
              building.buildingId,
            );
            return [building.buildingId, summary] as const;
          } catch {
            return [building.buildingId, null] as const;
          }
        }),
      );
      if (cancelled) {
        return;
      }
      const next: Record<string, BuildingSummaryResponse> = {};
      for (const [id, summary] of entries) {
        if (summary) {
          next[id] = summary;
        }
      }
      setSummaries(next);
      setSummariesLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeBuildings, loading, spaceId, visible]);

  const rows: BuildingRow[] = activeBuildings.map(building => ({
    ...building,
    summary: summaries[building.buildingId] ?? null,
  }));

  const selected = rows.find(row => row.buildingId === selectedId) ?? null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <OccupancyWizardTopBar title={title} onBack={onClose} onCancel={onClose} />

        <View style={styles.progressBlock}>
          <Text style={styles.stepProgress}>
            {t('occupancyWizard.stepProgress', { current: 1, total: totalSteps })}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(1 / totalSteps) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.stepTitle}>{t('occupancy.hierarchy.selectBuildingTitle')}</Text>
          <Text style={styles.hint}>{t('occupancy.hierarchy.selectBuildingHint')}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {loading || summariesLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : null}
          {rows.map(building => {
            const selectedRow = selectedId === building.buildingId;
            const code = building.code?.trim() || building.name;
            const meta = building.summary
              ? t('occupancy.hierarchy.buildingMeta', {
                  floors: building.summary.floors,
                  rooms: building.summary.rooms,
                })
              : null;

            return (
              <Pressable
                key={building.buildingId}
                onPress={() => setSelectedId(building.buildingId)}
                style={({ pressed }) => [
                  styles.row,
                  selectedRow && styles.rowSelected,
                  pressed && !selectedRow && styles.rowPressed,
                ]}>
                <View style={[styles.radioOuter, selectedRow && styles.radioOuterSelected]}>
                  {selectedRow ? <View style={styles.radioInner} /> : null}
                </View>
                <View style={styles.iconChip}>
                  <Building2 size={20} color={colors.primaryDark} strokeWidth={2.2} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowCode}>{code}</Text>
                  <Text style={styles.rowLabel}>{building.name}</Text>
                  {meta ? <Text style={styles.rowSubtitle}>{meta}</Text> : null}
                </View>
              </Pressable>
            );
          })}
          {!loading && activeBuildings.length === 0 ? (
            <Text style={styles.empty}>{t('accommodation.buildings.emptyTitle')}</Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={t('common.continue')}
            onPress={() => {
              if (selected) {
                onSelect(selected);
              }
            }}
            disabled={!selected}
            style={styles.continueBtn}
          />
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
  progressBlock: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  stepProgress: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: colors.muted,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}18`,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  intro: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  stepTitle: {
    ...typography.h3,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
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
    borderRadius: 16,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowCode: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  rowLabel: {
    ...typography.bodyStrong,
  },
  rowSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
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
  continueBtn: {
    alignSelf: 'stretch',
  },
});
