import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { MealPollSlot, MealType, UUID } from '../../api/types';
import { MealPollOptionRadio } from '../../components/meals/MealPollOptionRadio';
import { Button, Screen } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { formatMenuDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';

type MealPollResponseScreenProps = {
  spaceId: UUID;
  menuDate: string;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function MealPollResponseScreen({ spaceId, menuDate }: MealPollResponseScreenProps) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const showToast = useToastStore(state => state.showToast);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [polls, setPolls] = useState<MealPollSlot[]>([]);
  const [selections, setSelections] = useState<Partial<Record<MealType, UUID>>>({});

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('meals.poll.responseTitle') });
  }, [navigation, t]);

  const openPolls = useMemo(() => polls.filter(poll => poll.status === 'OPEN'), [polls]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const day = await mealsApi.getMealPolls(spaceId, menuDate);
      setPolls(day.polls);
      const initial: Partial<Record<MealType, UUID>> = {};
      for (const poll of day.polls) {
        if (poll.mySelectedOptionId) {
          initial[poll.mealType] = poll.mySelectedOptionId;
        }
      }
      setSelections(initial);
    } catch {
      setPolls([]);
      showToast(t('meals.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [menuDate, showToast, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleSelect = useCallback((mealType: MealType, optionId: UUID) => {
    setSelections(prev => ({ ...prev, [mealType]: optionId }));
  }, []);

  const handleSave = useCallback(async () => {
    const payload = openPolls
      .filter(poll => selections[poll.mealType] != null)
      .map(poll => ({
        mealType: poll.mealType,
        selectedOptionId: selections[poll.mealType] as UUID,
      }));

    if (payload.length === 0) {
      showToast(t('meals.poll.selectAtLeastOne'));
      return;
    }

    if (payload.length < openPolls.length) {
      showToast(t('meals.poll.selectAllOpen'));
      return;
    }

    setSaving(true);
    try {
      const day = await mealsApi.submitMealPollResponses(spaceId, menuDate, payload);
      setPolls(day.polls);
      showToast(t('meals.poll.saved'));
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [menuDate, openPolls, selections, showToast, spaceId, t]);

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.date}>{formatMenuDate(menuDate, i18n.language)}</Text>
      <Text style={styles.subtitle}>{t('meals.poll.responseHint')}</Text>

      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!loading && openPolls.length === 0 ? (
        <Text style={styles.empty}>{t('meals.poll.noOpenPolls')}</Text>
      ) : null}

      {!loading
        ? openPolls.map(poll => (
            <View key={poll.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{t(mealTypeLabelKey(poll.mealType))}</Text>
              {poll.options.map(option => (
                <MealPollOptionRadio
                  key={option.id}
                  option={option}
                  selected={selections[poll.mealType] === option.id}
                  onSelect={() => handleSelect(poll.mealType, option.id)}
                />
              ))}
            </View>
          ))
        : null}

      {!loading && openPolls.length > 0 ? (
        <Button
          label={saving ? t('meals.poll.submitting') : t('meals.poll.submit')}
          onPress={() => void handleSave()}
          disabled={saving}
          style={styles.submit}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  date: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  loader: { marginVertical: spacing.lg },
  empty: { ...typography.body, color: colors.muted, marginTop: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.bodyStrong, fontSize: 18, marginBottom: spacing.sm },
  submit: { marginTop: spacing.md },
});
