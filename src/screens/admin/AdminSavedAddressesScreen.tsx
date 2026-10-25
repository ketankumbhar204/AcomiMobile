import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/adminApi';
import type { SavedAddress } from '../../api/types';
import { AdminLeadCard } from '../../components/admin';
import { AddressLocationFields } from '../../components/location/AddressLocationFields';
import { ListSearchBar, useConfirmDialog } from '../../components/ui';
import {
  EMPTY_ADDRESS_CAPTURE,
  addressCaptureIssue,
  captureFromParts,
  composeStoredAddress,
} from '../../utils/locationAutocomplete';
import { formatAdminDate } from '../../utils/adminLabels';
import type { AdminStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminSavedAddresses'>;

const PINCODE_PATTERN = /^[1-9]\d{5}$/;

export function AdminSavedAddressesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { showConfirm } = useConfirmDialog();
  const showToast = useToastStore(state => state.showToast);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SavedAddress | null>(null);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState(EMPTY_ADDRESS_CAPTURE);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      const page = await adminApi.listSavedAddresses({
        search: term || undefined,
        size: 50,
        page: 0,
      });
      setAddresses(page.content);
    } catch {
      setError(t('admin.addresses.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load(debounced);
    }, [debounced, load]),
  );

  function openEdit(address: SavedAddress) {
    setEditTarget(address);
    setLocation(
      captureFromParts({
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        mapUrl: address.mapUrl,
      }),
    );
  }

  async function handleSave() {
    if (!editTarget) return;
    if (addressCaptureIssue(location, { required: true, pincodeRequired: true })) {
      showToast(t('admin.addresses.requiredFields'));
      return;
    }
    if (!PINCODE_PATTERN.test(location.pincode.trim())) {
      showToast(t('admin.addresses.invalidPincode'));
      return;
    }
    const mapUrl = location.mapUrl.trim();
    if (mapUrl && !mapUrl.startsWith('http://') && !mapUrl.startsWith('https://')) {
      showToast(t('admin.addresses.invalidMapUrl'));
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateSavedAddress(editTarget.id, {
        addressLine: composeStoredAddress(location),
        city: location.city.trim(),
        state: location.state.trim(),
        pincode: location.pincode.trim(),
        mapUrl: mapUrl || undefined,
      });
      showToast(t('admin.addresses.updated'));
      setEditTarget(null);
      await load(debounced);
    } catch {
      showToast(t('admin.addresses.updateFailed'));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(address: SavedAddress) {
    showConfirm({
      title: t('admin.addresses.removeTitle'),
      message: t('admin.addresses.removeMessage', {
        address: address.addressLine,
        city: address.city,
      }),
      confirmLabel: t('admin.common.remove'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        try {
          await adminApi.deleteSavedAddress(address.id);
          setAddresses(prev => prev.filter(item => item.id !== address.id));
          showToast(t('admin.addresses.removed'));
        } catch {
          showToast(t('admin.addresses.removeFailed'));
        }
      },
    });
  }

  return (
    <View style={styles.root}>
      <Text style={styles.hint}>{t('admin.addresses.hint')}</Text>
      <View style={styles.search}>
        <ListSearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('admin.addresses.searchPlaceholder')}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AdminLeadCard
              title={item.addressLine}
              subtitle={`${item.city}, ${item.state} - ${item.pincode}`}
              meta={`${item.usageCount === 1 ? t('admin.addresses.usedOnce', { count: item.usageCount }) : t('admin.addresses.usedMany', { count: item.usageCount })} · ${formatAdminDate(item.lastUsedAt ?? item.createdAt)}`}
              onPress={() => openEdit(item)}
              showDelete
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t('admin.addresses.empty')}</Text>}
        />
      )}
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>{t('admin.addresses.backToDashboard')}</Text>
      </Pressable>

      <Modal visible={editTarget != null} animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Text style={styles.modalTitle}>{t('admin.addresses.editTitle')}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <AddressLocationFields
              value={location}
              onChange={setLocation}
              required
              pincodeRequired
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable onPress={() => setEditTarget(null)} disabled={saving} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable onPress={() => void handleSave()} disabled={saving} style={styles.modalBtn}>
              <Text style={styles.modalBtnPrimary}>
                {saving ? t('common.saving') : t('common.save')}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  search: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  error: {
    ...typography.caption,
    color: colors.danger,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  empty: {
    textAlign: 'center',
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
  back: { padding: spacing.md },
  backText: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  modalTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  modalBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  modalBtnText: { ...typography.body, color: colors.textSecondary },
  modalBtnPrimary: { ...typography.bodyStrong, color: colors.primaryDark },
});
