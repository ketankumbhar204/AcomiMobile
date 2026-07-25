import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { ClipboardList } from 'lucide-react-native';
import { subscriptionPlansApi } from '../../api/subscriptionPlansApi';
import type { SubscriptionPlanResponse, UUID } from '../../api/types';
import { PaymentProofUploadField } from '../../components/meals/PaymentProofUploadField';
import { SubscriptionPlanCard } from '../../components/meals/SubscriptionPlanCard';
import { SubscriptionPlanDetailsPanel } from '../../components/meals/SubscriptionPlanDetailsPanel';
import {
  ProgressiveWorkflowFooter,
  progressiveSectionHighlightStyle,
} from '../../components/progressive';
import { FormInput } from '../../components/ui';
import { useCustomerSubscriptionStatus } from '../../hooks/useCustomerSubscriptionStatus';
import { useProgressiveSectionReview } from '../../hooks/useProgressiveSectionReview';
import { useToastStore } from '../../store/toastStore';
import type { MainStackParamList } from '../../navigation/types';
import { resolveProgressivePhase } from '../../utils/progressivePhase';
import { colors, radius, spacing, typography } from '../../theme';

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
      setPaymentReference('');
      setCustomerNotes('');
      setProofImageBase64(null);
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
      setPaymentReference('');
      setCustomerNotes('');
      setProofImageBase64(null);
      clearPaymentReviewed();
    },
    [clearPaymentReviewed],
  );

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
        <Text style={styles.subtitle}>
          {hasPendingRequest
            ? t('meals.subscription.customer.pendingCatalogSubtitle')
            : t('meals.subscription.customer.catalogSubtitle')}
        </Text>

        {hasPendingRequest ? (
          <View style={styles.pendingCard} accessibilityRole="summary">
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
          <View style={styles.emptyCard} accessibilityRole="text">
            <View style={styles.emptyIconWrap}>
              <ClipboardList size={20} color={colors.primaryDark} strokeWidth={2.2} />
            </View>
            <Text style={styles.emptyTitle}>{t('meals.subscription.customer.noPlansTitle')}</Text>
            <Text style={styles.emptyText}>{t('meals.subscription.customer.noPlans')}</Text>
            <Text style={styles.emptyHint}>{t('meals.subscription.customer.noPlansHint')}</Text>
          </View>
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

            <FormInput
              label={t('meals.subscription.customer.paymentReferenceLabel')}
              value={paymentReference}
              onChangeText={value => {
                markPaymentReviewed();
                setPaymentReference(value);
              }}
              placeholder={t('meals.subscription.customer.paymentReferencePlaceholder')}
            />

            <PaymentProofUploadField
              value={proofImageBase64}
              onChange={value => {
                markPaymentReviewed();
                setProofImageBase64(value);
              }}
              disabled={submitting}
            />

            <FormInput
              label={t('meals.subscription.customer.notesLabel')}
              value={customerNotes}
              onChangeText={value => {
                markPaymentReviewed();
                setCustomerNotes(value);
              }}
              placeholder={t('meals.subscription.customer.notesPlaceholder')}
              multiline
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
    padding: spacing.xxl,
    paddingBottom: spacing.section,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  sectionLabel: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  emptyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: radius.card,
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
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
    gap: spacing.md,
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
