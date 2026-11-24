import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Archive,
  Check,
  ChevronRight,
  MessageCircle,
  Pencil,
  Phone,
  UserRound,
} from 'lucide-react-native';
import { serviceContactsApi, type ServiceContact } from '../../api/serviceContactsApi';
import { ApiError } from '../../api/types';
import { useOptionalContactOptions } from '../../components/contact';
import { Button, EmptyState, HeaderBackButton } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { openContactDialer, openContactWhatsApp } from '../../utils/contactActions';
import { categoryVisual } from '../../utils/serviceContactCategoryVisual';
import { displayPhone, serviceContactNumbers } from '../../utils/serviceContactLinks';

type Route = RouteProp<MainStackParamList, 'ServiceContactDetails'>;
type Nav = NativeStackNavigationProp<MainStackParamList, 'ServiceContactDetails'>;

export function ServiceContactDetailsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const userId = useAuthStore(state => state.userId);
  const showToast = useToastStore(state => state.showToast);
  const { openContactOptions } = useOptionalContactOptions();
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'left',
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
      headerTitle: () => (
        <View style={styles.navTitle}>
          <Text style={styles.navHeading} numberOfLines={1}>
            {t('serviceContacts.detailsTitle', { defaultValue: 'Contact Details' })}
          </Text>
          <Text style={styles.navSubtitle} numberOfLines={1}>
            {t('serviceContacts.detailsSubtitle', { defaultValue: 'Service provider information' })}
          </Text>
        </View>
      ),
    });
  }, [navigation, t]);

  function openSheet(phone: string) {
    if (!contact) return;
    openContactOptions({
      phoneNumber: phone,
      displayName: contact.contactPersonName || contact.businessName,
      organizationName: contact.businessName,
      presentation: 'service',
    });
  }

  function missingNumber() {
    showToast(t('contact.invalid', { defaultValue: 'Phone number is not available' }));
  }

  async function callNumber(phone: string | null | undefined) {
    if (!phone) {
      missingNumber();
      return;
    }
    const result = await openContactDialer(phone);
    if (result !== 'opened') {
      showToast(t('serviceContacts.openFailed'));
    }
  }

  async function whatsappNumber(phone: string | null | undefined) {
    if (!phone) {
      missingNumber();
      return;
    }
    const result = await openContactWhatsApp(phone);
    if (result !== 'opened') {
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

  const visual = categoryVisual(contact.category, contact.categoryLabel);
  const Icon = visual.icon;
  const numbers = serviceContactNumbers(contact);
  const primary = numbers[0] ?? null;
  const whatsapp = contact.whatsappPhone || primary;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.root}>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: visual.iconBg }]}>
          <Icon size={26} color={visual.iconColor} strokeWidth={2.2} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroName}>{contact.businessName}</Text>
          <Text style={styles.heroService}>{contact.categoryLabel}</Text>
        </View>
        {contact.active ? (
          <View style={styles.activeBadge}>
            <Check size={12} color={colors.teal} strokeWidth={2.8} />
            <Text style={styles.activeText}>{t('serviceContacts.active', { defaultValue: 'Active' })}</Text>
          </View>
        ) : null}
      </View>

      {contact.contactPersonName ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('serviceContacts.contactPerson')}</Text>
          <View style={styles.personRow}>
            <UserRound size={18} color={colors.teal} strokeWidth={2.2} />
            <Text style={styles.personName}>{contact.contactPersonName}</Text>
          </View>
        </View>
      ) : null}

      {numbers.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {t('serviceContacts.contactNumbers', { defaultValue: 'Contact Numbers' })}
          </Text>
          {numbers.map(phone => {
            const shown = displayPhone(phone) ?? phone;
            return (
              <View key={phone} style={styles.numberRow}>
                <Phone size={16} color={colors.teal} strokeWidth={2.2} />
                <Pressable onPress={() => openSheet(phone)} style={styles.numberPress}>
                  <Text style={styles.numberText} numberOfLines={1}>
                    {shown}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void callNumber(phone)}
                  style={styles.roundBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t('serviceContacts.call')}>
                  <Phone size={16} color={colors.teal} strokeWidth={2.2} />
                </Pressable>
                <Pressable
                  onPress={() => void whatsappNumber(phone)}
                  style={styles.roundBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t('serviceContacts.whatsapp')}>
                  <MessageCircle size={16} color={colors.teal} strokeWidth={2.2} />
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            if (!primary) {
              missingNumber();
              return;
            }
            if (numbers.length > 1) {
              openSheet(primary);
              return;
            }
            void callNumber(primary);
          }}
          style={({ pressed }) => [styles.callBtn, pressed && styles.pressed]}
          accessibilityRole="button">
          <Phone size={16} color={colors.teal} strokeWidth={2.4} />
          <Text style={styles.callLabel}>{t('serviceContacts.call')}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (!whatsapp) {
              missingNumber();
              return;
            }
            if (numbers.length > 1) {
              openSheet(whatsapp);
              return;
            }
            void whatsappNumber(whatsapp);
          }}
          style={({ pressed }) => [styles.whatsAppBtn, pressed && styles.pressed]}
          accessibilityRole="button">
          <MessageCircle size={16} color={colors.white} strokeWidth={2.4} />
          <Text style={styles.whatsAppLabel}>{t('serviceContacts.whatsapp')}</Text>
        </Pressable>
      </View>

      {contact.canEdit ? (
        <Pressable
          onPress={() => navigation.navigate('ServiceContactForm', { contactId: contact.id })}
          style={styles.menuRow}
          accessibilityRole="button">
          <View style={styles.menuIcon}>
            <Pencil size={16} color={colors.teal} strokeWidth={2.2} />
          </View>
          <Text style={styles.menuLabel}>
            {t('serviceContacts.editContact', { defaultValue: 'Edit Contact' })}
          </Text>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>
      ) : null}
      {contact.canArchive ? (
        <Pressable onPress={archive} style={styles.menuRow} accessibilityRole="button">
          <View style={styles.menuIcon}>
            <Archive size={16} color={colors.teal} strokeWidth={2.2} />
          </View>
          <Text style={styles.menuLabel}>
            {t('serviceContacts.archiveContact', { defaultValue: 'Archive Contact' })}
          </Text>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  navTitle: { maxWidth: 240 },
  navHeading: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  navSubtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  meta: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.lightGreen,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.sm,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, minWidth: 0 },
  heroName: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '700',
  },
  heroService: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeText: {
    ...typography.caption,
    color: colors.teal,
    fontWeight: '700',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  personName: {
    ...typography.bodyStrong,
    fontSize: 16,
    fontWeight: '700',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
  },
  numberPress: { flex: 1, minWidth: 0 },
  numberText: {
    ...typography.bodyStrong,
    color: colors.teal,
    fontWeight: '700',
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  callBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: '#B7E7C9',
    backgroundColor: colors.lightGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  callLabel: {
    ...typography.bodyStrong,
    color: colors.teal,
    fontWeight: '700',
  },
  whatsAppBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  whatsAppLabel: {
    ...typography.bodyStrong,
    color: colors.white,
    fontWeight: '700',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    ...typography.bodyStrong,
    flex: 1,
    fontWeight: '700',
  },
  pressed: { opacity: 0.88 },
});
