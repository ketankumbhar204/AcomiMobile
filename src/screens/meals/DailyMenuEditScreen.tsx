import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type {
  DailyMenuEntryType,
  DailyMenuOptionResponse,
  FoodItemResponse,
  MealComboResponse,
  MealType,
  UUID,
} from '../../api/types';
import { Button, PermissionDeniedScreen } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { mealTypeLabelKey } from '../../utils/mealLabels';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type DailyMenuEditScreenProps = {
  spaceId: UUID;
  menuDate: string;
  mealType: MealType;
};

type DraftOption = {
  entryType: DailyMenuEntryType;
  comboId?: string | null;
  itemId?: string | null;
  label: string;
  sortOrder: number;
  isAvailable: boolean;
};

function inferEntryType(option: DailyMenuOptionResponse): DailyMenuEntryType {
  if (option.entryType) {
    return option.entryType;
  }
  if (option.itemId) {
    return 'ITEM';
  }
  return 'COMBO';
}

function toDraftOption(option: DailyMenuOptionResponse, index: number): DraftOption {
  const entryType = inferEntryType(option);
  return {
    entryType,
    comboId: entryType === 'COMBO' ? option.comboId : null,
    itemId: entryType === 'ITEM' ? option.itemId : null,
    label: option.label,
    sortOrder: option.sortOrder ?? index + 1,
    isAvailable: option.isAvailable,
  };
}

