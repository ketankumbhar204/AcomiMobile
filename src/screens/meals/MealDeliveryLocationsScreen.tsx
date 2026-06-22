import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { MealDeliveryLocation, UUID } from '../../api/types';
import { Button, Screen } from '../../components/ui';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';

type MealDeliveryLocationsScreenProps = {
  spaceId: UUID;
};

type EditForm = {
  name: string;
  description: string;
  address: string;
  active: boolean;
};

export function MealDeliveryLocationsScreen({ spaceId }: MealDeliveryLocationsScreenProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState<MealDeliveryLocation[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [editingLocation, setEditingLocation] = useState<MealDeliveryLocation | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    description: '',
    address: '',
    active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await mealsApi.getMealDeliveryLocationsManage(spaceId);
      setLocations(rows);
    } catch {
      showToast(t('meals.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [showToast, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setSaving(true);
    try {
      await mealsApi.createMealDeliveryLocation(spaceId, {
        name: trimmed,
        description: description.trim() || undefined,
        address: address.trim() || undefined,
      });
      setName('');
      setDescription('');
      setAddress('');
      showToast(t('meals.deliveryLocations.created'));
      await load();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (location: MealDeliveryLocation) => {
    setEditingLocation(location);
    setEditForm({
      name: location.name,
      description: location.description ?? '',
      address: location.address ?? '',
      active: location.active,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLocation || !editForm.name.trim()) {
      return;
    }
    setSaving(true);
    try {
      await mealsApi.updateMealDeliveryLocation(spaceId, editingLocation.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        address: editForm.address.trim() || undefined,
        active: editForm.active,
      });
      setEditingLocation(null);
      showToast(t('meals.deliveryLocations.updated'));
      await load();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const moveLocation = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= locations.length) {
      return;
    }
    const reordered = [...locations];
    const [item] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, item);
    setSaving(true);
    try {
      const rows = await mealsApi.reorderMealDeliveryLocations(
        spaceId,
        reordered.map(row => row.id),
      );
      setLocations(rows);
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.subtitle}>{t('meals.deliveryLocations.subtitle')}</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder={t('meals.deliveryLocations.namePlaceholder')}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder={t('meals.deliveryLocations.addressPlaceholder')}
          value={address}
          onChangeText={setAddress}
        />
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder={t('meals.deliveryLocations.descriptionPlaceholder')}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Button
          label={t('meals.deliveryLocations.add')}
          onPress={() => void handleCreate()}
          loading={saving}
          disabled={!name.trim()}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : locations.length === 0 ? (
        <Text style={styles.empty}>{t('meals.deliveryLocations.empty')}</Text>
      ) : (
        <View style={styles.list}>
          {locations.map((location, index) => (
            <View
              key={location.id}
              style={[styles.row, !location.active && styles.rowInactive]}>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{location.name}</Text>
                {location.address ? (
                  <Text style={styles.rowAddress}>{location.address}</Text>
                ) : null}
                {location.description ? (
                  <Text style={styles.rowDescription}>{location.description}</Text>
                ) : null}
              </View>
              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => void moveLocation(index, -1)}
                  disabled={saving || index === 0}
                  style={styles.iconButton}>
                  <Text style={styles.iconButtonLabel}>↑</Text>
                </Pressable>
                <Pressable
                  onPress={() => void moveLocation(index, 1)}
                  disabled={saving || index === locations.length - 1}
                  style={styles.iconButton}>
                  <Text style={styles.iconButtonLabel}>↓</Text>
                </Pressable>
                <Pressable onPress={() => openEdit(location)} style={styles.editButton}>
                  <Text style={styles.editButtonLabel}>{t('common.edit')}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal visible={editingLocation != null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t('meals.deliveryLocations.editTitle')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('meals.deliveryLocations.namePlaceholder')}
              value={editForm.name}
              onChangeText={value => setEditForm(prev => ({ ...prev, name: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder={t('meals.deliveryLocations.addressPlaceholder')}
              value={editForm.address}
              onChangeText={value => setEditForm(prev => ({ ...prev, address: value }))}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder={t('meals.deliveryLocations.descriptionPlaceholder')}
              value={editForm.description}
              onChangeText={value => setEditForm(prev => ({ ...prev, description: value }))}
              multiline
            />
            <Pressable
              onPress={() => setEditForm(prev => ({ ...prev, active: !prev.active }))}
              style={styles.activeToggle}>
              <Text style={styles.activeToggleLabel}>
                {editForm.active
                  ? t('meals.deliveryLocations.active')
                  : t('meals.deliveryLocations.inactive')}
              </Text>
            </Pressable>
            <Button
              label={t('common.save')}
              onPress={() => void handleSaveEdit()}
              loading={saving}
              disabled={!editForm.name.trim()}
            />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={() => setEditingLocation(null)}
              disabled={saving}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.lg, lineHeight: 22 },
  form: { gap: spacing.sm, marginBottom: spacing.xl },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    backgroundColor: colors.white,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  loader: { marginTop: spacing.xl },
  empty: { ...typography.body, color: colors.muted, marginTop: spacing.lg },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  rowInactive: { opacity: 0.55, backgroundColor: colors.surface },
  rowText: { flex: 1, gap: spacing.xxs },
  rowName: { ...typography.bodyStrong },
  rowAddress: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
  rowDescription: { ...typography.body, color: colors.muted },
  rowActions: { alignItems: 'flex-end', gap: spacing.xxs },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  iconButtonLabel: { ...typography.bodyStrong, color: colors.primaryDark },
  editButton: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  editButtonLabel: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: { ...typography.h3, marginBottom: spacing.xs },
  activeToggle: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.lightGreen,
  },
  activeToggleLabel: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
});
