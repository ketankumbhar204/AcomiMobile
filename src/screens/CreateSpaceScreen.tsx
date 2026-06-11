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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { SpaceType } from '../api/types';
import { Button, FormInput, SpaceTypePicker } from '../components/ui';
import { HeaderBackButton } from '../components/ui/HeaderBackButton';
import { useCreateSpace } from '../hooks/useCreateSpace';
import type { MainStackParamList } from '../navigation/types';
import { resetToDashboard } from '../navigation/navigationRef';
import { useSpaceStore } from '../store/spaceStore';
import { colors, spacing, typography } from '../theme';

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

  const [name, setName] = useState('');
  const [type, setType] = useState<SpaceType | null>(null);
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
    Keyboard.dismiss();
    clearError();

    if (!validate()) {
      return;
    }

    const space = await createSpace({
      name: name.trim(),
      type: type!,
      address: address.trim() || undefined,
      contactNumber: contactNumber.trim() || undefined,
    });

    if (space) {
      console.log('[CreateSpace] Space created successfully:', JSON.stringify(space, null, 2));
      await refresh();
      await switchSpace(space.id);
      resetToDashboard(space.id);
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

          <Text style={styles.eyebrow}>{t('spaces.createSpace.eyebrow')}</Text>
          <Text style={styles.heading}>{t('spaces.createSpace.heading')}</Text>
          <Text style={styles.subheading}>{t('spaces.createSpace.subheading')}</Text>

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
          />

          <SpaceTypePicker
            value={type}
            onChange={selected => {
              setType(selected);
              if (fieldErrors.type) {
                setFieldErrors(prev => ({ ...prev, type: undefined }));
              }
            }}
            error={fieldErrors.type}
          />

          <FormInput
            label={t('spaces.createSpace.addressLabel')}
            placeholder={t('spaces.createSpace.addressPlaceholder')}
            value={address}
            onChangeText={setAddress}
            error={fieldErrors.address}
            autoCapitalize="sentences"
            returnKeyType="next"
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
          />

          <View style={styles.footer}>
            <Button
              label={t('spaces.createSpace.save')}
              onPress={handleSave}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
            <Button
              label={t('spaces.createSpace.cancel')}
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
