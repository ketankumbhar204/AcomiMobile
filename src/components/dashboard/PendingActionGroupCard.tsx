import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import type { NotificationPriority, PendingActionGroup, UUID } from '../../api/types';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { navigateFromPendingActionGroup } from '../../utils/notificationDeepLinks';
import { canManageNotifications } from '../../utils/spaceOperator';
import {
  getNotificationCategoryColor,
  getNotificationIcon,
} from '../../utils/spaceVisuals';

type PendingActionGroupCardProps = {
  spaceId: UUID;
  group: PendingActionGroup;
};

function priorityTone(priority: NotificationPriority): {
  labelKey: string;
  color: string;
} {
  switch (priority) {
    case 'CRITICAL':
      return { labelKey: 'dashboard.pendingActions.priority.CRITICAL', color: '#DC2626' };
    case 'HIGH':
      return { labelKey: 'dashboard.pendingActions.priority.HIGH', color: '#D97706' };
    case 'LOW':
      return { labelKey: 'dashboard.pendingActions.priority.LOW', color: colors.muted };
    case 'MEDIUM':
    default:
      return { labelKey: 'dashboard.pendingActions.priority.MEDIUM', color: '#2563EB' };
  }
}

function isTodayFocusedAction(actionType: PendingActionGroup['actionType']): boolean {
  return (
    actionType === 'MOVE_IN_SCHEDULED_TODAY' ||
    actionType === 'MOVE_OUT_SCHEDULED_TODAY' ||
    actionType === 'RESERVATION_STARTING_TODAY'
  );
}

export function PendingActionGroupCard({ spaceId, group }: PendingActionGroupCardProps) {
  const { t } = useTranslation();
  const permissions = useSpacePermissions(spaceId);
  const isOperator = canManageNotifications(permissions);
  const sample = group.items[0];
  const category = sample?.category ?? 'ACTION_REQUIRED';
  const accent = getNotificationCategoryColor(category);
  const Icon = getNotificationIcon(group.actionType, category);
  const tone = priorityTone(group.priority);

  const title =
    t(`dashboard.pendingActions.groups.${group.actionType}`, {
      defaultValue: group.title,
    }) + (group.count > 0 ? ` (${group.count})` : '');

  const subtitle =
    sample?.message ??
    group.actionLabel ??
    t('dashboard.pendingActions.tapToOpen');

  const actionLabel =
    group.actionLabel ??
    sample?.actionLabel ??
    t('dashboard.pendingActions.tapToOpen');

  const onPress = useCallback(() => {
    navigateFromPendingActionGroup(spaceId, group, isOperator);
  }, [group, isOperator, spaceId]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}>
      <View style={[styles.iconWrap, { backgroundColor: `${accent}18` }]}>
        <Icon size={18} color={accent} strokeWidth={2.2} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View
            style={[
              styles.priorityChip,
              { backgroundColor: `${tone.color}14`, borderColor: `${tone.color}33` },
            ]}>
            <Text style={[styles.priorityText, { color: tone.color }]}>
              {t(tone.labelKey, {
                defaultValue: group.priority,
              })}
            </Text>
          </View>
        </View>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.actionPill, { backgroundColor: `${accent}12` }]}>
            <Text style={[styles.actionPillText, { color: accent }]} numberOfLines={1}>
              {actionLabel}
            </Text>
          </View>
          {sample?.createdAt ? (
            <Text style={styles.metaTime} numberOfLines={1}>
              {new Date(sample.createdAt).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
      </View>
      <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
    </Pressable>
  );
}

type PendingActionsListProps = {
  spaceId: UUID;
  groups: PendingActionGroup[];
};

export function PendingActionsList({ spaceId, groups }: PendingActionsListProps) {
  const { t } = useTranslation();

  const sections = useMemo(() => {
    const today: PendingActionGroup[] = [];
    const attention: PendingActionGroup[] = [];
    for (const group of groups) {
      if (isTodayFocusedAction(group.actionType)) {
        today.push(group);
      } else {
        attention.push(group);
      }
    }
    return [
      {
        id: 'today',
        title: t('dashboard.pendingActions.sections.today', {
          defaultValue: "Today's tasks",
        }),
        items: today,
      },
      {
        id: 'attention',
        title: t('dashboard.pendingActions.sections.attention', {
          defaultValue: 'Needs attention',
        }),
        items: attention,
      },
    ].filter(section => section.items.length > 0);
  }, [groups, t]);

  if (groups.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {sections.map(section => (
        <View key={section.id} style={styles.section}>
          {sections.length > 1 ? (
            <Text style={styles.sectionLabel}>{section.title}</Text>
          ) : null}
          {section.items.map(group => (
            <PendingActionGroupCard
              key={group.actionType}
              spaceId={spaceId}
              group={group}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
    marginBottom: spacing.xxs,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  cardPressed: {
    borderColor: `${colors.primary}66`,
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
  },
  priorityChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  priorityText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 14,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxs,
    flexWrap: 'wrap',
  },
  actionPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    maxWidth: '70%',
  },
  actionPillText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  metaTime: {
    ...typography.caption,
    color: colors.muted,
    fontSize: 11,
  },
});
