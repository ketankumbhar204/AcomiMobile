import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Tag, Type } from 'lucide-react-native';
import { inventoryApi } from '../../api/inventoryApi';
import type { InventoryUnit } from '../../api/inventoryTypes';
import { StickyFormActions } from '../../components/progressive';
import {
  FormInput,
  HeaderBackButton,
  PermissionDeniedScreen,
  Screen,
} from '../../components/ui';
import { useInventoryItems } from '../../hooks/useInventory';
import { useInventoryProfile } from '../../hooks/useInventoryProfile';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { formatInventoryUnit } from '../../utils/inventoryCatalog';

type Route = RouteProp<MainStackParamList, 'InventoryItemForm'>;
type Nav = NativeStackNavigationProp<MainStackParamList, 'InventoryItemForm'>;

/** Fast add/edit — Name, Category, Unit, Current, Minimum. Everything else optional. */
export function InventoryItemFormScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, mode, itemId } = route.params;
  const { spaceType, profile, canManage } = useInventoryProfile(spaceId);
  const showToast = useToastStore(state => state.showToast);
  const isEdit = mode === 'edit';
  const units = profile.defaultUnits;

  const { categories, loading: catalogLoading } = useInventoryItems(
    spaceId,
    spaceType,
    canManage,
  );

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [unit, setUnit] = useState<InventoryUnit>(units[0] ?? 'PIECE');
  const [currentStock, setCurrentStock] = useState('0');
  const [minimumStock, setMinimumStock] = useState('0');
  const [nameError, setNameError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit
        ? t('inventory.form.editTitle', { defaultValue: 'Edit item' })
        : t('inventory.form.createTitle', { defaultValue: 'Add item' }),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [isEdit, navigation, t]);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].categoryId);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (!isEdit || !itemId) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const item = await inventoryApi.getItem(spaceId, spaceType, itemId);
        if (item) {
          setName(item.name);
          setCategoryId(item.categoryId);
          setUnit(item.unit);
          setCurrentStock(String(item.currentStock));
          setMinimumStock(String(item.minimumStock));
        }
      } catch {
        showToast(t('common.errors.generic'));
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, itemId, showToast, spaceId, spaceType, t]);

  const selectedCategoryName = useMemo(
    () => categories.find(c => c.categoryId === categoryId)?.name,
    [categories, categoryId],
  );

  const submit = useCallback(async () => {
    Keyboard.dismiss();
    let valid = true;
    if (!name.trim()) {
      setNameError(t('inventory.form.nameRequired', { defaultValue: 'Name is required' }));
      valid = false;
    } else {
      setNameError(null);
    }
    if (!categoryId) {
      setCategoryError(
        t('inventory.form.categoryRequired', { defaultValue: 'Select a category' }),
      );
      valid = false;
    } else {
      setCategoryError(null);
    }
    if (!valid || !categoryId) {
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && itemId) {
        await inventoryApi.updateItem(spaceId, spaceType, itemId, {
          name: name.trim(),
          categoryId,
          unit,
          minimumStock: Math.max(0, Number(minimumStock) || 0),
        });
        showToast(t('inventory.form.updateSuccess', { defaultValue: 'Item updated' }));
      } else {
        await inventoryApi.createItem(spaceId, spaceType, {
          name: name.trim(),
          categoryId,
          unit,
          openingStock: Math.max(0, Number(currentStock) || 0),
          minimumStock: Math.max(0, Number(minimumStock) || 0),
        });
        showToast(t('inventory.form.createSuccess', { defaultValue: 'Item created' }));
      }
      navigation.goBack();
    } catch {
      showToast(t('common.errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }, [
    categoryId,
    currentStock,
    isEdit,
    itemId,
    minimumStock,
    name,
    navigation,
    showToast,
    spaceId,
    spaceType,
    t,
    unit,
  ]);

  if (!canManage) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  if (loading || catalogLoading) {
    return (
      <Screen contentStyle={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <FormInput
            label={t('inventory.form.name', { defaultValue: 'Name' })}
            value={name}
            onChangeText={setName}
            leadingIcon={Type}
            error={nameError}
            placeholder={t('inventory.form.namePlaceholder', {
              defaultValue: 'e.g. Milk, Rice, Oil',
            })}
          />

          <Text style={styles.fieldLabel}>
            {t('inventory.form.category', { defaultValue: 'Category' })}
          </Text>
          <Pressable
            onPress={() => setShowCategoryPicker(v => !v)}
            style={({ pressed }) => [styles.picker, pressed && styles.pickerPressed]}
            accessibilityRole="button">
            <Tag size={16} color={colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.pickerText} numberOfLines={1}>
              {selectedCategoryName ??
                t('inventory.form.selectCategory', { defaultValue: 'Select category' })}
            </Text>
          </Pressable>
          {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}
          {showCategoryPicker ? (
            <View style={styles.pickerList}>
              {categories.map(cat => {
                const active = cat.categoryId === categoryId;
                return (
                  <Pressable
                    key={cat.categoryId}
                    onPress={() => {
                      setCategoryId(cat.categoryId);
                      setShowCategoryPicker(false);
                    }}
                    style={[styles.pickerOption, active && styles.pickerOptionActive]}>
                    <Text
                      style={[
                        styles.pickerOptionText,
                        active && styles.pickerOptionTextActive,
                      ]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>
            {t('inventory.form.unit', { defaultValue: 'Unit' })}
          </Text>
          <View style={styles.chipRow}>
            {units.map(u => {
              const active = unit === u;
              return (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.chip, active && styles.chipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {formatInventoryUnit(u)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {!isEdit ? (
            <FormInput
              label={t('inventory.form.currentStock', { defaultValue: 'Current Stock' })}
              value={currentStock}
              onChangeText={setCurrentStock}
              keyboardType="decimal-pad"
            />
          ) : null}
          <FormInput
            label={t('inventory.form.minimumStock', { defaultValue: 'Minimum Stock' })}
            value={minimumStock}
            onChangeText={setMinimumStock}
            keyboardType="decimal-pad"
          />
        </ScrollView>

        <StickyFormActions
          primary={{
            label: t('common.save'),
            onPress: () => {
              void submit();
            },
            loading: submitting,
            disabled: submitting,
          }}
          secondary={{
            label: t('common.cancel'),
            onPress: () => navigation.goBack(),
            disabled: submitting,
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
    backgroundColor: colors.white,
  },
  pickerPressed: { backgroundColor: colors.surface },
  pickerText: { ...typography.body, flex: 1, color: colors.textPrimary },
  pickerList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  pickerOptionActive: { backgroundColor: colors.lightGreen },
  pickerOptionText: { ...typography.body, color: colors.textPrimary },
  pickerOptionTextActive: { color: colors.primaryDark, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.primaryDark },
  errorText: { ...typography.caption, color: '#DC2626' },
});
