import React, { useState } from 'react';
import { Linking, Modal, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';
import {
  buildPhotoRequestMessage,
  firstWhatsAppPhone,
  hasActualListingPhotos,
  photoRequestActionLabel,
  photoRequestTitle,
  whatsAppChatUrl,
  type PhotoRequestKind,
} from '../../utils/photoRequest';

type PhotoRequestActionProps = {
  kind: PhotoRequestKind;
  name: string;
  spaceType?: string | null;
  location?: string | null;
  photoUrls?: ReadonlyArray<string | null | undefined> | null;
  phones?: ReadonlyArray<string | null | undefined> | null;
  contactAuthorized: boolean;
  onNeedContact?: () => void;
};

export function PhotoRequestAction({
  kind,
  name,
  spaceType,
  location,
  photoUrls,
  phones,
  contactAuthorized,
  onNeedContact,
}: PhotoRequestActionProps) {
  const { t } = useTranslation();
  const hasPhotos = hasActualListingPhotos(photoUrls);
  const phone = contactAuthorized ? firstWhatsAppPhone(phones) : null;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const label = photoRequestActionLabel(hasPhotos);
  const title = photoRequestTitle(hasPhotos);

  function openRequest() {
    if (!contactAuthorized) {
      onNeedContact?.();
      return;
    }
    setMessage(buildPhotoRequestMessage({ kind, hasPhotos, name, spaceType, location }));
    setNotice('');
    setOpen(true);
  }

  async function openWhatsApp() {
    const url = phone ? whatsAppChatUrl(phone, message) : null;
    if (!url) {
      setNotice(
        t('spaces.findPlace.photoRequestUnavailable', {
          defaultValue: 'This contact number can’t be opened in WhatsApp.',
        }),
      );
      return;
    }
    try {
      await Linking.openURL(url);
      setOpen(false);
    } catch {
      try {
        await Share.share({ message: `${message}\n+${phone}` });
        setNotice(
          t('spaces.findPlace.photoRequestShare', {
            defaultValue: 'WhatsApp didn’t open. Share or copy the message and number instead.',
          }),
        );
      } catch {
        setNotice(
          t('spaces.findPlace.photoRequestBlocked', {
            defaultValue: 'WhatsApp didn’t open. Copy the message and contact number from this screen.',
          }),
        );
      }
    }
  }

  return (
    <>
      <Pressable
        onPress={openRequest}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.button}>
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.name}>{name}</Text>
            {phone ? (
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                accessibilityLabel={t('spaces.findPlace.photoRequestMessage', { defaultValue: 'Message' })}
                style={styles.input}
              />
            ) : (
              <Text style={styles.notice}>
                {t('spaces.findPlace.photoRequestUnavailable', {
                  defaultValue: 'This contact number can’t be opened in WhatsApp.',
                })}
              </Text>
            )}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            {phone ? (
              <Text selectable style={styles.phone}>
                +{phone}
              </Text>
            ) : null}
            <View style={styles.actions}>
              <Pressable onPress={() => setOpen(false)} style={styles.cancel} accessibilityRole="button">
                <Text style={styles.cancelText}>{t('common.cancel', { defaultValue: 'Cancel' })}</Text>
              </Pressable>
              {phone ? (
                <Pressable
                  onPress={() => void openWhatsApp()}
                  disabled={!message.trim()}
                  style={[styles.confirm, !message.trim() && styles.confirmDisabled]}
                  accessibilityRole="button">
                  <Text style={styles.confirmText}>
                    {t('spaces.findPlace.openWhatsApp', { defaultValue: 'Open WhatsApp' })}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.45)',
    backgroundColor: '#E7F6EE',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonText: { ...typography.caption, fontWeight: '700', color: colors.primaryDark },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(11, 28, 22, 0.45)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  name: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  notice: { ...typography.caption, color: colors.textSecondary },
  phone: { ...typography.caption, color: colors.textSecondary },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  cancel: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  cancelText: { ...typography.body, fontWeight: '600', color: colors.textSecondary },
  confirm: {
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  confirmDisabled: { opacity: 0.5 },
  confirmText: { ...typography.body, fontWeight: '700', color: colors.white },
});
