import React, { useCallback } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Copy,
  MessageCircle,
  MessageSquareText,
  Phone,
  UserPlus,
  X,
} from 'lucide-react-native';
import { colors, fontSize, radius, shadows, spacing, typography } from '../../theme';
import {
  canOpenContactOptions,
  contactDisplayNumber,
  copyContactNumber,
  openContactDialer,
  openContactMessageChooser,
  openContactSms,
  openContactWhatsApp,
  openSaveContact,
  type ContactActionResult,
} from '../../utils/contactActions';
import { contactInitials } from '../../utils/serviceContactLinks';
import { useToastStore } from '../../store/toastStore';

export type ContactOptionsTarget = {
  phoneNumber: string;
  displayName?: string | null;
  /** Optional relationship / role caption under the name. */
  roleLabel?: string | null;
  /** Single initial for avatar; derived from name when omitted. */
  avatarInitial?: string | null;
  /** Service provider / business shown beside the person on the service sheet. */
  organizationName?: string | null;
  /** Service-contact sheet matches the approved contact-action mockup. */
  presentation?: 'member' | 'service';
};

type ContactOptionsBottomSheetProps = {
  visible: boolean;
  target: ContactOptionsTarget | null;
  onClose: () => void;
};

function WhatsAppGlyph({ size = 18, color = colors.primaryDark }: { size?: number; color?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <MessageCircle size={Math.round(size * 0.62)} color={colors.white} strokeWidth={2.6} />
    </View>
  );
}

