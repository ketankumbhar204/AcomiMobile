import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ComplaintPriority, ComplaintStatus } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import {
  getComplaintPriorityColor,
  getComplaintStatusColor,
} from '../../utils/complaintStatus';
import {
  getComplaintCategoryIcon,
  getComplaintPriorityIcon,
  getComplaintStatusIcon,
} from '../../utils/complaintVisuals';

type ComplaintStatusBadgeProps = {
  status: ComplaintStatus;
};

export function ComplaintStatusBadge({ status }: ComplaintStatusBadgeProps) {
  const { t } = useTranslation();
  const color = getComplaintStatusColor(status);
  const Icon = getComplaintStatusIcon(status);

  return (
    <View style={[styles.badge, { borderColor: `${color}44`, backgroundColor: `${color}14` }]}>
      <Icon size={12} color={color} strokeWidth={2.4} />
      <Text style={[styles.label, { color }]}>{t(`complaints.status.${status}`)}</Text>
    </View>
  );
}

type ComplaintPriorityBadgeProps = {
  priority: ComplaintPriority;
};

export function ComplaintPriorityBadge({ priority }: ComplaintPriorityBadgeProps) {
  const { t } = useTranslation();
  const color = getComplaintPriorityColor(priority);
  const Icon = getComplaintPriorityIcon(priority);

  return (
    <View style={[styles.badge, { borderColor: `${color}44`, backgroundColor: `${color}14` }]}>
      <Icon size={12} color={color} strokeWidth={2.4} />
      <Text style={[styles.label, { color }]}>{t(`complaints.priority.${priority}`)}</Text>
    </View>
  );
}

type ComplaintCategoryBadgeProps = {
  category: string;
};

export function ComplaintCategoryBadge({ category }: ComplaintCategoryBadgeProps) {
  const { t } = useTranslation();
  const Icon = getComplaintCategoryIcon(category);

  return (
    <View style={[styles.badge, styles.categoryBadge]}>
      <Icon size={12} color="#475569" strokeWidth={2.4} />
      <Text style={styles.categoryLabel}>{t(`complaints.category.${category}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
  categoryBadge: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  categoryLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: '#475569',
  },
});
