import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { OccupancyHistoryEntryResponse } from '../api/types';
import { Card, HeaderBackButton, Screen, SkeletonCard } from '../components/ui';
import type { MainStackParamList } from '../navigation/types';
import { useMemberOccupancies } from '../hooks/useMemberOccupancies';
import { colors, spacing, typography } from '../theme';
import { formatOccupancyAllocatedDate } from '../utils/occupancyRules';

type Nav = NativeStackNavigationProp<MainStackParamList, 'MemberOccupancyHistory'>;
type Route = NativeStackScreenProps<MainStackParamList, 'MemberOccupancyHistory'>['route'];

function formatEventDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return formatOccupancyAllocatedDate(value) + ' ' + date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HistoryEventRow({ entry }: { entry: OccupancyHistoryEntryResponse }) {
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <Text style={styles.eventType}>{t(`occupancy.history.${entry.eventType}`)}</Text>
      <Text style={styles.meta}>{formatEventDate(entry.performedAt)}</Text>
      {entry.remarks ? <Text style={styles.remarks}>{entry.remarks}</Text> : null}
    </Card>
  );
}

export function MemberOccupancyHistoryScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, memberId, memberName } = route.params;
  const { data, loading, error, refresh } = useMemberOccupancies(spaceId, memberId);

  const chronologicalHistory = useMemo(() => {
    const entries = [...(data?.history ?? [])];
    entries.sort(
      (a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime(),
    );
    return entries;
  }, [data?.history]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: t('occupancy.history.title'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [i18n.language, navigation, t]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  if (loading && !data) {
    return (
      <Screen contentStyle={styles.content}>
        <SkeletonCard />
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} contentStyle={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{memberName}</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.section}>
          {chronologicalHistory.length === 0 ? (
            <Text style={styles.empty}>{t('occupancy.history.emptyEvents')}</Text>
          ) : (
            chronologicalHistory.map(entry => (
              <HistoryEventRow key={entry.historyId} entry={entry} />
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  heading: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.sm,
  },
  eventType: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
  },
  remarks: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
    marginBottom: spacing.md,
  },
});
