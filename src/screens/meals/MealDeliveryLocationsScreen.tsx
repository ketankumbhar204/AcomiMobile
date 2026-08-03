import React, { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Pencil,
} from 'lucide-react-native';
import { mealsApi } from '../../api/mealsApi';
import type { MealDeliveryLocation, UUID } from '../../api/types';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { DashboardSectionTitle } from '../../components/dashboard/DashboardSectionTitle';
import {
  Button,
  EmptyState,
  FormInput,
  Screen,
  SkeletonCard,
} from '../../components/ui';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatDeliveryLocationSecondary } from '../../utils/deliveryLocationLabel';

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
      <MealFormHero
        icon={MapPin}
        accent="#0D9488"
        soft="#F0FDFA"
        border="#99F6E4"
        eyebrow={t('meals.deliveryLocations.eyebrow', { defaultValue: 'Delivery' })}
        heading={t('meals.deliveryLocations.title', { defaultValue: 'Delivery locations' })}
        subheading={t('meals.deliveryLocations.subtitle')}
      />

      <View style={styles.formCard}>
        <Text style={styles.formCardTitle}>
          {t('meals.deliveryLocations.addSection', { defaultValue: 'Add location' })}
        </Text>
        <FormInput
          label={t('meals.deliveryLocations.nameLabel', { defaultValue: 'Name' })}
          placeholder={t('meals.deliveryLocations.namePlaceholder')}
          value={name}
          onChangeText={setName}
          leadingIcon={MapPin}
        />
        <FormInput
          label={t('meals.deliveryLocations.addressLabel', { defaultValue: 'Address' })}
          placeholder={t('meals.deliveryLocations.addressPlaceholder')}
          value={address}
          onChangeText={setAddress}
        />
        <FormInput
          label={t('meals.deliveryLocations.descriptionLabel', { defaultValue: 'Notes' })}
          placeholder={t('meals.deliveryLocations.descriptionPlaceholder')}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Button
          label={t('meals.deliveryLocations.add')}
          onPress={() => {
            handleCreate().catch(() => undefined);
          }}
          loading={saving}
          disabled={!name.trim()}
        />
      </View>

      <DashboardSectionTitle
        title={t('meals.deliveryLocations.listTitle', { defaultValue: 'Locations' })}
        subtitle={t('meals.deliveryLocations.listSubtitle', {
          defaultValue: 'Reorder with arrows · tap Edit to update',
        })}
      />

      {loading ? (
        <View style={styles.skeletonStack}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : locations.length === 0 ? (
        <EmptyState
          title={t('meals.deliveryLocations.empty')}
          description={t('meals.deliveryLocations.emptyHint', {
            defaultValue: 'Add a location above so members can pick delivery points.',
          })}
          Icon={MapPin}
        />
      ) : (
        <View style={styles.list}>
          {locations.map((location, index) => {
            const secondary = formatDeliveryLocationSecondary(location);
            return (
              <View
                key={location.id}
                style={[styles.row, !location.active && styles.rowInactive]}>
                <View style={styles.iconWell}>
                  <MapPin size={18} color="#0D9488" strokeWidth={2.2} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {location.name}
                  </Text>
                  {secondary ? (
                    <Text style={styles.rowAddress} numberOfLines={2}>
                      {secondary}
                    </Text>
                  ) : null}
                  {!location.active ? (
                    <View style={styles.inactiveChip}>
                      <Text style={styles.inactiveChipText}>
                        {t('meals.deliveryLocations.inactive')}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => {
                      moveLocation(index, -1).catch(() => undefined);
                    }}
                    disabled={saving || index === 0}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.iconButton,
                      (saving || index === 0) && styles.iconButtonDisabled,
                      pressed && styles.iconButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.moveUp', { defaultValue: 'Move up' })}>
                    <ChevronUp size={16} color={colors.primaryDark} strokeWidth={2.4} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      moveLocation(index, 1).catch(() => undefined);
                    }}
                    disabled={saving || index === locations.length - 1}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.iconButton,
                      (saving || index === locations.length - 1) && styles.iconButtonDisabled,
                      pressed && styles.iconButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.moveDown', { defaultValue: 'Move down' })}>
                    <ChevronDown size={16} color={colors.primaryDark} strokeWidth={2.4} />
                  </Pressable>
                  <Pressable
                    onPress={() => openEdit(location)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed && styles.editButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.edit')}>
                    <Pencil size={14} color={colors.primaryDark} strokeWidth={2.4} />
                    <Text style={styles.editButtonLabel}>{t('common.edit')}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Modal
        visible={editingLocation != null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingLocation(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditingLocation(null)}>
          <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>{t('meals.deliveryLocations.editTitle')}</Text>
            <FormInput
              label={t('meals.deliveryLocations.nameLabel', { defaultValue: 'Name' })}
              placeholder={t('meals.deliveryLocations.namePlaceholder')}
              value={editForm.name}
              onChangeText={value => setEditForm(prev => ({ ...prev, name: value }))}
              leadingIcon={MapPin}
            />
            <FormInput
              label={t('meals.deliveryLocations.addressLabel', { defaultValue: 'Address' })}
              placeholder={t('meals.deliveryLocations.addressPlaceholder')}
              value={editForm.address}
              onChangeText={value => setEditForm(prev => ({ ...prev, address: value }))}
            />
            <FormInput
              label={t('meals.deliveryLocations.descriptionLabel', { defaultValue: 'Notes' })}
              placeholder={t('meals.deliveryLocations.descriptionPlaceholder')}
              value={editForm.description}
              onChangeText={value => setEditForm(prev => ({ ...prev, description: value }))}
              multiline
            />
            <Pressable
              onPress={() => setEditForm(prev => ({ ...prev, active: !prev.active }))}
              style={[
                styles.activeToggle,
                !editForm.active && styles.activeToggleOff,
              ]}
              accessibilityRole="switch"
              accessibilityState={{ checked: editForm.active }}>
              <Text style={styles.activeToggleLabel}>
                {editForm.active
                  ? t('meals.deliveryLocations.active')
                  : t('meals.deliveryLocations.inactive')}
              </Text>
            </Pressable>
            <View style={styles.modalActions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setEditingLocation(null)}
                disabled={saving}
                style={styles.modalButton}
              />
              <Button
                label={t('common.save')}
                onPress={() => {
                  handleSaveEdit().catch(() => undefined);
                }}
                loading={saving}
                disabled={!editForm.name.trim() || saving}
                style={styles.modalButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.section,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  formCardTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  skeletonStack: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  rowInactive: {
    opacity: 0.7,
    backgroundColor: colors.surface,
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  rowName: {
    ...typography.bodyStrong,
    fontSize: 16,
    fontWeight: '600',
  },
  rowAddress: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  inactiveChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
  },
  inactiveChipText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  rowActions: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  iconButtonDisabled: {
    opacity: 0.35,
  },
  iconButtonPressed: {
    backgroundColor: colors.surface,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  editButtonPressed: {
    backgroundColor: colors.surface,
  },
  editButtonLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  activeToggle: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    minHeight: 40,
    justifyContent: 'center',
  },
  activeToggleOff: {
    backgroundColor: '#F3F4F6',
    borderColor: colors.border,
  },
  activeToggleLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
