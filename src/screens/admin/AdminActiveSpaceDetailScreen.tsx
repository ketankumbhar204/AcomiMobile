import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/adminApi';
import type { AdminListingMarketingResponse } from '../../api/types';
import {
  AdminDetailField,
  AdminDetailSection,
  AdminListingMarketingChips,
  AdminListingMarketingHistory,
  AdminListingMarketingShareDialog,
} from '../../components/admin';
import { ContactNumberLine } from '../../components/member/ContactAndStayMeta';
import { Button, Card } from '../../components/ui';
import { ReferenceCode } from '../../components/ui/ReferenceCode';
import { StickyFormActions } from '../../components/progressive';
import type { AdminStackParamList } from '../../navigation/types';
import { formatAdminDate } from '../../utils/adminLabels';
import { isMarkedTestLead } from '../../utils/adminTestLead';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminActiveSpaceDetail'>;

export function AdminActiveSpaceDetailScreen({ route }: Props) {
  const { t } = useTranslation();
  const space = route.params.space;
  const [marketing, setMarketing] = useState<AdminListingMarketingResponse | null>(null);
  const [loadingMarketing, setLoadingMarketing] = useState(true);
  const [marketingMode, setMarketingMode] = useState<'share' | 'call' | null>(null);

  const loadMarketing = useCallback(async () => {
    setLoadingMarketing(true);
    try {
      setMarketing(await adminApi.getSpaceMarketing(space.id));
    } catch {
      setMarketing(null);
    } finally {
      setLoadingMarketing(false);
    }
  }, [space.id]);

  useFocusEffect(
    useCallback(() => {
      void loadMarketing();
    }, [loadMarketing]),
  );

  useEffect(() => {
    void loadMarketing();
  }, [loadMarketing]);

  const listingKind = space.type === 'MESS' ? 'MESS' : 'PROPERTY';

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <Text style={styles.title} numberOfLines={2}>
            {space.name}
          </Text>
          <ReferenceCode value={space.referenceCode} />
          <Text style={styles.subtitle}>{space.type}</Text>
          {isMarkedTestLead(space.testLead) ? (
            <Text style={styles.testBadge}>{t('admin.labels.testBadge')}</Text>
          ) : null}
          <AdminListingMarketingChips
            marketingStatus={marketing?.marketingStatus ?? space.marketingStatus}
            whatsappAvailability={
              marketing?.whatsappAvailability ?? space.whatsappAvailability
            }
          />
        </Card>

        <AdminDetailSection>
          <AdminDetailField label={t('admin.common.type')} value={space.type} />
          <AdminDetailField label={t('admin.common.owner')} value={space.ownerName} />
          <AdminDetailField
            label={t('admin.common.mobile')}
            value={space.ownerMobile}
            valueNode={
              space.ownerMobile ? (
                <ContactNumberLine
                  value={space.ownerMobile}
                  name={space.ownerName}
                  showIcon={false}
                />
              ) : undefined
            }
          />
          {space.contactNumber ? (
            <AdminDetailField
              label={t('admin.common.spaceContact', { defaultValue: 'Space contact' })}
              value={space.contactNumber}
              valueNode={
                <ContactNumberLine
                  value={space.contactNumber}
                  name={space.name}
                  showIcon={false}
                />
              }
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

        <AdminDetailSection>
          {loadingMarketing ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <AdminListingMarketingHistory activities={marketing?.activities} />
          )}
        </AdminDetailSection>

        <Text style={styles.footnote}>
          {t('admin.activeSpace.footnote', {
            defaultValue:
              'Active space details come from the admin active-spaces API. Lead registration records remain under the Leads tab.',
          })}
        </Text>
      </ScrollView>

      <StickyFormActions>
        <Button label={t('admin.marketing.share')} onPress={() => setMarketingMode('share')} />
        <Button
          label={t('admin.marketing.callOwner')}
          variant="secondary"
          onPress={() => setMarketingMode('call')}
        />
      </StickyFormActions>

      <AdminListingMarketingShareDialog
        open={marketingMode != null}
        mode={marketingMode ?? 'share'}
        onClose={() => setMarketingMode(null)}
        onUpdated={() => void loadMarketing()}
        target={
          space.registrationId
            ? {
                kind: space.type === 'MESS' ? 'mess-registration' : 'property-registration',
                id: space.registrationId,
              }
            : { kind: 'space', id: space.id }
        }
        listingKind={listingKind}
        spaceType={space.type}
        name={space.name}
        ownerName={space.ownerName}
        location={space.address}
        address={space.address}
        phones={[space.contactNumber, space.ownerMobile]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  root: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.section, gap: spacing.sm },
  headerCard: { marginBottom: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  testBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    ...typography.caption,
    color: colors.white,
    backgroundColor: '#EF4444',
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  footnote: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
