import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export type TimelineItem = {
  id: string;
  title: string;
  meta?: string;
  description?: string;
  statusLabel?: string;
  accent?: string;
  icon?: LucideIcon;
};

export type TimelineGroup = {
  key: string;
  label: string;
  items: TimelineItem[];
};

type TimelineProps = {
  groups: TimelineGroup[];
};

/** Grouped vertical timeline with a status rail, shared across history screens. */
export function Timeline({ groups }: TimelineProps) {
  return (
    <View style={styles.wrap}>
      {groups.map(group => (
        <View key={group.key} style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View style={styles.groupRule} />
          </View>

          {group.items.map((item, index) => {
            const accent = item.accent ?? colors.primary;
            const Icon = item.icon;
            const isLast = index === group.items.length - 1;

            return (
              <View key={item.id} style={styles.row}>
                <View style={styles.rail}>
                  <View style={[styles.marker, { borderColor: accent }]}>
                    {Icon ? (
                      <Icon size={12} color={accent} strokeWidth={2.4} />
                    ) : (
                      <View style={[styles.markerDot, { backgroundColor: accent }]} />
                    )}
                  </View>
                  {!isLast ? <View style={styles.line} /> : null}
                </View>

                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.statusLabel ? (
                      <View
                        style={[
                          styles.statusChip,
                          { backgroundColor: `${accent}14`, borderColor: `${accent}44` },
                        ]}>
                        <Text style={[styles.statusText, { color: accent }]} numberOfLines={1}>
                          {item.statusLabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {item.meta ? <Text style={styles.meta}>{item.meta}</Text> : null}
                  {item.description ? (
                    <Text style={styles.description}>{item.description}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  group: {
    gap: spacing.xs,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  groupLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  groupRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rail: {
    width: 24,
    alignItems: 'center',
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    flex: 1,
    width: 2,
    minHeight: 16,
    marginVertical: 4,
    backgroundColor: colors.border,
  },
  card: {
    flex: 1,
    minWidth: 0,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    flexShrink: 0,
  },
  statusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
  },
  description: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
