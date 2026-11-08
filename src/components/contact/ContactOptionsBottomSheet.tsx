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
  X,
} from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import {
  canOpenContactOptions,
  contactDisplayNumber,
  copyContactNumber,
  openContactDialer,
  openContactMessageChooser,
  openContactSms,
  openContactWhatsApp,
  type ContactActionResult,
} from '../../utils/contactActions';
import { useToastStore } from '../../store/toastStore';

export type ContactOptionsTarget = {
  phoneNumber: string;
  displayName?: string | null;
  /** Optional relationship / role caption under the name. */
  roleLabel?: string | null;
  /** Single initial for avatar; derived from name when omitted. */
  avatarInitial?: string | null;
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
  const title = name
    ? t('contact.sheet.titleNamed', { name, defaultValue: `Contact ${name}` })
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
});
