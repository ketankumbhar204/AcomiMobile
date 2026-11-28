import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AdminListingMarketingActivity } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';

type Props = {
  activities?: AdminListingMarketingActivity[] | null;
};

function formatWhen(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function AdminListingMarketingHistory({ activities }: Props) {
  const { t } = useTranslation();
  const items = activities ?? [];

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('admin.marketing.history.title')}</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>{t('admin.marketing.history.empty')}</Text>
      ) : (
        items.map(activity => (
          <View key={activity.id} style={styles.item}>
            <Text style={styles.outcome}>
              {t(`admin.marketing.outcomes.${activity.outcome}`, {
                defaultValue: activity.outcome,
              })}
            </Text>
            <Text style={styles.meta}>
              {t(`admin.marketing.channels.${activity.channel}`, {
                defaultValue: activity.channel,
              })}
              {activity.templateKey
                ? ` · ${t(`admin.marketing.templates.${activity.templateKey}`, {
                    defaultValue: activity.templateKey,
                  })}`
                : ''}
              {` · ${formatWhen(activity.createdAt)}`}
            </Text>
            {activity.note ? <Text style={styles.note}>{activity.note}</Text> : null}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  empty: { ...typography.caption, color: colors.textSecondary },
  item: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.section,
    padding: spacing.sm,
    gap: 2,
  },
  outcome: { ...typography.caption, fontWeight: '700', color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  note: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
