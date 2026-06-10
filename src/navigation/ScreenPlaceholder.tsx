import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { formatSpaceType } from '../api';
import {
  Badge,
  EmptyState,
  HeaderBackButton,
  MetricCard,
  MetricCardProgress,
} from '../components/ui';
import { Screen } from '../components/ui/Screen';
import { useSpaceStore } from '../store/spaceStore';
import { colors, spacing, typography } from '../theme';

type ScreenPlaceholderProps = {
  title: string;
};

export function ScreenPlaceholder({ title }: ScreenPlaceholderProps) {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const selectedSpace = useSpaceStore(state => state.selectedSpace);
  const isDashboard = route.name === 'Dashboard';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation]);

  if (isDashboard) {
    return (
      <Screen scrollable contentStyle={styles.dashboardContent}>
        {selectedSpace ? (
          <View style={styles.spaceDetails}>
            <Text style={styles.spaceName}>{selectedSpace.name}</Text>
            <Text style={styles.spaceType}>{formatSpaceType(selectedSpace.type)}</Text>
          </View>
        ) : null}
        <Badge label={t('common.appName')} />
        <Text style={styles.dashboardTitle}>{t('dashboard.overview')}</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            label={t('dashboard.occupancy')}
            value="94%"
            style={styles.metricHalf}
          />
          <MetricCard
            label={t('dashboard.todaysMeals')}
            value="42"
            hint={t('dashboard.mealsHint')}
            hintPositive
            style={styles.metricHalf}
          />
        </View>
        <MetricCard
          label={t('dashboard.rentCollected')}
          value="₹ 4,28,500"
          hint={t('dashboard.rentHint')}
          hintPositive>
          <MetricCardProgress percent={78} />
        </MetricCard>
      </Screen>
    );
  }

  return (
    <EmptyState
      title={title}
      description={t('dashboard.sectionComingSoon', { section: title })}
    />
  );
}

const styles = StyleSheet.create({
  spaceDetails: {
    marginBottom: spacing.lg,
  },
  spaceName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  spaceType: {
    ...typography.body,
    color: colors.muted,
  },
  dashboardContent: {
    paddingBottom: spacing.section,
  },
  dashboardTitle: {
    ...typography.h1,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metricHalf: {
    flex: 1,
  },
});
