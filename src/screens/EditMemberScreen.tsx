import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import type { MealBillingType, MemberGender, MembershipRole, PrepaidBalanceUnit } from '../api/types';
import {
  MemberMealBillingTypeSection,
  type MemberMealBillingSelection,
} from '../components/member/MemberMealBillingTypeSection';
import { MemberSubscriptionSetupFields } from '../components/member/MemberSubscriptionSetupFields';
import {
  ProgressiveWorkflowFooter,
  progressiveSectionHighlightStyle,
} from '../components/progressive';
import { Button, FormInput, GenderPicker, HeaderBackButton, RolePicker } from '../components/ui';
import { useProgressiveSectionReview } from '../hooks/useProgressiveSectionReview';
import type { MainStackParamList } from '../navigation/types';
import { useMemberStore } from '../store/memberStore';
import { useSpaceStore } from '../store/spaceStore';
import { useToastStore } from '../store/toastStore';
import { colors, radius, spacing, typography } from '../theme';
import { isRoleAssignableInSpace } from '../utils/memberRoles';
import { isMemberGenderRequired, isSelectableMemberGender } from '../utils/memberGender';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '../utils/indianMobile';
import { findMySpaceEntry } from '../utils/spacePermissions';
import {
  buildSubscriptionPurchasePayload,
  isSubscriptionBilling,
} from '../utils/memberMealBilling';
import { defaultSubscriptionValidTillIso, parseValidTillInput } from '../utils/subscriptionLifecycle';
import { resolveProgressivePhase } from '../utils/progressivePhase';

type EditMemberNav = NativeStackNavigationProp<MainStackParamList, 'EditMember'>;
type EditMemberRoute = NativeStackScreenProps<MainStackParamList, 'EditMember'>['route'];

type FieldErrors = {
  fullName?: string;
  mobileNumber?: string;
  role?: string;
  gender?: string;
  subscriptionMealQty?: string;
  subscriptionPrice?: string;
};

