import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { UUID } from '../../api/types';
import { MealPollDayContent } from '../../components/meals/MealPollDayContent';
import { Screen } from '../../components/ui';
import { useMealPollDay } from '../../hooks/useMealPollDay';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type MealPollResponseScreenProps = {
  spaceId: UUID;
  menuDate: string;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function MealPollResponseScreen({ spaceId, menuDate }: MealPollResponseScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const poll = useMealPollDay(spaceId, menuDate);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('meals.poll.responseTitle') });
  }, [navigation, t]);

  return (
    <Screen scrollable contentStyle={styles.content}>
      {!poll.loading && poll.openPolls.length === 0 ? (
        <Text style={styles.empty}>{t('meals.poll.noOpenPolls')}</Text>
      ) : (
        <MealPollDayContent
          menuDate={menuDate}
          loading={poll.loading}
          saving={poll.saving}
          openPolls={poll.openPolls}
          selections={poll.selections}
          showSummary={poll.showSummary}
          onSelect={poll.handleSelect}
          onSave={poll.handleSave}
          onUpdateChoices={poll.handleUpdateChoices}
          variant="screen"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  empty: { ...typography.body, color: colors.muted, marginTop: spacing.md },
});
