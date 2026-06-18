import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../api/mealsApi';
import type { MealPollSlot, MealType, UUID } from '../api/types';
import { useToastStore } from '../store/toastStore';

export function useMealPollDay(spaceId: UUID, menuDate: string) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [polls, setPolls] = useState<MealPollSlot[]>([]);
  const [selections, setSelections] = useState<Partial<Record<MealType, UUID>>>({});
  const [editing, setEditing] = useState(true);

  const openPolls = useMemo(() => polls.filter(poll => poll.status === 'OPEN'), [polls]);

  const allResponded = useMemo(
    () => openPolls.length > 0 && openPolls.every(poll => poll.mySelectedOptionId != null),
    [openPolls],
  );

  const showSummary = allResponded && !editing;

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
      const open = day.polls.filter(poll => poll.status === 'OPEN');
      const responded =
        open.length > 0 && open.every(poll => poll.mySelectedOptionId != null);
      setEditing(!responded);
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

  const handleUpdateChoices = useCallback(() => {
    setEditing(true);
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
      setEditing(false);
      showToast(t('meals.poll.saved'));
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [menuDate, openPolls, selections, showToast, spaceId, t]);

  return {
    loading,
    saving,
    openPolls,
    selections,
    showSummary,
    handleSelect,
    handleSave,
    handleUpdateChoices,
  };
}
