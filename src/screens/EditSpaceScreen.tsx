import React, { useCallback, useLayoutEffect, useState } from 'react';
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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { formatSpaceType } from '../api';
import { Button, Card, FormInput, HeaderBackButton } from '../components/ui';
import { useDeactivateSpace } from '../hooks/useDeactivateSpace';
import { useAuthenticatedUserId } from '../hooks/useAuth';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { colors, spacing, typography } from '../theme';
import { isSpaceOwner } from '../utils/spaceOwnership';

type EditSpaceNav = NativeStackNavigationProp<MainStackParamList, 'EditSpace'>;
type EditSpaceRoute = NativeStackScreenProps<MainStackParamList, 'EditSpace'>['route'];

type FieldErrors = {
  name?: string;
};

export function EditSpaceScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<EditSpaceNav>();
  const route = useRoute<EditSpaceRoute>();
  const { spaceId } = route.params;
  const currentUserId = useAuthenticatedUserId();
  const { confirmDeactivate, isLoading: isDeactivating } = useDeactivateSpace();

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

  const owner = isSpaceOwner(selectedSpace, currentUserId);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.editSpace'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      console.log('[EditSpace] screen focused', { spaceId });

      loadSpaceDetails(spaceId).then(loaded => {
        if (loaded) {
          setName(loaded.name);
          setAddress(loaded.address ?? '');
          setContactNumber(loaded.contactNumber ?? '');
          setTypeLabel(formatSpaceType(loaded.type));
        }
      });
    }, [loadSpaceDetails, spaceId]),
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

    console.log('[EditSpace] save started', { spaceId });
    setIsSubmitting(true);

    const updated = await updateSpace(spaceId, {
      name: name.trim(),
      address: address.trim() || undefined,
      contactNumber: contactNumber.trim() || undefined,
    });

    setIsSubmitting(false);

    if (updated) {
      console.log('[EditSpace] save success', updated.id);
      Alert.alert(
        t('spaces.editSpace.successTitle'),
        t('spaces.editSpace.successMessage'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }],
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

          <Text style={styles.eyebrow}>{t('spaces.editSpace.eyebrow')}</Text>
          <Text style={styles.heading}>{t('spaces.editSpace.heading')}</Text>
          <Text style={styles.subheading}>{t('spaces.editSpace.subheading')}</Text>

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
                setFieldErrors({});
              }
            }}
            error={fieldErrors.name}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <FormInput
            label={t('spaces.createSpace.addressLabel')}
            placeholder={t('spaces.createSpace.addressPlaceholder')}
            value={address}
            onChangeText={setAddress}
            autoCapitalize="sentences"
            returnKeyType="next"
          />

          <FormInput
            label={t('spaces.createSpace.contactLabel')}
            placeholder={t('spaces.createSpace.contactPlaceholder')}
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
            returnKeyType="done"
            maxLength={15}
          />

          <Card style={styles.readOnlyCard}>
            <Text style={styles.readOnlyLabel}>{t('spaces.editSpace.typeLabel')}</Text>
            <Text style={styles.readOnlyValue}>{typeLabel || '—'}</Text>
          </Card>

          <View style={styles.footer}>
            <Button
              label={t('spaces.editSpace.save')}
              onPress={handleSave}
              loading={isSubmitting || isLoading}
              disabled={isSubmitting || isLoading || isDeactivating}
            />
            <Button
              label={t('spaces.createSpace.cancel')}
              variant="ghost"
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
              style={styles.cancelButton}
            />
          </View>

          {owner ? (
            <Button
              label={t('spaces.details.deactivate')}
              variant="ghost"
              onPress={() => confirmDeactivate(spaceId, name)}
              loading={isDeactivating}
              disabled={isSubmitting || isLoading || isDeactivating}
              style={styles.deactivateButton}
            />
          ) : null}
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
  readOnlyCard: {
    marginBottom: spacing.lg,
  },
  readOnlyLabel: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  readOnlyValue: {
    ...typography.bodyStrong,
  },
  footer: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.xs,
  },
  deactivateButton: {
    borderColor: '#FECACA',
    marginTop: spacing.lg,
  },
});
