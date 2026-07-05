import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type {
  AccommodationSetupSampleNode,
  AccommodationSetupTotals,
} from '../../../api/types';
import { Button } from '../../ui';
import { colors, radius, shadows, spacing, typography } from '../../../theme';
import {
  buildStructurePreview,
  INITIAL_VISIBLE_FLOORS,
  type SetupPreviewFloor,
} from './setupPreviewUtils';

export type SetupPreviewLayoutProps = {
  nodes: AccommodationSetupSampleNode[];
  totals: AccommodationSetupTotals;
  layoutModeLabel?: string;
};

type SummaryCardProps = {
  value: number;
  label: string;
};

function SummaryCard({ value, label }: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SetupPreviewSummaryGrid({ totals }: { totals: AccommodationSetupTotals }) {
  const { t } = useTranslation();

  return (
    <View style={styles.summaryGrid}>
      <View style={styles.summaryRow}>
        <SummaryCard
          value={totals.floors}
          label={t('accommodation.setup.summary.floors')}
        />
        <SummaryCard
          value={totals.units}
          label={t('accommodation.setup.summary.units')}
        />
      </View>
      <View style={styles.summaryRow}>
        <SummaryCard
          value={totals.rooms}
          label={t('accommodation.setup.summary.rooms')}
        />
        <SummaryCard
          value={totals.beds}
          label={t('accommodation.setup.summary.beds')}
        />
      </View>
    </View>
  );
}

function FloorCountLines({ floor }: { floor: SetupPreviewFloor }) {
  const { t } = useTranslation();

  return (
    <View style={styles.floorCounts}>
      {floor.unitCount > 0 ? (
        <Text style={styles.countLine}>
          {t('accommodation.setup.structure.floorUnits', { count: floor.unitCount })}
        </Text>
      ) : null}
      {floor.roomCount > 0 ? (
        <Text style={styles.countLine}>
          {t('accommodation.setup.structure.floorRooms', { count: floor.roomCount })}
        </Text>
      ) : null}
      {floor.bedCount > 0 ? (
        <Text style={styles.countLine}>
          {t('accommodation.setup.structure.floorBeds', { count: floor.bedCount })}
        </Text>
      ) : null}
    </View>
  );
}

function ExpandableFloorSection({
  floor,
  defaultExpanded,
}: {
  floor: SetupPreviewFloor;
  defaultExpanded: boolean;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.floorCard}>
      <Pressable
        onPress={() => setExpanded(value => !value)}
        style={({ pressed }) => [styles.floorHeader, pressed && styles.floorHeaderPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}>
        <Text style={styles.floorChevron}>{expanded ? '▼' : '▶'}</Text>
        <View style={styles.floorHeaderBody}>
          <Text style={styles.floorTitle}>{floor.label}</Text>
          {!expanded ? <FloorCountLines floor={floor} /> : null}
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.floorBody}>
          <FloorCountLines floor={floor} />
          {floor.childItems.length > 0 ? (
            <View style={styles.childList}>
              {floor.childItems.map((item, index) => (
                <Text key={`${item.label}-${index}`} style={styles.childItem}>
                  {t('accommodation.setup.structure.bullet', { label: item.label })}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function BuildingUnitsSection({ section }: { section: SetupPreviewFloor }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.floorCard}>
      <Pressable
        onPress={() => setExpanded(value => !value)}
        style={({ pressed }) => [styles.floorHeader, pressed && styles.floorHeaderPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}>
        <Text style={styles.floorChevron}>{expanded ? '▼' : '▶'}</Text>
        <View style={styles.floorHeaderBody}>
          <Text style={styles.floorTitle}>{t('accommodation.setup.structure.unitsSection')}</Text>
          {!expanded ? <FloorCountLines floor={section} /> : null}
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.floorBody}>
          <FloorCountLines floor={section} />
          <View style={styles.childList}>
            {section.childItems.map((item, index) => (
              <Text key={`${item.label}-${index}`} style={styles.childItem}>
                {t('accommodation.setup.structure.bullet', { label: item.label })}
              </Text>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function SetupPreviewLayout({
  nodes,
  totals,
  layoutModeLabel,
}: SetupPreviewLayoutProps) {
  const { t } = useTranslation();
  const structure = useMemo(
    () => buildStructurePreview(nodes, totals),
    [nodes, totals],
  );
  const [showAllFloors, setShowAllFloors] = useState(false);

  const visibleFloors = showAllFloors
    ? structure.floors
    : structure.floors.slice(0, INITIAL_VISIBLE_FLOORS);
  const hasHiddenFloors = structure.floors.length > INITIAL_VISIBLE_FLOORS;

  return (
    <View style={styles.root}>
      {layoutModeLabel ? (
        <Text style={styles.layoutMode}>{layoutModeLabel}</Text>
      ) : null}

      <Text style={styles.buildingTitle}>{structure.buildingLabel}</Text>

      <SetupPreviewSummaryGrid totals={totals} />

      <Text style={styles.sectionTitle}>
        {t('accommodation.setup.structurePreview')}
      </Text>

      {structure.floors.length > 0 ? (
        <View style={styles.structureList}>
          {visibleFloors.map((floor, index) => (
            <ExpandableFloorSection
              key={floor.id}
              floor={floor}
              defaultExpanded={index < INITIAL_VISIBLE_FLOORS}
            />
          ))}

          {hasHiddenFloors && !showAllFloors ? (
            <Button
              label={t('accommodation.setup.viewCompleteStructure')}
              variant="ghost"
              onPress={() => setShowAllFloors(true)}
              style={styles.expandButton}
            />
          ) : null}
        </View>
      ) : null}

      {structure.buildingSection ? (
        <BuildingUnitsSection section={structure.buildingSection} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  layoutMode: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  buildingTitle: {
    ...typography.h3,
  },
  summaryGrid: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  summaryValue: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textSecondary,
  },
  structureList: {
    gap: spacing.sm,
  },
  floorCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  floorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  floorHeaderPressed: {
    backgroundColor: colors.surface,
  },
  floorChevron: {
    ...typography.body,
    color: colors.muted,
    width: 16,
    marginTop: 2,
  },
  floorHeaderBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  floorTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  floorBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  floorCounts: {
    gap: 2,
  },
  countLine: {
    ...typography.body,
    color: colors.textSecondary,
  },
  childList: {
    marginTop: spacing.xs,
    gap: 4,
    paddingLeft: spacing.sm,
  },
  childItem: {
    ...typography.body,
    color: colors.textPrimary,
  },
  expandButton: {
    alignSelf: 'stretch',
  },
});
