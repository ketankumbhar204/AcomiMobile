import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Clock3, Package } from 'lucide-react-native';
import { subscriptionPlansApi } from '../../api/subscriptionPlansApi';
import type { SubscriptionPlanResponse, UUID } from '../../api/types';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { SubscriptionPlanCard } from '../../components/meals/SubscriptionPlanCard';
import { SubscriptionPlanDetailsPanel } from '../../components/meals/SubscriptionPlanDetailsPanel';
import {
  UniversalPaymentProofModal,
  type UniversalPaymentProofPayload,
} from '../../components/payments/UniversalPaymentProofModal';
import {
  ProgressiveWorkflowFooter,
  progressiveSectionHighlightStyle,
} from '../../components/progressive';
import { EmptyState, Skeleton } from '../../components/ui';
import { useCustomerSubscriptionStatus } from '../../hooks/useCustomerSubscriptionStatus';
import { useProgressiveSectionReview } from '../../hooks/useProgressiveSectionReview';
import { useToastStore } from '../../store/toastStore';
import type { MainStackParamList } from '../../navigation/types';
import { resolveProgressivePhase } from '../../utils/progressivePhase';
import { colors, radius, shadows, spacing, typography } from '../../theme';

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
  const scrollRef = useRef<ScrollView>(null);

  const [plans, setPlans] = useState<SubscriptionPlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<UUID | null>(null);
  const [proofPayload, setProofPayload] = useState<UniversalPaymentProofPayload>({
    paymentMethod: 'UPI',
  });
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

  const progressiveEnabled = canSubmitRequest;

  const {
    reviewed: paymentReviewed,
    highlighted: paymentHighlighted,
    onSectionLayout: onPaymentLayout,
    onScroll: onPaymentScroll,
    onScrollBeginDrag: onPaymentScrollBeginDrag,
    continueToSection: continueToPayment,
    clearReviewed: clearPaymentReviewed,
    markReviewed: markPaymentReviewed,
  } = useProgressiveSectionReview({
    enabled: progressiveEnabled,
  });

  const progressivePhase = resolveProgressivePhase({
    enabled: progressiveEnabled,
    prerequisiteMet: Boolean(selectedPlan),
    sectionReviewed: paymentReviewed,
  });

  useEffect(() => {
    if (hasPendingRequest) {
      setSelectedPlanId(null);
      setProofPayload({ paymentMethod: 'UPI' });
    }
  }, [hasPendingRequest]);

  useEffect(() => {
    if (!selectedPlanId) {
      clearPaymentReviewed();
    }
  }, [clearPaymentReviewed, selectedPlanId]);

  const handleSelectPlan = useCallback(
    (planId: UUID) => {
      setSelectedPlanId(planId);
      setProofPayload({ paymentMethod: 'UPI' });
      clearPaymentReviewed();
    },
    [clearPaymentReviewed],
  );

  const handleProofPayloadChange = useCallback(
    (payload: UniversalPaymentProofPayload) => {
      setProofPayload(payload);
      if (
        payload.proofImageBase64?.trim() ||
        payload.referenceNumber?.trim() ||
        payload.remarks?.trim()
      ) {
        markPaymentReviewed();
      }
    },
    [markPaymentReviewed],
  );

  const handleSubmitRequest = useCallback(async () => {
    if (!selectedPlan || !canSubmitRequest) {
      return;
    }
    const reference = proofPayload.referenceNumber?.trim() ?? '';
    if (!reference && !proofPayload.proofImageBase64?.trim()) {
      showToast(t('meals.subscription.customer.proofOrReferenceRequired'));
      return;
    }
    const methodLabel = t(
      `paymentCollection.method.${proofPayload.paymentMethod ?? 'UPI'}`,
    );
    const noteParts = [
      `${t('paymentCollection.proof.paymentMethod')}: ${methodLabel}`,
      proofPayload.remarks?.trim() || null,
    ].filter(Boolean);
    setSubmitting(true);
    try {
      await subscriptionPlansApi.createActivationRequest(spaceId, memberId, {
        planId: selectedPlan.planId,
        paymentReference: reference || undefined,
        proofImageBase64: proofPayload.proofImageBase64 ?? undefined,
        customerNotes: noteParts.join('\n') || undefined,
      });
      showToast(t('meals.subscription.customer.requestSubmitted'));
      setProofPayload({ paymentMethod: 'UPI' });
      setSelectedPlanId(null);
      await reloadStatus();
    } catch {
      showToast(t('meals.errors.actionFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmitRequest,
    memberId,
    proofPayload,
    reloadStatus,
    selectedPlan,
    showToast,
    spaceId,
    t,
  ]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      onPaymentScroll(contentOffset.y, layoutMeasurement.height);
    },
    [onPaymentScroll],
  );

  const showProgressiveFooter = progressiveEnabled && !hasPendingRequest && !loading;

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={onPaymentScrollBeginDrag}
        onScroll={handleScroll}>
        <MealFormHero
          icon={Package}
          eyebrow={t('meals.subscription.customer.eyebrow', { defaultValue: 'Subscription' })}
          heading={t('meals.subscription.customer.title', {
            defaultValue: 'Choose a plan',
          })}
          subheading={
            hasPendingRequest
              ? t('meals.subscription.customer.pendingCatalogSubtitle')
              : t('meals.subscription.customer.catalogSubtitle')
          }
          compact
        />

        {hasPendingRequest ? (
          <View style={styles.pendingCard} accessibilityRole="summary">
            <View style={styles.pendingIcon}>
              <Clock3 size={18} color="#B45309" strokeWidth={2.2} />
            </View>
            <View style={styles.pendingBodyWrap}>
              <Text style={styles.pendingBadge}>
                {t('meals.subscription.customer.pendingBadge')}
              </Text>
              <Text style={styles.pendingTitle}>
                {t('meals.subscription.customer.pendingTitle')}
              </Text>
              <Text style={styles.pendingBody}>
                {t('meals.subscription.customer.pendingBody', {
                  plan: status?.pendingPlanName ?? t('meals.subscription.customer.selectedPlan'),
                })}
              </Text>
            </View>
          </View>
        ) : loading ? (
          <View style={styles.skeletonWrap}>
            <Skeleton width="100%" height={96} borderRadius={18} />
            <Skeleton width="100%" height={96} borderRadius={18} />
          </View>
        ) : plans.length === 0 ? (
          <EmptyState
            Icon={ClipboardList}
            title={t('meals.subscription.customer.noPlansTitle')}
            description={t('meals.subscription.customer.noPlans')}
          />
        ) : (
          <>
            <Text style={styles.sectionLabel}>
              {t('progressiveWorkflow.subscription.choosePlanTitle')}
            </Text>
            {plans.map(plan => (
              <SubscriptionPlanCard
                key={plan.planId}
                plan={plan}
                selectable
                selected={selectedPlanId === plan.planId}
                onPress={() => handleSelectPlan(plan.planId)}
              />
            ))}
          </>
        )}

        {selectedPlan && canSubmitRequest ? (
          <View
            collapsable={false}
            style={[
              styles.requestCard,
              paymentHighlighted ? styles.requestHighlight : null,
            ]}
            onLayout={event => {
              const { y, height } = event.nativeEvent.layout;
              onPaymentLayout(y, height);
            }}>
            <Text style={styles.requestTitle}>
              {t('progressiveWorkflow.subscription.paymentDetailsTitle')}
            </Text>
            <SubscriptionPlanDetailsPanel plan={selectedPlan} />
            <Text style={styles.requestHint}>{t('meals.subscription.customer.requestHint')}</Text>

            <UniversalPaymentProofModal
              key={selectedPlan.planId}
              visible
              presentation="inline"
              hideActions
              submitting={submitting}
              onClose={() => undefined}
              onSubmit={() => undefined}
              onPayloadChange={handleProofPayloadChange}
            />
          </View>
        ) : null}
      </ScrollView>

      {showProgressiveFooter ? (
        <ProgressiveWorkflowFooter
          phase={progressivePhase}
          stepLabel={
            progressivePhase === 'continue' || progressivePhase === 'ready'
              ? t('progressiveWorkflow.stepOf', {
                  current: progressivePhase === 'continue' ? 1 : 2,
                  total: 2,
                })
              : undefined
          }
          progressLine={
            progressivePhase === 'continue'
              ? t('progressiveWorkflow.subscription.progressPlanNext')
              : progressivePhase === 'ready'
                ? t('progressiveWorkflow.subscription.progressReady')
                : undefined
          }
          continueEyebrow={t('progressiveWorkflow.nextStep')}
          continueTitle={t('progressiveWorkflow.subscription.reviewPaymentTitle')}
          continueHint={t('progressiveWorkflow.subscription.reviewPaymentHint')}
          continueLabel={t('progressiveWorkflow.subscription.continueToPayment')}
          continueA11yLabel={t('progressiveWorkflow.subscription.continueToPayment')}
          onContinue={() => continueToPayment(scrollRef)}
          primaryAction={{
            label: t('meals.subscription.customer.submitRequest'),
            onPress: () => void handleSubmitRequest(),
            loading: submitting,
            disabled: submitting || !selectedPlan,
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.section,
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  skeletonWrap: {
    gap: spacing.sm,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.warningTint,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: spacing.md,
    ...shadows.sm,
  },
  pendingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBodyWrap: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  pendingBadge: {
    ...typography.caption,
    color: '#B45309',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pendingTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  pendingBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  requestCard: {
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
    gap: spacing.md,
    ...shadows.sm,
  },
  requestHighlight: {
    ...progressiveSectionHighlightStyle,
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
