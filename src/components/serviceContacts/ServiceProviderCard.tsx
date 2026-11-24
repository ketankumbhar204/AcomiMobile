import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Phone, UserRound } from 'lucide-react-native';
import type { ServiceContact } from '../../api/serviceContactsApi';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { categoryVisual } from '../../utils/serviceContactCategoryVisual';
import { displayPhone } from '../../utils/serviceContactLinks';

type ServiceProviderCardProps = {
  contact: ServiceContact;
  onOpen: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  onPhonePress: () => void;
};

export function ServiceProviderCard({
  contact,
  onOpen,
  onCall,
  onWhatsApp,
  onPhonePress,
}: ServiceProviderCardProps) {
  const { t } = useTranslation();
  const visual = categoryVisual(contact.category, contact.categoryLabel);
  const Icon = visual.icon;
  const phone = displayPhone(contact.primaryPhone || contact.whatsappPhone);
  const person = contact.contactPersonName?.trim() || '';

  return (
    <View style={styles.card}>
      <Pressable onPress={onOpen} accessibilityRole="button" style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: visual.iconBg }]}>
          <Icon size={22} color={visual.iconColor} strokeWidth={2.2} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {contact.businessName}
          </Text>
          <Text style={styles.service} numberOfLines={1}>
            {contact.categoryLabel}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: visual.badgeBg }]}>
          <Text style={[styles.badgeText, { color: visual.badgeColor }]} numberOfLines={1}>
            {visual.shortLabel}
          </Text>
        </View>
      </Pressable>

      {person || phone ? (
        <View style={styles.personRow}>
          {person ? (
            <View style={styles.personPart}>
              <UserRound size={15} color={colors.textSecondary} strokeWidth={2.2} />
              <Text style={styles.personName} numberOfLines={1}>
                {person}
              </Text>
            </View>
          ) : null}
          {person && phone ? <View style={styles.divider} /> : null}
          {phone ? (
            <Pressable
              onPress={onPhonePress}
              style={styles.phonePart}
              accessibilityRole="button"
              accessibilityLabel={phone}>
              <Phone size={15} color={colors.teal} strokeWidth={2.2} />
              <Text style={styles.phone} numberOfLines={1}>
                {phone}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          onPress={onCall}
          style={({ pressed }) => [styles.callBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('serviceContacts.call')}>
          <Phone size={16} color={colors.teal} strokeWidth={2.4} />
          <Text style={styles.callLabel}>{t('serviceContacts.call')}</Text>
        </Pressable>
        <Pressable
          onPress={onWhatsApp}
          style={({ pressed }) => [styles.whatsAppBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('serviceContacts.whatsapp')}>
          <MessageCircle size={16} color={colors.white} strokeWidth={2.4} />
          <Text style={styles.whatsAppLabel}>{t('serviceContacts.whatsapp')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.bodyStrong,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  service: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 110,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  personPart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  personName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    flexShrink: 1,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  phonePart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  phone: {
    ...typography.body,
    color: colors.teal,
    fontWeight: '700',
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  callBtn: {
    flex: 1,
    minHeight: 44,
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
    minHeight: 44,
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
  pressed: {
    opacity: 0.88,
  },
});
