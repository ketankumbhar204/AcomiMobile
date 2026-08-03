import React, { useLayoutEffect, useRef, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Building2, MapPin, Phone } from 'lucide-react-native';
import type { AmenityAssignment, GenderPolicy, SpaceType } from '../api/types';
import { FormInput, SpaceTypePicker } from '../components/ui';
import { SpaceAmenitiesField } from '../components/spaces/SpaceAmenitiesField';
import { SpacePropertyCategoryPicker } from '../components/spaces/SpacePropertyCategoryPicker';
import { HeaderBackButton } from '../components/ui/HeaderBackButton';
import {
  ProgressiveWorkflowFooter,
  StickyFormActions,
  progressiveSectionHighlightStyle,
} from '../components/progressive';
import { useCreateSpace } from '../hooks/useCreateSpace';
import { useProgressiveSectionReview } from '../hooks/useProgressiveSectionReview';
import {
  buildAllPresetAmenities,
  normalizeAmenityAssignments,
  presetAmenityLabelKey,
  supportsSpaceAmenities,
} from '../utils/amenities';
import { supportsSpacePropertyCategory } from '../utils/spacePropertyCategory';
import { isAccommodationApplicable } from '../utils/accommodationProfile';
import { markAutoOpenedAccommodation } from '../utils/spaceSetupStorage';
import { resolveProgressivePhase } from '../utils/progressivePhase';
import type { MainStackParamList } from '../navigation/types';
import {
  resetToAccommodationHome,
  resetToDashboard,
} from '../navigation/navigationRef';
import { useSpaceStore } from '../store/spaceStore';
import { useToastStore } from '../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../theme';

type CreateSpaceNav = NativeStackNavigationProp<MainStackParamList, 'CreateSpace'>;

type FieldErrors = {
  name?: string;
  type?: string;
  address?: string;
  contactNumber?: string;
};