export function EditMemberScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<EditMemberNav>();
  const route = useRoute<EditMemberRoute>();
  const { spaceId, memberId } = route.params;
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = findMySpaceEntry(mySpaces, spaceId)?.spaceType;

  const loadMemberDetails = useMemberStore(state => state.loadMemberDetails);
  const updateMember = useMemberStore(state => state.updateMember);
  const loading = useMemberStore(state => state.loading);
  const storeError = useMemberStore(state => state.error);
  const showToast = useToastStore(state => state.showToast);

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState<MembershipRole | null>(null);
  const [gender, setGender] = useState<MemberGender | null>(null);
  const [mealBillingSelection, setMealBillingSelection] =
    useState<MemberMealBillingSelection>('DEFAULT');
  const [spaceDefaultBilling, setSpaceDefaultBilling] = useState<MealBillingType>('PAY_PER_MEAL');
  const [prepaidBalanceUnit, setPrepaidBalanceUnit] = useState<PrepaidBalanceUnit>('MEALS');
  const [subscriptionMealQty, setSubscriptionMealQty] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [subscriptionValidTill, setSubscriptionValidTill] = useState(defaultSubscriptionValidTillIso());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const genderRequired = isMemberGenderRequired(spaceType);
  const showMealBilling = spaceType === 'MESS';
  const showSubscriptionSetup =
    showMealBilling && isSubscriptionBilling(mealBillingSelection, spaceDefaultBilling);
  const messProgressiveEnabled = showMealBilling;
  const scrollRef = useRef<ScrollView>(null);

  const {
    reviewed: mealsReviewed,
    highlighted: mealsHighlighted,
    onSectionLayout: onMealsLayout,
    onScroll: onMealsScroll,
    onScrollBeginDrag: onMealsScrollBeginDrag,
    continueToSection: continueToMeals,
    markReviewed: markMealsReviewed,
  } = useProgressiveSectionReview({
    enabled: messProgressiveEnabled,
  });

  const progressivePhase = resolveProgressivePhase({
    enabled: messProgressiveEnabled,
    prerequisiteMet: true,
    sectionReviewed: mealsReviewed,
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    onMealsScroll(contentOffset.y, layoutMeasurement.height);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.editMember'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      if (showMealBilling) {
        void mealBillingApi.getSettings(spaceId).then(settings => {
          setSpaceDefaultBilling(settings.billingType);
          setPrepaidBalanceUnit(settings.prepaidBalanceUnit ?? 'MEALS');
        });
      }

      loadMemberDetails(memberId).then(loaded => {
        if (loaded && loaded.role !== 'OWNER') {
          setFullName(loaded.fullName);
          setMobileNumber(loaded.mobileNumber);
          setRole(loaded.role);
          setGender(isSelectableMemberGender(loaded.gender) ? loaded.gender : null);
          setMealBillingSelection(loaded.mealBillingType ?? 'DEFAULT');
        }
      });
    }, [loadMemberDetails, memberId, showMealBilling, spaceId]),
  );

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

    if (!role || role === 'OWNER') {
      errors.role = t('membership.invite.roleRequired');
    } else if (!isRoleAssignableInSpace(role, spaceType)) {
      errors.role = t('membership.invite.roleNotAllowed');
    }

    if (genderRequired && !gender) {
      errors.gender = t('membership.gender.required');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    Keyboard.dismiss();

    if (!validate() || !role) {
      return;
    }

    setIsSubmitting(true);

    const updated = await updateMember(memberId, {
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      role,
      gender: gender ?? undefined,
      mealBillingType:
        showMealBilling && mealBillingSelection !== 'DEFAULT' ? mealBillingSelection : null,
    });

    setIsSubmitting(false);

    if (updated) {
      const purchase = buildSubscriptionPurchasePayload(
        subscriptionMealQty,
        subscriptionPrice,
        prepaidBalanceUnit,
      );
      if (showSubscriptionSetup && purchase) {
        try {
          await mealBalanceApi.recordPurchase(spaceId, memberId, {
            ...purchase,
            validTill: parseValidTillInput(subscriptionValidTill) ?? defaultSubscriptionValidTillIso(),
          });
        } catch {
          showToast(t('meals.errors.saveFailed'));
        }
      }
      showToast(t('membership.edit.successToast'));
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
        <View style={styles.flex}>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScrollBeginDrag={messProgressiveEnabled ? onMealsScrollBeginDrag : undefined}
            onScroll={messProgressiveEnabled ? handleScroll : undefined}>
            <Text style={styles.eyebrow}>{t('membership.edit.eyebrow')}</Text>
            <Text style={styles.heading}>{t('membership.edit.heading')}</Text>
            <Text style={styles.subheading}>{t('membership.edit.subheading')}</Text>

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

            {messProgressiveEnabled ? (
              <View
                collapsable={false}
                style={[
                  styles.mealsSection,
                  mealsHighlighted ? styles.mealsHighlight : null,
                ]}
                onLayout={event => {
                  const { y, height } = event.nativeEvent.layout;
                  onMealsLayout(y, height);
                }}>
                {showMealBilling ? (
                  <MemberMealBillingTypeSection
                    spaceDefault={spaceDefaultBilling}
                    value={mealBillingSelection}
                    onChange={value => {
                      markMealsReviewed();
                      setMealBillingSelection(value);
                    }}
                    disabled={isSubmitting || loading}
                  />
                ) : null}

                {showSubscriptionSetup ? (
                  <MemberSubscriptionSetupFields
                    unit={prepaidBalanceUnit}
                    mealQty={subscriptionMealQty}
                    subscriptionPrice={subscriptionPrice}
                    validTill={subscriptionValidTill}
                    onMealQtyChange={value => {
                      markMealsReviewed();
                      setSubscriptionMealQty(value);
                    }}
                    onSubscriptionPriceChange={value => {
                      markMealsReviewed();
                      setSubscriptionPrice(value);
                    }}
                    onValidTillChange={value => {
                      markMealsReviewed();
                      setSubscriptionValidTill(value);
                    }}
                    optionalHint
                    useSubscriptionLabels
                  />
                ) : null}
              </View>
            ) : null}

            {!messProgressiveEnabled ? (
              <View style={styles.footer}>
                <Button
                  label={t('membership.edit.save')}
                  onPress={handleSave}
                  loading={isSubmitting || loading}
                  disabled={isSubmitting || loading}
                />
                <Button
                  label={t('common.cancel')}
                  variant="ghost"
                  onPress={() => navigation.goBack()}
                  disabled={isSubmitting || loading}
                  style={styles.cancelButton}
                />
              </View>
            ) : null}
          </ScrollView>

          {messProgressiveEnabled ? (
            <ProgressiveWorkflowFooter
              phase={progressivePhase}
              stepLabel={t('progressiveWorkflow.stepOf', {
                current: progressivePhase === 'continue' ? 1 : 2,
                total: 2,
              })}
              progressLine={
                progressivePhase === 'continue'
                  ? t('progressiveWorkflow.member.progressIdentityNext')
                  : t('progressiveWorkflow.member.progressReady')
              }
              continueEyebrow={t('progressiveWorkflow.nextStep')}
              continueTitle={t('progressiveWorkflow.member.reviewMealsTitle')}
              continueHint={t('progressiveWorkflow.member.reviewMealsHint')}
              continueLabel={t('progressiveWorkflow.member.continueToMeals')}
              onContinue={() => continueToMeals(scrollRef)}
              primaryAction={{
                label: t('membership.edit.save'),
                onPress: handleSave,
                loading: isSubmitting || loading,
                disabled: isSubmitting || loading,
              }}
              secondaryAction={{
                label: t('common.cancel'),
                onPress: () => navigation.goBack(),
                disabled: isSubmitting || loading,
              }}
            />
          ) : null}
        </View>
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
    marginBottom: spacing.xxl,
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
  mealsSection: {
    marginTop: spacing.sm,
  },
  mealsHighlight: {
    ...progressiveSectionHighlightStyle,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.sm,
  },
  footer: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.xs,
  },
});
