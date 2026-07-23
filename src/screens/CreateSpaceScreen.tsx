import React, { useLayoutEffect, useRef, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Building2, MapPin, Phone, Save } from 'lucide-react-native';
import type { AmenityAssignment, GenderPolicy, SpaceType } from '../api/types';
import { Button, FormInput, SpaceTypePicker } from '../components/ui';
import { SpaceAmenitiesField } from '../components/spaces/SpaceAmenitiesField';
import { SpacePropertyCategoryPicker } from '../components/spaces/SpacePropertyCategoryPicker';
import { HeaderBackButton } from '../components/ui/HeaderBackButton';
import { useCreateSpace } from '../hooks/useCreateSpace';
import {
  buildAllPresetAmenities,
  normalizeAmenityAssignments,
  presetAmenityLabelKey,
  supportsSpaceAmenities,
} from '../utils/amenities';
import { supportsSpacePropertyCategory } from '../utils/spacePropertyCategory';
import { isAccommodationApplicable } from '../utils/accommodationProfile';
import { markAutoOpenedAccommodation } from '../utils/spaceSetupStorage';
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

  const isBusy = isSubmitting || isFinishing;

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

      // Space already exists — never treat post-create work as a create failure.
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

      // Prefer replace so Create Space is not left under the new space.
      // Fall back to soft tab navigate if replace is unavailable.
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
      // Keep Save locked after success so a slow unmount cannot double-submit.
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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
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

          <FormInput
            label={t('spaces.createSpace.nameLabel')}
            placeholder={t('spaces.createSpace.namePlaceholder')}
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

          {supportsSpaceAmenities(type) ? (
            <SpaceAmenitiesField
              value={amenities}
              onChange={setAmenities}
              selectAllByDefault
            />
          ) : null}

          <View style={styles.footer}>
            <Button
              label={t('spaces.createSpace.save')}
              onPress={handleSave}
              loading={isBusy}
              disabled={isBusy}
              icon={Save}
            />
            <Button
              label={t('spaces.createSpace.cancel')}
              variant="ghost"
              onPress={() => navigation.goBack()}
              disabled={isBusy}
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
    padding: spacing.md,
    paddingBottom: spacing.section,
  },
  hero: {
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.section,
    backgroundColor: '#ECFDF5',
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
  footer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  cancelButton: {
    marginTop: spacing.xxs,
  },
});
