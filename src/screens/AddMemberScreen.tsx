import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { enrollMemberInFullMeals } from '../api/mealsApi';
import { mealBalanceApi } from '../api/mealBalanceApi';
import { mealBillingApi } from '../api/mealBillingApi';
import type { MealBillingType, MemberGender, MembershipRole, PrepaidBalanceUnit } from '../api/types';
import {
  MemberMealBillingTypeSection,
  type MemberMealBillingSelection,
} from '../components/member/MemberMealBillingTypeSection';
import { MemberSubscriptionSetupFields } from '../components/member/MemberSubscriptionSetupFields';
import { Button, FormInput, GenderPicker, HeaderBackButton, RolePicker } from '../components/ui';
import type { MainStackParamList } from '../navigation/types';
import { useMemberStore } from '../store/memberStore';
import { useSpaceStore } from '../store/spaceStore';
import { useToastStore } from '../store/toastStore';
import { colors, spacing, typography } from '../theme';
import { defaultRoleForSpaceType } from '../utils/memberRoles';
import { isMemberGenderRequired } from '../utils/memberGender';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '../utils/indianMobile';
import { findMySpaceEntry } from '../utils/spacePermissions';
import {
  buildSubscriptionPurchasePayload,
  isSubscriptionBilling,
} from '../utils/memberMealBilling';
import { defaultSubscriptionValidTillIso, parseValidTillInput } from '../utils/subscriptionLifecycle';

type AddMemberNav = NativeStackNavigationProp<MainStackParamList, 'AddMember'>;
type AddMemberRoute = NativeStackScreenProps<MainStackParamList, 'AddMember'>['route'];

type FieldErrors = {
  fullName?: string;
  mobileNumber?: string;
  role?: string;
  gender?: string;
  subscriptionMealQty?: string;
  subscriptionPrice?: string;
};

