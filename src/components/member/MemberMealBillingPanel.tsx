import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mealBalanceApi } from '../../api/mealBalanceApi';
import { mealBillingApi } from '../../api/mealBillingApi';
import type {
  MealBillingType,
  MemberDetailsResponse,
  MemberMealBalance,
  PrepaidBalanceUnit,
  SpaceType,
} from '../../api/types';
import { MemberSubscriptionBottomSheet } from '../meals/MemberSubscriptionBottomSheet';
import { useConfirmDialog } from '../ui';
import { useMemberStore } from '../../store/memberStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import {
  isSubscriptionBilling,
  resolveMemberEffectiveMealBilling,
} from '../../utils/memberMealBilling';
import { shouldOpenSubscriptionSetupDrawer } from '../../utils/subscriptionLifecycle';
import { MemberMealBillingBottomSheet } from './MemberMealBillingBottomSheet';
import type { MemberMealBillingSelection } from './MemberMealBillingTypeSection';

type MemberMealBillingPanelProps = {
  spaceId: string;
  member: MemberDetailsResponse;
  spaceType?: SpaceType;
  canEdit?: boolean;
  onBillingChanged?: () => void;
};

export function MemberMealBillingPanel({
  spaceId,
  member,
  spaceType,
  canEdit = false,
  onBillingChanged,
}: MemberMealBillingPanelProps) {
  const { t } = useTranslation();
  const { showConfirm } = useConfirmDialog();
  const showToast = useToastStore(state => state.showToast);
  const updateMealBilling = useMemberStore(state => state.updateMealBilling);
  const storeLoading = useMemberStore(state => state.loading);

  const [selection, setSelection] = useState<MemberMealBillingSelection>(
    member.mealBillingType ?? 'DEFAULT',
  );
  const [spaceDefaultBilling, setSpaceDefaultBilling] =
    useState<MealBillingType>('PAY_PER_MEAL');
  const [prepaidBalanceUnit, setPrepaidBalanceUnit] = useState<PrepaidBalanceUnit>('MEALS');
  const [saving, setSaving] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [subscription, setSubscription] = useState<MemberMealBalance | null>(null);
  const [setupSheetVisible, setSetupSheetVisible] = useState(false);

  const effectiveBilling = resolveMemberEffectiveMealBilling(member, spaceDefaultBilling);
  const disabled = saving || storeLoading;
  const typeLabel = t(`spaces.mealBilling.types.${effectiveBilling}.label`);

  useEffect(() => {
    setSelection(member.mealBillingType ?? 'DEFAULT');
  }, [member.mealBillingType, member.memberId]);

  useEffect(() => {
    if (spaceType !== 'MESS') {
      return;
    }
    void mealBillingApi.getSettings(spaceId).then(settings => {
      setSpaceDefaultBilling(settings.billingType);
      setPrepaidBalanceUnit(settings.prepaidBalanceUnit ?? 'MEALS');
    });
  }, [spaceId, spaceType]);

  const loadSubscription = useCallback(async () => {
    if (effectiveBilling !== 'PREPAID_BALANCE') {
      setSubscription(null);
      return;
    }
    try {
      const balance = await mealBalanceApi.getBalance(spaceId, member.memberId);
      setSubscription(balance);
    } catch {
      setSubscription(null);
    }
  }, [effectiveBilling, member.memberId, spaceId]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  const persistSelection = useCallback(
    async (next: MemberMealBillingSelection) => {
      if (next === selection || disabled) {
        return false;
      }

      setSaving(true);
      const updated = await updateMealBilling(member.memberId, next);
      setSaving(false);

      if (!updated) {
        return false;
      }

      setSelection(next);
      setDrawerVisible(false);
      showToast(t('members.mealBilling.saveSuccess'));
      onBillingChanged?.();

      const nowSubscription = isSubscriptionBilling(next, spaceDefaultBilling);
      if (nowSubscription) {
        let openSetup = true;
        try {
          const balance = await mealBalanceApi.getBalance(spaceId, member.memberId);
          setSubscription(balance);
          openSetup = shouldOpenSubscriptionSetupDrawer(balance);
        } catch {
          openSetup = true;
        }
        if (openSetup) {
          // Let the billing drawer finish closing before stacking the subscription sheet.
          setTimeout(() => setSetupSheetVisible(true), 400);
        }
      } else {
        setSubscription(null);
      }

      return true;
    },
    [
      disabled,
      member.memberId,
      onBillingChanged,
      selection,
      showToast,
      spaceDefaultBilling,
      spaceId,
      t,
      updateMealBilling,
    ],
  );

  const handleSelectionChange = useCallback(
    (next: MemberMealBillingSelection) => {
      if (next === selection || disabled) {
        return;
      }

      const wasSubscription = isSubscriptionBilling(selection, spaceDefaultBilling);
      const willBeSubscription = isSubscriptionBilling(next, spaceDefaultBilling);

      if (wasSubscription && !willBeSubscription) {
        showConfirm({
          title: t('members.mealBilling.switchToPayPerMealTitle'),
          message: t('members.mealBilling.switchToPayPerMealMessage'),
          confirmLabel: t('members.mealBilling.switchToPayPerMealConfirm'),
          cancelLabel: t('common.cancel'),
          onConfirm: () => {
            void persistSelection(next);
          },
        });
        return;
      }

      void persistSelection(next);
    },
    [disabled, persistSelection, selection, showConfirm, spaceDefaultBilling, t],
  );

  if (spaceType !== 'MESS') {
    return null;
  }

  const badgeTone =
    effectiveBilling === 'PREPAID_BALANCE' ? styles.badgeSubscription : styles.badgePayPerMeal;
  const badgeTextTone =
    effectiveBilling === 'PREPAID_BALANCE'
      ? styles.badgeTextSubscription
      : styles.badgeTextPayPerMeal;

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.label}>{t('membership.details.mealBilling')}</Text>
        <View style={styles.valueRow}>
          {disabled ? (
            <ActivityIndicator color={colors.primary} size="small" style={styles.loader} />
          ) : (
            <View style={[styles.badge, badgeTone]}>
              <Text style={[styles.badgeText, badgeTextTone]} numberOfLines={1}>
                {typeLabel}
              </Text>
            </View>
          )}
          {canEdit ? (
            <Pressable
              onPress={() => setDrawerVisible(true)}
              disabled={disabled}
              hitSlop={8}
              style={({ pressed }) => [styles.changeButton, pressed && styles.changePressed]}>
              <Text style={styles.changeLabel}>{t('members.mealBilling.changeAction')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <MemberMealBillingBottomSheet
        visible={drawerVisible}
        spaceDefault={spaceDefaultBilling}
        value={selection}
        saving={disabled}
        onClose={() => setDrawerVisible(false)}
        onChange={handleSelectionChange}
      />

      <MemberSubscriptionBottomSheet
        visible={setupSheetVisible}
        spaceId={spaceId}
        memberId={member.memberId}
        action="create"
        subscription={subscription}
        unit={prepaidBalanceUnit}
        onClose={() => setSetupSheetVisible(false)}
        onSaved={() => {
          setSetupSheetVisible(false);
          void loadSubscription();
          onBillingChanged?.();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 15,
    flexShrink: 0,
  },
  valueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    minWidth: 0,
  },
  badge: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  badgeSubscription: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgePayPerMeal: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  badgeTextSubscription: {
    color: colors.primaryDark,
  },
  badgeTextPayPerMeal: {
    color: '#1D4ED8',
  },
  loader: {
    marginRight: spacing.xs,
  },
  changeButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    flexShrink: 0,
  },
  changePressed: {
    opacity: 0.75,
  },
  changeLabel: {
    ...typography.bodyStrong,
    color: colors.primary,
    fontSize: 14,
  },
});
