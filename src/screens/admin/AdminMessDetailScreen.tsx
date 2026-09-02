import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { adminApi } from '../../api/adminApi';
import type { AdminUpdateRegistrationContactRequest, MessRegistrationDetail } from '../../api/types';
import {
  AdminDetailField,
  AdminDetailSection,
  AdminRegistrationContactEditor,
} from '../../components/admin';
import { Button, Card, useConfirmDialog } from '../../components/ui';
import { StickyFormActions } from '../../components/progressive';
import type { AdminStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { formatRegistrationSource, formatRegistrationStatus } from '../../utils/adminLabels';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminMessDetail'>;

export function AdminMessDetailScreen({ navigation, route }: Props) {
  const { showConfirm } = useConfirmDialog();
  const showToast = useToastStore(state => state.showToast);
  const [detail, setDetail] = useState<MessRegistrationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    adminApi.getMessRegistration(route.params.id).then(setDetail).finally(() => setLoading(false));
  }, [route.params.id]);

  async function handleSaveContact(payload: AdminUpdateRegistrationContactRequest) {
    setSavingContact(true);
    try {
      const updated = await adminApi.updateMessRegistrationContact(route.params.id, payload);
      setDetail(updated);
      setEditingContact(false);
      showToast('Owner contact updated.');
    } catch {
      showToast('Could not update owner contact.');
    } finally {
      setSavingContact(false);
    }
  }

  function handleDeletePress() {
    if (!detail || deleting) return;
    showConfirm({
      title: 'Delete this mess lead?',
      message: `${detail.messName}\n\nThis action will remove the registration from the Admin lead list.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        setDeleting(true);
        try {
          await adminApi.deleteMessRegistration(route.params.id);
          showToast('Mess lead deleted.');
          navigation.goBack();
        } catch {
          showToast('Could not delete mess lead.');
        } finally {
          setDeleting(false);
        }
      },
    });
  }

  if (loading || !detail) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <Text style={styles.title}>{detail.messName}</Text>
          <Text style={styles.ref}>{detail.reference}</Text>
        </Card>

        <AdminDetailSection>
          {editingContact ? (
            <AdminRegistrationContactEditor
              ownerName={detail.ownerName}
              mobileNumber={detail.mobileNumber}
              alternateMobileNumber={detail.alternateMobileNumber}
              saving={savingContact}
              onSave={handleSaveContact}
              onCancel={() => setEditingContact(false)}
            />
          ) : (
            <>
              <AdminDetailField label="Owner" value={detail.ownerName} />
              <AdminDetailField label="Mobile" value={detail.mobileNumber} />
              {detail.alternateMobileNumber ? (
                <AdminDetailField label="Alternate mobile" value={detail.alternateMobileNumber} />
              ) : null}
              <Button label="Edit contact" variant="ghost" onPress={() => setEditingContact(true)} />
            </>
          )}
        </AdminDetailSection>

        <AdminDetailSection>
          <AdminDetailField label="Source" value={formatRegistrationSource(detail.source)} />
          <AdminDetailField label="Status" value={formatRegistrationStatus(detail.status)} />
          <AdminDetailField label="Test lead" value={detail.testLead ? 'Yes' : 'No'} />
        </AdminDetailSection>

        <AdminDetailSection>
          <AdminDetailField
            label="Address"
            value={`${detail.addressLine}, ${detail.city}, ${detail.state} ${detail.pincode}`}
          />
          <AdminDetailField label="Monthly price" value={`₹${detail.monthlyPrice}`} />
          <AdminDetailField label="Meal price" value={`₹${detail.mealPrice}`} />
          {detail.claimedAt ? (
            <AdminDetailField label="Claimed" value={new Date(detail.claimedAt).toLocaleString()} />
          ) : null}
        </AdminDetailSection>
      </ScrollView>

      <StickyFormActions>
        <Button
          label="Delete lead"
          variant="secondary"
          loading={deleting}
          onPress={handleDeletePress}
        />
      </StickyFormActions>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: { marginBottom: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary },
  ref: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
});
