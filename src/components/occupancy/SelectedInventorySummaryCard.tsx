import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BedDouble, Building2, DoorOpen, Eye, Home, Pencil } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ContactNumberLine } from '../member/ContactAndStayMeta';
import { colors, radius, spacing, typography } from '../../theme';
import {
  formatOccupancyInventoryPath,
  formatOccupancyInventoryTitle,
} from '../../utils/formatOccupancyInventoryTitle';
import type { OccupancyHierarchyContext } from './HierarchyBreadcrumbCard';

type SelectedInventorySummaryCardProps = {
  context: OccupancyHierarchyContext;
  /** When true, show View details instead of Change. */
  viewOnly?: boolean;
  onChangePress?: () => void;
  memberName?: string | null;
  memberMobile?: string | null;
  showMember?: boolean;
  /** Flatten borders when nested inside another card (e.g. Review). */
  embedded?: boolean;
};

function InventoryIcon({ context }: { context: OccupancyHierarchyContext }) {
  if (context.bedName?.trim()) {
    return <BedDouble size={18} color={colors.primaryDark} strokeWidth={2.2} />;
  }
  if (context.roomName?.trim()) {
    return <DoorOpen size={18} color={colors.primaryDark} strokeWidth={2.2} />;
  }
  if (context.unitName?.trim()) {
    return <Home size={18} color={colors.primaryDark} strokeWidth={2.2} />;
  }
  return <Building2 size={18} color={colors.primaryDark} strokeWidth={2.2} />;
}

export function SelectedInventorySummaryCard({
  context,
  viewOnly = false,
  onChangePress,
  memberName,
  memberMobile,
  showMember = false,
  embedded = false,
}: SelectedInventorySummaryCardProps) {
  const { t } = useTranslation();
  const title = formatOccupancyInventoryTitle(context, t);
  const subtitle = formatOccupancyInventoryPath(context);

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded]} testID="selected-inventory-summary">
      <View style={[styles.card, embedded && styles.cardEmbedded]}>
        <View style={styles.iconWrap} accessibilityElementsHidden>
          <InventoryIcon context={context} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={3}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onChangePress ? (
          <Pressable
            onPress={onChangePress}
            hitSlop={8}
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel={
              viewOnly
                ? t('common.viewDetails', { defaultValue: 'View details' })
                : t('common.change', { defaultValue: 'Change' })
            }>
            {viewOnly ? (
              <Eye size={14} color={colors.primaryDark} strokeWidth={2.2} />
            ) : (
              <Pencil size={14} color={colors.primaryDark} strokeWidth={2.2} />
            )}
            <Text style={styles.actionLabel}>
              {viewOnly
                ? t('common.viewDetails', { defaultValue: 'View details' })
                : t('common.change', { defaultValue: 'Change' })}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {showMember && memberName ? (
        <View style={[styles.card, styles.memberCard, embedded && styles.cardEmbedded]}>
          <View style={[styles.iconWrap, styles.memberIcon]} accessibilityElementsHidden>
            <Text style={styles.memberInitial}>
              {memberName.trim().charAt(0).toUpperCase() || 'M'}
            </Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>
              {memberName}
            </Text>
            {memberMobile ? (
              <ContactNumberLine
                value={memberMobile}
                name={memberName}
                textStyle={styles.subtitle}
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  wrapEmbedded: {
    marginBottom: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  cardEmbedded: {
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  memberCard: {
    backgroundColor: `${colors.primary}0D`,
    borderColor: `${colors.primary}33`,
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.successTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  memberIcon: {
    backgroundColor: `${colors.primary}22`,
  },
  memberInitial: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 14,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
    flexShrink: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    flexShrink: 0,
    marginTop: 2,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
  },
});
