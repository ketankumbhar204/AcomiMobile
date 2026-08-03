import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import { Phone, User, UserPlus } from 'lucide-react-native';
import { enrollMemberInFullMeals } from '../api/mealsApi';
import { mealBalanceApi } from '../api/mealBalanceApi';
import { mealBillingApi } from '../api/mealBillingApi';
import { memberApi } from '../api/memberApi';
import type {
  MealBillingType,
  MemberGender,
  MembershipRole,
  PrepaidBalanceUnit,
  UUID,
} from '../api/types';
import {
  MemberMealBillingTypeSection,
  type MemberMealBillingSelection,
} from '../components/member/MemberMealBillingTypeSection';
import { MemberSubscriptionSetupFields } from '../components/member/MemberSubscriptionSetupFields';
import {
  ProgressiveWorkflowFooter,
  StickyFormActions,
  progressiveSectionHighlightStyle,
} from '../components/progressive';
import { FormInput, GenderPicker, HeaderBackButton, RolePicker } from '../components/ui';
import {
  MemberPickerStep,
  type MemberPickerMode,
} from '../features/occupancy/OccupancyWizard/steps/MemberPickerStep';
import { useProgressiveSectionReview } from '../hooks/useProgressiveSectionReview';
import {
  useResidentImportSearch,
  type ResidentPickerItem,
} from '../hooks/useResidentImportSearch';
import type { MainStackParamList } from '../navigation/types';
import { useMemberStore } from '../store/memberStore';
import { useSpaceStore } from '../store/spaceStore';
import { useToastStore } from '../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { invalidateDashboardQueries } from '../utils/dashboardQueryCache';
import { defaultRoleForSpaceType } from '../utils/memberRoles';
import { isMemberGenderRequired } from '../utils/memberGender';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '../utils/indianMobile';
import { getMembershipErrorMessage } from '../utils/membershipErrors';
import { findMySpaceEntry } from '../utils/spacePermissions';
import {
  buildSubscriptionPurchasePayload,
  isSubscriptionBilling,
} from '../utils/memberMealBilling';
import { defaultSubscriptionValidTillIso, parseValidTillInput } from '../utils/subscriptionLifecycle';
import { resolveProgressivePhase } from '../utils/progressivePhase';

type AddMemberNav = NativeStackNavigationProp<MainStackParamList, 'AddMember'>;
type AddMemberRoute = NativeStackScreenProps<MainStackParamList, 'AddMember'>['route'];

type FieldErrors = {
  fullName?: string;
  mobileNumber?: string;
  role?: string;
  gender?: string;
  subscriptionMealQty?: string;
  subscriptionPrice?: string;
  import?: string;
};

