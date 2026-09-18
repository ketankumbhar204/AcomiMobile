import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { adminEnquiryApi } from '../../api/enquiryApi';
import type { AdminSpaceEnquiryDetail } from '../../api/types';
import { AdminDetailField, AdminDetailSection } from '../../components/admin';
import { FormInput } from '../../components/ui';
import { StickyFormActions } from '../../components/progressive';
import type { AdminStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminEnquiryDetail'>;

export function AdminEnquiryDetailScreen({ route }: Props) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [detail, setDetail] = useState<AdminSpaceEnquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    adminEnquiryApi
      .get(route.params.id)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [route.params.id]);

  async function share() {
    setBusy(true);
    try {
      setDetail(await adminEnquiryApi.share(route.params.id));
      showToast(t('admin.enquiries.shareSuccess'));
    } catch {
      showToast(t('admin.enquiries.shareFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setBusy(true);
    try {
      setDetail(await adminEnquiryApi.reject(route.params.id, reason.trim() || undefined));
      showToast(t('admin.enquiries.rejectSuccess'));
    } catch {
      showToast(t('admin.enquiries.rejectFailed'));
    } finally {
      setBusy(false);
    }
  }

  if (loading || !detail) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const contact = detail.ownerContact;
  const pending = detail.status === 'PENDING';

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.status}>{t(`admin.enquiries.status.${detail.status}`)}</Text>
        <AdminDetailSection>
          <AdminDetailField
            label={t('admin.enquiries.columns.listing')}
            value={detail.spaceName}
          />
          {detail.spaceType ? (
            <AdminDetailField label={t('admin.common.type')} value={detail.spaceType} />
          ) : null}
          {detail.spaceAddress ? (
            <AdminDetailField label={t('admin.common.address')} value={detail.spaceAddress} />
          ) : null}
          <AdminDetailField
            label={t('admin.enquiries.columns.requestedBy')}
            value={`${detail.requesterName} · ${
              detail.requesterType === 'OWNER'
                ? t('admin.labels.owner')
                : t('admin.labels.member')
            }`}
          />
          <AdminDetailField label={t('admin.enquiries.email')} value={detail.requesterEmail} />
          <AdminDetailField
            label={t('admin.enquiries.columns.requested')}
            value={new Date(detail.requestedAt).toLocaleString()}
          />
          <AdminDetailField
            label={t('admin.enquiries.expires')}
            value={new Date(detail.expiresAt).toLocaleString()}
          />
          {detail.sharedAt ? (
            <AdminDetailField
              label={t('admin.enquiries.sharedAt', { defaultValue: 'Shared at' })}
              value={new Date(detail.sharedAt).toLocaleString()}
            />
          ) : null}
          {detail.reviewedAt ? (
            <AdminDetailField
              label={t('admin.enquiries.reviewedAt', { defaultValue: 'Reviewed at' })}
              value={new Date(detail.reviewedAt).toLocaleString()}
            />
          ) : null}
          {detail.rejectionReason ? (
            <AdminDetailField
              label={t('admin.enquiries.rejectReason')}
              value={detail.rejectionReason}
            />
          ) : null}
        </AdminDetailSection>

        <Text style={styles.sectionTitle}>{t('admin.enquiries.ownerContact')}</Text>
        <AdminDetailSection>
          <AdminDetailField
            label={t('admin.enquiries.contactAvailable', { defaultValue: 'Contact available' })}
            value={contact.available ? t('common.yes') : t('common.no')}
          />
          <AdminDetailField
            label={t('admin.enquiries.ownerName')}
            value={contact.ownerName || t('admin.labels.emDash')}
          />
          <AdminDetailField
            label={t('admin.enquiries.mobile')}
            value={contact.mobileNumber || t('admin.labels.emDash')}
          />
          <AdminDetailField
            label={t('admin.enquiries.alternateMobile')}
            value={contact.alternateMobileNumber || t('admin.labels.emDash')}
          />
          <AdminDetailField
            label={t('admin.enquiries.additionalContact')}
            value={contact.additionalMobileNumber || t('admin.labels.emDash')}
          />
          <AdminDetailField
            label={t('admin.enquiries.ownerEmail')}
            value={contact.email || t('admin.labels.emDash')}
          />
        </AdminDetailSection>

        {pending ? (
          <FormInput
            label={t('admin.enquiries.rejectReason')}
            value={reason}
            onChangeText={setReason}
            multiline
          />
        ) : null}
      </ScrollView>
      {pending ? (
        <StickyFormActions
          primary={{
            label: t('admin.enquiries.share'),
            onPress: () => void share(),
            loading: busy,
            disabled: busy,
          }}
          secondary={{
            label: t('admin.enquiries.reject'),
            onPress: () => void reject(),
            disabled: busy,
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  status: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
});
