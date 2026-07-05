import React from 'react';
import { StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { useTranslation } from 'react-i18next';
import { InlineEditableName } from '../../../ui/InlineEditableName';
import { colors, radius, shadows, spacing, typography } from '../../../../theme';
import {
  AccommodationInactiveBadge,
  accommodationInactiveCardStyle,
  accommodationInactiveIllustrationStyle,
} from '../../AccommodationInactiveBadge';
import { CircularOccupancyIndicator } from './CircularOccupancyIndicator';
import { LayoutIllustration } from './LayoutIllustration';
import type { LayoutStatusCounts } from './layoutSummaryTypes';

type Metric = {
  label: string;
  value: string;
};

type LayoutSummaryCardProps = {
  title: string;
  subtitle?: string;
  metrics: Metric[];
  occupancyPercent?: number;
  statusCounts?: LayoutStatusCounts;
  illustration?: ImageSourcePropType;
  illustrationSize?: 'building' | 'floor' | 'unit' | 'room' | 'bed' | 'bedHero';
  actions?: React.ReactNode;
  inactive?: boolean;
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
};

function hasStatusCounts(counts?: LayoutStatusCounts): counts is LayoutStatusCounts {
  if (!counts) {
    return false;
  }
  return (
    counts.available != null ||
    counts.occupied != null ||
    counts.reserved != null ||
    counts.maintenance != null ||
    counts.blocked != null ||
    counts.inactive != null
  );
}

export function LayoutSummaryCard({
  title,
  subtitle,
  metrics,
  occupancyPercent,
  statusCounts,
  illustration,
  illustrationSize = 'building',
  actions,
  inactive = false,
  editableName = false,
  onSaveName,
}: LayoutSummaryCardProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.card, inactive && accommodationInactiveCardStyle]}>
      {illustration ? (
        <View style={illustrationSize === 'floor' ? styles.floorIllustrationWrap : undefined}>
          <LayoutIllustration
            source={illustration}
            size={illustrationSize}
            style={inactive ? accommodationInactiveIllustrationStyle : undefined}
          />
        </View>
      ) : null}

      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          {editableName && onSaveName ? (
            <InlineEditableName value={title} editable onSave={onSaveName} />
          ) : (
            <Text style={[styles.title, inactive && styles.titleInactive]}>{title}</Text>
          )}
          {subtitle ? (
            <Text style={[styles.subtitle, inactive && styles.subtitleInactive]}>{subtitle}</Text>
          ) : null}
          {inactive ? (
            <View style={styles.inactiveBadgeWrap}>
              <AccommodationInactiveBadge />
            </View>
          ) : null}
        </View>
        {occupancyPercent != null && !inactive ? (
          <CircularOccupancyIndicator percent={occupancyPercent} size={56} />
        ) : null}
      </View>

      {metrics.length > 0 ? (
        <View style={styles.metricsRow}>
          {metrics.map(metric => (
            <View key={metric.label} style={styles.metric}>
              <Text style={[styles.metricValue, inactive && styles.metricValueInactive]}>
                {metric.value}
              </Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {hasStatusCounts(statusCounts) ? (
        <Text style={styles.statusLine}>
          {t('accommodation.layout.dashboard.statusLine', {
            available: statusCounts.available ?? 0,
            occupied: statusCounts.occupied ?? 0,
            reserved: statusCounts.reserved ?? 0,
            maintenance: statusCounts.maintenance ?? 0,
            blocked: statusCounts.blocked ?? 0,
            inactive: statusCounts.inactive ?? 0,
          })}
        </Text>
      ) : null}

      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  floorIllustrationWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  titleInactive: {
    color: '#6B7280',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  subtitleInactive: {
    color: '#9CA3AF',
  },
  inactiveBadgeWrap: {
    marginTop: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metric: {
    minWidth: '28%',
    flex: 1,
  },
  metricValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  metricValueInactive: {
    color: '#6B7280',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  statusLine: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  actions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
