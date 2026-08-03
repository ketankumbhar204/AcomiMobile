import React, { useCallback, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  ClipboardCheck,
  Image as ImageLucide,
  Package,
  UserRound,
} from 'lucide-react-native';
import { subscriptionPlansApi } from '../../api/subscriptionPlansApi';
import type { SubscriptionActivationRequestResponse, UUID } from '../../api/types';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { Button, EmptyState, PermissionDeniedScreen, Skeleton } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useConfirmDialog } from '../../components/ui';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useToastStore } from '../../store/toastStore';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';

type Route = NativeStackScreenProps<MainStackParamList, 'SubscriptionActivationRequests'>['route'];

type SubscriptionActivationRequestsScreenProps = {
  spaceId?: UUID;
};

export function SubscriptionActivationRequestsScreen({
  spaceId: spaceIdProp,
}: SubscriptionActivationRequestsScreenProps) {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const spaceId = spaceIdProp ?? route.params.spaceId;
  const permissions = useSpacePermissions(spaceId);
  const showToast = useToastStore(state => state.showToast);
  const { showConfirm } = useConfirmDialog();
  const [requests, setRequests] = useState<SubscriptionActivationRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<UUID | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await subscriptionPlansApi.listPendingRequests(spaceId);
      setRequests(rows);
    } catch {
      showToast(t('meals.errors.loadFailed'));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const handleApprove = useCallback(
    (request: SubscriptionActivationRequestResponse) => {
      showConfirm({
        title: t('meals.subscriptionPlans.approveTitle'),
        message: t('meals.subscriptionPlans.approveMessage', {
          name: request.memberName,
          plan: request.planName,
        }),
        confirmLabel: t('meals.subscriptionPlans.approveAction'),
        onConfirm: () => {
          void (async () => {
            setResolvingId(request.requestId);
            try {
              await subscriptionPlansApi.approveActivationRequest(spaceId, request.requestId);
              invalidateDashboardQueries();
              showToast(t('meals.subscriptionPlans.approveSuccess'));
              await reload();
            } catch {
              showToast(t('meals.errors.actionFailed'));
            } finally {
              setResolvingId(null);
            }
          })();
        },
      });
    },
    [reload, showConfirm, showToast, spaceId, t],
  );

  const handleReject = useCallback(
    (request: SubscriptionActivationRequestResponse) => {
      showConfirm({
        title: t('meals.subscriptionPlans.rejectTitle'),
        message: t('meals.subscriptionPlans.rejectMessage', { name: request.memberName }),
        confirmLabel: t('meals.subscriptionPlans.rejectAction'),
        destructive: true,
        onConfirm: () => {
          void (async () => {
            setResolvingId(request.requestId);
            try {
              await subscriptionPlansApi.rejectActivationRequest(spaceId, request.requestId);
              invalidateDashboardQueries();
              showToast(t('meals.subscriptionPlans.rejectSuccess'));
              await reload();
            } catch {
              showToast(t('meals.errors.actionFailed'));
            } finally {
              setResolvingId(null);
            }
          })();
        },
      });
    },
    [reload, showConfirm, showToast, spaceId, t],
  );

  if (!permissions.canManageMeals) {
    return <PermissionDeniedScreen />;
  }

  return (
    <Screen scrollable contentStyle={styles.content}>
      <MealFormHero
        icon={ClipboardCheck}
        eyebrow={t('meals.subscriptionPlans.requestsEyebrow', { defaultValue: 'Approvals' })}
        heading={t('meals.subscriptionPlans.requestsTitle', {
          defaultValue: 'Activation requests',
        })}
        subheading={t('meals.subscriptionPlans.requestsSubtitle', {
          defaultValue: 'Review payment proof and activate prepaid plans.',
        })}
        accent="#B45309"
        soft={colors.warningTint}
        border="#FDE68A"
        compact
      />

      {loading ? (
        <View style={styles.skeletonWrap}>
          <Skeleton width="100%" height={140} borderRadius={18} />
          <Skeleton width="100%" height={140} borderRadius={18} />
        </View>
      ) : requests.length === 0 ? (
        <EmptyState
          Icon={ClipboardCheck}
          title={t('meals.subscriptionPlans.noPendingRequests')}
          description={t('meals.subscriptionPlans.noPendingRequestsHint', {
            defaultValue: 'New customer activation requests will appear here.',
          })}
        />
      ) : (
        requests.map(request => (
          <View key={request.requestId} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <UserRound size={18} color="#B45309" strokeWidth={2.2} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.memberName} numberOfLines={1}>
                  {request.memberName}
                </Text>
                <View style={styles.planRow}>
                  <Package size={12} color={colors.primaryDark} strokeWidth={2.2} />
                  <Text style={styles.planLine} numberOfLines={1}>
                    {t('meals.subscriptionPlans.requestedPlan', { plan: request.planName })}
                  </Text>
                </View>
              </View>
              <View style={styles.pendingChip}>
                <Text style={styles.pendingChipText}>
                  {t('meals.subscription.customer.pendingBadge')}
                </Text>
              </View>
            </View>

            {request.paymentReference ? (
              <Text style={styles.meta}>
                {t('meals.subscriptionPlans.paymentReference', {
                  reference: request.paymentReference,
                })}
              </Text>
            ) : null}
            {request.customerNotes ? (
              <Text style={styles.notes}>{request.customerNotes}</Text>
            ) : null}
            {request.paymentProofImageUrl ? (
              <Pressable
                onPress={() => setProofPreviewUrl(request.paymentProofImageUrl ?? null)}
                style={({ pressed }) => [styles.proofLink, pressed && styles.proofPressed]}
                accessibilityRole="button">
                <ImageLucide size={14} color={colors.primaryDark} strokeWidth={2.2} />
                <Text style={styles.proofLinkText}>
                  {t('meals.subscriptionPlans.viewPaymentProof')}
                </Text>
              </Pressable>
            ) : null}

            <View style={styles.actions}>
              <Button
                label={t('meals.subscriptionPlans.approveAction')}
                onPress={() => handleApprove(request)}
                loading={resolvingId === request.requestId}
                style={styles.actionButton}
              />
              <Button
                label={t('meals.subscriptionPlans.rejectAction')}
                variant="secondary"
                onPress={() => handleReject(request)}
                disabled={resolvingId === request.requestId}
                style={styles.actionButton}
              />
            </View>
          </View>
        ))
      )}

      <Modal
        visible={proofPreviewUrl != null}
        transparent
        animationType="fade"
        onRequestClose={() => setProofPreviewUrl(null)}>
        <Pressable style={styles.proofBackdrop} onPress={() => setProofPreviewUrl(null)}>
          {proofPreviewUrl ? (
            <Image
              source={{ uri: proofPreviewUrl }}
              style={styles.proofPreview}
              resizeMode="contain"
            />
          ) : null}
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  skeletonWrap: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    backgroundColor: colors.warningTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  memberName: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  planLine: {
    ...typography.caption,
    flex: 1,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pendingChip: {
    backgroundColor: '#FEF3C7',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  pendingChipText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  notes: {
    ...typography.caption,
    color: colors.muted,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  proofLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  proofPressed: {
    opacity: 0.75,
  },
  proofLinkText: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.primaryDark,
  },
  proofBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  proofPreview: {
    width: '100%',
    height: '80%',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
});
