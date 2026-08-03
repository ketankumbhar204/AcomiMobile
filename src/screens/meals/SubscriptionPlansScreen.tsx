import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, CreditCard, Package, Plus } from 'lucide-react-native';
import { subscriptionPlansApi } from '../../api/subscriptionPlansApi';
import type { SubscriptionPlanResponse, UUID } from '../../api/types';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { SubscriptionPlanCard } from '../../components/meals/SubscriptionPlanCard';
import { SubscriptionPlanFormBottomSheet } from '../../components/meals/SubscriptionPlanFormBottomSheet';
import { Button, EmptyState, PermissionDeniedScreen, Skeleton } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { DashboardActionRow } from '../../components/dashboard/shared/DashboardActionRow';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { useToastStore } from '../../store/toastStore';
import { spacing } from '../../theme';

type SubscriptionPlansScreenProps = {
  spaceId: UUID;
};

export function SubscriptionPlansScreen({ spaceId }: SubscriptionPlansScreenProps) {
  const { t } = useTranslation();
  const permissions = useSpacePermissions(spaceId);
  const showToast = useToastStore(state => state.showToast);
  const [plans, setPlans] = useState<SubscriptionPlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanResponse | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await subscriptionPlansApi.listPlans(spaceId, { includeInactive: true });
      setPlans(rows);
    } catch {
      showToast(t('meals.errors.loadFailed'));
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const openCreate = useCallback(() => {
    setEditingPlan(null);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((plan: SubscriptionPlanResponse) => {
    setEditingPlan(plan);
    setDrawerOpen(true);
  }, []);

  const handleSave = useCallback(
    async (payload: Parameters<typeof subscriptionPlansApi.createPlan>[1]) => {
      try {
        if (editingPlan) {
          await subscriptionPlansApi.updatePlan(spaceId, editingPlan.planId, payload);
          showToast(t('meals.subscriptionPlans.updateSuccess'));
        } else {
          await subscriptionPlansApi.createPlan(spaceId, payload);
          showToast(t('meals.subscriptionPlans.createSuccess'));
        }
        await reload();
      } catch {
        showToast(t('meals.errors.actionFailed'));
        throw new Error('save failed');
      }
    },
    [editingPlan, reload, showToast, spaceId, t],
  );

  if (!permissions.canManageMeals) {
    return <PermissionDeniedScreen />;
  }

  return (
    <Screen scrollable contentStyle={styles.content}>
      <MealFormHero
        icon={Package}
        eyebrow={t('meals.subscriptionPlans.eyebrow', { defaultValue: 'Billing' })}
        heading={t('meals.subscriptionPlans.title', { defaultValue: 'Subscription plans' })}
        subheading={t('meals.subscriptionPlans.ownerSubtitle')}
        compact
      />

      <Button
        label={t('meals.subscriptionPlans.createAction')}
        icon={Plus}
        onPress={openCreate}
        style={styles.createButton}
      />

      {loading ? (
        <View style={styles.skeletonWrap}>
          <Skeleton width="100%" height={96} borderRadius={18} />
          <Skeleton width="100%" height={96} borderRadius={18} />
        </View>
      ) : plans.length === 0 ? (
        <EmptyState
          Icon={CreditCard}
          title={t('meals.subscriptionPlans.empty')}
          description={t('meals.subscriptionPlans.emptyHint', {
            defaultValue: 'Create a prepaid meal pack customers can request.',
          })}
        />
      ) : (
        plans.map(plan => (
          <SubscriptionPlanCard
            key={plan.planId}
            plan={plan}
            showStatus
            onEdit={() => openEdit(plan)}
            onPress={plan.isActive ? () => openEdit(plan) : undefined}
          />
        ))
      )}

      <DashboardActionRow
        title={t('meals.subscriptionPlans.viewRequests')}
        subtitle={t('meals.subscriptionPlans.viewRequestsHint', {
          defaultValue: 'Review pending activation requests',
        })}
        icon={ClipboardCheck}
        accent="#B45309"
        onPress={() => navigateMainStack('SubscriptionActivationRequests', { spaceId })}
      />

      <SubscriptionPlanFormBottomSheet
        visible={drawerOpen}
        mode={editingPlan ? 'edit' : 'create'}
        plan={editingPlan}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  createButton: {
    alignSelf: 'stretch',
  },
  skeletonWrap: {
    gap: spacing.sm,
  },
});
