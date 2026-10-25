import React, { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { enquiryApi } from '../../api/enquiryApi';
import { Button } from '../ui/Button';
import { FormInput } from '../ui/FormInput';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { androidModalNavigationInset } from '../../utils/modalSafeInsets';
import {
  buildPhotoRequestMessage,
  confirmPhotoRequest,
  hasActualListingPhotos,
  photoRequestActionLabel,
  photoRequestTitle,
  type PhotoRequestKind,
} from '../../utils/photoRequest';

type PhotoRequestActionProps = {
  spaceId: string;
  kind: PhotoRequestKind;
  name: string;
  spaceType?: string | null;
  location?: string | null;
  photoUrls?: ReadonlyArray<string | null | undefined> | null;
  /** Return false to keep the WhatsApp dialog closed, for example while payment is required. */
  onBeforeOpen?: () => boolean;
  /** Increment to open the dialog after payment is confirmed. */
  openToken?: number;
};

export function PhotoRequestAction({
  spaceId,
  kind,
  name,
  spaceType,
  location,
  photoUrls,
  onBeforeOpen,
  openToken = 0,
}: PhotoRequestActionProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const hasPhotos = hasActualListingPhotos(photoUrls);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const label = photoRequestActionLabel(hasPhotos);
  const title = photoRequestTitle(kind, hasPhotos);
  const bottomInset = Math.max(insets.bottom, androidModalNavigationInset());

  function openComposer() {
    setMessage(buildPhotoRequestMessage({ kind, hasPhotos, name, spaceType, location }));
    setNotice('');
    setOpen(true);
  }

  function openRequest() {
    if (onBeforeOpen && !onBeforeOpen()) return;
    openComposer();
  }

  const seenOpenToken = useRef(0);
  useEffect(() => {
    if (!openToken || openToken === seenOpenToken.current) return;
    seenOpenToken.current = openToken;
    openComposer();
  }, [hasPhotos, kind, location, name, openToken, spaceType]);

  function closeRequest() {
    if (submittingRef.current) return;
    setOpen(false);
  }

  async function confirm() {
    if (submittingRef.current || !message.trim()) return;
    submittingRef.current = true;
    setSubmitting(true);
    setNotice('');
    try {
      const result = await confirmPhotoRequest({
        message,
        request: () => enquiryApi.requestPhotos(spaceId),
        openUrl: url => Linking.openURL(url),
      });
      if (result.whatsApp === 'opened') {
        setOpen(false);
        return;
      }
      setNotice(
        result.whatsApp === 'unavailable'
          ? result.notificationPersisted
            ? t('spaces.findPlace.photoRequestUnavailableSaved', {
                defaultValue:
                  'This listing doesn’t have a WhatsApp number we can open. The photo request was saved in ACOMI.',
              })
            : t('spaces.findPlace.photoRequestUnavailable', {
                defaultValue: 'This listing doesn’t have a WhatsApp number we can open.',
              })
          : result.notificationPersisted
            ? t('spaces.findPlace.photoRequestBlockedSaved', {
                defaultValue:
                  'WhatsApp didn’t open. The photo request was saved in ACOMI. You can try again.',
              })
            : t('spaces.findPlace.photoRequestBlocked', {
                defaultValue: 'WhatsApp didn’t open. You can try again.',
              }),
      );
    } catch (error) {
      const text = error instanceof Error ? error.message.trim() : '';
      setNotice(
        text ||
          t('spaces.findPlace.photoRequestFailed', {
            defaultValue: 'Couldn’t request photos. WhatsApp was not opened.',
          }),
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        label={label}
        variant="secondary"
        onPress={openRequest}
        testID="photo-request-open"
        accessibilityLabel={label}
        style={styles.launch}
      />
      <Modal visible={open} transparent animationType="slide" onRequestClose={closeRequest}>
        <Pressable style={styles.backdrop} onPress={closeRequest}>
          <Pressable
            style={[styles.sheet, { paddingBottom: spacing.lg + bottomInset }]}
            onPress={event => event.stopPropagation()}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.hint}>
              {t('spaces.findPlace.photoRequestHint', {
                defaultValue: 'You send this message yourself in WhatsApp. Opening WhatsApp does not send it.',
              })}
            </Text>
            <FormInput
              label={t('spaces.findPlace.photoRequestMessage', { defaultValue: 'Message' })}
              value={message}
              onChangeText={setMessage}
              multiline
              editable={!submitting}
              textAlignVertical="top"
              testID="photo-request-message"
              style={styles.input}
            />
            {notice ? (
              <Text testID="photo-request-notice" style={styles.notice}>
                {notice}
              </Text>
            ) : null}
            <View style={styles.actions}>
              <Button
                label={t('common.cancel', { defaultValue: 'Cancel' })}
                variant="ghost"
                onPress={closeRequest}
                disabled={submitting}
                testID="photo-request-cancel"
              />
              <Button
                label={t('spaces.findPlace.continueWhatsApp', { defaultValue: 'Continue to WhatsApp' })}
                onPress={() => void confirm()}
                loading={submitting}
                disabled={!message.trim()}
                testID="photo-request-confirm"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  launch: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: '#E7F6EE',
    borderColor: 'rgba(37, 211, 102, 0.45)',
  },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlayScrim },
  sheet: {
    ...shadows.raised,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  name: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  hint: { ...typography.caption, color: colors.textSecondary },
  input: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  notice: { ...typography.caption, color: colors.textSecondary },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
