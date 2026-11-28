import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/adminApi';
import type {
  AdminUpdateListingMarketingRequest,
  ListingMarketingOutcome,
  SpaceType,
} from '../../api/types';
import {
  buildMessageForTemplate,
  customTemplateToSelectable,
  templatesForListing,
  type ListingMarketingKind,
  type ListingMarketingTemplate,
  type ListingMarketingTemplateKey,
} from '../../admin/marketing/listingMarketingTemplates';
import {
  MARKETING_MEDIA_MAX_FILES,
  marketingMediaKind,
  marketingMediaMaxMb,
  shareMarketingMediaNatively,
  validateMarketingMediaAddition,
  type MarketingMediaValidationCode,
  type SelectedMarketingMedia,
} from '../../admin/marketing/marketingMediaLimits';

type MarketingShareDeliveryMode = 'manual' | 'system_share';
import { Button } from '../ui';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { openContactDialer, openContactWhatsApp } from '../../utils/contactActions';
import { copyTextToClipboard } from '../../utils/copyTextToClipboard';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '../../utils/indianMobile';
import { whatsAppPhoneDigits } from '../../utils/photoRequest';
import { useToastStore } from '../../store/toastStore';

const CUSTOM_PHONE_VALUE = '__custom__';

export type AdminListingMarketingTarget =
  | { kind: 'property-registration'; id: string }
  | { kind: 'mess-registration'; id: string }
  | { kind: 'space'; id: string };

export type AdminListingMarketingShareDialogProps = {
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  target: AdminListingMarketingTarget;
  listingKind: ListingMarketingKind;
  spaceType?: SpaceType | null;
  name: string;
  ownerName?: string | null;
  location?: string | null;
  address?: string | null;
  rentOrPrice?: string | null;
  sharing?: string | null;
  amenities?: string | null;
  foodIncluded?: string | null;
  genderPolicy?: string | null;
  description?: string | null;
  phones: Array<string | null | undefined>;
  mode?: 'share' | 'call';
};

function uniquePhones(phones: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const phone of phones) {
    const digits = whatsAppPhoneDigits(phone);
    if (!digits || seen.has(digits)) continue;
    seen.add(digits);
    result.push(phone!.trim());
  }
  return result;
}

async function persistMarketing(
  target: AdminListingMarketingTarget,
  payload: AdminUpdateListingMarketingRequest,
) {
  if (target.kind === 'property-registration') {
    return adminApi.updatePropertyRegistrationMarketing(target.id, payload);
  }
  if (target.kind === 'mess-registration') {
    return adminApi.updateMessRegistrationMarketing(target.id, payload);
  }
  return adminApi.updateSpaceMarketing(target.id, payload);
}

