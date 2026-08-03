import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import {
  Building2,
  CalendarClock,
  MapPin,
  Phone,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import { formatSpaceType } from '../api';
import { mealBillingApi } from '../api/mealBillingApi';
import { mealPollClosingApi } from '../api/mealPollClosingApi';
import type {
  GenderPolicy,
  MealBillingType,
  PrepaidBalanceUnit,
  SpaceType,
} from '../api/types';
import { StickyFormActions } from '../components/progressive';
import { FormInput, HeaderBackButton, ListFilterChips, useConfirmDialog } from '../components/ui';
import { MealFormHero } from '../components/meals/MealFormHero';
import type { ListFilterChipOption } from '../components/ui/ListFilterChips';
import {
  MealBillingSettingsSection,
  type MealBillingSettingsFormValues,
} from '../components/settings/MealBillingSettingsSection';
import {
  PollClosingDefaultsSection,
  type PollClosingDefaultsFormValues,
} from '../components/settings/PollClosingDefaultsSection';
import { SpaceAmenitiesField } from '../components/spaces/SpaceAmenitiesField';
import { SpacePropertyCategoryPicker } from '../components/spaces/SpacePropertyCategoryPicker';
import { useDeactivateSpace } from '../hooks/useDeactivateSpace';
import type { AmenityAssignment } from '../api/types';
import { normalizeAmenityAssignments, supportsSpaceAmenities } from '../utils/amenities';
import { supportsSpacePropertyCategory } from '../utils/spacePropertyCategory';
import { useAuthenticatedUserId } from '../hooks/useAuth';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { isSpaceOwner } from '../utils/spaceOwnership';

type EditSpaceNav = NativeStackNavigationProp<MainStackParamList, 'EditSpace'>;
type EditSpaceRoute = NativeStackScreenProps<MainStackParamList, 'EditSpace'>['route'];

type FieldErrors = {
  name?: string;
};

function EditSectionCard({
  icon: Icon,
  title,
  helper,
  accent = colors.primaryDark,
  children,
}: {
  icon: LucideIcon;
  title: string;
  helper?: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${accent}14` }]}>
          <Icon size={15} color={accent} strokeWidth={2.2} />
        </View>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {helper ? <Text style={styles.sectionHelper}>{helper}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

const DEFAULT_BILLING: MealBillingSettingsFormValues = {
  billingType: 'PAY_PER_MEAL',
  prepaidBalanceUnit: 'MEALS',
  fallbackToPayPerMeal: true,
};

const DEFAULT_POLL_CLOSING: PollClosingDefaultsFormValues = {
  timezone: 'Asia/Kolkata',
  breakfastDayOffset: 'PREVIOUS_DAY',
  breakfastTime: '20:00',
  lunchDayOffset: 'SAME_DAY',
  lunchTime: '08:00',
  dinnerDayOffset: 'SAME_DAY',
  dinnerTime: '13:00',
};

function normalizeTime(value: string): string {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return value.trim();
  }
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
}

function pollClosingChanged(
  current: PollClosingDefaultsFormValues,
  initial: PollClosingDefaultsFormValues,
): boolean {
  return (
    current.timezone !== initial.timezone ||
    current.breakfastDayOffset !== initial.breakfastDayOffset ||
    normalizeTime(current.breakfastTime) !== normalizeTime(initial.breakfastTime) ||
    current.lunchDayOffset !== initial.lunchDayOffset ||
    normalizeTime(current.lunchTime) !== normalizeTime(initial.lunchTime) ||
    current.dinnerDayOffset !== initial.dinnerDayOffset ||
    normalizeTime(current.dinnerTime) !== normalizeTime(initial.dinnerTime)
  );
}

function billingFromSpace(
  mealBillingType?: MealBillingType,
  prepaidBalanceUnit?: PrepaidBalanceUnit | null,
  prepaidFallbackToPayPerMeal?: boolean,
): MealBillingSettingsFormValues {
  return {
    billingType: mealBillingType ?? 'PAY_PER_MEAL',
    prepaidBalanceUnit: prepaidBalanceUnit ?? 'MEALS',
    fallbackToPayPerMeal: prepaidFallbackToPayPerMeal ?? true,
  };
}

function billingChanged(
  current: MealBillingSettingsFormValues,
  initial: MealBillingSettingsFormValues,
): boolean {
  return (
    current.billingType !== initial.billingType ||
    current.prepaidBalanceUnit !== initial.prepaidBalanceUnit ||
    current.fallbackToPayPerMeal !== initial.fallbackToPayPerMeal
  );
}

export function EditSpaceScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<EditSpaceNav>();
  const route = useRoute<EditSpaceRoute>();
  const { spaceId } = route.params;
  const currentUserId = useAuthenticatedUserId();
  const { confirmDeactivate, isLoading: isDeactivating } = useDeactivateSpace();
  const { showConfirm } = useConfirmDialog();

  const loadSpaceDetails = useSpaceStore(state => state.loadSpaceDetails);
  const updateSpace = useSpaceStore(state => state.updateSpace);
  const selectedSpace = useSpaceStore(state => state.selectedSpace);
  const isLoading = useSpaceStore(state => state.loading);
  const error = useSpaceStore(state => state.error);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [typeLabel, setTypeLabel] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingValues, setBillingValues] = useState<MealBillingSettingsFormValues>(DEFAULT_BILLING);
  const [initialBillingValues, setInitialBillingValues] =
    useState<MealBillingSettingsFormValues>(DEFAULT_BILLING);
  const [pollClosingValues, setPollClosingValues] =
    useState<PollClosingDefaultsFormValues>(DEFAULT_POLL_CLOSING);
  const [initialPollClosingValues, setInitialPollClosingValues] =
    useState<PollClosingDefaultsFormValues>(DEFAULT_POLL_CLOSING);
  const [spaceType, setSpaceType] = useState<string | null>(null);
  const [amenities, setAmenities] = useState<AmenityAssignment[]>([]);
  const [genderPolicy, setGenderPolicy] = useState<GenderPolicy | null>(null);

  const owner = isSpaceOwner(selectedSpace, currentUserId);
  const isMessSpace = spaceType === 'MESS';
  const showAmenities = supportsSpaceAmenities(spaceType as SpaceType | null);
  const showPropertyCategory = supportsSpacePropertyCategory(spaceType as SpaceType | null);
  const showMealsTab = isMessSpace && owner;
  const showPollsTab = owner;

  type EditSpaceTab = 'general' | 'meals' | 'polls';
  const [activeTab, setActiveTab] = useState<EditSpaceTab>('general');

  const tabOptions = useMemo((): ListFilterChipOption<EditSpaceTab>[] => {
    const options: ListFilterChipOption<EditSpaceTab>[] = [
      { id: 'general', label: t('progressiveWorkflow.editSpace.tabGeneral') },
    ];
    if (showMealsTab) {
      options.push({ id: 'meals', label: t('progressiveWorkflow.editSpace.tabMeals') });
    }
    if (showPollsTab) {
      options.push({ id: 'polls', label: t('progressiveWorkflow.editSpace.tabPolls') });
    }
    return options;
  }, [showMealsTab, showPollsTab, t]);

  useEffect(() => {
    if (activeTab === 'meals' && !showMealsTab) {
      setActiveTab('general');
    }
    if (activeTab === 'polls' && !showPollsTab) {
      setActiveTab('general');
    }
  }, [activeTab, showMealsTab, showPollsTab]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.editSpace'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      loadSpaceDetails(spaceId).then(async loaded => {
        if (loaded) {
          setName(loaded.name);
          setAddress(loaded.address ?? '');
          setContactNumber(loaded.contactNumber ?? '');
          setTypeLabel(formatSpaceType(loaded.type));
          setSpaceType(loaded.type);
          setAmenities(normalizeAmenityAssignments(loaded.amenities ?? []));
          setGenderPolicy(loaded.genderPolicy ?? null);

          if (loaded.type === 'MESS') {
            try {
              const settings = await mealBillingApi.getSettings(spaceId);
              const next = billingFromSpace(
                settings.billingType,
                settings.prepaidBalanceUnit,
                settings.fallbackToPayPerMeal,
              );
              setBillingValues(next);
              setInitialBillingValues(next);
            } catch {
              const fallback = billingFromSpace(
                loaded.mealBillingType,
                loaded.prepaidBalanceUnit,
                loaded.prepaidFallbackToPayPerMeal,
              );
              setBillingValues(fallback);
              setInitialBillingValues(fallback);
            }
          }

          if (owner) {
            try {
              const closing = await mealPollClosingApi.getSettings(spaceId);
              const nextClosing: PollClosingDefaultsFormValues = {
                timezone: closing.timezone || 'Asia/Kolkata',
                breakfastDayOffset: closing.breakfastDayOffset,
                breakfastTime: normalizeTime(closing.breakfastTime).slice(0, 5),
                lunchDayOffset: closing.lunchDayOffset,
                lunchTime: normalizeTime(closing.lunchTime).slice(0, 5),
                dinnerDayOffset: closing.dinnerDayOffset,
                dinnerTime: normalizeTime(closing.dinnerTime).slice(0, 5),
              };
              setPollClosingValues(nextClosing);
              setInitialPollClosingValues(nextClosing);
            } catch {
              setPollClosingValues(DEFAULT_POLL_CLOSING);
              setInitialPollClosingValues(DEFAULT_POLL_CLOSING);
            }
          }
        }
      });
    }, [loadSpaceDetails, owner, spaceId]),
  );

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!name.trim()) {
      errors.name = t('spaces.editSpace.nameRequired');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    Keyboard.dismiss();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const updated = await updateSpace(spaceId, {
      name: name.trim(),
      address: address.trim() || undefined,
      contactNumber: contactNumber.trim() || undefined,
      amenities: showAmenities ? normalizeAmenityAssignments(amenities) : undefined,
      genderPolicy: showPropertyCategory ? genderPolicy : undefined,
    });

    if (!updated) {
      setIsSubmitting(false);
      return;
    }

    if (isMessSpace && owner && billingChanged(billingValues, initialBillingValues)) {
      try {
        await mealBillingApi.updateSettings(spaceId, {
          billingType: billingValues.billingType,
          prepaidBalanceUnit:
            billingValues.billingType === 'PREPAID_BALANCE'
              ? billingValues.prepaidBalanceUnit
              : null,
          fallbackToPayPerMeal: billingValues.fallbackToPayPerMeal,
        });
        setInitialBillingValues(billingValues);
      } catch {
        setIsSubmitting(false);
        return;
      }
    }

    if (owner && pollClosingChanged(pollClosingValues, initialPollClosingValues)) {
      try {
        await mealPollClosingApi.updateSettings(spaceId, {
          timezone: pollClosingValues.timezone.trim() || 'Asia/Kolkata',
          breakfastDayOffset: pollClosingValues.breakfastDayOffset,
          breakfastTime: normalizeTime(pollClosingValues.breakfastTime),
          lunchDayOffset: pollClosingValues.lunchDayOffset,
          lunchTime: normalizeTime(pollClosingValues.lunchTime),
          dinnerDayOffset: pollClosingValues.dinnerDayOffset,
          dinnerTime: normalizeTime(pollClosingValues.dinnerTime),
        });
        setInitialPollClosingValues(pollClosingValues);
      } catch {
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);

    if (updated) {
      const goBack = () => navigation.goBack();
      showConfirm({
        title: t('spaces.editSpace.successTitle'),
        message: t('spaces.editSpace.successMessage'),
        confirmLabel: t('common.ok'),
        hideCancel: true,
        onConfirm: goBack,
        onDismiss: goBack,
      });
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.flex}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <MealFormHero
              icon={Settings2}
              eyebrow={t('spaces.editSpace.eyebrow')}
              heading={t('spaces.editSpace.heading')}
              subheading={t('spaces.editSpace.subheading')}
              compact
            />

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {tabOptions.length > 1 ? (
              <View style={styles.tabWrap}>
                <ListFilterChips
                  options={tabOptions}
                  value={activeTab}
                  onChange={setActiveTab}
                />
              </View>
            ) : null}

            {activeTab === 'general' ? (
              <>
                <EditSectionCard
                  icon={Building2}
                  title={t('spaces.details.generalInfo', {
                    defaultValue: 'General information',
                  })}
                  helper={t('spaces.editSpace.generalHelper', {
                    defaultValue: 'Basic details shown across the space.',
                  })}>
                  <FormInput
                    label={t('spaces.createSpace.nameLabel')}
                    placeholder={t('spaces.createSpace.namePlaceholder')}
                    value={name}
                    onChangeText={text => {
                      setName(text);
                      if (fieldErrors.name) {
                        setFieldErrors({});
                      }
                    }}
                    error={fieldErrors.name}
                    autoCapitalize="words"
                    returnKeyType="next"
                    leadingIcon={Building2}
                  />

                  <View style={styles.readOnlyRow}>
                    <View style={styles.readOnlyIcon}>
                      <Tag size={16} color={colors.primaryDark} strokeWidth={2.2} />
                    </View>
                    <View style={styles.readOnlyText}>
                      <Text style={styles.readOnlyLabel}>
                        {t('spaces.editSpace.typeLabel')}
                      </Text>
                      <Text style={styles.readOnlyValue}>{typeLabel || '—'}</Text>
                    </View>
                  </View>
                </EditSectionCard>

                <EditSectionCard
                  icon={MapPin}
                  title={t('spaces.details.contactInfo', {
                    defaultValue: 'Contact information',
                  })}
                  helper={t('spaces.editSpace.contactHelper', {
                    defaultValue: 'How residents and staff can reach this space.',
                  })}>
                  <FormInput
                    label={t('spaces.createSpace.addressLabel')}
                    placeholder={t('spaces.createSpace.addressPlaceholder')}
                    value={address}
                    onChangeText={setAddress}
                    autoCapitalize="sentences"
                    returnKeyType="next"
                    leadingIcon={MapPin}
                  />

                  <FormInput
                    label={t('spaces.createSpace.contactLabel')}
                    placeholder={t('spaces.createSpace.contactPlaceholder')}
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    maxLength={15}
                    leadingIcon={Phone}
                  />
                </EditSectionCard>

                {showPropertyCategory && spaceType ? (
                  <EditSectionCard
                    icon={ShieldCheck}
                    title={t('spaces.editSpace.rulesTitle', {
                      defaultValue: 'Rules & policy',
                    })}>
                    <SpacePropertyCategoryPicker
                      spaceType={spaceType as SpaceType}
                      value={genderPolicy}
                      onChange={setGenderPolicy}
                    />
                  </EditSectionCard>
                ) : null}

                {showAmenities ? (
                  <EditSectionCard
                    icon={Sparkles}
                    title={t('spaces.amenities.title')}
                    helper={t('spaces.amenities.hint')}>
                    <SpaceAmenitiesField
                      value={amenities}
                      onChange={setAmenities}
                      disabled={isSubmitting || isLoading}
                    />
                  </EditSectionCard>
                ) : null}
              </>
            ) : null}

            {activeTab === 'meals' && showMealsTab ? (
              <EditSectionCard
                icon={UtensilsCrossed}
                title={t('spaces.mealBilling.title')}
                accent="#C2410C">
                <MealBillingSettingsSection
                  values={billingValues}
                  onChange={setBillingValues}
                  disabled={isSubmitting || isLoading}
                />
              </EditSectionCard>
            ) : null}

            {activeTab === 'polls' && showPollsTab ? (
              <EditSectionCard
                icon={CalendarClock}
                title={t('progressiveWorkflow.editSpace.tabPolls')}
                accent="#7C3AED">
                <PollClosingDefaultsSection
                  values={pollClosingValues}
                  onChange={setPollClosingValues}
                  disabled={isSubmitting || isLoading}
                />
              </EditSectionCard>
            ) : null}

            {owner ? (
              <Pressable
                onPress={() => confirmDeactivate(spaceId, name)}
                disabled={isSubmitting || isLoading || isDeactivating}
                style={({ pressed }) => [
                  styles.deactivate,
                  pressed && styles.deactivatePressed,
                  (isSubmitting || isLoading || isDeactivating) && styles.deactivateDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('spaces.details.deactivate')}>
                <Trash2 size={16} color="#DC2626" strokeWidth={2.2} />
                <Text style={styles.deactivateText}>
                  {t('spaces.details.deactivate')}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>

          <StickyFormActions
            primary={{
              label: t('spaces.editSpace.save'),
              onPress: handleSave,
              loading: isSubmitting || isLoading,
              disabled: isSubmitting || isLoading || isDeactivating,
            }}
            secondary={{
              label: t('spaces.createSpace.cancel'),
              onPress: () => navigation.goBack(),
              disabled: isSubmitting,
            }}
          />
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
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  tabWrap: {
    marginBottom: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  sectionHelper: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.card,
    padding: spacing.md,
  },
  errorBannerText: {
    ...typography.body,
    color: '#DC2626',
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  readOnlyIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  readOnlyLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  readOnlyValue: {
    ...typography.bodyStrong,
    fontSize: 15,
  },
  deactivate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  deactivatePressed: {
    opacity: 0.85,
  },
  deactivateDisabled: {
    opacity: 0.6,
  },
  deactivateText: {
    ...typography.bodyStrong,
    color: '#DC2626',
    fontWeight: '700',
  },
});
