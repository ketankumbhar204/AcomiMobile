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
import { Phone, UserPlus } from 'lucide-react-native';
import type { MembershipRole } from '../api/types';
import { FormInput, RolePicker } from '../components/ui';
import { HeaderBackButton } from '../components/ui/HeaderBackButton';
import { StickyFormActions } from '../components/progressive';
import type { MainStackParamList } from '../navigation/types';
import { useMemberStore } from '../store/memberStore';
import { useSpaceStore } from '../store/spaceStore';
import { useToastStore } from '../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { defaultRoleForSpaceType } from '../utils/memberRoles';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '../utils/indianMobile';
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
  const { spaceId, mobileNumber: initialMobile, role: initialRole, memberName } =
    route.params;
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = findMySpaceEntry(mySpaces, spaceId)?.spaceType;
  const inviteMember = useMemberStore(state => state.inviteMember);
  const loadPendingInvitations = useMemberStore(state => state.loadPendingInvitations);
  const storeError = useMemberStore(state => state.error);
  const loading = useMemberStore(state => state.loading);
  const showToast = useToastStore(state => state.showToast);

  const [mobileNumber, setMobileNumber] = useState(initialMobile ?? '');
  const [role, setRole] = useState<MembershipRole | null>(() =>
    initialRole ?? defaultRoleForSpaceType(spaceType),
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
    const digits = normalizeIndianMobileDigits(mobileNumber);

    if (!mobileNumber.trim()) {
      errors.mobileNumber = t('membership.invite.mobileRequired');
    } else if (!isValidIndianMobile(digits)) {
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
        <View style={styles.flex}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <View style={styles.decorBlob} pointerEvents="none" />
              <View style={styles.decorRing} pointerEvents="none" />
              <View style={styles.heroIconWrap} accessibilityElementsHidden>
                <UserPlus size={18} color={colors.primaryDark} strokeWidth={2.2} />
              </View>
              <Text style={styles.eyebrow}>{t('membership.invite.eyebrow')}</Text>
              <Text style={styles.heading}>
                {memberName
                  ? t('membership.invite.prefillHeading', { name: memberName })
                  : t('membership.invite.heading')}
              </Text>
              <Text style={styles.subheading}>{t('membership.invite.subheading')}</Text>
            </View>

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
              leadingIcon={Phone}
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
          </ScrollView>

          <StickyFormActions
            primary={{
              label: t('membership.invite.send'),
              onPress: () => {
                handleSend().catch(() => undefined);
              },
              loading,
              disabled: loading,
            }}
            secondary={{
              label: t('common.cancel'),
              onPress: () => navigation.goBack(),
              disabled: loading,
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
    paddingBottom: spacing.xxl,
  },
  hero: {
    marginBottom: spacing.lg,
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
});
