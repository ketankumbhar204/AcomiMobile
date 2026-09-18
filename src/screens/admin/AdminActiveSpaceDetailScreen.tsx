import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AdminDetailField, AdminDetailSection } from '../../components/admin';
import { Card } from '../../components/ui';
import type { AdminStackParamList } from '../../navigation/types';
import { formatAdminDate } from '../../utils/adminLabels';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminActiveSpaceDetail'>;

export function AdminActiveSpaceDetailScreen({ route }: Props) {
  const { t } = useTranslation();
  const space = route.params.space;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <Text style={styles.title} numberOfLines={2}>
          {space.name}
        </Text>
        <Text style={styles.subtitle}>{space.type}</Text>
      </Card>

      <AdminDetailSection>
        <AdminDetailField label={t('admin.common.type')} value={space.type} />
        <AdminDetailField label={t('admin.common.owner')} value={space.ownerName} />
        <AdminDetailField label={t('admin.common.mobile')} value={space.ownerMobile} />
        {space.contactNumber ? (
          <AdminDetailField
            label={t('admin.common.spaceContact', { defaultValue: 'Space contact' })}
            value={space.contactNumber}
          />
        ) : null}
        {space.address ? (
          <AdminDetailField label={t('admin.common.address')} value={space.address} />
        ) : null}
        <AdminDetailField
          label={t('admin.common.created', { defaultValue: 'Created' })}
          value={formatAdminDate(space.createdAt)}
        />
      </AdminDetailSection>

      <Text style={styles.footnote}>
        {t('admin.activeSpace.footnote', {
          defaultValue:
            'Active space details come from the admin active-spaces API. Lead registration records remain under the Leads tab.',
        })}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.sm },
  headerCard: { marginBottom: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  footnote: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
