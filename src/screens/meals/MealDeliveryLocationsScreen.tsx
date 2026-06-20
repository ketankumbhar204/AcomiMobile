import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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

export function MealDeliveryLocationsScreen({ spaceId }: MealDeliveryLocationsScreenProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState<MealDeliveryLocation[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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
      });
      setName('');
      setDescription('');
      showToast(t('meals.deliveryLocations.created'));
      await load();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (location: MealDeliveryLocation) => {
    setSaving(true);
    try {
      await mealsApi.updateMealDeliveryLocation(spaceId, location.id, {
        active: !location.active,
      });
      await load();
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
          {locations.map(location => (
            <Pressable
              key={location.id}
              style={[styles.row, !location.active && styles.rowInactive]}
              onPress={() => void toggleActive(location)}
              disabled={saving}>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{location.name}</Text>
                {location.description ? (
                  <Text style={styles.rowDescription}>{location.description}</Text>
                ) : null}
              </View>
              <Text style={styles.rowStatus}>
                {location.active
                  ? t('meals.deliveryLocations.active')
                  : t('meals.deliveryLocations.inactive')}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
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
  rowDescription: { ...typography.body, color: colors.muted },
  rowStatus: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
});
