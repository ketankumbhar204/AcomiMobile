import React, { useLayoutEffect, useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
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
import { defaultRoleForSpaceType } from '../utils/memberRoles';
import { findMySpaceEntry } from '../utils/spacePermissions';

type AddMemberNav = NativeStackNavigationProp<MainStackParamList, 'AddMember'>;
type AddMemberRoute = NativeStackScreenProps<MainStackParamList, 'AddMember'>['route'];

type FieldErrors = {
  fullName?: string;
  mobileNumber?: string;
  role?: string;
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.addMember'),
      headerLeft: () => <HeaderBackButton />,
      headerBackVisible: false,
    });
  }, [navigation, t, i18n.language]);

  function validate(): boolean {
    const errors: FieldErrors = {};
    const digits = mobileNumber.replace(/\D/g, '');

    if (!fullName.trim()) {
      errors.fullName = t('membership.add.fullNameRequired');
    }

    if (!mobileNumber.trim()) {
      errors.mobileNumber = t('membership.invite.mobileRequired');
    } else if (digits.length < 10) {
      errors.mobileNumber = t('membership.invite.mobileInvalid');
    }

    if (!role) {
      errors.role = t('membership.invite.roleRequired');
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
    });

    if (member) {
      console.log('[AddMember] success', member.memberId);
      showToast(t('membership.add.successToast'));
      navigation.goBack();
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
