import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ComplaintCategory, ComplaintPriority } from '../../api/types';
import { colors, shadows, spacing, typography } from '../../theme';
import {
  getComplaintCategoryColor,
  getComplaintCategoryIcon,
  getComplaintPriorityIcon,
  getComplaintPriorityPickerColor,
} from '../../utils/complaintVisuals';

type ComplaintSelectionSummaryProps = {
  title: string;
  categoryLabel: string;
  priorityLabel: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  categoryCaption: string;
  priorityCaption: string;
};

export function ComplaintSelectionSummary({
  title,
  categoryLabel,
  priorityLabel,
  category,
  priority,
  categoryCaption,
  priorityCaption,
}: ComplaintSelectionSummaryProps) {
  const CategoryIcon = getComplaintCategoryIcon(category);
  const PriorityIcon = getComplaintPriorityIcon(priority);
  const categoryColor = getComplaintCategoryColor(category);
  const priorityColor = getComplaintPriorityPickerColor(priority);

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${categoryCaption} ${categoryLabel}. ${priorityCaption} ${priorityLabel}.`}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.caption}>{categoryCaption}</Text>
          <View style={[styles.chip, { backgroundColor: `${categoryColor}14`, borderColor: `${categoryColor}44` }]}>
            <CategoryIcon size={14} color={categoryColor} strokeWidth={2.4} />
            <Text style={[styles.chipText, { color: categoryColor }]} numberOfLines={1}>
              {categoryLabel}
            </Text>
          </View>
        </View>
        <View style={styles.item}>
          <Text style={styles.caption}>{priorityCaption}</Text>
          <View style={[styles.chip, { backgroundColor: `${priorityColor}14`, borderColor: `${priorityColor}44` }]}>
            <PriorityIcon size={14} color={priorityColor} strokeWidth={2.4} />
            <Text style={[styles.chipText, { color: priorityColor }]} numberOfLines={1}>
              {priorityLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  item: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  caption: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    ...typography.caption,
    flex: 1,
    fontWeight: '700',
    fontSize: 13,
  },
});
