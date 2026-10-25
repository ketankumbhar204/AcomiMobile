import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { Button, FormInput } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { associableSpaces } from '../../utils/serviceContactAccess';
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
  const spaces = useSpaceStore(state => state.mySpaces);
  const choices = useMemo(() => associableSpaces(spaces), [spaces]);
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
        <Text style={styles.label}>{t('serviceContacts.category')}</Text>
        <View style={styles.chips}>
          {categories.map(category => {
            const selected = draft.category === category.code;
            return (
              <Pressable
                key={category.code}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setField('category', category.code)}
                style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{category.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {fieldError('category') ? <Text style={styles.error}>{fieldError('category')}</Text> : null}
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
        <Text style={styles.label}>{t('serviceContacts.spacesLabel')}</Text>
        <Text style={styles.hint}>{t('serviceContacts.reuseHint')}</Text>
        {choices.map(space => {
          const selected = draft.spaceIds.includes(space.spaceId);
          return (
            <Pressable
              key={space.spaceId}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() =>
                setField(
                  'spaceIds',
                  selected
                    ? draft.spaceIds.filter(id => id !== space.spaceId)
                    : [...draft.spaceIds, space.spaceId],
                )
              }
              style={styles.spaceRow}>
              <View style={[styles.box, selected && styles.boxSelected]} />
              <Text style={styles.rowText}>{space.spaceName}</Text>
            </Pressable>
          );
        })}
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  hint: { ...typography.body, color: colors.textSecondary },
  label: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  error: { ...typography.caption, color: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.lightGreen },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextSelected: { color: colors.primaryDark, fontWeight: '700' },
  spaceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  boxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  rowText: { ...typography.body, color: colors.textPrimary, flex: 1 },
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
