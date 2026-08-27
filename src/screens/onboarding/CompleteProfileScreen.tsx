import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  FileText,
  Hash,
  Mail,
  MapPin,
  Phone,
  Smartphone,
  TriangleAlert,
  UserRound,
  Users,
} from 'lucide-react-native';
import type { MemberDocumentType, MemberGender } from '../../api/types';
import { memberApi } from '../../api/memberApi';
import { AuthHero } from '../../components/auth';
import { DocumentTypePicker } from '../../components/member/DocumentTypePicker';
import { StickyFormActions } from '../../components/progressive';
import {
  Button,
  FormInput,
  GenderPicker,
  HeaderBackButton,
  Screen,
} from '../../components/ui';
import { useAuthenticatedUser } from '../../hooks/useAuth';
import { useCompleteProfile } from '../../hooks/useCompleteProfile';
import { useLogout } from '../../hooks/useLogout';
import type { MainStackParamList } from '../../navigation/types';
import { resetToDashboard, resetToMySpaces } from '../../navigation/navigationRef';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, shadows, spacing, typography } from '../../theme';
import { pickProfileImage } from '../../utils/pickProfileImage';
import { profileDocumentsToFormState } from '../../utils/profileDocuments';
import { isConsumerMembershipRole } from '../../utils/profileCompletion';
import { useAuthStore } from '../../store/authStore';

type Nav = NativeStackNavigationProp<MainStackParamList, 'CompleteProfile'>;
type CompleteProfileRoute = RouteProp<MainStackParamList, 'CompleteProfile'>;

type WizardStep = 'personal' | 'address' | 'emergency' | 'documents';

const STEPS: WizardStep[] = ['personal', 'address', 'emergency', 'documents'];

