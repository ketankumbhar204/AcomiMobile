import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { subscriptionPlansApi } from '../../api/subscriptionPlansApi';
import type { SubscriptionPlanResponse, UUID } from '../../api/types';
import { SubscriptionPlanCard } from '../../components/meals/SubscriptionPlanCard';
import { SubscriptionPlanFormBottomSheet } from '../../components/meals/SubscriptionPlanFormBottomSheet';
import { Button, PermissionDeniedScreen } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';

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
      <Text style={styles.subtitle}>{t('meals.subscriptionPlans.ownerSubtitle')}</Text>

      <Button
        label={t('meals.subscriptionPlans.createAction')}
        onPress={openCreate}
        style={styles.createButton}
      />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : plans.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('meals.subscriptionPlans.empty')}</Text>
        </View>
      ) : (
        plans.map(plan => (
          <SubscriptionPlanCard
            key={plan.planId}
            plan={plan}
            showStatus
            onEdit={() => openEdit(plan)}
            onPress={
              plan.isActive
                ? () => openEdit(plan)
                : undefined
            }
          />
        ))
      )}

      <Button
        label={t('meals.subscriptionPlans.viewRequests')}
        variant="secondary"
        onPress={() => navigateMainStack('SubscriptionActivationRequests', { spaceId })}
        style={styles.requestsButton}
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
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  createButton: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  requestsButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  loader: {
    marginVertical: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
