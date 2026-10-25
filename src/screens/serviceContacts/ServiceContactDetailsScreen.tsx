import React, { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Mail, MapPin, Phone, StickyNote, UserRound } from 'lucide-react-native';
import { serviceContactsApi, type ServiceContact } from '../../api/serviceContactsApi';
import { ApiError } from '../../api/types';
import { Button, EmptyState } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { displayPhone, mailtoHref, telHref, whatsappHref } from '../../utils/serviceContactLinks';

type Route = RouteProp<MainStackParamList, 'ServiceContactDetails'>;
type Nav = NativeStackNavigationProp<MainStackParamList, 'ServiceContactDetails'>;

export function ServiceContactDetailsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const userId = useAuthStore(state => state.userId);
  const showToast = useToastStore(state => state.showToast);
  const [contact, setContact] = useState<ServiceContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setContact(null);
    try {
      setContact(await serviceContactsApi.get(route.params.contactId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('serviceContacts.loadError'));
    } finally {
      setLoading(false);
    }
  }, [route.params.contactId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, userId]),
  );

  async function openUrl(url: string | null) {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      showToast(t('serviceContacts.openFailed'));
    }
  }

  function archive() {
    if (!contact) return;
    Alert.alert(t('serviceContacts.archiveConfirmTitle'), t('serviceContacts.archiveConfirmBody'), [
      { text: t('serviceContacts.cancel'), style: 'cancel' },
      {
        text: t('serviceContacts.archive'),
        style: 'destructive',
        onPress: () => {
          void serviceContactsApi
            .archive(contact.id)
            .then(() => {
              showToast(t('serviceContacts.archived'));
              navigation.goBack();
            })
            .catch((err: unknown) => {
              showToast(err instanceof Error ? err.message : t('serviceContacts.saveError'));
            });
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.meta}>{t('serviceContacts.loading')}</Text>
      </View>
    );
  }
  if (!contact) {
    return (
      <View style={styles.center}>
        <EmptyState title={error ?? t('serviceContacts.loadError')} />
        <Button label={t('serviceContacts.retry')} onPress={() => void load()} />
      </View>
    );
  }

  const phone = displayPhone(contact.primaryPhone);
  const alternate = displayPhone(contact.alternatePhone);
  const whatsapp = displayPhone(contact.whatsappPhone);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.name}>{contact.businessName}</Text>
        <Text style={styles.meta}>{contact.categoryLabel}</Text>
        {contact.contactPersonName ? <Line icon={<UserRound size={16} color={colors.primaryDark} />} text={contact.contactPersonName} /> : null}
        {phone ? <Line icon={<Phone size={16} color={colors.primaryDark} />} text={phone} /> : null}
        {alternate ? <Line icon={<Phone size={16} color={colors.primaryDark} />} text={alternate} /> : null}
        {whatsapp ? <Line icon={<Phone size={16} color={colors.primaryDark} />} text={`${t('serviceContacts.whatsapp')} ${whatsapp}`} /> : null}
        {contact.email ? <Line icon={<Mail size={16} color={colors.primaryDark} />} text={contact.email} /> : null}
        {contact.address ? <Line icon={<MapPin size={16} color={colors.primaryDark} />} text={contact.address} /> : null}
        {contact.description ? <Text style={styles.body}>{contact.description}</Text> : null}
        {contact.notes ? (
          <Line icon={<StickyNote size={16} color={colors.primaryDark} />} text={contact.notes} />
        ) : null}
        <Text style={styles.meta}>
          {contact.spaces.length > 0
            ? contact.spaces.map(space => space.name).join(', ')
            : t('serviceContacts.noSpaces')}
        </Text>
      </View>
      <View style={styles.actions}>
        {telHref(contact.primaryPhone) ? (
          <Button label={t('serviceContacts.call')} variant="secondary" onPress={() => void openUrl(telHref(contact.primaryPhone))} />
        ) : null}
        {whatsappHref(contact.whatsappPhone || contact.primaryPhone) ? (
          <Button
            label={t('serviceContacts.whatsapp')}
            variant="secondary"
            onPress={() => void openUrl(whatsappHref(contact.whatsappPhone || contact.primaryPhone))}
          />
        ) : null}
        {mailtoHref(contact.email) ? (
          <Button label={t('serviceContacts.email')} variant="secondary" onPress={() => void openUrl(mailtoHref(contact.email))} />
        ) : null}
        {contact.canEdit ? (
          <Button
            label={t('serviceContacts.edit')}
            onPress={() => navigation.navigate('ServiceContactForm', { contactId: contact.id })}
          />
        ) : null}
        {contact.canArchive ? (
          <Button label={t('serviceContacts.archive')} variant="secondary" onPress={archive} />
        ) : null}
      </View>
    </ScrollView>
  );
}

function Line({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.line}>
      {icon}
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  name: { ...typography.h2, color: colors.textPrimary },
  meta: { ...typography.body, color: colors.textSecondary },
  body: { ...typography.body, color: colors.textPrimary, flex: 1 },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  actions: { gap: spacing.sm },
});
