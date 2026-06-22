import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealBalanceApi } from '../api/mealBalanceApi';
import { mealBillingApi } from '../api/mealBillingApi';
import type { MemberMealBalance } from '../api/types';
import { MemberSubscriptionSetupFields } from '../components/member/MemberSubscriptionSetupFields';
import { Button, HeaderBackButton } from '../components/ui';
import type { MainStackParamList } from '../navigation/types';
import { useToastStore } from '../store/toastStore';
import { colors, radius, spacing, typography } from '../theme';
import { formatComboPrice } from '../utils/comboPrice';
import { buildSubscriptionPurchasePayload } from '../utils/memberMealBilling';
import {
  defaultRenewalValidTillIso,
  defaultSubscriptionValidTillIso,
  formatSubscriptionDate,
  getSubscriptionLifecycleStatus,
  parseValidTillInput,
  resolveSubscriptionValidTill,
} from '../utils/subscriptionLifecycle';

type Nav = NativeStackNavigationProp<MainStackParamList, 'MemberSubscription'>;
type Route = NativeStackScreenProps<MainStackParamList, 'MemberSubscription'>['route'];

type FieldErrors = {
  subscriptionMealQty?: string;
  subscriptionPrice?: string;
  validTill?: string;
};

export function MemberSubscriptionScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, memberId, action } = route.params;
  const showToast = useToastStore(state => state.showToast);

  const [prepaidBalanceUnit, setPrepaidBalanceUnit] = useState<'MEALS' | 'CURRENCY'>('MEALS');
  const [currentSubscription, setCurrentSubscription] = useState<MemberMealBalance | null>(null);
  const [mealQty, setMealQty] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [validTill, setValidTill] = useState(defaultSubscriptionValidTillIso());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCreate = action === 'create';
  const isRenew = action === 'renew';
  const titleKey = isCreate
    ? 'meals.subscription.createTitle'
    : isRenew
      ? 'meals.subscription.renewTitle'
      : 'meals.subscription.updateTitle';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t(titleKey),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [i18n.language, isCreate, isRenew, navigation, t, titleKey]);

  const loadExisting = useCallback(async () => {
    try {
      const [billing, balance] = await Promise.all([
        mealBillingApi.getSettings(spaceId),
        mealBalanceApi.getBalance(spaceId, memberId),
      ]);
      setPrepaidBalanceUnit(billing.prepaidBalanceUnit ?? 'MEALS');
      setCurrentSubscription(balance);

      const status = getSubscriptionLifecycleStatus(balance);
      if (isCreate || status === 'none') {
        setMealQty('');
        setSubscriptionPrice('');
        setValidTill(defaultSubscriptionValidTillIso());
        return;
      }

      if (isRenew) {
        setMealQty(
          balance.lastPurchaseMeals != null ? String(Math.round(balance.lastPurchaseMeals)) : '',
        );
        const paid = balance.currentAmountPaid ?? balance.lastPurchasePaidAmount;
        setSubscriptionPrice(paid != null ? String(paid) : '');
        setValidTill(defaultRenewalValidTillIso());
        return;
      }

      const planMeals = balance.mealsIncluded ?? balance.lastPurchaseMeals;
      if (planMeals != null) {
        setMealQty(String(Math.round(planMeals)));
      }
      const paid = balance.currentAmountPaid ?? balance.lastPurchasePaidAmount;
      if (paid != null) {
        setSubscriptionPrice(String(paid));
      }
      const existingValidTill = resolveSubscriptionValidTill(balance);
      setValidTill(existingValidTill ?? defaultSubscriptionValidTillIso());
    } catch {
      setCurrentSubscription(null);
    }
  }, [isCreate, isRenew, memberId, spaceId]);

  useFocusEffect(
    useCallback(() => {
      void loadExisting();
    }, [loadExisting]),
  );

  function validate(): boolean {
    const nextErrors: FieldErrors = {};
    const unit = prepaidBalanceUnit;

    if (unit === 'MEALS') {
      const qty = Number(mealQty.trim());
      if (!Number.isFinite(qty) || qty <= 0) {
        nextErrors.subscriptionMealQty = t('members.subscriptionSetup.mealQtyRequired');
      }
    }

    const price = Number(subscriptionPrice.trim());
    if (!Number.isFinite(price) || price <= 0) {
      nextErrors.subscriptionPrice = t('members.subscriptionSetup.priceRequired');
    }

    if (!parseValidTillInput(validTill)) {
      nextErrors.validTill = t('meals.subscription.validTillRequired');
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    Keyboard.dismiss();
    if (!validate()) {
      return;
    }

    const purchase = buildSubscriptionPurchasePayload(
      mealQty,
      subscriptionPrice,
      prepaidBalanceUnit,
    );
    const parsedValidTill = parseValidTillInput(validTill);
    if (!purchase || !parsedValidTill) {
      return;
    }

    setIsSubmitting(true);
    try {
      await mealBalanceApi.recordPurchase(spaceId, memberId, {
        ...purchase,
        validTill: parsedValidTill,
      });
      showToast(t('meals.subscription.saveSuccess'));
      navigation.goBack();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const currencyCode = currentSubscription?.currencyCode ?? 'INR';
  const showCurrentCard = !isCreate && currentSubscription?.lastPurchaseAt;
  const lifecycleStatus = getSubscriptionLifecycleStatus(currentSubscription);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          {showCurrentCard && lifecycleStatus !== 'none' ? (
            <View style={styles.currentCard}>
              <Text style={styles.currentTitle}>{t('meals.subscription.currentTitle')}</Text>
              {lifecycleStatus === 'expired' ? (
                <>
                  <Text style={styles.expiredHero}>{t('meals.subscription.expiredTitle')}</Text>
                  <View style={styles.currentMetaRow}>
                    <View style={styles.currentMetaItem}>
                      <Text style={styles.currentMetaLabel}>
                        {t('meals.subscription.expiredLastPlan')}
                      </Text>
                      <Text style={styles.currentMetaValue}>
                        {currentSubscription?.lastPurchaseMeals != null
                          ? t('dashboard.financial.mealsCount', {
                              count: Math.round(currentSubscription.lastPurchaseMeals),
                            })
                          : '—'}
                      </Text>
                    </View>
                    <View style={styles.currentMetaItem}>
                      <Text style={styles.currentMetaLabel}>
                        {t('meals.subscription.expiredOn')}
                      </Text>
                      <Text style={styles.currentMetaValue}>
                        {formatSubscriptionDate(
                          resolveSubscriptionValidTill(currentSubscription),
                          i18n.language,
                        )}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.currentHero}>
                    {currentSubscription?.mealsRemaining != null
                      ? t('meals.subscription.mealsRemainingLine', {
                          count: Math.round(currentSubscription.mealsRemaining),
                        })
                      : '—'}
                  </Text>
                  <View style={styles.currentMetaRow}>
                    <View style={styles.currentMetaItem}>
                      <Text style={styles.currentMetaLabel}>
                        {t('meals.subscription.amountPaidLabel')}
                      </Text>
                      <Text style={styles.currentMetaValue}>
                        {formatComboPrice(
                          currentSubscription?.currentAmountPaid ??
                            currentSubscription?.lastPurchasePaidAmount ??
                            null,
                          currencyCode,
                        ) ?? '—'}
                      </Text>
                    </View>
                    <View style={styles.currentMetaItem}>
                      <Text style={styles.currentMetaLabel}>
                        {t('meals.subscription.validTillLabel')}
                      </Text>
                      <Text style={styles.currentMetaValue}>
                        {formatSubscriptionDate(
                          resolveSubscriptionValidTill(currentSubscription),
                          i18n.language,
                        )}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          ) : null}

          {showCurrentCard ? <View style={styles.divider} /> : null}

          <Text style={styles.sectionTitle}>{t(titleKey)}</Text>
          <Text style={styles.subtitle}>
            {t(
              isCreate
                ? 'meals.subscription.createSubtitle'
                : isRenew
                  ? 'meals.subscription.renewSubtitle'
                  : 'meals.subscription.updateSubtitle',
            )}
          </Text>

          <MemberSubscriptionSetupFields
            unit={prepaidBalanceUnit}
            mealQty={mealQty}
            subscriptionPrice={subscriptionPrice}
            validTill={validTill}
            onMealQtyChange={setMealQty}
            onSubscriptionPriceChange={setSubscriptionPrice}
            onValidTillChange={setValidTill}
            mealQtyError={fieldErrors.subscriptionMealQty}
            subscriptionPriceError={fieldErrors.subscriptionPrice}
            validTillError={fieldErrors.validTill}
            hideHeader
            useSubscriptionLabels
          />

          <Button
            label={t('common.save')}
            onPress={() => void handleSave()}
            loading={isSubmitting}
          />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  currentCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  currentTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
  },
  currentHero: {
    ...typography.h3,
    color: colors.primaryDark,
    fontSize: 20,
  },
  expiredHero: {
    ...typography.h3,
    color: '#B91C1C',
    fontSize: 18,
  },
  currentMetaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  currentMetaItem: {
    flex: 1,
    gap: 2,
  },
  currentMetaLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    fontSize: 11,
  },
  currentMetaValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    lineHeight: 20,
    marginTop: -spacing.xs,
  },
});
