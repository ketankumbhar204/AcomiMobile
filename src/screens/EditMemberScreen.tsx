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
import type { MembershipRole } from '../api/types';
import { Button, FormInput, HeaderBackButton, RolePicker } from '../components/ui';
import type { MainStackParamList } from '../navigation/types';
import { useMemberStore } from '../store/memberStore';
import { useSpaceStore } from '../store/spaceStore';
import { useToastStore } from '../store/toastStore';
import { colors, spacing, typography } from '../theme';
import { isRoleAssignableInSpace } from '../utils/memberRoles';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '../utils/indianMobile';
import { findMySpaceEntry } from '../utils/spacePermissions';

type EditMemberNav = NativeStackNavigationProp<MainStackParamList, 'EditMember'>;
type EditMemberRoute = NativeStackScreenProps<MainStackParamList, 'EditMember'>['route'];

type FieldErrors = {
  fullName?: string;
  mobileNumber?: string;
  role?: string;
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.editMember'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      console.log('[EditMember] screen focused', { memberId });

      loadMemberDetails(memberId).then(loaded => {
        if (loaded && loaded.role !== 'OWNER') {
          setFullName(loaded.fullName);
          setMobileNumber(loaded.mobileNumber);
          setRole(loaded.role);
        }
      });
    }, [loadMemberDetails, memberId]),
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

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    Keyboard.dismiss();

    if (!validate() || !role) {
      return;
    }

    console.log('[EditMember] save started', { memberId });
    setIsSubmitting(true);

    const updated = await updateMember(memberId, {
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      role,
    });

    setIsSubmitting(false);

    if (updated) {
      console.log('[EditMember] save success', updated.memberId);
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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
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
  footer: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.xs,
  },
});