export function AdminListingMarketingShareDialog({
  open,
  onClose,
  onUpdated,
  target,
  listingKind,
  spaceType,
  name,
  ownerName,
  location,
  address,
  rentOrPrice,
  sharing,
  amenities,
  foodIncluded,
  genderPolicy,
  description,
  phones,
  mode = 'share',
}: AdminListingMarketingShareDialogProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const availablePhones = useMemo(() => uniquePhones(phones), [phones]);
  const [customTemplates, setCustomTemplates] = useState<ListingMarketingTemplate[]>([]);
  const templates = useMemo(
    () => templatesForListing(listingKind, spaceType, customTemplates),
    [listingKind, spaceType, customTemplates],
  );
  const [templateKey, setTemplateKey] = useState<ListingMarketingTemplateKey>(
    templates[0]?.key ?? 'general_property',
  );
  const [message, setMessage] = useState('');
  const [messageDirty, setMessageDirty] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'compose' | 'confirmShare' | 'confirmCall'>('compose');
  const [media, setMedia] = useState<SelectedMarketingMedia[]>([]);
  const [mediaFallback, setMediaFallback] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<MarketingShareDeliveryMode>('manual');
  const busyRef = useRef(false);

  const messageFields = useMemo(
    () => ({
      name,
      spaceType: spaceType ?? (listingKind === 'MESS' ? 'MESS' : null),
      ownerName,
      location,
      address,
      rentOrPrice,
      sharing,
      amenities,
      foodIncluded,
      genderPolicy,
      description,
    }),
    [
      name,
      spaceType,
      listingKind,
      ownerName,
      location,
      address,
      rentOrPrice,
      sharing,
      amenities,
      foodIncluded,
      genderPolicy,
      description,
    ],
  );

  const resolvedPhone = useMemo(() => {
    if (selectedPhone === CUSTOM_PHONE_VALUE) {
      const digits = normalizeIndianMobileDigits(customPhone);
      return isValidIndianMobile(digits) ? digits : '';
    }
    return selectedPhone;
  }, [selectedPhone, customPhone]);

  const hasUsablePhone = Boolean(whatsAppPhoneDigits(resolvedPhone));

  const templateLabel = (template: ListingMarketingTemplate) => {
    if (template.builtin) {
      return t(`admin.marketing.templates.${template.key}`);
    }
    return template.name?.trim() || t('admin.marketing.custom');
  };

  const applySelectedTemplate = (
    key: ListingMarketingTemplateKey,
    list: ListingMarketingTemplate[],
  ) => {
    const template = list.find(item => item.key === key) ?? list[0];
    if (!template) return;
    setTemplateKey(template.key);
    setMessage(buildMessageForTemplate(template, messageFields));
    setMessageDirty(false);
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setSelectedPhone(availablePhones[0] ?? CUSTOM_PHONE_VALUE);
    setCustomPhone('');
    setPhase('compose');
    setBusy(false);
    busyRef.current = false;
    setMedia([]);
    setMediaFallback(false);
    setMessageDirty(false);
    setDeliveryMode('manual');

    const bootstrap = async () => {
      let customs: ListingMarketingTemplate[] = [];
      if (mode === 'share') {
        try {
          const rows = await adminApi.listListingMarketingTemplates({ activeOnly: true });
          customs = rows.map(customTemplateToSelectable);
        } catch {
          customs = [];
        }
      }
      if (cancelled) return;
      setCustomTemplates(customs);
      const merged = templatesForListing(listingKind, spaceType, customs);
      const first = merged[0];
      const nextKey = first?.key ?? 'general_property';
      setTemplateKey(nextKey);
      if (first) {
        setMessage(buildMessageForTemplate(first, messageFields));
      } else {
        setMessage('');
      }
      setMessageDirty(false);
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [open, mode, availablePhones, listingKind, spaceType, messageFields]);

  const validationMessage = (code: MarketingMediaValidationCode) => {
    switch (code) {
      case 'TOO_MANY':
        return t('admin.marketing.media.tooMany', { max: MARKETING_MEDIA_MAX_FILES });
      case 'UNSUPPORTED':
        return t('admin.marketing.media.unsupported');
      case 'IMAGE_TOO_LARGE':
        return t('admin.marketing.media.imageTooLarge', {
          maxMb: marketingMediaMaxMb('image'),
        });
      case 'VIDEO_TOO_LARGE':
        return t('admin.marketing.media.videoTooLarge', {
          maxMb: marketingMediaMaxMb('video'),
        });
      default:
        return t('admin.marketing.media.shareFailed');
    }
  };

  const pickMedia = async () => {
    const remaining = MARKETING_MEDIA_MAX_FILES - media.length;
    if (remaining <= 0) {
      showToast(validationMessage('TOO_MANY'));
      return;
    }
    const result = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: remaining,
      includeBase64: false,
    });
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      showToast(result.errorMessage ?? t('admin.marketing.media.shareFailed'));
      return;
    }
    const assets = result.assets ?? [];
    const candidates = assets.map(asset => ({
      name: asset.fileName ?? asset.uri?.split('/').pop() ?? 'media',
      mime: asset.type ?? '',
      size: asset.fileSize && asset.fileSize > 0 ? asset.fileSize : 0,
      uri: asset.uri,
    }));
    const validation = validateMarketingMediaAddition(
      media.length,
      candidates.map(({ name: n, mime, size }) => ({ name: n, mime, size })),
    );
    if (!validation.ok) {
      showToast(validationMessage(validation.code));
      return;
    }
    const next: SelectedMarketingMedia[] = [];
    for (const asset of candidates) {
      if (!asset.uri) continue;
      const kind = marketingMediaKind(asset.mime);
      if (!kind) continue;
      next.push({
        id: `${asset.uri}-${asset.size}-${Math.random()}`,
        uri: asset.uri,
        mime: asset.mime,
        size: asset.size,
        name: asset.name,
        kind,
      });
    }
    setMedia(prev => [...prev, ...next]);
    setMediaFallback(false);
  };

  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(item => item.id !== id));
  };

  const clearMedia = () => {
    setMedia([]);
    setMediaFallback(false);
  };

  const handleClose = () => {
    if (busyRef.current) return;
    clearMedia();
    onClose();
  };

  const saveOutcome = async (outcome: ListingMarketingOutcome, channel: 'WHATSAPP' | 'CALL') => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const payload: AdminUpdateListingMarketingRequest = {
        activity: {
          channel,
          outcome,
          templateKey: mode === 'share' ? templateKey : undefined,
          messageSnapshot: mode === 'share' ? message : undefined,
        },
      };
      if (outcome === 'SHARED_CONFIRMED') {
        payload.marketingStatus = 'SHARED';
        payload.whatsappAvailability = 'AVAILABLE';
      }
      if (outcome === 'WHATSAPP_UNAVAILABLE') {
        payload.whatsappAvailability = 'UNAVAILABLE';
      }
      await persistMarketing(target, payload);
      showToast(t('admin.marketing.saved'));
      onUpdated?.();
      clearMedia();
      onClose();
    } catch {
      showToast(t('admin.marketing.saveFailed'));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const openWhatsApp = async () => {
    if (busyRef.current) return;

    if (deliveryMode === 'system_share') {
      if (media.length === 0) {
        showToast(t('admin.marketing.deliverySystemShareNeedsMedia'));
        return;
      }
      busyRef.current = true;
      setBusy(true);
      try {
        // Copy caption first — file share omits text so WhatsApp shows the contact/media picker.
        if (message.trim()) {
          try {
            copyTextToClipboard(message.trim());
          } catch {
            // best-effort
          }
        }
        // System picker: do not target the ACOMI contact number and do not mark Shared.
        const result = await shareMarketingMediaNatively(media, message);
        if (result === 'cancelled') {
          showToast(t('admin.marketing.systemShareCancelled'));
          return;
        }
        if (result === 'unsupported' || result === 'failed') {
          showToast(
            result === 'unsupported'
              ? t('admin.marketing.systemShareUnsupported')
              : t('admin.marketing.media.shareFailed'),
          );
          return;
        }
        setMediaFallback(false);
        showToast(
          result === 'partial'
            ? t('admin.marketing.systemSharePartial')
            : t('admin.marketing.systemShareOpened'),
        );
        setPhase('confirmShare');
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
      return;
    }

    if (!hasUsablePhone || !message.trim()) {
      showToast(
        selectedPhone === CUSTOM_PHONE_VALUE
          ? t('admin.marketing.invalidCustomPhone')
          : t('admin.marketing.noPhone'),
      );
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      await persistMarketing(target, {
        activity: {
          channel: 'WHATSAPP',
          outcome: 'WHATSAPP_OPENED',
          templateKey,
          messageSnapshot: message,
        },
      });

      // Manual mode: open the exact selected owner chat with text.
      // Attachments (if any) are added manually in WhatsApp with the paperclip.
      const result = await openContactWhatsApp(resolvedPhone, message);
      if (result === 'invalid') {
        showToast(t('admin.marketing.invalidCustomPhone'));
      } else if (result === 'unavailable') {
        showToast(t('admin.marketing.whatsAppOpenFailed'));
      } else {
        if (media.length > 0) {
          setMediaFallback(true);
          showToast(t('admin.marketing.media.fallbackNotice'));
        } else {
          setMediaFallback(false);
        }
        setPhase('confirmShare');
      }
    } catch {
      showToast(t('admin.marketing.saveFailed'));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const openDialer = async () => {
    if (busyRef.current) return;
    if (!hasUsablePhone) {
      showToast(
        selectedPhone === CUSTOM_PHONE_VALUE
          ? t('admin.marketing.invalidCustomPhone')
          : t('admin.marketing.noPhone'),
      );
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      await persistMarketing(target, {
        activity: {
          channel: 'CALL',
          outcome: 'CALL_ATTEMPTED',
        },
      });
      const result = await openContactDialer(resolvedPhone);
      if (result === 'invalid') {
        showToast(t('admin.marketing.noPhone'));
      } else if (result === 'unavailable') {
        showToast(t('admin.marketing.callOpenFailed'));
      } else {
        setPhase('confirmCall');
      }
    } catch {
      showToast(t('admin.marketing.saveFailed'));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={busy ? undefined : handleClose}
      statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={busy ? undefined : handleClose} />
        <View style={styles.card}>
          <Text style={styles.title}>
            {mode === 'call' ? t('admin.marketing.callOwner') : t('admin.marketing.shareTitle')}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {name}
            {ownerName ? ` · ${ownerName}` : ''}
          </Text>

          {phase === 'compose' ? (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <View style={styles.section}>
                <Text style={styles.label}>{t('admin.marketing.contactNumber')}</Text>
                <View style={styles.chipRow}>
                  {availablePhones.map(phone => (
                    <Pressable
                      key={phone}
                      onPress={() => {
                        setSelectedPhone(phone);
                        setCustomPhone('');
                      }}
                      style={[
                        styles.phoneChip,
                        selectedPhone === phone && styles.phoneChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.phoneChipText,
                          selectedPhone === phone && styles.phoneChipTextActive,
                        ]}>
                        {phone}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => setSelectedPhone(CUSTOM_PHONE_VALUE)}
                    style={[
                      styles.phoneChip,
                      selectedPhone === CUSTOM_PHONE_VALUE && styles.phoneChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.phoneChipText,
                        selectedPhone === CUSTOM_PHONE_VALUE && styles.phoneChipTextActive,
                      ]}>
                      {t('admin.marketing.otherNumber')}
                    </Text>
                  </Pressable>
                </View>
                {selectedPhone === CUSTOM_PHONE_VALUE ? (
                  <>
                    <TextInput
                      style={styles.customPhone}
                      value={customPhone}
                      onChangeText={setCustomPhone}
                      keyboardType="phone-pad"
                      placeholder={t('admin.marketing.customNumber')}
                      maxLength={15}
                    />
                    <Text style={styles.hint}>{t('admin.marketing.customNumberHint')}</Text>
                    {Boolean(customPhone.trim()) && !hasUsablePhone ? (
                      <Text style={styles.error}>{t('admin.marketing.invalidCustomPhone')}</Text>
                    ) : null}
                  </>
                ) : null}
              </View>

              {mode === 'share' ? (
                <>
                  <View style={styles.section}>
                    <Text style={styles.label}>{t('admin.marketing.deliveryMode')}</Text>
                    <View style={styles.chipRow}>
                      {(
                        [
                          ['manual', t('admin.marketing.deliveryManual')],
                          ['system_share', t('admin.marketing.deliverySystemShare')],
                        ] as const
                      ).map(([value, label]) => (
                        <Pressable
                          key={value}
                          onPress={() => {
                            setDeliveryMode(value);
                            setMediaFallback(false);
                          }}
                          style={[
                            styles.phoneChip,
                            deliveryMode === value && styles.phoneChipActive,
                          ]}>
                          <Text
                            style={[
                              styles.phoneChipText,
                              deliveryMode === value && styles.phoneChipTextActive,
                            ]}>
                            {label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Text style={styles.hint}>
                      {deliveryMode === 'system_share'
                        ? t('admin.marketing.deliverySystemShareHint')
                        : t('admin.marketing.deliveryManualHint')}
                    </Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>{t('admin.marketing.selectTemplate')}</Text>
                    <View style={styles.chipRow}>
                      {templates.map(template => (
                        <Pressable
                          key={template.key}
                          onPress={() => {
                            setTemplateKey(template.key);
                            if (messageDirty) {
                              showToast(t('admin.marketing.templateEditedHint'));
                              return;
                            }
                            applySelectedTemplate(template.key, templates);
                          }}
                          style={[
                            styles.phoneChip,
                            templateKey === template.key && styles.phoneChipActive,
                          ]}>
                          <Text
                            style={[
                              styles.phoneChipText,
                              templateKey === template.key && styles.phoneChipTextActive,
                            ]}>
                            {templateLabel(template)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Button
                      label={t('admin.marketing.applyTemplate')}
                      variant="secondary"
                      disabled={busy || templates.length === 0}
                      onPress={() => applySelectedTemplate(templateKey, templates)}
                    />
                    {messageDirty ? (
                      <Text style={styles.hint}>{t('admin.marketing.templateEditedHint')}</Text>
                    ) : null}
                  </View>
                  <View style={styles.section}>
                    <Text style={styles.label}>{t('admin.marketing.editMessage')}</Text>
                    <TextInput
                      style={styles.message}
                      multiline
                      value={message}
                      onChangeText={value => {
                        setMessage(value);
                        setMessageDirty(true);
                      }}
                      textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{message.length}</Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>{t('admin.marketing.media.title')}</Text>
                    <Text style={styles.hint}>
                      {t('admin.marketing.media.helper', {
                        maxFiles: MARKETING_MEDIA_MAX_FILES,
                        imageMb: marketingMediaMaxMb('image'),
                        videoMb: marketingMediaMaxMb('video'),
                      })}
                    </Text>
                    <View style={styles.mediaActions}>
                      <Button
                        label={t('admin.marketing.media.add')}
                        variant="secondary"
                        disabled={busy || media.length >= MARKETING_MEDIA_MAX_FILES}
                        onPress={() => {
                          pickMedia().catch(() => undefined);
                        }}
                      />
                      {media.length > 0 ? (
                        <Button
                          label={t('admin.marketing.media.clearAll')}
                          variant="ghost"
                          disabled={busy}
                          onPress={clearMedia}
                        />
                      ) : null}
                    </View>
                    {media.length === 0 ? (
                      <Text style={styles.hint}>
                        {deliveryMode === 'system_share'
                          ? t('admin.marketing.deliverySystemShareNeedsMedia')
                          : t('admin.marketing.media.optional')}
                      </Text>
                    ) : (
                      media.map(item => (
                        <View key={item.id} style={styles.mediaRow}>
                          {item.kind === 'image' ? (
                            <Image source={{ uri: item.uri }} style={styles.thumb} />
                          ) : (
                            <View style={styles.videoBadge}>
                              <Text style={styles.videoBadgeText}>
                                {t('admin.marketing.media.videoBadge')}
                              </Text>
                            </View>
                          )}
                          <View style={styles.mediaMeta}>
                            <Text style={styles.mediaName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.hint}>
                              {item.kind === 'image'
                                ? t('admin.marketing.media.imageLabel')
                                : t('admin.marketing.media.videoLabel')}{' '}
                              · {(item.size / (1024 * 1024)).toFixed(1)} MB
                            </Text>
                          </View>
                          <Pressable onPress={() => removeMedia(item.id)} hitSlop={8}>
                            <Text style={styles.remove}>{t('admin.marketing.media.remove')}</Text>
                          </Pressable>
                        </View>
                      ))
                    )}
                    <Text style={styles.hint}>
                      {mediaFallback && deliveryMode === 'manual'
                        ? t('admin.marketing.media.fallbackNotice')
                        : deliveryMode === 'system_share'
                          ? t('admin.marketing.deliverySystemShareHint')
                          : t('admin.marketing.media.shareHint')}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.hint}>{t('admin.marketing.callHint')}</Text>
              )}
            </ScrollView>
          ) : phase === 'confirmShare' ? (
            <View style={styles.confirmBlock}>
              <Text style={styles.hint}>{t('admin.marketing.confirmSharingHint')}</Text>
              {media.length > 0 ? (
                <View style={styles.fallbackBox}>
                  <Text style={styles.fallbackText}>
                    {deliveryMode === 'system_share'
                      ? t('admin.marketing.systemShareOpened')
                      : mediaFallback
                        ? t('admin.marketing.media.fallbackNotice')
                        : t('admin.marketing.media.mediaStepNotice', {
                            phone: resolvedPhone,
                          })}
                  </Text>
                  {media.map(item => (
                    <Text key={item.id} style={styles.fallbackText}>
                      • {item.name}
                    </Text>
                  ))}
                </View>
              ) : null}
              <Button
                label={t('admin.marketing.markShared')}
                loading={busy}
                onPress={() => {
                  saveOutcome('SHARED_CONFIRMED', 'WHATSAPP').catch(() => undefined);
                }}
              />
              <Button
                label={t('admin.marketing.markUnavailable')}
                variant="secondary"
                loading={busy}
                onPress={() => {
                  saveOutcome('WHATSAPP_UNAVAILABLE', 'WHATSAPP').catch(() => undefined);
                }}
              />
              <Button
                label={t('admin.marketing.cancel')}
                variant="ghost"
                disabled={busy}
                onPress={handleClose}
              />
            </View>
          ) : (
            <View style={styles.confirmBlock}>
              <Text style={styles.hint}>{t('admin.marketing.confirmCallHint')}</Text>
              <Button
                label={t('admin.marketing.contactedByPhone')}
                loading={busy}
                onPress={() => {
                  saveOutcome('CONTACTED_BY_PHONE', 'CALL').catch(() => undefined);
                }}
              />
              <Button
                label={t('admin.marketing.notContacted')}
                variant="secondary"
                loading={busy}
                onPress={() => {
                  saveOutcome('SKIPPED', 'CALL').catch(() => undefined);
                }}
              />
            </View>
          )}

          {phase === 'compose' ? (
            <View style={styles.actions}>
              <Button
                label={t('admin.marketing.cancel')}
                variant="ghost"
                disabled={busy}
                onPress={handleClose}
              />
              {mode === 'call' ? (
                <Button
                  label={t('admin.marketing.callOwner')}
                  loading={busy}
                  disabled={!hasUsablePhone}
                  onPress={() => {
                    openDialer().catch(() => undefined);
                  }}
                />
              ) : (
                <Button
                  label={
                    deliveryMode === 'system_share'
                      ? t('admin.marketing.shareOnWhatsAppSystem')
                      : t('admin.marketing.shareOnWhatsApp')
                  }
                  loading={busy}
                  disabled={
                    deliveryMode === 'manual'
                      ? !hasUsablePhone || !message.trim()
                      : media.length === 0
                  }
                  onPress={() => {
                    openWhatsApp().catch(() => undefined);
                  }}
                />
              )}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  backdropTap: { ...StyleSheet.absoluteFillObject },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    maxHeight: '88%',
    ...shadows.md,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  scroll: { maxHeight: 420 },
  scrollContent: { gap: spacing.md, paddingBottom: spacing.sm },
  section: { gap: spacing.sm },
  label: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  phoneChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.section,
  },
  phoneChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  phoneChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  phoneChipTextActive: { color: colors.tealDark },
  customPhone: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  message: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  charCount: {
    ...typography.caption,
    color: colors.muted,
    alignSelf: 'flex-end',
  },
  hint: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  error: { ...typography.caption, color: colors.danger, fontWeight: '700' },
  actions: { marginTop: spacing.md, gap: spacing.sm },
  confirmBlock: { gap: spacing.sm, paddingVertical: spacing.sm },
  mediaActions: { gap: spacing.sm },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.sm,
    backgroundColor: colors.section,
  },
  thumb: { width: 48, height: 48, borderRadius: 8 },
  videoBadge: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadgeText: { ...typography.caption, fontWeight: '800', color: colors.tealDark },
  mediaMeta: { flex: 1, minWidth: 0 },
  mediaName: { ...typography.caption, fontWeight: '700', color: colors.textPrimary },
  remove: { ...typography.caption, fontWeight: '700', color: colors.danger },
  fallbackBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: radius.input,
    padding: spacing.sm,
    gap: 4,
  },
  fallbackText: { ...typography.caption, color: '#9A3412', lineHeight: 18 },
});
