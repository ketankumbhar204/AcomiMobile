import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealBalanceApi } from '../../api/mealBalanceApi';
import type { MemberDetailsResponse, MemberMealBalance, UUID } from '../../api/types';
import type { MainStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';
import { Button } from '../ui';
import { MemberMealActivityMonthNav } from '../meals/MemberMealActivityMonthNav';
import { MemberMealSubscriptionActivityTimeline } from '../meals/MemberMealSubscriptionActivityTimeline';
import { MemberSubscriptionSummaryCard } from './MemberSubscriptionSummaryCard';

type MemberSubscriptionTabProps = {
  spaceId: UUID;
  member: MemberDetailsResponse;
  canManage: boolean;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

function currentMonthIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthPart] = month.split('-').map(Number);
  const date = new Date(year, monthPart - 1 + delta, 1);
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${nextMonth}`;
}

function resolveSubscriptionAction(
  subscription: MemberMealBalance | null,
): 'create' | 'edit' | 'renew' {
  if (!subscription?.lastPurchaseAt) {
    return 'create';
  }
  const now = Date.now();
  const validTill = subscription.validTill ? new Date(subscription.validTill).getTime() : null;
  const remaining = subscription.mealsRemaining ?? subscription.balance ?? 0;
  const expired = validTill != null && validTill < now;
  if (expired || remaining <= 0) {
    return 'renew';
  }
  return 'edit';
}

export function MemberSubscriptionTab({ spaceId, member, canManage }: MemberSubscriptionTabProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<MemberMealBalance | null>(null);
  const [month, setMonth] = useState(currentMonthIso);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const row = await mealBalanceApi.getBalance(spaceId, member.memberId);
      setSubscription(row);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [member.memberId, spaceId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    void load();
  }, [load, reloadToken]);

  const action = useMemo(() => resolveSubscriptionAction(subscription), [subscription]);

  const openSubscriptionFlow = () => {
    navigation.navigate('MemberSubscription', {
      spaceId,
      memberId: member.memberId,
      action,
    });
  };

  const actionLabelKey =
    action === 'create'
      ? 'meals.subscription.createAction'
      : action === 'renew'
        ? 'meals.subscription.renewAction'
        : 'meals.subscription.editAction';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <MemberSubscriptionSummaryCard subscription={subscription} loading={loading} />

      {canManage ? (
        <Button label={t(actionLabelKey)} onPress={openSubscriptionFlow} />
      ) : null}

      <MemberMealActivityMonthNav
        month={month}
        onPreviousMonth={() => setMonth(value => shiftMonth(value, -1))}
        onNextMonth={() => setMonth(value => shiftMonth(value, 1))}
      />

      <MemberMealSubscriptionActivityTimeline
        spaceId={spaceId}
        memberId={member.memberId}
        month={month}
        unit={subscription?.unit}
        currencyCode={subscription?.currencyCode ?? 'INR'}
        reloadToken={reloadToken}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
