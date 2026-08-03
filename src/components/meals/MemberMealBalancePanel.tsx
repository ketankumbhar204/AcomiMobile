import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealBalanceApi } from '../../api/mealBalanceApi';
import type { MealBillingType, MemberMealBalance, PrepaidBalanceUnit, UUID } from '../../api/types';
import type { MainStackParamList } from '../../navigation/types';
import { useConfirmDialog, Button } from '../ui';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import {
  formatSubscriptionDate,
  getSubscriptionLifecycleStatus,
  resolveSubscriptionValidTill,
  type SubscriptionFlowAction,
  type SubscriptionLifecycleStatus,
} from '../../utils/subscriptionLifecycle';
import { MemberSubscriptionBottomSheet } from './MemberSubscriptionBottomSheet';

type MemberMealBalancePanelProps = {
  spaceId: UUID;
  memberId: UUID;
  effectiveMealBillingType?: MealBillingType;
  canManage: boolean;
  onPurchased?: () => void;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

function formatMealsCount(
  amount: number | null | undefined,
  unit: PrepaidBalanceUnit,
  currencyCode: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (amount == null) {
    return '—';
  }
  if (unit === 'MEALS') {
    return t('dashboard.financial.mealsCount', { count: Math.round(amount) });
  }
  return formatComboPrice(amount, currencyCode) ?? '—';
}

function StatusBadge({ status }: { status: SubscriptionLifecycleStatus }) {
  const { t } = useTranslation();
  if (status === 'none' || status === 'ended') {
    return null;
  }
  const labelKey =
    status === 'active'
      ? 'meals.subscription.statusActive'
      : status === 'expiring_soon'
        ? 'meals.subscription.statusExpiringSoon'
        : 'meals.subscription.statusExpired';
  const toneStyle =
    status === 'active'
      ? styles.statusActive
      : status === 'expiring_soon'
        ? styles.statusExpiring
        : styles.statusExpiredBadge;
  const textStyle =
    status === 'active'
      ? styles.statusActiveText
      : status === 'expiring_soon'
        ? styles.statusExpiringText
        : styles.statusExpiredText;

  return (
    <View style={[styles.statusBadge, toneStyle]}>
      <Text style={[styles.statusText, textStyle]}>
        {t('meals.subscription.statusLabel')}: {t(labelKey)}
      </Text>
    </View>
  );
}

function ActionRowButton({
  label,
  onPress,
  destructive = false,
  style,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowButton,
        destructive ? styles.rowButtonDestructive : styles.rowButtonPrimary,
        pressed && styles.rowButtonPressed,
        style,
      ]}>
      <Text
        style={[
          styles.rowButtonLabel,
          destructive ? styles.rowButtonDestructiveLabel : styles.rowButtonPrimaryLabel,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MemberMealBalancePanel({
  spaceId,
  memberId,
  effectiveMealBillingType,
  canManage,
  onPurchased,
}: MemberMealBalancePanelProps) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { showConfirm } = useConfirmDialog();
  const showToast = useToastStore(state => state.showToast);
  const billingType = effectiveMealBillingType ?? 'PAY_PER_MEAL';
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<MemberMealBalance | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetAction, setSheetAction] = useState<SubscriptionFlowAction>('create');
  const [ending, setEnding] = useState(false);

  const load = useCallback(async () => {
    if (billingType !== 'PREPAID_BALANCE') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const row = await mealBalanceApi.getBalance(spaceId, memberId);
      setSubscription(row);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [billingType, memberId, spaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      void load().then(() => onPurchased?.());
    });
    return unsubscribe;
  }, [load, navigation, onPurchased]);

  const lifecycleStatus = useMemo(
    () => getSubscriptionLifecycleStatus(subscription),
    [subscription],
  );

  const openSheet = (action: SubscriptionFlowAction) => {
    setSheetAction(action);
    setSheetVisible(true);
  };

  const openHistory = () => {
    navigation.navigate('MemberSubscriptionHistory', { spaceId, memberId });
  };

  const handleEndSubscription = () => {
    showConfirm({
      title: t('meals.subscription.endConfirmTitle'),
      message: t('meals.subscription.endConfirmMessageModelB'),
      confirmLabel: t('meals.subscription.endConfirmAction'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        setEnding(true);
        try {
          const updated = await mealBalanceApi.endSubscription(spaceId, memberId);
          setSubscription(updated);
          showToast(t('meals.subscription.endSuccess'));
          onPurchased?.();
        } catch {
          showToast(t('meals.errors.saveFailed'));
        } finally {
          setEnding(false);
        }
      },
    });
  };

  const handleSaved = () => {
    void load().then(() => onPurchased?.());
  };

  if (billingType !== 'PREPAID_BALANCE') {
    return null;
  }

  const unit = subscription?.unit ?? 'MEALS';
  const currencyCode = subscription?.currencyCode ?? 'INR';
  const validTill = resolveSubscriptionValidTill(subscription);
  const amountPaid =
    formatComboPrice(
      subscription?.currentAmountPaid ?? null,
      currencyCode,
    ) ?? '—';
  const lastPlanMeals = subscription?.mealsIncluded ?? subscription?.lastPurchaseMeals;
  const lastPlanAmount =
    formatComboPrice(subscription?.currentAmountPaid ?? null, currencyCode) ?? '—';
  const mealsRemaining = subscription?.mealsRemaining ?? subscription?.balance;
  const remainingLabel =
    unit === 'MEALS' && mealsRemaining != null
      ? t('meals.subscription.mealsRemainingLine', { count: Math.round(mealsRemaining) })
      : formatMealsCount(mealsRemaining, unit, currencyCode, t);

  const showHistoryLink = lifecycleStatus !== 'none';

  return (
    <>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {lifecycleStatus === 'ended' || lifecycleStatus === 'none'
              ? t('meals.subscription.noActiveTitle')
              : t('meals.subscription.currentTitle')}
          </Text>
          <View style={styles.titleActions}>
            {showHistoryLink ? (
              <Pressable onPress={openHistory} hitSlop={8}>
                <Text style={styles.historyLink}>{t('meals.subscription.historyAction')}</Text>
              </Pressable>
            ) : null}
            {!loading && lifecycleStatus !== 'none' && lifecycleStatus !== 'ended' ? (
              <StatusBadge status={lifecycleStatus} />
            ) : null}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : lifecycleStatus === 'none' ? (
          <>
            <Text style={styles.empty}>{t('meals.subscription.noActiveDescription')}</Text>
            {canManage ? (
              <Button
                label={t('meals.subscription.createAction')}
                variant="secondary"
                onPress={() => openSheet('create')}
                style={styles.fullAction}
              />
            ) : null}
          </>
        ) : lifecycleStatus === 'ended' ? (
          <>
            <Text style={styles.empty}>{t('meals.subscription.noActiveDescription')}</Text>
            <View style={styles.lastBlock}>
              <Text style={styles.lastBlockTitle}>{t('meals.subscription.lastSubscription')}</Text>
              <Text style={styles.lastBlockValue}>
                {formatMealsCount(lastPlanMeals, unit, currencyCode, t)}
              </Text>
              <Text style={styles.lastBlockValue}>{lastPlanAmount}</Text>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('meals.subscription.endedOn')}</Text>
                <Text style={styles.metaValue}>
                  {formatSubscriptionDate(subscription?.endedAt, i18n.language)}
                </Text>
              </View>
            </View>
            {canManage ? (
              <Button
                label={t('meals.subscription.createAction')}
                variant="secondary"
                onPress={() => openSheet('create')}
                style={styles.fullAction}
              />
            ) : null}
          </>
        ) : lifecycleStatus === 'expired' ? (
          <>
            <Text style={styles.expiredHero}>{t('meals.subscription.expiredTitle')}</Text>
            <Text style={styles.hero}>{remainingLabel}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('meals.subscription.mealsUsed')}</Text>
                <Text style={styles.metaValue}>
                  {formatMealsCount(subscription?.mealsUsed, unit, currencyCode, t)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('meals.subscription.amountPaidLabel')}</Text>
                <Text style={styles.metaValue}>{amountPaid}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('meals.subscription.expiredOn')}</Text>
                <Text style={styles.metaValue}>
                  {formatSubscriptionDate(validTill, i18n.language)}
                </Text>
              </View>
            </View>
            {canManage ? (
              <View style={styles.actionRow}>
                <ActionRowButton
                  label={t('meals.subscription.addMealsActionShort')}
                  onPress={() => openSheet('add')}
                  style={styles.actionRowItem}
                />
                <ActionRowButton
                  label={t('meals.subscription.endAction')}
                  onPress={handleEndSubscription}
                  destructive
                  style={styles.actionRowItem}
                />
              </View>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.hero}>{remainingLabel}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('meals.subscription.mealsUsed')}</Text>
                <Text style={styles.metaValue}>
                  {formatMealsCount(subscription?.mealsUsed, unit, currencyCode, t)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('meals.subscription.amountPaidLabel')}</Text>
                <Text style={styles.metaValue}>{amountPaid}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('meals.subscription.validTillLabel')}</Text>
                <Text style={styles.metaValue}>
                  {formatSubscriptionDate(validTill, i18n.language)}
                </Text>
              </View>
            </View>
            {canManage ? (
              <View style={styles.actionRow}>
                <ActionRowButton
                  label={t('meals.subscription.addMealsActionShort')}
                  onPress={() => openSheet('add')}
                  style={styles.actionRowItem}
                />
                <ActionRowButton
                  label={t('meals.subscription.endAction')}
                  onPress={handleEndSubscription}
                  destructive
                  style={styles.actionRowItem}
                />
              </View>
            ) : null}
            {ending ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : null}
          </>
        )}
      </View>

      <MemberSubscriptionBottomSheet
        visible={sheetVisible}
        spaceId={spaceId}
        memberId={memberId}
        action={sheetAction}
        subscription={subscription}
        unit={unit}
        onClose={() => setSheetVisible(false)}
        onSaved={handleSaved}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  historyLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: colors.successTint,
    borderColor: '#A7F3D0',
  },
  statusExpiring: {
    backgroundColor: colors.warningTint,
    borderColor: '#FDE68A',
  },
  statusExpiredBadge: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusActiveText: {
    color: colors.primaryDark,
  },
  statusExpiringText: {
    color: '#B45309',
  },
  statusExpiredText: {
    color: '#B91C1C',
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 10,
  },
  loader: {
    alignSelf: 'center',
    marginVertical: spacing.xxs,
  },
  empty: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
  hero: {
    ...typography.h3,
    color: colors.primaryDark,
    fontSize: 20,
  },
  expiredHero: {
    ...typography.h3,
    color: '#B91C1C',
    fontSize: 18,
  },
  lastBlock: {
    gap: 2,
    paddingTop: spacing.xxs,
  },
  lastBlockTitle: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    fontSize: 11,
  },
  lastBlockValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    fontSize: 11,
  },
  metaValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  actionRowItem: {
    flex: 1,
  },
  fullAction: {
    marginTop: spacing.xxs,
  },
  rowButton: {
    minHeight: 44,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rowButtonPrimary: {
    backgroundColor: colors.lightGreen,
    borderColor: `${colors.primary}33`,
  },
  rowButtonDestructive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  rowButtonPressed: {
    opacity: 0.92,
  },
  rowButtonLabel: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  rowButtonPrimaryLabel: {
    color: colors.primaryDark,
  },
  rowButtonDestructiveLabel: {
    color: '#B91C1C',
  },
});