export function CompleteProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<CompleteProfileRoute>();
  const user = useAuthenticatedUser();
  const logout = useLogout();
  const selectedSpaceId = useSpaceStore(state => state.selectedSpaceId);
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const { completeProfile, isSubmitting, error, clearError } = useCompleteProfile();
  const showToast = useToastStore(state => state.showToast);

  const isEditMode = route.params?.mode === 'edit';

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [gender, setGender] = useState<MemberGender | null>(user?.gender ?? null);
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.profilePhotoUrl ?? '');

  const [permanentAddress, setPermanentAddress] = useState(user?.permanentAddress ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [stateName, setStateName] = useState(user?.state ?? '');
  const [pincode, setPincode] = useState(user?.pincode ?? '');

  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactMobile, setEmergencyContactMobile] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');

  const [identityDocumentType, setIdentityDocumentType] = useState<MemberDocumentType | null>(
    null,
  );
  const [identityDocumentNumber, setIdentityDocumentNumber] = useState('');
  const [addressProofFileUrl, setAddressProofFileUrl] = useState('');
  const [identityProofFileUrl, setIdentityProofFileUrl] = useState('');
  const [additionalDocumentFileUrl, setAdditionalDocumentFileUrl] = useState('');

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pickingTarget, setPickingTarget] = useState<string | null>(null);
  const editHydratedRef = useRef(false);
  const userEditedDocumentsRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!isEditMode) {
        return;
      }

      if (editHydratedRef.current) {
        return;
      }

      const spaceId =
        selectedSpaceId ??
        mySpaces.find(space => isConsumerMembershipRole(space.membershipRole))?.spaceId ??
        null;
      if (!spaceId) {
        return;
      }

      editHydratedRef.current = true;
      userEditedDocumentsRef.current = false;

      let active = true;

      void (async () => {
        try {
          const refreshed = await useAuthStore.getState().refreshUser();
          const profileUser = refreshed ?? useAuthStore.getState().user;
          if (!active || !profileUser) {
            return;
          }

          setFullName(profileUser.fullName ?? '');
          setGender(profileUser.gender ?? null);
          setDateOfBirth(profileUser.dateOfBirth ?? '');
          setEmail(profileUser.email ?? '');
          setProfilePhotoUrl(profileUser.profilePhotoUrl ?? '');
          setPermanentAddress(profileUser.permanentAddress ?? '');
          setCity(profileUser.city ?? '');
          setStateName(profileUser.state ?? '');
          setPincode(profileUser.pincode ?? '');

          const linked = await memberApi.getMyLinkedMember(spaceId);
          const details = await memberApi.getMember(spaceId, linked.memberId);
          if (!active) {
            return;
          }

          setEmergencyContactName(details.emergencyContactName ?? '');
          setEmergencyContactMobile(details.emergencyContactMobile ?? '');
          setEmergencyContactRelation(details.emergencyContactRelation ?? '');

          const documents = await memberApi.getMemberDocuments(spaceId, linked.memberId);
          if (!active) {
            return;
          }

          const documentState = profileDocumentsToFormState(documents);
          if (!userEditedDocumentsRef.current) {
            setIdentityDocumentType(documentState.identityDocumentType);
            setIdentityDocumentNumber(documentState.identityDocumentNumber);
            setAddressProofFileUrl(documentState.addressProofFileUrl);
            setIdentityProofFileUrl(documentState.identityProofFileUrl);
            setAdditionalDocumentFileUrl(documentState.additionalDocumentFileUrl);
          }
        } catch {
          // Keep in-progress edits if hydration fails.
        }
      })();

      return () => {
        active = false;
        editHydratedRef.current = false;
        userEditedDocumentsRef.current = false;
      };
    }, [isEditMode, mySpaces, selectedSpaceId]),
  );

  const headerLeft = useCallback(
    () => (isEditMode && stepIndex === 0 ? <HeaderBackButton /> : null),
    [isEditMode, stepIndex],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode
        ? t('settings.profile.editProfileTitle')
        : t('profileCompletion.wizard.title'),
      headerBackVisible: isEditMode && stepIndex === 0,
      headerLeft,
    });
  }, [headerLeft, isEditMode, navigation, stepIndex, t]);

  const stepLabel = useMemo(
    () => t('profileCompletion.wizard.stepProgress', { current: stepIndex + 1, total: STEPS.length }),
    [stepIndex, t],
  );

  const progressPercent = ((stepIndex + 1) / STEPS.length) * 100;

  function validateStep(current: WizardStep): boolean {
    clearError();
    setFieldError(null);

    if (current === 'personal') {
      if (!fullName.trim() || fullName.trim().toLowerCase() === 'user') {
        setFieldError(t('profileCompletion.errors.fullNameRequired'));
        return false;
      }
    }

    if (current === 'address') {
      if (!permanentAddress.trim()) {
        setFieldError(t('profileCompletion.errors.addressRequired'));
        return false;
      }
      if (!city.trim()) {
        setFieldError(t('profileCompletion.errors.cityRequired'));
        return false;
      }
      if (!stateName.trim()) {
        setFieldError(t('profileCompletion.errors.stateRequired'));
        return false;
      }
      if (!pincode.trim()) {
        setFieldError(t('profileCompletion.errors.pincodeRequired'));
        return false;
      }
    }

    return true;
  }

  async function handleNext() {
    if (!validateStep(step)) {
      return;
    }

    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }

    if (identityDocumentNumber.trim() && !identityDocumentType) {
      setFieldError(t('membership.documents.typeRequired'));
      return;
    }

    const success = await completeProfile({
      fullName: fullName.trim(),
      gender,
      dateOfBirth: dateOfBirth.trim() || null,
      email: email.trim() || null,
      profilePhotoUrl: profilePhotoUrl.trim() || null,
      permanentAddress: permanentAddress.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      emergencyContactName: emergencyContactName.trim() || null,
      emergencyContactMobile: emergencyContactMobile.trim() || null,
      emergencyContactRelation: emergencyContactRelation.trim() || null,
      identityDocumentType,
      identityDocumentNumber: identityDocumentNumber.trim() || null,
      addressProofFileUrl: addressProofFileUrl.trim() || null,
      identityProofFileUrl: identityProofFileUrl.trim() || null,
      additionalDocumentFileUrl: additionalDocumentFileUrl.trim() || null,
    });

    if (success) {
      if (isEditMode) {
        showToast(t('settings.profile.saveSuccess'));
        navigation.goBack();
        return;
      }

      const spaceId =
        selectedSpaceId ?? useSpaceStore.getState().mySpaces[0]?.spaceId ?? null;
      if (spaceId) {
        resetToDashboard(spaceId);
      } else {
        resetToMySpaces();
      }
    }
  }

  async function handlePickPhoto(target: 'profile' | 'address' | 'identity' | 'additional') {
    setPickingTarget(target);
    setFieldError(null);
    try {
      const picked = await pickProfileImage();
      if (!picked) {
        return;
      }

      switch (target) {
        case 'profile':
          setProfilePhotoUrl(picked.fileUrl);
          break;
        case 'address':
          setAddressProofFileUrl(picked.fileUrl);
          break;
        case 'identity':
          setIdentityProofFileUrl(picked.fileUrl);
          break;
        case 'additional':
          setAdditionalDocumentFileUrl(picked.fileUrl);
          break;
        default:
          break;
      }
    } catch (err) {
      console.warn('[CompleteProfile] image pick failed', err);
      showToast(t('profileCompletion.errors.pickFailed'));
    } finally {
      setPickingTarget(null);
    }
  }

  function previewUriForStoredFile(stored: string): string {
    if (!stored) {
      return '';
    }
    if (stored.startsWith('file://') || stored.startsWith('data:') || stored.startsWith('http')) {
      return stored;
    }
    return stored;
  }

  function renderUploadRow(
    label: string,
    value: string,
    target: 'profile' | 'address' | 'identity' | 'additional',
  ) {
    const previewUri = previewUriForStoredFile(value);
    const isPicking = pickingTarget === target;

    return (
      <View style={styles.uploadRow}>
        <Text style={styles.uploadLabel}>{label}</Text>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.previewImage} />
        ) : null}
        <Button
          label={
            previewUri
              ? t('profileCompletion.wizard.replacePhoto')
              : t('profileCompletion.wizard.uploadPhoto')
          }
          variant="secondary"
          loading={isPicking}
          disabled={isPicking || isSubmitting}
          onPress={() => void handlePickPhoto(target)}
        />
      </View>
    );
  }

  return (
    <Screen scrollable={false} contentStyle={styles.screen}>
      <View style={styles.flex}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <AuthHero
            icon={UserRound}
            eyebrow={stepLabel}
            heading={t(`profileCompletion.wizard.sections.${step}`)}
            subheading={t('profileCompletion.wizard.helper', {
              defaultValue: 'A few details help us personalize ACOMI for you.',
            })}
          />

          <View style={styles.progressCard}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.stepDots}>
              {STEPS.map((key, index) => (
                <View
                  key={key}
                  style={[
                    styles.stepDot,
                    index <= stepIndex && styles.stepDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.sectionCard}>
          {step === 'personal' ? (
            <>
              <FormInput
                label={`${t('profileCompletion.fields.fullName')} *`}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                leadingIcon={UserRound}
              />
              <GenderPicker value={gender} onChange={setGender} />
              <FormInput
                label={t('profileCompletion.fields.dateOfBirth')}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder={t('profileCompletion.fields.dateOfBirthPlaceholder')}
                leadingIcon={CalendarDays}
              />
              <FormInput
                label={t('profileCompletion.fields.mobileNumber')}
                value={user?.mobileNumber ?? ''}
                editable={false}
                leadingIcon={Smartphone}
              />
              <Pressable
                onPress={() => navigation.navigate('ChangeMobile')}
                accessibilityRole="button">
                <Text style={styles.changeMobileLink}>{t('settings.profile.changeMobile')}</Text>
              </Pressable>
              <FormInput
                label={t('profileCompletion.fields.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leadingIcon={Mail}
              />
              {renderUploadRow(
                t('profileCompletion.fields.profilePhoto'),
                profilePhotoUrl,
                'profile',
              )}
            </>
          ) : null}

          {step === 'address' ? (
            <>
              <FormInput
                label={`${t('profileCompletion.fields.permanentAddress')} *`}
                value={permanentAddress}
                onChangeText={setPermanentAddress}
                multiline
                leadingIcon={MapPin}
              />
              <FormInput
                label={`${t('profileCompletion.fields.city')} *`}
                value={city}
                onChangeText={setCity}
                leadingIcon={MapPin}
              />
              <FormInput
                label={`${t('profileCompletion.fields.state')} *`}
                value={stateName}
                onChangeText={setStateName}
                leadingIcon={MapPin}
              />
              <FormInput
                label={`${t('profileCompletion.fields.pincode')} *`}
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                leadingIcon={Hash}
              />
            </>
          ) : null}

          {step === 'emergency' ? (
            <>
              <FormInput
                label={t('profileCompletion.fields.guardianName')}
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                leadingIcon={Users}
              />
              <FormInput
                label={t('profileCompletion.fields.guardianMobile')}
                value={emergencyContactMobile}
                onChangeText={setEmergencyContactMobile}
                keyboardType="phone-pad"
                leadingIcon={Phone}
              />
              <FormInput
                label={t('profileCompletion.fields.relationship')}
                value={emergencyContactRelation}
                onChangeText={setEmergencyContactRelation}
                leadingIcon={Users}
              />
            </>
          ) : null}

          {step === 'documents' ? (
            <>
              <Text style={styles.optionalHint}>
                {t('profileCompletion.wizard.documentsOptional')}
              </Text>
              <DocumentTypePicker
                value={identityDocumentType}
                onChange={type => {
                  userEditedDocumentsRef.current = true;
                  setIdentityDocumentType(type);
                }}
              />
              <FormInput
                label={t('profileCompletion.fields.documentNumber')}
                value={identityDocumentNumber}
                onChangeText={value => {
                  userEditedDocumentsRef.current = true;
                  setIdentityDocumentNumber(value);
                }}
                leadingIcon={FileText}
              />
              {renderUploadRow(
                t('profileCompletion.fields.addressProof'),
                addressProofFileUrl,
                'address',
              )}
              {renderUploadRow(
                t('profileCompletion.fields.identityProof'),
                identityProofFileUrl,
                'identity',
              )}
              {renderUploadRow(
                t('profileCompletion.fields.additionalDocument'),
                additionalDocumentFileUrl,
                'additional',
              )}
            </>
          ) : null}

          {fieldError ? (
            <View style={styles.errorBanner}>
              <TriangleAlert size={14} color="#B91C1C" strokeWidth={2.2} />
              <Text style={styles.errorText}>{fieldError}</Text>
            </View>
          ) : null}
          {error ? (
            <View style={styles.errorBanner}>
              <TriangleAlert size={14} color="#B91C1C" strokeWidth={2.2} />
              <Text style={styles.errorText}>
                {error.startsWith('profileCompletion') ? t(error) : error}
              </Text>
            </View>
          ) : null}
          </View>
        </ScrollView>

        <StickyFormActions
          layout="row"
          accessibilityLabel={t('profileCompletion.wizard.title')}
          primary={{
            label:
              stepIndex === STEPS.length - 1
                ? isEditMode
                  ? t('settings.profile.save')
                  : t('profileCompletion.wizard.submit')
                : t('common.next'),
            onPress: () => void handleNext(),
            loading: isSubmitting,
            disabled: isSubmitting,
          }}
          secondary={
            stepIndex > 0
              ? {
                  label: t('common.back'),
                  onPress: () => setStepIndex(stepIndex - 1),
                  disabled: isSubmitting,
                }
              : undefined
          }
          footerExtra={
            <Pressable
              disabled={isLoggingOut}
              accessibilityRole="button"
              accessibilityLabel={
                isEditMode ? t('common.cancel') : t('settings.profile.logout')
              }
              onPress={() => {
                if (isEditMode) {
                  navigation.goBack();
                  return;
                }
                void (async () => {
                  setIsLoggingOut(true);
                  try {
                    await logout();
                  } finally {
                    setIsLoggingOut(false);
                  }
                })();
              }}>
              <Text style={styles.logoutLink}>
                {isEditMode ? t('common.cancel') : t('settings.profile.logout')}
              </Text>
            </Pressable>
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 0,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primaryDark,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  optionalHint: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  uploadRow: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  uploadLabel: {
    ...typography.label,
    color: colors.textPrimary,
  },
  previewImage: {
    width: 96,
    height: 96,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    flex: 1,
  },
  changeMobileLink: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  logoutLink: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
});
