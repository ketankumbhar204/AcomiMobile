import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
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
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MembershipRole } from '../api/types';
import { Button, FormInput, RolePicker } from '../components/ui';
import { HeaderBackButton } from '../components/ui/HeaderBackButton';
import { useCreateInvitation } from '../hooks/useInvitation';
import type { MainStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';

type InviteMembersNav = NativeStackNavigationProp<MainStackParamList, 'InviteMembers'>;
type InviteMembersRoute = NativeStackScreenProps<MainStackParamList, 'InviteMembers'>['route'];

type FieldErrors = {
  mobileNumber?: string;
  role?: string;
};

export function InviteMemberScreen() {
  const navigation = useNavigation<InviteMembersNav>();
  const route = useRoute<InviteMembersRoute>();
  const { spaceId } = route.params;

  const { createInvitation, isSubmitting, error, clearError } = useCreateInvitation();

  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState<MembershipRole | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <HeaderBackButton />,
      headerBackVisible: false,
    });
  }, [navigation]);

  function validate(): boolean {
    const errors: FieldErrors = {};

    const digits = mobileNumber.replace(/\D/g, '');
    if (!mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required.';
    } else if (digits.length < 10) {
      errors.mobileNumber = 'Enter a valid 10-digit mobile number.';
    }

    if (!role) {
      errors.role = 'Please select a role for this member.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSend() {
    Keyboard.dismiss();
    clearError();

    if (!validate()) {
      return;
    }

    const invitation = await createInvitation({
      spaceId,
      mobileNumber: mobileNumber.trim(),
      role: role!,
    });

    if (invitation) {
      console.log('[InviteMember] Invitation sent:', JSON.stringify(invitation, null, 2));
      Alert.alert(
        'Invitation sent',
        `Invitation sent to ${invitation.mobileNumber} as ${invitation.role}.\nExpires: ${new Date(invitation.expiresAt).toLocaleDateString()}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
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

          <Text style={styles.eyebrow}>Members</Text>
          <Text style={styles.heading}>Invite a Member</Text>
          <Text style={styles.subheading}>
            Enter their mobile number and assign a role. They will receive an invitation.
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <FormInput
            label="Mobile Number"
            placeholder="e.g. 9876543210"
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
              label="Send Invitation"
              onPress={handleSend}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
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