export function ContactOptionsBottomSheet({
  visible,
  target,
  onClose,
}: ContactOptionsBottomSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore(state => state.showToast);

  const phone = target?.phoneNumber ?? '';
  const display = contactDisplayNumber(phone) ?? phone;
  const name = target?.displayName?.trim() || '';
  const titledName =
    name || (target?.presentation === 'service' ? target.organizationName?.trim() || '' : '');
  const title = titledName
    ? t('contact.sheet.titleNamed', { name: titledName, defaultValue: `Contact ${titledName}` })
    : t('contact.sheet.title', { defaultValue: 'Contact Member' });
  const initial =
    (target?.avatarInitial?.trim() || name.charAt(0) || display.charAt(0) || '?').toUpperCase();

  const report = useCallback(
    (result: ContactActionResult) => {
      if (result === 'copied') {
        showToast(t('contact.copied', { defaultValue: 'Number copied' }));
        return;
      }
      if (result === 'unavailable') {
        showToast(
          t('contact.unavailable', {
            defaultValue: 'No app available to complete this action',
          }),
        );
        return;
      }
      if (result === 'invalid') {
        showToast(t('contact.invalid', { defaultValue: 'Phone number is not available' }));
      }
    },
    [showToast, t],
  );

  const run = useCallback(
    async (action: () => Promise<ContactActionResult> | ContactActionResult) => {
      onClose();
      const result = await action();
      report(result);
    },
    [onClose, report],
  );

  if (!visible || !target || !canOpenContactOptions(phone)) {
    return null;
  }

  if (target.presentation === 'service') {
    const organization = target.organizationName?.trim() || '';
    const initials = contactInitials(name || organization);
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
            onPress={event => event.stopPropagation()}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
                hitSlop={8}>
                <X size={18} color={colors.textSecondary} strokeWidth={2.4} />
              </Pressable>
            </View>
            <Text style={styles.subtitle}>
              {t('serviceContacts.sheetSubtitle', {
                defaultValue: 'Choose how you want to get in touch.',
              })}
            </Text>

            <View style={styles.identityCard}>
              <View style={styles.serviceAvatar}>
                <Text style={styles.serviceAvatarText}>{initials}</Text>
              </View>
              <View style={styles.identityDivider} />
              <View style={styles.identityText}>
                <Text style={styles.identityName} numberOfLines={1}>
                  {name || organization}
                </Text>
                {organization ? (
                  <Text style={styles.identityOrg} numberOfLines={1}>
                    {organization}
                  </Text>
                ) : null}
              </View>
            </View>

            <Text style={styles.numberLabel}>
              {t('serviceContacts.contactNumber', { defaultValue: 'Contact Number' })}
            </Text>
            <View style={styles.numberCard}>
              <Phone size={16} color={colors.teal} strokeWidth={2.2} />
              <Text style={styles.numberValue} numberOfLines={1}>
                {display}
              </Text>
              <Pressable
                onPress={() => void run(() => copyContactNumber(phone))}
                style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('contact.copy', { defaultValue: 'Copy number' })}
                hitSlop={6}>
                <Copy size={16} color={colors.teal} strokeWidth={2.2} />
              </Pressable>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => void run(() => openContactDialer(phone))}
                style={({ pressed }) => [styles.callNow, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('serviceContacts.callNow', { defaultValue: 'Call Now' })}>
                <Phone size={18} color={colors.white} strokeWidth={2.4} />
                <View style={styles.actionText}>
                  <Text style={styles.callNowLabel}>
                    {t('serviceContacts.callNow', { defaultValue: 'Call Now' })}
                  </Text>
                  <Text style={styles.callNowHint}>
                    {t('serviceContacts.openDialer', { defaultValue: 'Open phone dialer' })}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => void run(() => openContactWhatsApp(phone))}
                style={({ pressed }) => [styles.whatsAppNow, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('serviceContacts.whatsapp', { defaultValue: 'WhatsApp' })}>
                <MessageCircle size={18} color={colors.teal} strokeWidth={2.4} />
                <View style={styles.actionText}>
                  <Text style={styles.whatsAppLabel}>
                    {t('serviceContacts.whatsapp', { defaultValue: 'WhatsApp' })}
                  </Text>
                  <Text style={styles.whatsAppHint}>
                    {t('serviceContacts.openWhatsapp', { defaultValue: 'Open in WhatsApp' })}
                  </Text>
                </View>
              </Pressable>
            </View>

            <Text style={styles.serviceSectionTitle}>
              {t('serviceContacts.moreOptions', { defaultValue: 'More Options' })}
            </Text>
            <View>
              <ServiceOption
                icon={<MessageSquareText size={18} color={colors.teal} strokeWidth={2.2} />}
                label={t('serviceContacts.sendSms', { defaultValue: 'Send SMS' })}
                hint={t('serviceContacts.sendSmsHint', { defaultValue: 'Open messaging app' })}
                onPress={() => void run(() => openContactSms(phone))}
              />
              <ServiceOption
                icon={<Copy size={18} color={colors.teal} strokeWidth={2.2} />}
                label={t('serviceContacts.copyNumber', { defaultValue: 'Copy Number' })}
                hint={t('serviceContacts.copyHint', { defaultValue: 'Copy to clipboard' })}
                onPress={() => void run(() => copyContactNumber(phone))}
              />
              <ServiceOption
                icon={<UserPlus size={18} color={colors.teal} strokeWidth={2.2} />}
                label={t('serviceContacts.saveToContacts', { defaultValue: 'Save to Contacts' })}
                hint={t('serviceContacts.saveToContactsHint', {
                  defaultValue: 'Add to your phone contacts',
                })}
                onPress={() => void run(() => openSaveContact(phone, name || organization))}
                isLast
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
          onPress={event => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              hitSlop={8}>
              <X size={18} color={colors.textSecondary} strokeWidth={2.4} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            {t('contact.sheet.subtitle', {
              defaultValue: 'Choose how you want to contact this person.',
            })}
          </Text>

          <View style={styles.personRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.personText}>
              {name ? (
                <Text style={styles.personName} numberOfLines={1}>
                  {name}
                </Text>
              ) : null}
              <View style={styles.phoneRow}>
                <Phone size={14} color={colors.primaryDark} strokeWidth={2.2} />
                <Text style={styles.personPhone} numberOfLines={1}>
                  {display}
                </Text>
              </View>
              {target.roleLabel ? (
                <Text style={styles.roleLabel} numberOfLines={1}>
                  {target.roleLabel}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.primaryRow}>
            <Pressable
              onPress={() => void run(() => openContactDialer(phone))}
              style={({ pressed }) => [styles.primaryCard, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('contact.call', { defaultValue: 'Call' })}>
              <Phone size={28} color={colors.primaryDark} strokeWidth={2} />
              <Text style={styles.primaryLabel}>
                {t('contact.call', { defaultValue: 'Call' })}
              </Text>
              <Text style={styles.primaryHint}>
                {t('contact.callHint', { defaultValue: 'Open phone dialer' })}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void run(() => openContactMessageChooser(phone))}
              style={({ pressed }) => [styles.primaryCard, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('contact.message', { defaultValue: 'Message' })}>
              <MessageSquareText size={28} color={colors.primaryDark} strokeWidth={2} />
              <Text style={styles.primaryLabel}>
                {t('contact.message', { defaultValue: 'Message' })}
              </Text>
              <Text style={styles.primaryHint}>
                {t('contact.messageHint', { defaultValue: 'Choose messaging app' })}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>
            {t('contact.messagingOptions', { defaultValue: 'Messaging options' })}
          </Text>
          <ScrollView style={styles.list} bounces={false}>
            <OptionRow
              icon={<MessageSquareText size={18} color={colors.primaryDark} strokeWidth={2.2} />}
              label={t('contact.sms', { defaultValue: 'SMS' })}
              onPress={() => void run(() => openContactSms(phone))}
            />
            <OptionRow
              icon={<WhatsAppGlyph />}
              label={t('contact.whatsapp', { defaultValue: 'WhatsApp' })}
              onPress={() => void run(() => openContactWhatsApp(phone))}
            />
            <OptionRow
              icon={<Copy size={18} color={colors.primaryDark} strokeWidth={2.2} />}
              label={t('contact.copy', { defaultValue: 'Copy number' })}
              onPress={() => void run(() => copyContactNumber(phone))}
              isLast
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ServiceOption({
  icon,
  label,
  hint,
  onPress,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.serviceOption, !isLast && styles.serviceOptionGap, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={styles.optionIcon}>{icon}</View>
      <View style={styles.serviceOptionText}>
        <Text style={styles.serviceOptionLabel}>{label}</Text>
        <Text style={styles.serviceOptionHint}>{hint}</Text>
      </View>
      <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
    </Pressable>
  );
}

function OptionRow({
  icon,
  label,
  onPress,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        !isLast && styles.optionBorder,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={styles.optionIcon}>{icon}</View>
      <Text style={styles.optionLabel}>{label}</Text>
      <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...shadows.raised,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    fontSize: 20,
    lineHeight: 26,
    flex: 1,
    minWidth: 0,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.bodyStrong,
    color: '#1D4ED8',
    fontSize: 18,
  },
  personText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  personName: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  personPhone: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '600',
    flexShrink: 1,
  },
  roleLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  primaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: `${colors.primary}55`,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  primaryLabel: {
    ...typography.bodyStrong,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  primaryHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.bodyStrong,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  list: {
    flexGrow: 0,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.sm,
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.88,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.lightGreen,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  serviceAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceAvatarText: {
    ...typography.bodyStrong,
    color: colors.teal,
    fontSize: 16,
    fontWeight: '700',
  },
  identityDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#C6EBD7',
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  identityName: {
    ...typography.bodyStrong,
    fontSize: 16,
    fontWeight: '700',
  },
  identityOrg: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  numberLabel: {
    ...typography.bodyStrong,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  numberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    marginBottom: spacing.md,
  },
  numberValue: {
    ...typography.bodyStrong,
    color: colors.teal,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  callNow: {
    flex: 1,
    minHeight: 64,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  whatsAppNow: {
    flex: 1,
    minHeight: 64,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: '#B7E7C9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    flexShrink: 1,
  },
  callNowLabel: {
    ...typography.bodyStrong,
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  callNowHint: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
  },
  whatsAppLabel: {
    ...typography.bodyStrong,
    color: colors.teal,
    fontWeight: '700',
    fontSize: 14,
  },
  whatsAppHint: {
    ...typography.caption,
    color: colors.teal,
    fontSize: 11,
  },
  serviceSectionTitle: {
    ...typography.bodyStrong,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  serviceOptionGap: {
    marginBottom: spacing.xs,
  },
  serviceOptionText: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  serviceOptionLabel: {
    fontFamily: typography.bodyStrong.fontFamily,
    fontSize: fontSize.md,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    includeFontPadding: false,
  },
  serviceOptionHint: {
    fontFamily: typography.caption.fontFamily,
    fontSize: fontSize.sm,
    lineHeight: 16,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
});
