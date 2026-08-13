import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  CreditCard,
  Info,
  LayoutDashboard,
  MessageSquareWarning,
  UtensilsCrossed,
  Users,
  WalletCards,
} from 'lucide-react-native';
import { DashboardActionRow } from '../components/dashboard/shared/DashboardActionRow';
import { DashboardSectionHeader } from '../components/dashboard/shared/DashboardSectionHeader';
import { DashboardStatCard } from '../components/dashboard/shared/DashboardStatCard';
import { MealFormHero } from '../components/meals/MealFormHero';
import { Screen } from '../components/ui';
import { colors, radius, shadows, spacing, typography } from '../theme';

/**
 * Marketing / about surface (not wired into product navigation).
 * Kept as a Design A reference landing — no APIs or auth.
 */
const HomeScreen = () => {
  const { t } = useTranslation();

  return (
    <Screen scrollable contentStyle={styles.content}>
      <MealFormHero
        icon={LayoutDashboard}
        eyebrow={t('home.eyebrow', { defaultValue: 'ACOMI' })}
        heading={t('home.heading', {
          defaultValue: 'Smart PG & hostel operations',
        })}
        subheading={t('home.subheading', {
          defaultValue:
            'Manage tenants, payments, meals, and daily operations from one premium workspace.',
        })}
        compact
      />

      <DashboardSectionHeader
        title={t('home.summaryTitle', { defaultValue: "Today's snapshot" })}
        icon={LayoutDashboard}
      />
      <View style={styles.kpiRow}>
        <DashboardStatCard
          label={t('home.mealsLabel', { defaultValue: 'Meals today' })}
          value="148"
          icon={UtensilsCrossed}
          accent={colors.primaryDark}
          compact
        />
        <DashboardStatCard
          label={t('home.rentLabel', { defaultValue: 'Rent collected' })}
          value="₹4.2L"
          icon={WalletCards}
          accent="#0F766E"
          compact
        />
        <DashboardStatCard
          label={t('home.collectionLabel', { defaultValue: 'Collection' })}
          value="78%"
          icon={CreditCard}
          accent="#D97706"
          compact
        />
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>
          {t('home.insightTitle', { defaultValue: 'Meal breakdown' })}
        </Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>
            {t('home.breakfast', { defaultValue: 'Breakfast' })}
          </Text>
          <Text style={styles.statValue}>42</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>
            {t('home.lunch', { defaultValue: 'Lunch' })}
          </Text>
          <Text style={styles.statValue}>57</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>
            {t('home.dinner', { defaultValue: 'Dinner' })}
          </Text>
          <Text style={styles.statValue}>49</Text>
        </View>
        <Text style={styles.cardHint}>
          {t('home.wasteHint', {
            defaultValue: '↓ 18% less waste vs last week',
          })}
        </Text>
      </View>

      <DashboardSectionHeader
        title={t('home.shortcutsTitle', { defaultValue: 'Product areas' })}
        icon={Building2}
      />
      <View style={styles.shortcuts}>
        <DashboardActionRow
          title={t('home.shortcutMembers', { defaultValue: 'Members' })}
          subtitle={t('home.shortcutMembersBody', {
            defaultValue: 'Residents, invites, and profiles',
          })}
          icon={Users}
        />
        <DashboardActionRow
          title={t('home.shortcutMeals', { defaultValue: 'Meals' })}
          subtitle={t('home.shortcutMealsBody', {
            defaultValue: 'Menus, polls, and headcount',
          })}
          icon={UtensilsCrossed}
        />
        <DashboardActionRow
          title={t('home.shortcutPayments', { defaultValue: 'Payments' })}
          subtitle={t('home.shortcutPaymentsBody', {
            defaultValue: 'Collections and reviews',
          })}
          icon={WalletCards}
        />
        <DashboardActionRow
          title={t('home.shortcutComplaints', { defaultValue: 'Complaints' })}
          subtitle={t('home.shortcutComplaintsBody', {
            defaultValue: 'Tickets and resolution',
          })}
          icon={MessageSquareWarning}
        />
      </View>

      <View style={styles.aboutCard}>
        <View style={styles.aboutIcon}>
          <Info size={18} color={colors.primaryDark} strokeWidth={2.2} />
        </View>
        <View style={styles.aboutBody}>
          <Text style={styles.aboutTitle}>
            {t('home.aboutTitle', { defaultValue: 'Built for Indian PGs & hostels' })}
          </Text>
          <Text style={styles.aboutBodyText}>
            {t('home.aboutBody', {
              defaultValue:
                'ACOMI brings accommodation, meals, payments, and complaints into one Material Design workspace.',
            })}
          </Text>
        </View>
      </View>
    </Screen>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.section,
    gap: spacing.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  insightCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  insightTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
  },
  statLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  statValue: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  cardHint: {
    ...typography.caption,
    color: colors.success,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  shortcuts: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  aboutCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.successTint,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    padding: spacing.md,
    ...shadows.sm,
  },
  aboutIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  aboutBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  aboutTitle: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  aboutBodyText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