export function DailyMenuEditScreen({ spaceId, menuDate, mealType }: DailyMenuEditScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const permissions = useSpacePermissions(spaceId);
  const showToast = useToastStore(state => state.showToast);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [combos, setCombos] = useState<MealComboResponse[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItemResponse[]>([]);
  const [options, setOptions] = useState<DraftOption[]>([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [comboList, itemList, menu] = await Promise.all([
        mealsApi.getMealCombos(spaceId),
        mealsApi.getFoodItems(spaceId),
        mealsApi.getDailyMenu(spaceId, menuDate, mealType).catch(() => null),
      ]);
      setCombos(comboList.filter(combo => combo.isActive));
      setFoodItems(itemList.filter(item => item.isActive));
      if (menu) {
        setOptions(menu.options.map(toDraftOption));
        setNotes(menu.notes ?? '');
        setStatus(menu.status);
      }
    } catch {
      showToast(t('meals.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [mealType, menuDate, showToast, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!permissions.canManageMeals) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  const addCombo = (combo: MealComboResponse) => {
    setOptions(prev => [
      ...prev,
      {
        entryType: 'COMBO',
        comboId: combo.comboId,
        itemId: null,
        label: combo.name,
        sortOrder: prev.length + 1,
        isAvailable: true,
      },
    ]);
  };

  const addItem = (item: FoodItemResponse) => {
    setOptions(prev => {
      if (prev.some(option => option.itemId === item.itemId)) {
        return prev;
      }
      return [
        ...prev,
        {
          entryType: 'ITEM' as const,
          comboId: null,
          itemId: item.itemId,
          label: item.name,
          sortOrder: prev.length + 1,
          isAvailable: true,
        },
      ];
    });
  };

  const save = async (publish: boolean) => {
    if (options.length === 0) {
      showToast(t('meals.errors.optionsRequired'));
      return;
    }
    setSaving(true);
    try {
      await mealsApi.upsertDailyMenu(spaceId, menuDate, mealType, {
        options: options.map(option => ({
          entryType: option.entryType,
          comboId: option.entryType === 'COMBO' ? option.comboId : null,
          itemId: option.entryType === 'ITEM' ? option.itemId : null,
          label: option.label,
          sortOrder: option.sortOrder,
          isAvailable: option.isAvailable,
        })),
        notes: notes.trim() || null,
      });
      if (publish) {
        await mealsApi.publishDailyMenu(spaceId, menuDate, mealType);
      }
      showToast(publish ? t('meals.success.published') : t('meals.success.saved'));
      navigation.goBack();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const clearDraft = async () => {
    if (status !== 'DRAFT') {
      return;
    }
    setSaving(true);
    try {
      await mealsApi.deleteDailyMenu(spaceId, menuDate, mealType);
      showToast(t('meals.success.draftDeleted'));
      navigation.goBack();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.title}>
        {t('meals.planMenu')} — {t(mealTypeLabelKey(mealType))}
      </Text>
      <Text style={styles.date}>{menuDate}</Text>
      {status === 'PUBLISHED' ? (
        <Text style={styles.published}>{t('meals.menu.published')}</Text>
      ) : null}

      {loading ? <ActivityIndicator color={colors.primary} /> : null}

      <Text style={styles.label}>{t('meals.menu.plannedEntries')}</Text>
      {options.length === 0 ? (
        <Text style={styles.emptyHint}>{t('meals.menu.noItemsYet')}</Text>
      ) : null}
      {options.map((option, index) => (
        <View key={`${option.entryType}-${option.comboId ?? option.itemId}-${index}`} style={styles.optionRow}>
          <View style={styles.optionMeta}>
            <Text style={styles.optionType}>
              {option.entryType === 'COMBO' ? t('meals.library.combos') : t('meals.library.items')}
            </Text>
            <TextInput
              style={styles.input}
              value={option.label}
              onChangeText={value =>
                setOptions(prev =>
                  prev.map((row, i) => (i === index ? { ...row, label: value } : row)),
                )
              }
            />
          </View>
          <Pressable onPress={() => setOptions(prev => prev.filter((_, i) => i !== index))}>
            <Text style={styles.remove}>✕</Text>
          </Pressable>
        </View>
      ))}

      <Text style={styles.label}>{t('meals.menu.addCombo')}</Text>
      <View style={styles.comboChips}>
        {combos.map(combo => (
          <Pressable key={combo.comboId} style={styles.chip} onPress={() => addCombo(combo)}>
            <Text style={styles.chipText}>+ {combo.name}</Text>
          </Pressable>
        ))}
        {combos.length === 0 ? (
          <Text style={styles.emptyHint}>{t('meals.library.combosEmpty')}</Text>
        ) : null}
      </View>

      <Text style={styles.label}>{t('meals.menu.addItems')}</Text>
      <View style={styles.comboChips}>
        {foodItems.slice(0, 24).map(item => (
          <Pressable key={item.itemId} style={styles.chip} onPress={() => addItem(item)}>
            <Text style={styles.chipText}>+ {item.name}</Text>
          </Pressable>
        ))}
        {foodItems.length > 24 ? (
          <Text style={styles.moreHint}>{t('meals.menu.moreItemsInLibrary')}</Text>
        ) : null}
      </View>

      <Text style={styles.label}>{t('meals.menu.notes')}</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder={t('meals.menu.notesPlaceholder')}
      />

      <View style={styles.actions}>
        {status === 'DRAFT' && options.length > 0 ? (
          <Button
            label={t('meals.actions.deleteDraft')}
            variant="ghost"
            loading={saving}
            onPress={() => void clearDraft()}
          />
        ) : null}
        <Button
          label={t('meals.actions.saveDraft')}
          variant="secondary"
          loading={saving}
          onPress={() => void save(false)}
        />
        <Button label={t('meals.actions.publish')} loading={saving} onPress={() => void save(true)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  title: { ...typography.h2, marginBottom: spacing.xs },
  date: { ...typography.caption, color: colors.muted, marginBottom: spacing.md },
  published: { ...typography.caption, color: colors.success, marginBottom: spacing.md },
  label: { ...typography.bodyStrong, marginTop: spacing.md, marginBottom: spacing.sm },
  emptyHint: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm },
  optionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  optionMeta: { flex: 1, gap: spacing.xs },
  optionType: { ...typography.caption, color: colors.muted, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    backgroundColor: colors.white,
    ...typography.body,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  remove: { fontSize: 18, color: colors.muted, padding: spacing.sm },
  comboChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipText: { ...typography.caption, color: colors.primaryDark },
  moreHint: { ...typography.caption, color: colors.muted, alignSelf: 'center' },
  actions: { marginTop: spacing.xl, gap: spacing.sm },
});