export function AddMemberScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<AddMemberNav>();
  const route = useRoute<AddMemberRoute>();
  const { spaceId } = route.params;
  const initialMode = route.params.initialMode;
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = findMySpaceEntry(mySpaces, spaceId)?.spaceType;
  const addMember = useMemberStore(state => state.addMember);
  const loading = useMemberStore(state => state.loading);
  const storeError = useMemberStore(state => state.error);
  const showToast = useToastStore(state => state.showToast);

  const isMess = spaceType === 'MESS';
  const [pickerMode, setPickerMode] = useState<MemberPickerMode>(() =>
    initialMode === 'new' ? 'new' : 'search',
  );
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedImport, setSelectedImport] = useState<ResidentPickerItem | null>(null);
  const [importing, setImporting] = useState(false);

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
  const showCustomerReuse = isMess && role === 'CUSTOMER';
  const usingImport = showCustomerReuse && pickerMode === 'search' && selectedImport != null;
  const showCreateForm = !showCustomerReuse || pickerMode === 'new';

  const importSearch = useResidentImportSearch(spaceId, memberQuery, {
    enabled: showCustomerReuse && pickerMode === 'search',
  });

  const showMealAccess = isMess && role === 'CUSTOMER';
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

  const messProgressiveEnabled = isMess && (showMealBilling || showMealAccess);
  const scrollRef = useRef<ScrollView>(null);

  const {
    reviewed: mealsReviewed,
    highlighted: mealsHighlighted,
    onSectionLayout: onMealsLayout,
    onScroll: onMealsScroll,
    onScrollBeginDrag: onMealsScrollBeginDrag,
    continueToSection: continueToMeals,
    clearReviewed: clearMealsReviewed,
    markReviewed: markMealsReviewed,
  } = useProgressiveSectionReview({
    enabled: messProgressiveEnabled,
  });

  useEffect(() => {
    if (!messProgressiveEnabled) {
      return;
    }
    clearMealsReviewed();
  }, [clearMealsReviewed, messProgressiveEnabled, role]);

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
      title: isMess ? t('membership.add.headingMess') : t('navigation.addMember'),
      headerLeft: () => <HeaderBackButton />,
      headerBackVisible: false,
    });
  }, [isMess, navigation, t, i18n.language]);

  useEffect(() => {
    if (!showCustomerReuse) {
      setPickerMode('new');
      setSelectedImport(null);
      setMemberQuery('');
    } else if (role === 'CUSTOMER') {
      setPickerMode('search');
    }
  }, [role, showCustomerReuse]);

  function validateCreate(): boolean {
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

  function validateImport(): boolean {
    const errors: FieldErrors = {};
    if (!selectedImport) {
      errors.import = t('membership.add.reuseRequired');
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

  async function finishAfterMemberCreated(memberId: UUID) {
    if (showMealAccess && mealAccessEnabled) {
      try {
        await enrollMemberInFullMeals(spaceId, memberId);
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
          await mealBalanceApi.recordPurchase(spaceId, memberId, {
            ...purchase,
            validTill:
              parseValidTillInput(subscriptionValidTill) ?? defaultSubscriptionValidTillIso(),
          });
        } catch {
          showToast(t('meals.errors.saveFailed'));
        }
      }
    }
    showToast(
      usingImport
        ? t('membership.add.importSuccessToast')
        : t('membership.add.successToast'),
    );
    invalidateDashboardQueries();
    navigation.goBack();
  }

  async function handleSave() {
    Keyboard.dismiss();

    if (usingImport && selectedImport) {
      if (!validateImport()) {
        return;
      }
      setImporting(true);
      try {
        let memberId = selectedImport.memberId;
        if (selectedImport.needsImport) {
          const imported = await memberApi.importMember(spaceId, {
            sourceMemberId: selectedImport.memberId,
          });
          memberId = imported.memberId;
        }
        await finishAfterMemberCreated(memberId);
      } catch (err) {
        setFieldErrors({
          import: getMembershipErrorMessage(err, 'membership.add.importFailed'),
        });
      } finally {
        setImporting(false);
      }
      return;
    }

    if (!validateCreate()) {
      return;
    }

    const member = await addMember({
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      role: role!,
      gender: gender ?? undefined,
      mealBillingType:
        showMealBilling && mealBillingSelection !== 'DEFAULT' ? mealBillingSelection : null,
    });

    if (member) {
      await finishAfterMemberCreated(member.memberId);
      return;
    }

    const err = useMemberStore.getState().error;
    if (err?.toLowerCase().includes('mobile number')) {
      setFieldErrors({ mobileNumber: err });
    }
  }

  const busy = loading || importing;
  const saveLabel = usingImport
    ? t('membership.add.saveImport')
    : isMess
      ? t('membership.add.saveMess')
      : t('membership.add.save');
  const saveDisabled = busy || (showCustomerReuse && pickerMode === 'search' && !selectedImport);

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
            <View style={styles.hero}>
              <View style={styles.decorBlob} pointerEvents="none" />
              <View style={styles.decorRing} pointerEvents="none" />
              <View style={styles.heroIconWrap} accessibilityElementsHidden>
                <UserPlus size={18} color={colors.primaryDark} strokeWidth={2.2} />
              </View>
              <Text style={styles.eyebrow}>{t('membership.add.eyebrow')}</Text>
              <Text style={styles.heading}>
                {isMess ? t('membership.add.headingMess') : t('membership.add.heading')}
              </Text>
              <Text style={styles.subheading}>
                {isMess ? t('membership.add.subheadingMess') : t('membership.add.subheading')}
              </Text>
            </View>
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
            {fieldErrors.import ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{fieldErrors.import}</Text>
              </View>
            ) : null}

            <RolePicker
              value={role}
              spaceType={spaceType}
              onChange={selected => {
                setRole(selected);
                setSelectedImport(null);
                if (fieldErrors.role) {
                  setFieldErrors(prev => ({ ...prev, role: undefined }));
                }
              }}
              error={fieldErrors.role}
            />

            {showCustomerReuse ? (
              <View style={styles.pickerWrap}>
                <MemberPickerStep
                  hideTitle
                  allowAddNew
                  crossSpaceReuse
                  audience="customer"
                  query={memberQuery}
                  onQueryChange={setMemberQuery}
                  members={importSearch.members}
                  loading={importSearch.loading}
                  error={importSearch.error}
                  pickerMode={pickerMode}
                  onPickerModeChange={mode => {
                    setPickerMode(mode);
                    setSelectedImport(null);
                    setFieldErrors(prev => ({ ...prev, import: undefined }));
                  }}
                  newMemberName={fullName}
                  newMemberMobile={mobileNumber}
                  onNewMemberNameChange={text => {
                    setFullName(text);
                    if (fieldErrors.fullName) {
                      setFieldErrors(prev => ({ ...prev, fullName: undefined }));
                    }
                  }}
                  onNewMemberMobileChange={text => {
                    setMobileNumber(text);
                    if (fieldErrors.mobileNumber) {
                      setFieldErrors(prev => ({ ...prev, mobileNumber: undefined }));
                    }
                  }}
                  newMemberErrors={{
                    fullName: fieldErrors.fullName,
                    mobileNumber: fieldErrors.mobileNumber,
                  }}
                  creatingMember={busy}
                  selectedMemberId={selectedImport?.memberId}
                  onSelect={member => {
                    setSelectedImport(member);
                    setFieldErrors(prev => ({ ...prev, import: undefined }));
                  }}
                />
              </View>
            ) : null}

            {showCreateForm && !showCustomerReuse ? (
              <View style={styles.formCard}>
                <Text style={styles.formCardTitle}>
                  {t('membership.add.detailsHeading', { defaultValue: 'Member details' })}
                </Text>
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
                  leadingIcon={User}
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
                  leadingIcon={Phone}
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
              </View>
            ) : null}

            {usingImport && selectedImport ? (
              <View style={styles.selectedCard}>
                <Text style={styles.selectedLabel}>{t('membership.add.selectedCustomer')}</Text>
                <Text style={styles.selectedName}>{selectedImport.fullName}</Text>
                <Text style={styles.selectedMeta}>
                  {t('occupancyWizard.residentCard.mobile', {
                    mobile: selectedImport.mobileNumber,
                  })}
                </Text>
                {selectedImport.sourceSpaceName ? (
                  <Text style={styles.selectedMeta}>
                    {selectedImport.alreadyInTargetSpace
                      ? t('occupancyWizard.residentCard.inThisSpace')
                      : t('occupancyWizard.residentCard.previouslyIn', {
                          space: selectedImport.sourceSpaceName,
                        })}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {showCreateForm && showCustomerReuse ? (
              <View style={styles.formCard}>
                <Text style={styles.formCardTitle}>
                  {t('membership.add.detailsHeading', { defaultValue: 'Member details' })}
                </Text>
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
              </View>
            ) : null}

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
                    disabled={busy}
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
                      if (fieldErrors.subscriptionMealQty) {
                        setFieldErrors(prev => ({ ...prev, subscriptionMealQty: undefined }));
                      }
                    }}
                    onSubscriptionPriceChange={value => {
                      markMealsReviewed();
                      setSubscriptionPrice(value);
                      if (fieldErrors.subscriptionPrice) {
                        setFieldErrors(prev => ({ ...prev, subscriptionPrice: undefined }));
                      }
                    }}
                    onValidTillChange={value => {
                      markMealsReviewed();
                      setSubscriptionValidTill(value);
                    }}
                    mealQtyError={fieldErrors.subscriptionMealQty}
                    subscriptionPriceError={fieldErrors.subscriptionPrice}
                    useSubscriptionLabels
                  />
                ) : null}

                {showMealAccess ? (
                  <View style={styles.mealAccessRow}>
                    <View style={styles.mealAccessText}>
                      <Text style={styles.mealAccessLabel}>{t('meals.mealAccess.label')}</Text>
                      <Text style={styles.mealAccessHint}>
                        {t('meals.mealAccess.addCustomerHint')}
                      </Text>
                    </View>
                    <Switch
                      value={mealAccessEnabled}
                      onValueChange={value => {
                        markMealsReviewed();
                        setMealAccessEnabled(value);
                      }}
                    />
                  </View>
                ) : null}
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
                label: saveLabel,
                onPress: handleSave,
                loading: busy,
                disabled: saveDisabled,
              }}
              secondaryAction={{
                label: t('common.cancel'),
                onPress: () => navigation.goBack(),
                disabled: busy,
              }}
            />
          ) : (
            <StickyFormActions
              primary={{
                label: saveLabel,
                onPress: handleSave,
                loading: busy,
                disabled: saveDisabled,
              }}
              secondary={{
                label: t('common.cancel'),
                onPress: () => navigation.goBack(),
                disabled: busy,
              }}
            />
          )}
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.section,
    backgroundColor: colors.successTint,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.sm,
  },
  decorBlob: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}1F`,
    top: -48,
    right: -28,
  },
  decorRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 8,
    borderColor: `${colors.primary}14`,
    bottom: -16,
    right: 40,
  },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    zIndex: 1,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: 2,
    zIndex: 1,
  },
  heading: {
    ...typography.h2,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: 2,
    zIndex: 1,
  },
  subheading: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
    zIndex: 1,
  },
  inviteInsteadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
    borderRadius: radius.button,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    ...typography.body,
    fontSize: 14,
    color: '#DC2626',
  },
  pickerWrap: {
    minHeight: 320,
    marginBottom: spacing.md,
  },
  formCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.xs,
    ...shadows.sm,
  },
  formCardTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  selectedCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
    gap: 2,
  },
  selectedLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  selectedName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  selectedMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  mealAccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  mealAccessText: { flex: 1, gap: spacing.xs },
  mealAccessLabel: { ...typography.bodyStrong },
  mealAccessHint: { ...typography.caption, color: colors.muted },
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
    gap: spacing.sm,
  },
  cancelButton: {
    marginTop: spacing.xs,
  },
});
