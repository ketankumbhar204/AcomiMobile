import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MapPin, Plus, X } from 'lucide-react-native';
import { adminApi } from '../../api/adminApi';
import type { SavedAddress } from '../../api/types';
import { ListSearchBar } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';

export type AddressFields = {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  mapUrl: string;
};

type AdminSavedAddressPickerProps = {
  value: AddressFields;
  onChange: (next: AddressFields) => void;
};

export function AdminSavedAddressPicker({ value, onChange }: AdminSavedAddressPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [options, setOptions] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void adminApi
      .listSavedAddresses({ search: debounced || undefined, size: 10, page: 0 })
      .then(page => {
        if (!cancelled) setOptions(page.content);
      })
      .catch(() => {
        if (!cancelled) {
          setOptions([]);
          setError('Unable to load saved addresses. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, debounced]);

  function apply(address: SavedAddress) {
    onChange({
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      mapUrl: address.mapUrl ?? '',
    });
    setOpen(false);
  }

  function startNew() {
    onChange({ addressLine: '', city: '', state: '', pincode: '', mapUrl: '' });
    setOpen(false);
  }

  const summary = [value.addressLine, value.city, value.pincode].filter(Boolean).join(', ');

  return (
    <View>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <MapPin size={16} color={colors.primaryDark} />
        <View style={styles.triggerText}>
          <Text style={styles.triggerLabel}>Select saved address</Text>
          <Text style={styles.triggerValue} numberOfLines={2}>
            {summary || 'Search recently used addresses'}
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={startNew} style={styles.addNew} hitSlop={8}>
        <Plus size={14} color={colors.primaryDark} />
        <Text style={styles.addNewText}>Add new address</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Saved addresses</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ListSearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search address, city, state, or pincode"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={options}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable style={styles.option} onPress={() => apply(item)}>
                  <Text style={styles.optionTitle}>{item.addressLine}</Text>
                  <Text style={styles.optionMeta}>
                    {item.city}, {item.state} - {item.pincode}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  {debounced ? 'No saved addresses match that search.' : 'No recently used addresses yet.'}
                </Text>
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  triggerText: { flex: 1, minWidth: 0 },
  triggerLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  triggerValue: { ...typography.body, color: colors.textPrimary, marginTop: 2 },
  addNew: {
    marginTop: spacing.sm,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addNewText: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalTitle: { ...typography.h3, color: colors.textPrimary },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
  loader: { marginTop: spacing.xl },
  option: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minWidth: 0,
  },
  optionTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  optionMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  empty: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
