import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  CalendarX,
  ChevronRight,
  CircleAlert,
  FilePenLine,
  House,
  Mail,
  ReceiptIndianRupee,
  Store,
  type LucideIcon,
} from 'lucide-react-native';
import { getSpaceTypeLabel } from '../../api';
import type {
  GlobalAttentionItem,
  GlobalAttentionSpace,
  NotificationType,
  SpaceType,
} from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type GlobalAttentionSpaceCardProps = {
  space: GlobalAttentionSpace;
  onPressHeader: () => void;
  onPressItem: (item: GlobalAttentionItem) => void;
};

function resolveSpaceType(spaceType: GlobalAttentionSpace['spaceType']): SpaceType | null {
  if (spaceType === 'MESS' || spaceType === 'PG' || spaceType === 'HOSTEL') {
    return spaceType;
  }
  return null;
}

function spaceIconFor(spaceType: SpaceType | null): LucideIcon {
  if (spaceType === 'MESS') {
    return Store;
  }
  if (spaceType === 'HOSTEL') {
    return Building2;
  }
  return House;
}

function actionVisual(actionType: NotificationType): { icon: LucideIcon; accent: string } {
  switch (actionType) {
    case 'MENU_NOT_PLANNED':
    case 'MENU_DRAFT_PENDING_PUBLISH':
    case 'MEAL_POLL_NOT_PUBLISHED':
    case 'MEAL_RESPONSES_BELOW_THRESHOLD':
      return { icon: CalendarX, accent: '#D97706' };
    case 'PAYMENT_NEEDS_REVIEW':
    case 'PAYMENT_NEEDS_UPDATE':
    case 'PAYMENT_OVERDUE':
    case 'PAYMENT_UPDATE_REQUESTED':
    case 'PAYMENT_SUBMITTED':
    case 'PAYMENT_APPROVED':
    case 'PAYMENT_REJECTED':
      return { icon: ReceiptIndianRupee, accent: '#2563EB' };
    case 'COMPLAINT_PENDING':
    case 'COMPLAINT_OVERDUE':
    case 'COMPLAINT_CREATED':
    case 'COMPLAINT_COMMENTED':
    case 'COMPLAINT_RESOLVED':
      return { icon: CircleAlert, accent: '#DC2626' };
    case 'PENDING_INVITATION':
    case 'INVITATION_ACCEPTED':
      return { icon: Mail, accent: '#7C3AED' };
    case 'SUBSCRIPTION_ACTIVATION_PENDING':
    case 'TENANT_PROFILE_INCOMPLETE':
    case 'MISSING_KYC_DOCUMENTS':
    case 'MISSING_ADDRESS_PROOF':
      return { icon: FilePenLine, accent: '#EA580C' };
    default:
      return { icon: FilePenLine, accent: '#EA580C' };
  }
}

const AttentionActionRow = memo(function AttentionActionRow({
  item,
  onPress,
}: {
  item: GlobalAttentionItem;
  onPress: () => void;
}) {
  const { icon: Icon, accent } = actionVisual(item.actionType);
  const showBadge = item.count > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
      accessibilityRole="button"
      accessibilityLabel={
        showBadge ? `${item.title}, ${item.count}` : item.title
      }>
      <View style={[styles.actionIconWrap, { backgroundColor: `${accent}18` }]}>
        <Icon size={16} color={accent} strokeWidth={2.2} />
      </View>
      <Text style={styles.actionTitle} numberOfLines={1}>
        {item.title}
      </Text>
      {showBadge ? (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{item.count > 99 ? '99+' : String(item.count)}</Text>
        </View>
      ) : null}
      <ChevronRight size={16} color={colors.muted} strokeWidth={2.4} />
    </Pressable>
  );
});

/** Design A Needs Attention space card — header + compact action rows. */
export const GlobalAttentionSpaceCard = memo(function GlobalAttentionSpaceCard({
  space,
  onPressHeader,
  onPressItem,
}: GlobalAttentionSpaceCardProps) {
  const { t } = useTranslation();
  const spaceType = resolveSpaceType(space.spaceType);
  const SpaceIcon = useMemo(() => spaceIconFor(spaceType), [spaceType]);
  const typeLabel = spaceType ? getSpaceTypeLabel(spaceType) : null;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPressHeader}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${space.spaceName}, ${t('spaces.globalDashboard.pendingActions', {
          count: space.count,
        })}`}>
        <View style={styles.spaceIconWrap}>
          <SpaceIcon size={20} color={colors.primaryDark} strokeWidth={2.2} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.spaceName} numberOfLines={1}>
            {space.spaceName}
          </Text>
          <Text style={styles.pendingCount}>
            {t('spaces.globalDashboard.pendingActions', { count: space.count })}
          </Text>
        </View>
        {typeLabel ? (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText} numberOfLines={1}>
              {typeLabel}
            </Text>
          </View>
        ) : null}
        <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
      </Pressable>

      {space.items.length > 0 ? (
        <>
          <View style={styles.divider} />
          <View style={styles.actions}>
            {space.items.map(item => (
              <AttentionActionRow
                key={`${space.spaceId}-${item.actionType}`}
                item={item}
                onPress={() => onPressItem(item)}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  headerPressed: {
    opacity: 0.88,
  },
  spaceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  spaceName: {
    ...typography.bodyStrong,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  pendingCount: {
    ...typography.caption,
    color: '#C2410C',
    fontWeight: '700',
  },
  typeBadge: {
    flexShrink: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
  },
  typeBadgeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 11,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  actions: {
    gap: 2,
    paddingBottom: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    borderRadius: radius.button,
  },
  actionRowPressed: {
    backgroundColor: colors.surface,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 11,
  },
});
