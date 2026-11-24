import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { serviceContactsApi } from '../../api/serviceContactsApi';
import { CategorySelectField } from '../../components/serviceContacts/CategorySelectField';
import { Button, FormInput } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { readDuplicate } from '../../utils/serviceContactErrors';
import {
  draftFromContact,
  emptyDraft,
  toSaveBody,
  validateServiceContactDraft,
  type ServiceContactDraft,
} from '../../utils/serviceContactForm';
import { normalizeIndianMobileDigits } from '../../utils/indianMobile';

type Route = RouteProp<MainStackParamList, 'ServiceContactForm'>;
type Nav = NativeStackNavigationProp<MainStackParamList, 'ServiceContactForm'>;

const FIELD_MESSAGE: Record<string, string> = {
  name_required: 'serviceContacts.requiredName',
  category_required: 'serviceContacts.requiredCategory',
  custom_required: 'serviceContacts.requiredCustom',
  method_required: 'serviceContacts.requiredMethod',
  phone_invalid: 'serviceContacts.invalidPhone',
  email_invalid: 'serviceContacts.invalidEmail',
};

export function ServiceContactFormScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const contactId = route.params?.contactId;
  const showToast = useToastStore(state => state.showToast);
  const [draft, setDraft] = useState<ServiceContactDraft>(emptyDraft());
  const [baseline, setBaseline] = useState('');
  const [categories, setCategories] = useState<{ code: string; label: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(contactId));
  const skipGuard = useRef(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const categoryRows = await serviceContactsApi.categories();
        if (!active) return;
        setCategories(categoryRows);
        if (contactId) {
          const contact = await serviceContactsApi.get(contactId);
          if (!active) return;
          const next = draftFromContact(contact);
          setDraft(next);
          setBaseline(JSON.stringify(next));
        } else {
          setBaseline(JSON.stringify(emptyDraft()));
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : t('serviceContacts.loadError'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [contactId, showToast, t]);

  const dirty = JSON.stringify(draft) !== baseline;

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (!dirty || saving || skipGuard.current) return;
      event.preventDefault();
      Alert.alert(t('serviceContacts.unsavedTitle'), t('serviceContacts.unsavedBody'), [
        { text: t('serviceContacts.cancel'), style: 'cancel' },
        {
          text: t('serviceContacts.discard'),
          style: 'destructive',
          onPress: () => navigation.dispatch(event.data.action),
        },
      ]);
    });
    return unsubscribe;
  }, [dirty, navigation, saving, t]);

  function setField<K extends keyof ServiceContactDraft>(key: K, value: ServiceContactDraft[K]) {
    setDraft(current => ({ ...current, [key]: value }));
    setErrors(current => {
      const next = { ...current };
      delete next[key as string];
      delete next.contactMethod;
      return next;
    });
  }

  async function persist(acknowledgeDuplicate: boolean) {
    const nextErrors = validateServiceContactDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    try {
      const body = toSaveBody(draft, acknowledgeDuplicate);
      const saved = contactId
        ? await serviceContactsApi.update(contactId, body)
        : await serviceContactsApi.create(body);
      skipGuard.current = true;
      setBaseline(JSON.stringify(draftFromContact(saved)));
      showToast(t('serviceContacts.saved'));
      navigation.replace('ServiceContactDetails', { contactId: saved.id });
    } catch (error) {
      const duplicate = readDuplicate(error);
      if (duplicate) {
        const names = duplicate.matches.map(match => match.businessName).filter(Boolean).join(', ');
        Alert.alert(
          t('serviceContacts.duplicateTitle'),
          `${duplicate.strong ? t('serviceContacts.duplicateStrong') : t('serviceContacts.duplicateBody')}${names ? `\n${names}` : ''}`,
          [
            { text: t('serviceContacts.cancel'), style: 'cancel' },
            { text: t('serviceContacts.saveAnyway'), onPress: () => void persist(true) },
          ],
        );
        return;
      }
      showToast(error instanceof Error ? error.message : t('serviceContacts.saveError'));
    } finally {
      setSaving(false);
    }
  }

  function fieldError(key: string): string | undefined {
    const code = errors[key];
    return code ? t(FIELD_MESSAGE[code] ?? 'serviceContacts.saveError') : undefined;
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.hint}>{t('serviceContacts.loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <Text style={styles.hint}>{t('serviceContacts.reuseHint')}</Text>
        <FormInput
          label={t('serviceContacts.businessName')}
          value={draft.businessName}
          error={fieldError('businessName')}
          onChangeText={value => setField('businessName', value)}
        />
        <CategorySelectField
          label={t('serviceContacts.category')}
          value={draft.category}
          options={categories}
          error={fieldError('category')}
          onChange={code => setField('category', code)}
        />
        {draft.category === 'OTHER' ? (
          <FormInput
            label={t('serviceContacts.customCategory')}
            value={draft.customCategoryName}
            error={fieldError('customCategoryName')}
            onChangeText={value => setField('customCategoryName', value)}
          />
        ) : null}
        <FormInput
          label={`${t('serviceContacts.contactPerson')} (${t('serviceContacts.optional')})`}
          value={draft.contactPersonName}
          onChangeText={value => setField('contactPersonName', value)}
        />
        <FormInput
          label={t('serviceContacts.primaryPhone')}
          prefix="+91"
          keyboardType="phone-pad"
          value={draft.primaryPhone}
          error={fieldError('primaryPhone')}
          onChangeText={value => setField('primaryPhone', normalizeIndianMobileDigits(value))}
        />
        <FormInput
          label={`${t('serviceContacts.alternatePhone')} (${t('serviceContacts.optional')})`}
          prefix="+91"
          keyboardType="phone-pad"
          value={draft.alternatePhone}
          error={fieldError('alternatePhone')}
          onChangeText={value => setField('alternatePhone', normalizeIndianMobileDigits(value))}
        />
        <FormInput
          label={`${t('serviceContacts.whatsappNumber')} (${t('serviceContacts.optional')})`}
          prefix="+91"
          keyboardType="phone-pad"
          value={draft.whatsappPhone}
          error={fieldError('whatsappPhone')}
          onChangeText={value => setField('whatsappPhone', normalizeIndianMobileDigits(value))}
        />
        <FormInput
          label={`${t('serviceContacts.emailLabel')} (${t('serviceContacts.optional')})`}
          keyboardType="email-address"
          autoCapitalize="none"
          value={draft.email}
          error={fieldError('email') ?? fieldError('contactMethod')}
          onChangeText={value => setField('email', value)}
        />
        <FormInput
          label={`${t('serviceContacts.description')} (${t('serviceContacts.optional')})`}
          value={draft.description}
          onChangeText={value => setField('description', value)}
        />
        <FormInput
          label={`${t('serviceContacts.address')} (${t('serviceContacts.optional')})`}
          value={draft.address}
          onChangeText={value => setField('address', value)}
        />
        <FormInput
          label={`${t('serviceContacts.notes')} (${t('serviceContacts.optional')})`}
          value={draft.notes}
          multiline
          onChangeText={value => setField('notes', value)}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label={t('serviceContacts.cancel')}
          variant="secondary"
          style={styles.footerButton}
          onPress={() => navigation.goBack()}
        />
        <Button
          label={t('serviceContacts.save')}
          loading={saving}
          disabled={saving}
          style={styles.footerButton}
          onPress={() => void persist(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xs },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerButton: { flex: 1 },
});
