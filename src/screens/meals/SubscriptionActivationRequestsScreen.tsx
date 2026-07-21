import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { subscriptionPlansApi } from '../../api/subscriptionPlansApi';
import type { SubscriptionActivationRequestResponse, UUID } from '../../api/types';
import { Button, PermissionDeniedScreen } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useToastStore } from '../../store/toastStore';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
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
      Alert.alert(
        t('meals.subscriptionPlans.approveTitle'),
        t('meals.subscriptionPlans.approveMessage', {
          name: request.memberName,
          plan: request.planName,
        }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('meals.subscriptionPlans.approveAction'),
            onPress: () => {
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
          },
        ],
      );
    },
    [reload, showToast, spaceId, t],
  );

  const handleReject = useCallback(
    (request: SubscriptionActivationRequestResponse) => {
      Alert.alert(
        t('meals.subscriptionPlans.rejectTitle'),
        t('meals.subscriptionPlans.rejectMessage', { name: request.memberName }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('meals.subscriptionPlans.rejectAction'),
            style: 'destructive',
            onPress: () => {
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
          },
        ],
      );
    },
    [reload, showToast, spaceId, t],
  );

  if (!permissions.canManageMeals) {
    return <PermissionDeniedScreen />;
  }

  return (
    <Screen scrollable contentStyle={styles.content}>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : requests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('meals.subscriptionPlans.noPendingRequests')}</Text>
        </View>
      ) : (
        requests.map(request => (
          <View key={request.requestId} style={styles.card}>
            <Text style={styles.memberName}>{request.memberName}</Text>
            <Text style={styles.planLine}>
              {t('meals.subscriptionPlans.requestedPlan', { plan: request.planName })}
            </Text>
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
              <Pressable onPress={() => setProofPreviewUrl(request.paymentProofImageUrl ?? null)}>
                <Text style={styles.proofLink}>{t('meals.subscriptionPlans.viewPaymentProof')}</Text>
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

      <Modal visible={proofPreviewUrl != null} transparent animationType="fade" onRequestClose={() => setProofPreviewUrl(null)}>
        <Pressable style={styles.proofBackdrop} onPress={() => setProofPreviewUrl(null)}>
          {proofPreviewUrl ? (
            <Image source={{ uri: proofPreviewUrl }} style={styles.proofPreview} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  memberName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  planLine: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  notes: {
    ...typography.caption,
    color: colors.muted,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  proofLink: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
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
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
