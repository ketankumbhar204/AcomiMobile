import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CalendarDays,
  ChevronRight,
  History,
  UserCheck,
  UserRound,
} from 'lucide-react-native';
import type { ComplaintResponse } from '../../api/types';
import { colors, shadows, spacing, typography } from '../../theme';
import { formatComplaintDateTime } from '../../utils/complaintStatus';
import { getComplaintCategoryIcon } from '../../utils/complaintVisuals';
import {
  ComplaintCategoryBadge,
  ComplaintPriorityBadge,
  ComplaintStatusBadge,
} from './ComplaintStatusBadge';

type ComplaintListCardProps = {
  item: ComplaintResponse;
  onPress: () => void;
  categoryLabel: string;
  memberFallback: string;
  assignedLabel?: string;
  updatedLabel?: string;
};

export function ComplaintListCard({
  item,
  onPress,
  categoryLabel,
  memberFallback,
  assignedLabel,
  updatedLabel,
}: ComplaintListCardProps) {
  const CategoryIcon = getComplaintCategoryIcon(item.category);
  const memberName = item.createdByMemberName?.trim() || memberFallback;
  const assignee = item.assignedToName?.trim();
  const latest = updatedLabel ?? formatComplaintDateTime(item.updatedAt || item.createdAt);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(180, 83, 9, 0.08)' }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${categoryLabel}`}>
      <View style={styles.iconWell} accessibilityElementsHidden>
        <CategoryIcon size={18} color="#B45309" strokeWidth={2.2} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
        </View>

        <View style={styles.chipRow}>
          <ComplaintStatusBadge status={item.status} />
          <ComplaintPriorityBadge priority={item.priority} />
          <ComplaintCategoryBadge category={item.category} />
        </View>

        <View style={styles.metaRow}>
          <UserRound size={12} color={colors.muted} strokeWidth={2.2} />
          <Text style={styles.meta} numberOfLines={1}>
            {memberName}
          </Text>
        </View>

        {assignee ? (
          <View style={styles.metaRow}>
            <UserCheck size={12} color={colors.muted} strokeWidth={2.2} />
            <Text style={styles.meta} numberOfLines={1}>
              {assignedLabel ? `${assignedLabel}: ${assignee}` : assignee}
            </Text>
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <View style={styles.metaRow}>
            <CalendarDays size={12} color={colors.muted} strokeWidth={2.2} />
            <Text style={styles.footer} numberOfLines={1}>
              {formatComplaintDateTime(item.createdAt)}
            </Text>
          </View>
          {latest ? (
            <View style={styles.metaRow}>
              <History size={12} color={colors.muted} strokeWidth={2.2} />
              <Text style={styles.footer} numberOfLines={1}>
                {latest}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  cardPressed: {
    borderColor: `${colors.primary}66`,
    backgroundColor: colors.surface,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.warningTint,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  meta: {
    ...typography.caption,
    flex: 1,
    color: colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: 2,
  },
  footer: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
  },
});
