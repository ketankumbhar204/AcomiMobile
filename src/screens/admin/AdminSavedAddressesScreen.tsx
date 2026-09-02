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
import { adminApi } from '../../api/adminApi';
import type { SavedAddress } from '../../api/types';
import { AdminLeadCard } from '../../components/admin';
import { FormInput, ListSearchBar, useConfirmDialog } from '../../components/ui';
import { formatAdminDate } from '../../utils/adminLabels';
import type { AdminStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminSavedAddresses'>;

const PINCODE_PATTERN = /^[1-9]\d{5}$/;

export function AdminSavedAddressesScreen() {
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
  const [form, setForm] = useState({
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    mapUrl: '',
  });

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
      setError('Unable to load saved addresses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(debounced);
    }, [debounced, load]),
  );

  function openEdit(address: SavedAddress) {
    setEditTarget(address);
    setForm({
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      mapUrl: address.mapUrl ?? '',
    });
  }

  async function handleSave() {
    if (!editTarget) return;
    if (!form.addressLine.trim() || !form.city.trim() || !form.state.trim()) {
      showToast('Address, city, and state are required.');
      return;
    }
    if (!PINCODE_PATTERN.test(form.pincode.trim())) {
      showToast('Enter a valid 6-digit pincode.');
      return;
    }
    const mapUrl = form.mapUrl.trim();
    if (mapUrl && !mapUrl.startsWith('http://') && !mapUrl.startsWith('https://')) {
      showToast('Map link must start with http:// or https://');
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateSavedAddress(editTarget.id, {
        addressLine: form.addressLine.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        mapUrl: mapUrl || undefined,
      });
      showToast('Saved address updated.');
      setEditTarget(null);
      await load(debounced);
    } catch {
      showToast('Could not update saved address.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(address: SavedAddress) {
    showConfirm({
      title: 'Remove this saved address?',
      message: `${address.addressLine}, ${address.city}. Existing property leads keep their address.`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        try {
          await adminApi.deleteSavedAddress(address.id);
          setAddresses(prev => prev.filter(item => item.id !== address.id));
          showToast('Saved address removed.');
        } catch {
          showToast('Could not remove saved address.');
        }
      },
    });
  }

  return (
    <View style={styles.root}>
      <Text style={styles.hint}>Recently used first. Multiple properties can share one address.</Text>
      <View style={styles.search}>
        <ListSearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search address, city, state, or pincode"
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
              meta={`Used ${item.usageCount} ${item.usageCount === 1 ? 'time' : 'times'} · ${formatAdminDate(item.lastUsedAt ?? item.createdAt)}`}
              onPress={() => openEdit(item)}
              showDelete
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No saved addresses yet.</Text>}
        />
      )}
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>Back to dashboard</Text>
      </Pressable>

      <Modal visible={editTarget != null} animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Text style={styles.modalTitle}>Edit saved address</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <FormInput
              label="Address"
              value={form.addressLine}
              onChangeText={addressLine => setForm(prev => ({ ...prev, addressLine }))}
            />
            <FormInput
              label="City"
              value={form.city}
              onChangeText={city => setForm(prev => ({ ...prev, city }))}
            />
            <FormInput
              label="State"
              value={form.state}
              onChangeText={state => setForm(prev => ({ ...prev, state }))}
            />
            <FormInput
              label="Pincode"
              value={form.pincode}
              onChangeText={pincode => setForm(prev => ({ ...prev, pincode }))}
              keyboardType="number-pad"
              maxLength={6}
            />
            <FormInput
              label="Google Maps link"
              value={form.mapUrl}
              onChangeText={mapUrl => setForm(prev => ({ ...prev, mapUrl }))}
              autoCapitalize="none"
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable onPress={() => setEditTarget(null)} disabled={saving} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={() => void handleSave()} disabled={saving} style={styles.modalBtn}>
              <Text style={styles.modalBtnPrimary}>{saving ? 'Saving…' : 'Save'}</Text>
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
