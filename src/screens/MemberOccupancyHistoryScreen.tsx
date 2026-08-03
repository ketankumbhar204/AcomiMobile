import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { History } from 'lucide-react-native';
import { DashboardSectionTitle } from '../components/dashboard/DashboardSectionTitle';
import {
  EmptyState,
  HeaderBackButton,
  Screen,
  SkeletonCard,
  Timeline,
  type TimelineGroup,
} from '../components/ui';
import type { MainStackParamList } from '../navigation/types';
import { useMemberOccupancies } from '../hooks/useMemberOccupancies';
import { colors, spacing, typography } from '../theme';
import { formatOccupancyAllocatedDate } from '../utils/occupancyRules';

type Nav = NativeStackNavigationProp<MainStackParamList, 'MemberOccupancyHistory'>;
type Route = NativeStackScreenProps<MainStackParamList, 'MemberOccupancyHistory'>['route'];

const EVENT_ACCENT: Record<string, string> = {
  ALLOCATED: colors.primary,
  MOVE_IN: colors.primary,
  RESERVED: '#D97706',
  TRANSFERRED: '#2563EB',
  VACATED: colors.muted,
  RESERVATION_CANCELLED: '#DC2626',
};

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

function monthKey(value?: string | null): { key: string; label: string } {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { key: 'unknown', label: '—' };
  }
  return {
    key: `${date.getFullYear()}-${date.getMonth()}`,
    label: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  };
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

  const timelineGroups = useMemo<TimelineGroup[]>(() => {
    const groups: TimelineGroup[] = [];
    chronologicalHistory.forEach(entry => {
      const { key, label } = monthKey(entry.performedAt);
      let group = groups.find(candidate => candidate.key === key);
      if (!group) {
        group = { key, label, items: [] };
        groups.push(group);
      }
      group.items.push({
        id: entry.historyId,
        title: t(`occupancy.history.${entry.eventType}`),
        meta: formatEventDate(entry.performedAt),
        description: entry.remarks ?? undefined,
        accent: EVENT_ACCENT[entry.eventType] ?? colors.primary,
      });
    });
    return groups;
  }, [chronologicalHistory, t]);

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
        <View style={styles.gap} />
        <SkeletonCard />
        <View style={styles.gap} />
        <SkeletonCard />
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} contentStyle={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DashboardSectionTitle
          title={memberName}
          subtitle={t('occupancy.history.title')}
        />

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          {timelineGroups.length === 0 ? (
            <EmptyState
              title={t('occupancy.history.emptyEvents')}
              description={t('membership.history.emptyDescription')}
              Icon={History}
            />
          ) : (
            <Timeline groups={timelineGroups} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  gap: {
    height: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    ...typography.body,
    fontSize: 14,
    color: '#DC2626',
  },
});
