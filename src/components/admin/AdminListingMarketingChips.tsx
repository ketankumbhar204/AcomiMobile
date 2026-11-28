import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ListingMarketingStatus, WhatsAppAvailability } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';

type Props = {
  marketingStatus?: ListingMarketingStatus | null;
  whatsappAvailability?: WhatsAppAvailability | null;
};

export function AdminListingMarketingChips({ marketingStatus, whatsappAvailability }: Props) {
  const { t } = useTranslation();
  const status = marketingStatus ?? 'NOT_SHARED';
  const availability = whatsappAvailability ?? 'UNKNOWN';

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.chip,
          status === 'SHARED' ? styles.shared : styles.notShared,
        ]}
        numberOfLines={1}>
        {status === 'SHARED'
          ? t('admin.marketing.status.shared')
          : t('admin.marketing.status.notShared')}
      </Text>
      <Text
        style={[
          styles.chip,
          availability === 'AVAILABLE'
            ? styles.waAvailable
            : availability === 'UNAVAILABLE'
              ? styles.waUnavailable
              : styles.waUnknown,
        ]}
        numberOfLines={1}>
        {availability === 'AVAILABLE'
          ? t('admin.marketing.whatsapp.available')
          : availability === 'UNAVAILABLE'
            ? t('admin.marketing.whatsapp.unavailable')
            : t('admin.marketing.whatsapp.unknown')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    ...typography.caption,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  shared: { backgroundColor: '#DCFCE7', color: '#15803D' },
  notShared: { backgroundColor: colors.section, color: colors.textSecondary },
  waAvailable: { backgroundColor: '#ECFDF5', color: '#047857' },
  waUnavailable: { backgroundColor: '#FEF2F2', color: '#B91C1C' },
  waUnknown: { backgroundColor: colors.section, color: colors.textSecondary },
});
