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
import { Button, FormInput, RolePicker } from '../components/ui';
import { HeaderBackButton } from '../components/ui/HeaderBackButton';
import type { MainStackParamList } from '../navigation/types';
import { useMemberStore } from '../store/memberStore';
import { useSpaceStore } from '../store/spaceStore';
import { useToastStore } from '../store/toastStore';
import { colors, spacing, typography } from '../theme';
import { defaultRoleForSpaceType } from '../utils/memberRoles';
import { findMySpaceEntry } from '../utils/spacePermissions';

type InviteMembersNav = NativeStackNavigationProp<MainStackParamList, 'InviteMembers'>;
type InviteMembersRoute = NativeStackScreenProps<MainStackParamList, 'InviteMembers'>['route'];

type FieldErrors = {
  mobileNumber?: string;
  role?: string;
};

export function InviteMemberScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<InviteMembersNav>();
  const route = useRoute<InviteMembersRoute>();
  const { spaceId } = route.params;
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = findMySpaceEntry(mySpaces, spaceId)?.spaceType;
  const inviteMember = useMemberStore(state => state.inviteMember);
  const loadPendingInvitations = useMemberStore(state => state.loadPendingInvitations);
  const storeError = useMemberStore(state => state.error);
  const loading = useMemberStore(state => state.loading);
  const showToast = useToastStore(state => state.showToast);

  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState<MembershipRole | null>(() =>
    defaultRoleForSpaceType(spaceType),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.inviteMember'),
      headerLeft: () => <HeaderBackButton />,
      headerBackVisible: false,
    });
  }, [navigation, t, i18n.language]);

  function validate(): boolean {
    const errors: FieldErrors = {};
    const digits = mobileNumber.replace(/\D/g, '');

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

  async function handleSend() {
    Keyboard.dismiss();

    if (!validate()) {
      return;
    }

    const invitation = await inviteMember({
      mobileNumber: mobileNumber.trim(),
      role: role!,
    });

    if (invitation) {
      console.log('[InviteMember] success', invitation.id);
      await loadPendingInvitations();
      showToast(t('membership.invite.successToast'));
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
          <Text style={styles.eyebrow}>{t('membership.invite.eyebrow')}</Text>
          <Text style={styles.heading}>{t('membership.invite.heading')}</Text>
          <Text style={styles.subheading}>{t('membership.invite.subheading')}</Text>

          {storeError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{storeError}</Text>
            </View>
          ) : null}

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
              label={t('membership.invite.send')}
              onPress={handleSend}
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
