import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Badge,
  EmptyState,
  HeaderBackButton,
  MetricCard,
  MetricCardProgress,
} from '../components/ui';
import { Screen } from '../components/ui/Screen';
import { spacing, typography } from '../theme';

type ScreenPlaceholderProps = {
  title: string;
};

export function ScreenPlaceholder({ title }: ScreenPlaceholderProps) {
  const route = useRoute();
  const navigation = useNavigation();
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
        <Badge label="CountIn" />
        <Text style={styles.dashboardTitle}>Overview</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            label="Occupancy"
            value="94%"
            style={styles.metricHalf}
          />
          <MetricCard
            label="Today's meals"
            value="42"
            hint="↓ 18% less waste vs last week"
            hintPositive
            style={styles.metricHalf}
          />
        </View>
        <MetricCard
          label="Rent collected (May)"
          value="₹ 4,28,500"
          hint="78% of expected collection"
          hintPositive>
          <MetricCardProgress percent={78} />
        </MetricCard>
      </Screen>
    );
  }

  return (
    <EmptyState
      title={title}
      description={`The ${route.name} section is being set up. Check back soon.`}
    />
  );
}

const styles = StyleSheet.create({
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
