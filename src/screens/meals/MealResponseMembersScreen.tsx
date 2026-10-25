import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react-native';
import type { MealType, UUID } from '../../api/types';
import { ListFilterChips } from '../../components/ui/ListFilterChips';
import { EmptyState, ListCard, Screen, SkeletonCard } from '../../components/ui';
import { useMealHeadcountDetail } from '../../hooks/useMealHeadcountDetail';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { formatMenuDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import {
  buildMealResponseLists,
  type MealResponseFilter,
} from '../../utils/mealResponseMembers';

type MealResponseMembersScreenProps = {
  spaceId: UUID;
  menuDate: string;
  mealType: MealType;
};

export function MealResponseMembersScreen({
  spaceId,
  menuDate,
  mealType,
}: MealResponseMembersScreenProps) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [filter, setFilter] = useState<MealResponseFilter>('responded');
  const { loading, detail, error, reload } = useMealHeadcountDetail(
    spaceId,
    menuDate,
    mealType,
    true,
  );
  const lists = useMemo(() => buildMealResponseLists(detail), [detail]);
  const rows =
    filter === 'eligible'
      ? lists.eligible
      : filter === 'not_responded'
        ? lists.notResponded
        : lists.responded;
  const mealLabel = t(mealTypeLabelKey(mealType));

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('meals.responses.title', { meal: mealLabel, defaultValue: '{{meal}} responses' }),
    });
  }, [mealLabel, navigation, t]);

  const emptyCopy =
    filter === 'responded'
      ? {
          title: t('meals.responses.emptyRespondedTitle', {
            defaultValue: 'No responses yet',
          }),
          description: t('meals.responses.emptyRespondedBody', {
            defaultValue: 'Members who reply to this meal will appear here.',
          }),
        }
      : filter === 'not_responded'
        ? {
            title: t('meals.responses.emptyNotRespondedTitle', {
              defaultValue: 'Everyone has responded',
            }),
            description: t('meals.responses.emptyNotRespondedBody', {
              defaultValue: 'There are no eligible members still waiting to reply.',
            }),
          }
        : {
            title: t('meals.responses.emptyEligibleTitle', {
              defaultValue: 'No eligible members',
            }),
            description: t('meals.responses.emptyEligibleBody', {
              defaultValue: 'No members are eligible for this meal.',
            }),
          };

  return (
    <Screen
      scrollable
      refreshing={loading && detail != null}
      onRefresh={() => void reload()}>
      <Text style={styles.subtitle}>
        {t('meals.responses.subtitle', {
          meal: mealLabel,
          date: formatMenuDate(menuDate, i18n.language),
          defaultValue: '{{meal}} · {{date}}',
        })}
      </Text>

      <ListFilterChips
        value={filter}
        onChange={setFilter}
        options={[
          {
            id: 'eligible',
            label: t('meals.responses.filterEligible', { defaultValue: 'Eligible' }),
            badge: lists.eligible.length,
          },
          {
            id: 'responded',
            label: t('meals.responses.filterResponded', { defaultValue: 'Responded' }),
            badge: lists.responded.length,
            tone: 'info',
          },
          {
            id: 'not_responded',
            label: t('meals.responses.filterNotResponded', { defaultValue: 'Not responded' }),
            badge: lists.notResponded.length,
            tone: 'warning',
          },
        ]}
      />

      {loading && detail == null ? (
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <EmptyState
          Icon={Users}
          title={t('meals.responses.loadErrorTitle', { defaultValue: 'Could not load responses' })}
          description={t('meals.responses.loadErrorBody', {
            defaultValue: 'Pull to refresh, or try again.',
          })}
        />
      ) : rows.length === 0 ? (
        <EmptyState Icon={Users} title={emptyCopy.title} description={emptyCopy.description} />
      ) : (
        <View style={styles.list}>
          {rows.map(row => (
            <ListCard
              key={row.memberId}
              title={row.memberName}
              subtitle={
                row.responded
                  ? row.choice ||
                    t('meals.responses.respondedChoice', { defaultValue: 'Responded' })
                  : t('meals.responses.notRespondedChoice', { defaultValue: 'Not responded' })
              }
            />
          ))}
        </View>
      )}

      <Pressable
        style={styles.editLink}
        onPress={() => navigateMainStack('DailyMenuEdit', { spaceId, menuDate, mealType })}
        accessibilityRole="button">
        <Text style={styles.editLinkText}>
          {t('meals.responses.editMenu', { defaultValue: 'Edit menu' })}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  list: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  editLink: {
    alignSelf: 'flex-start',
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
  },
  editLinkText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
});