export function CreateSpaceScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<CreateSpaceNav>();
  const { createSpace, isSubmitting, error, clearError } = useCreateSpace();
  const refresh = useSpaceStore(state => state.refresh);
  const switchSpace = useSpaceStore(state => state.switchSpace);
  const showToast = useToastStore(state => state.showToast);

  const [name, setName] = useState('');
  const [type, setType] = useState<SpaceType | null>(null);
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [amenities, setAmenities] = useState<AmenityAssignment[]>([]);
  const [genderPolicy, setGenderPolicy] = useState<GenderPolicy | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const submitLockRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const isBusy = isSubmitting || isFinishing;
  const showAmenities = supportsSpaceAmenities(type);
  const amenitiesProgressiveEnabled = showAmenities;
  const essentialsComplete = Boolean(type && name.trim());

  const {
    reviewed: amenitiesReviewed,
    highlighted: amenitiesHighlighted,
    onSectionLayout: onAmenitiesLayout,
    onScroll: onAmenitiesScroll,
    onScrollBeginDrag: onAmenitiesScrollBeginDrag,
    continueToSection: continueToAmenities,
    clearReviewed: clearAmenitiesReviewed,
  } = useProgressiveSectionReview({
    enabled: amenitiesProgressiveEnabled,
  });

  React.useEffect(() => {
    if (!amenitiesProgressiveEnabled) {
      return;
    }
    clearAmenitiesReviewed();
  }, [amenitiesProgressiveEnabled, clearAmenitiesReviewed, type]);

  const progressivePhase = resolveProgressivePhase({
    enabled: amenitiesProgressiveEnabled,
    prerequisiteMet: essentialsComplete,
    sectionReviewed: amenitiesReviewed,
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    onAmenitiesScroll(contentOffset.y, layoutMeasurement.height);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.createSpace'),
      headerLeft: () => <HeaderBackButton />,
      headerBackVisible: false,
    });
  }, [navigation, t, i18n.language]);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!name.trim()) {
      errors.name = t('spaces.createSpace.nameRequired');
    }
    if (!type) {
      errors.type = t('spaces.createSpace.typeRequired');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (submitLockRef.current || isBusy) {
      return;
    }

    Keyboard.dismiss();
    clearError();

    if (!validate()) {
      return;
    }

    submitLockRef.current = true;
    setIsFinishing(true);

    let createdSuccessfully = false;

    try {
      const space = await createSpace({
        name: name.trim(),
        type: type!,
        address: address.trim() || undefined,
        contactNumber: contactNumber.trim() || undefined,
        amenities: supportsSpaceAmenities(type)
          ? normalizeAmenityAssignments(amenities)
          : undefined,
        genderPolicy: supportsSpacePropertyCategory(type) ? genderPolicy : undefined,
      });

      if (!space?.id) {
        return;
      }

      createdSuccessfully = true;

      try {
        await refresh();
      } catch {
        // Ignore — mySpaces will refresh on next focus.
      }

      try {
        await switchSpace(space.id);
      } catch {
        // Ignore — navigate with the created id regardless.
      }

      const openAccommodation = isAccommodationApplicable(space.type);
      if (openAccommodation) {
        await markAutoOpenedAccommodation(space.id);
      }

      try {
        navigation.replace('SpaceTabs', {
          spaceId: space.id,
          screen: openAccommodation ? 'Accommodation' : 'Dashboard',
          params: { spaceId: space.id },
        });
      } catch {
        if (openAccommodation) {
          resetToAccommodationHome(space.id);
        } else {
          resetToDashboard(space.id);
        }
      }

      showToast(t('spaces.createSpace.successMessage', { name: space.name }));
    } finally {
      if (!createdSuccessfully) {
        submitLockRef.current = false;
        setIsFinishing(false);
      }
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
            onScrollBeginDrag={
              amenitiesProgressiveEnabled ? onAmenitiesScrollBeginDrag : undefined
            }
            onScroll={amenitiesProgressiveEnabled ? handleScroll : undefined}>
            <View style={styles.hero} accessibilityRole="header">
              <View style={styles.decorBlob} pointerEvents="none" />
              <View style={styles.decorRing} pointerEvents="none" />
              <View style={styles.heroIconWrap} accessibilityElementsHidden>
                <Building2 size={18} color={colors.primaryDark} strokeWidth={2.2} />
              </View>
              <Text style={styles.eyebrow}>{t('spaces.createSpace.eyebrow')}</Text>
              <Text style={styles.heading}>{t('spaces.createSpace.heading')}</Text>
              <Text style={styles.subheading}>{t('spaces.createSpace.subheading')}</Text>
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>
              {t('progressiveWorkflow.createSpace.essentialsTitle')}
            </Text>

            <SpaceTypePicker
              value={type}
              onChange={selected => {
                setType(selected);
                if (!supportsSpaceAmenities(selected)) {
                  setAmenities([]);
                } else if (amenities.length === 0) {
                  setAmenities(
                    buildAllPresetAmenities(code => t(presetAmenityLabelKey(code))),
                  );
                }
                if (!supportsSpacePropertyCategory(selected)) {
                  setGenderPolicy(null);
                }
                if (fieldErrors.type) {
                  setFieldErrors(prev => ({ ...prev, type: undefined }));
                }
              }}
              error={fieldErrors.type}
            />

            <FormInput
              label={t('spaces.createSpace.nameLabel')}
              placeholder={t(
                type
                  ? `spaces.createSpace.namePlaceholderByType.${type}`
                  : 'spaces.createSpace.namePlaceholder',
              )}
              value={name}
              onChangeText={text => {
                setName(text);
                if (fieldErrors.name) {
                  setFieldErrors(prev => ({ ...prev, name: undefined }));
                }
              }}
              error={fieldErrors.name}
              autoCapitalize="words"
              returnKeyType="next"
              leadingIcon={Building2}
            />

            {type && supportsSpacePropertyCategory(type) ? (
              <SpacePropertyCategoryPicker
                spaceType={type}
                value={genderPolicy}
                onChange={setGenderPolicy}
              />
            ) : null}

            <FormInput
              label={t('spaces.createSpace.addressLabel')}
              placeholder={t('spaces.createSpace.addressPlaceholder')}
              value={address}
              onChangeText={setAddress}
              error={fieldErrors.address}
              autoCapitalize="sentences"
              returnKeyType="next"
              leadingIcon={MapPin}
            />

            <FormInput
              label={t('spaces.createSpace.contactLabel')}
              placeholder={t('spaces.createSpace.contactPlaceholder')}
              value={contactNumber}
              onChangeText={setContactNumber}
              error={fieldErrors.contactNumber}
              keyboardType="phone-pad"
              returnKeyType="done"
              maxLength={15}
              leadingIcon={Phone}
            />

            {showAmenities ? (
              <View
                style={[styles.amenitiesSection, amenitiesHighlighted && styles.amenitiesHighlight]}
                onLayout={event => {
                  onAmenitiesLayout(
                    event.nativeEvent.layout.y,
                    event.nativeEvent.layout.height,
                  );
                }}>
                <Text style={styles.sectionTitle}>
                  {t('progressiveWorkflow.createSpace.amenitiesTitle')}
                </Text>
                <SpaceAmenitiesField
                  value={amenities}
                  onChange={setAmenities}
                  selectAllByDefault
                />
              </View>
            ) : null}
          </ScrollView>

          {amenitiesProgressiveEnabled ? (
            <ProgressiveWorkflowFooter
              phase={progressivePhase}
              stepLabel={t('progressiveWorkflow.stepOf', {
                current: progressivePhase === 'continue' ? 1 : 2,
                total: 2,
              })}
              progressLine={
                progressivePhase === 'continue'
                  ? t('progressiveWorkflow.createSpace.progressEssentialsNext')
                  : t('progressiveWorkflow.createSpace.progressReady')
              }
              continueEyebrow={t('progressiveWorkflow.nextStep')}
              continueTitle={t('progressiveWorkflow.createSpace.reviewAmenitiesTitle')}
              continueHint={t('progressiveWorkflow.createSpace.reviewAmenitiesHint')}
              continueLabel={t('progressiveWorkflow.createSpace.continueToAmenities')}
              onContinue={() => continueToAmenities(scrollRef)}
              primaryAction={{
                label: t('spaces.createSpace.save'),
                onPress: handleSave,
                loading: isBusy,
                disabled: isBusy,
              }}
              secondaryAction={{
                label: t('spaces.createSpace.cancel'),
                onPress: () => navigation.goBack(),
                disabled: isBusy,
              }}
            />
          ) : (
            <StickyFormActions
              primary={{
                label: t('spaces.createSpace.save'),
                onPress: handleSave,
                loading: isBusy,
                disabled: isBusy,
              }}
              secondary={{
                label: t('spaces.createSpace.cancel'),
                onPress: () => navigation.goBack(),
                disabled: isBusy,
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
    padding: spacing.md,
    paddingBottom: spacing.xl,
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
    color: colors.primaryDark,
    marginBottom: 2,
    zIndex: 1,
  },
  subheading: {
    ...typography.caption,
    color: colors.muted,
    zIndex: 1,
  },
  sectionTitle: {
    ...typography.h3,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  amenitiesSection: {
    marginTop: spacing.sm,
  },
  amenitiesHighlight: {
    ...progressiveSectionHighlightStyle,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.sm,
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
    color: '#DC2626',
  },
});
