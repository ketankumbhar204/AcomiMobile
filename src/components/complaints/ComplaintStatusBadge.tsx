import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ComplaintPriority, ComplaintStatus } from '../../api/types';
import { radius, spacing, typography } from '../../theme';
import {
  getComplaintPriorityColor,
  getComplaintStatusColor,
} from '../../utils/complaintStatus';

type ComplaintStatusBadgeProps = {
  status: ComplaintStatus;
};

export function ComplaintStatusBadge({ status }: ComplaintStatusBadgeProps) {
  const { t } = useTranslation();
  const color = getComplaintStatusColor(status);

  return (
    <View style={[styles.badge, { borderColor: `${color}44`, backgroundColor: `${color}14` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
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

  return (
    <View style={[styles.badge, { borderColor: `${color}44`, backgroundColor: `${color}14` }]}>
      <Text style={[styles.label, { color }]}>{t(`complaints.priority.${priority}`)}</Text>
    </View>
  );
}

type ComplaintCategoryBadgeProps = {
  category: string;
};

export function ComplaintCategoryBadge({ category }: ComplaintCategoryBadgeProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.badge, styles.categoryBadge]}>
      <Text style={styles.categoryLabel}>{t(`complaints.category.${category}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
  categoryBadge: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  categoryLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: '#475569',
  },
});
