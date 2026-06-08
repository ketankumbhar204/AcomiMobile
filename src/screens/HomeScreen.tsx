import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Badge,
  MetricCard,
  MetricCardProgress,
  Screen,
} from '../components/ui';
import { colors, spacing, typography } from '../theme';

const HomeScreen = () => {
  return (
    <Screen scrollable contentStyle={styles.content}>
      <View style={styles.heroAccent} />
      <Badge label="Built for Indian PG & hostel owners" />

      <Text style={styles.logo}>CountIn</Text>

      <Text style={styles.heading}>
        Smart PG Management with WhatsApp Automation
      </Text>

      <Text style={styles.subHeading}>
        Manage tenants, payments, meals, and daily operations from one simple
        platform.
      </Text>

      <MetricCard label="Today's Summary" value="148 meals" style={styles.card}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Breakfast</Text>
          <Text style={styles.statValue}>42</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Lunch</Text>
          <Text style={styles.statValue}>57</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Dinner</Text>
          <Text style={styles.statValue}>49</Text>
        </View>
        <Text style={styles.cardHint}>↓ 18% less waste vs last week</Text>
      </MetricCard>

      <MetricCard
        label="Rent collected (May)"
        value="₹ 4,28,500"
        hint="78% of expected collection"
        hintPositive>
        <MetricCardProgress percent={78} />
      </MetricCard>
    </Screen>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    paddingBottom: spacing.section,
  },
  heroAccent: {
    position: 'absolute',
    top: -60,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${colors.primary}1A`,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primaryHover,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  subHeading: {
    ...typography.body,
    marginBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  statValue: {
    ...typography.bodyStrong,
    fontSize: 18,
  },
  cardHint: {
    ...typography.caption,
    color: colors.success,
    marginTop: spacing.md,
  },
});
