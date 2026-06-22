import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { subscriptionPlansApi } from '../../api/subscriptionPlansApi';
import type { SubscriptionPlanResponse, UUID } from '../../api/types';
import { PaymentProofUploadField } from '../../components/meals/PaymentProofUploadField';
import { SubscriptionPlanCard } from '../../components/meals/SubscriptionPlanCard';
import { SubscriptionPlanDetailsPanel } from '../../components/meals/SubscriptionPlanDetailsPanel';
import { Button, FormInput } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useCustomerSubscriptionStatus } from '../../hooks/useCustomerSubscriptionStatus';
import { useToastStore } from '../../store/toastStore';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Route = NativeStackScreenProps<MainStackParamList, 'CustomerSubscriptionPlans'>['route'];

type CustomerSubscriptionPlansScreenProps = {
  spaceId?: UUID;
  memberId?: UUID;
};

export function CustomerSubscriptionPlansScreen({
  spaceId: spaceIdProp,
  memberId: memberIdProp,
}: CustomerSubscriptionPlansScreenProps) {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const spaceId = spaceIdProp ?? route.params.spaceId;
  const memberId = memberIdProp ?? route.params.memberId;
  const showToast = useToastStore(state => state.showToast);
  const { status, reload: reloadStatus } = useCustomerSubscriptionStatus(spaceId, memberId);

  const [plans, setPlans] = useState<SubscriptionPlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<UUID | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [proofImageBase64, setProofImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reloadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await subscriptionPlansApi.listPlans(spaceId);
      setPlans(rows.filter(plan => plan.isActive));
    } catch {
      showToast(t('meals.errors.loadFailed'));
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void reloadPlans();
      void reloadStatus();
    }, [reloadPlans, reloadStatus]),
  );

  const selectedPlan = useMemo(
    () => plans.find(plan => plan.planId === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const hasPendingRequest = status?.pendingActivationStatus === 'PENDING';

  const canSubmitRequest = useMemo(() => {
    if (!selectedPlan) {
      return false;
    }
    if (status?.subscriptionActive) {
      return false;
    }
    if (hasPendingRequest) {
      return false;
    }
    return true;
  }, [hasPendingRequest, selectedPlan, status?.subscriptionActive]);

  useEffect(() => {
    if (hasPendingRequest) {
      setSelectedPlanId(null);
      setPaymentReference('');
      setCustomerNotes('');
      setProofImageBase64(null);
    }
  }, [hasPendingRequest]);

  const handleSelectPlan = useCallback((planId: UUID) => {
    setSelectedPlanId(planId);
    setPaymentReference('');
    setCustomerNotes('');
    setProofImageBase64(null);
  }, []);

  const handleSubmitRequest = useCallback(async () => {
    if (!selectedPlan || !canSubmitRequest) {
      return;
    }
    const reference = paymentReference.trim();
    if (!reference && !proofImageBase64) {
      showToast(t('meals.subscription.customer.proofOrReferenceRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await subscriptionPlansApi.createActivationRequest(spaceId, memberId, {
        planId: selectedPlan.planId,
        paymentReference: reference || undefined,
        proofImageBase64: proofImageBase64 ?? undefined,
        customerNotes: customerNotes.trim() || undefined,
      });
      showToast(t('meals.subscription.customer.requestSubmitted'));
      setPaymentReference('');
      setCustomerNotes('');
      setProofImageBase64(null);
      setSelectedPlanId(null);
      await reloadStatus();
    } catch {
      showToast(t('meals.errors.actionFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmitRequest,
    customerNotes,
    memberId,
    paymentReference,
    proofImageBase64,
    reloadStatus,
    selectedPlan,
    showToast,
    spaceId,
    t,
  ]);

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.subtitle}>
        {hasPendingRequest
          ? t('meals.subscription.customer.pendingCatalogSubtitle')
          : t('meals.subscription.customer.catalogSubtitle')}
      </Text>

      {hasPendingRequest ? (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingBadge}>{t('meals.subscription.customer.pendingBadge')}</Text>
          <Text style={styles.pendingTitle}>{t('meals.subscription.customer.pendingTitle')}</Text>
          <Text style={styles.pendingBody}>
            {t('meals.subscription.customer.pendingBody', {
              plan: status?.pendingPlanName ?? t('meals.subscription.customer.selectedPlan'),
            })}
          </Text>
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : plans.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('meals.subscription.customer.noPlans')}</Text>
        </View>
      ) : (
        plans.map(plan => (
          <SubscriptionPlanCard
            key={plan.planId}
            plan={plan}
            selectable
            selected={selectedPlanId === plan.planId}
            onPress={() => handleSelectPlan(plan.planId)}
          />
        ))
      )}

      {selectedPlan && canSubmitRequest ? (
        <View style={styles.requestCard}>
          <Text style={styles.requestTitle}>{t('meals.subscription.customer.requestTitle')}</Text>
          <SubscriptionPlanDetailsPanel plan={selectedPlan} />
          <Text style={styles.requestHint}>{t('meals.subscription.customer.requestHint')}</Text>

          <FormInput
            label={t('meals.subscription.customer.paymentReferenceLabel')}
            value={paymentReference}
            onChangeText={setPaymentReference}
            placeholder={t('meals.subscription.customer.paymentReferencePlaceholder')}
          />

          <PaymentProofUploadField
            value={proofImageBase64}
            onChange={setProofImageBase64}
            disabled={submitting}
          />

          <FormInput
            label={t('meals.subscription.customer.notesLabel')}
            value={customerNotes}
            onChangeText={setCustomerNotes}
            placeholder={t('meals.subscription.customer.notesPlaceholder')}
            multiline
          />

          <Button
            label={t('meals.subscription.customer.submitRequest')}
            onPress={() => void handleSubmitRequest()}
            loading={submitting}
          />
        </View>
      ) : null}
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
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pendingBadge: {
    ...typography.caption,
    color: '#B45309',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  pendingTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  pendingBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  requestCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
    gap: spacing.md,
  },
  requestTitle: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  requestHint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