export function AddMemberScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<AddMemberNav>();
  const route = useRoute<AddMemberRoute>();
  const { spaceId } = route.params;
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = findMySpaceEntry(mySpaces, spaceId)?.spaceType;
  const addMember = useMemberStore(state => state.addMember);
  const loading = useMemberStore(state => state.loading);
  const storeError = useMemberStore(state => state.error);
  const showToast = useToastStore(state => state.showToast);

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState<MembershipRole | null>(() =>
    defaultRoleForSpaceType(spaceType),
  );
  const [gender, setGender] = useState<MemberGender | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [mealAccessEnabled, setMealAccessEnabled] = useState(true);
  const [mealBillingSelection, setMealBillingSelection] =
    useState<MemberMealBillingSelection>('DEFAULT');
  const [spaceDefaultBilling, setSpaceDefaultBilling] = useState<MealBillingType>('PAY_PER_MEAL');
  const [prepaidBalanceUnit, setPrepaidBalanceUnit] = useState<PrepaidBalanceUnit>('MEALS');
  const [subscriptionMealQty, setSubscriptionMealQty] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [subscriptionValidTill, setSubscriptionValidTill] = useState(defaultSubscriptionValidTillIso());

  const genderRequired = isMemberGenderRequired(spaceType);

  const showMealAccess = spaceType === 'MESS' && role === 'CUSTOMER';
  const showMealBilling = showMealAccess;

  useEffect(() => {
    if (!showMealBilling) {
      return;
    }
    void mealBillingApi.getSettings(spaceId).then(settings => {
      setSpaceDefaultBilling(settings.billingType);
      setPrepaidBalanceUnit(settings.prepaidBalanceUnit ?? 'MEALS');
    });
  }, [showMealBilling, spaceId]);

  const showSubscriptionSetup =
    showMealBilling && isSubscriptionBilling(mealBillingSelection, spaceDefaultBilling);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.addMember'),
      headerLeft: () => <HeaderBackButton />,
      headerBackVisible: false,
    });
  }, [navigation, t, i18n.language]);

  function validate(): boolean {
    const errors: FieldErrors = {};
    const digits = normalizeIndianMobileDigits(mobileNumber);

    if (!fullName.trim()) {
      errors.fullName = t('membership.add.fullNameRequired');
    }

    if (!mobileNumber.trim()) {
      errors.mobileNumber = t('membership.invite.mobileRequired');
    } else if (!isValidIndianMobile(digits)) {
      errors.mobileNumber = t('membership.invite.mobileInvalid');
    }

    if (!role) {
      errors.role = t('membership.invite.roleRequired');
    }

    if (genderRequired && !gender) {
      errors.gender = t('membership.gender.required');
    }

    if (showSubscriptionSetup) {
      const purchase = buildSubscriptionPurchasePayload(
        subscriptionMealQty,
        subscriptionPrice,
        prepaidBalanceUnit,
      );
      if (!purchase) {
        if (prepaidBalanceUnit === 'MEALS') {
          errors.subscriptionMealQty = t('members.subscriptionSetup.mealQtyRequired');
        } else {
          errors.subscriptionPrice = t('members.subscriptionSetup.priceRequired');
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    Keyboard.dismiss();

    if (!validate()) {
      return;
    }

    console.log('[AddMember] submit');
    const member = await addMember({
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      role: role!,
      gender: gender ?? undefined,
      mealBillingType:
        showMealBilling && mealBillingSelection !== 'DEFAULT' ? mealBillingSelection : null,
    });

    if (member) {
      console.log('[AddMember] success', member.memberId);
      if (showMealAccess && mealAccessEnabled) {
        try {
          await enrollMemberInFullMeals(spaceId, member.memberId);
        } catch {
          showToast(t('meals.errors.mealAccessFailed'));
        }
      }
      if (showSubscriptionSetup) {
        const purchase = buildSubscriptionPurchasePayload(
          subscriptionMealQty,
          subscriptionPrice,
          prepaidBalanceUnit,
        );
        if (purchase) {
          try {
            await mealBalanceApi.recordPurchase(spaceId, member.memberId, {
            ...purchase,
            validTill: parseValidTillInput(subscriptionValidTill) ?? defaultSubscriptionValidTillIso(),
          });
          } catch {
            showToast(t('meals.errors.saveFailed'));
          }
        }
      }
      showToast(t('membership.add.successToast'));
      navigation.goBack();
      return;
    }

    const err = useMemberStore.getState().error;
    if (err?.toLowerCase().includes('mobile number')) {
      setFieldErrors({ mobileNumber: err });
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>{t('membership.add.eyebrow')}</Text>
          <Text style={styles.heading}>{t('membership.add.heading')}</Text>
          <Text style={styles.subheading}>{t('membership.add.subheading')}</Text>
          <View style={styles.inviteInsteadRow}>
            <Text style={styles.inviteInsteadText}>
              {t('membership.add.inviteInstead')}{' '}
            </Text>
            <Pressable
              onPress={() => navigation.navigate('InviteMembers', { spaceId })}
              hitSlop={8}>
              <Text style={styles.inviteInsteadLink}>
                {t('membership.add.inviteInsteadAction')}
              </Text>
            </Pressable>
          </View>

          {storeError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{storeError}</Text>
            </View>
          ) : null}

          <FormInput
            label={t('membership.add.fullNameLabel')}
            placeholder={t('membership.add.fullNamePlaceholder')}
            value={fullName}
            onChangeText={text => {
              setFullName(text);
              if (fieldErrors.fullName) {
                setFieldErrors(prev => ({ ...prev, fullName: undefined }));
              }
            }}
            error={fieldErrors.fullName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <FormInput
            label={t('membership.invite.mobileLabel')}
            placeholder={t('membership.invite.mobilePlaceholder')}
            value={mobileNumber}
            onChangeText={text => {
              setMobileNumber(text);
              if (fieldErrors.mobileNumber) {
                setFieldErrors(prev => ({ ...prev, mobileNumber: undefined }));
              }
            }}
            error={fieldErrors.mobileNumber}
            keyboardType="phone-pad"
            returnKeyType="done"
            maxLength={15}
          />

          <RolePicker
            value={role}
            spaceType={spaceType}
            onChange={selected => {
              setRole(selected);
              if (fieldErrors.role) {
                setFieldErrors(prev => ({ ...prev, role: undefined }));
              }
            }}
            error={fieldErrors.role}
          />

          {showMealBilling ? (
            <MemberMealBillingTypeSection
              spaceDefault={spaceDefaultBilling}
              value={mealBillingSelection}
              onChange={setMealBillingSelection}
              disabled={loading}
            />
          ) : null}

          {showSubscriptionSetup ? (
            <MemberSubscriptionSetupFields
              unit={prepaidBalanceUnit}
              mealQty={subscriptionMealQty}
              subscriptionPrice={subscriptionPrice}
              validTill={subscriptionValidTill}
              onMealQtyChange={value => {
                setSubscriptionMealQty(value);
                if (fieldErrors.subscriptionMealQty) {
                  setFieldErrors(prev => ({ ...prev, subscriptionMealQty: undefined }));
                }
              }}
              onSubscriptionPriceChange={value => {
                setSubscriptionPrice(value);
                if (fieldErrors.subscriptionPrice) {
                  setFieldErrors(prev => ({ ...prev, subscriptionPrice: undefined }));
                }
              }}
              onValidTillChange={setSubscriptionValidTill}
              mealQtyError={fieldErrors.subscriptionMealQty}
              subscriptionPriceError={fieldErrors.subscriptionPrice}
              useSubscriptionLabels
            />
          ) : null}

          <GenderPicker
            value={gender}
            onChange={selected => {
              setGender(selected);
              if (fieldErrors.gender) {
                setFieldErrors(prev => ({ ...prev, gender: undefined }));
              }
            }}
            error={fieldErrors.gender}
            required={genderRequired}
          />

          {showMealAccess ? (
            <View style={styles.mealAccessRow}>
              <View style={styles.mealAccessText}>
                <Text style={styles.mealAccessLabel}>{t('meals.mealAccess.label')}</Text>
                <Text style={styles.mealAccessHint}>{t('meals.mealAccess.addCustomerHint')}</Text>
              </View>
              <Switch value={mealAccessEnabled} onValueChange={setMealAccessEnabled} />
            </View>
          ) : null}

          <View style={styles.footer}>
            <Button
              label={t('membership.add.save')}
              onPress={handleSave}
              loading={loading}
              disabled={loading}
            />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={styles.cancelButton}
            />
          </View>
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
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xxl,
    paddingBottom: spacing.section,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.sm,
  },
  heading: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subheading: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  inviteInsteadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  inviteInsteadText: {
    ...typography.body,
    color: colors.muted,
  },
  inviteInsteadLink: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    ...typography.body,
    color: '#DC2626',
  },
  mealAccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  mealAccessText: { flex: 1, gap: spacing.xs },
  mealAccessLabel: { ...typography.bodyStrong },
  mealAccessHint: { ...typography.caption, color: colors.muted },
  footer: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.xs,
  },
});
