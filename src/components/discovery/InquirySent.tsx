import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Calendar, Check, Mail, Smartphone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { enquiryApi } from '../../api/enquiryApi';
import { markInquired } from '../../state/inquiredListings';
import { useInquiryRecord } from '../../hooks/useAlreadyInquired';
import { showEnquiryToast } from '../../store/enquiryFeedbackStore';
import { enquiryErrorMessage } from '../../utils/enquiryErrors';

type InquirySentProps = {
  variant?: 'chip' | 'inline' | 'button';
  sentVia?: 'EMAIL' | 'APP' | 'BOTH' | null;
  email?: string | null;
  style?: StyleProp<ViewStyle>;
};

export function InquirySent({ variant = 'chip', sentVia = null, email = null, style }: InquirySentProps) {
  const { t } = useTranslation();
  const label = t('spaces.findPlace.inquirySent', { defaultValue: 'Inquiry sent' });
  const address = email?.trim() || '';
  const where = address
    ? t('spaces.findPlace.inquirySentTo', { email: address, defaultValue: 'Sent to {{email}}' })
    : sentVia === 'APP'
    ? t('spaces.findPlace.inquirySentInApp', { defaultValue: 'Sent in the ACOMI app' })
    : sentVia === 'BOTH'
      ? t('spaces.findPlace.inquirySentEmailAndApp', { defaultValue: 'Sent to your email and the ACOMI app' })
      : sentVia === 'EMAIL'
        ? t('spaces.findPlace.inquirySentByEmail', { defaultValue: 'Sent to your email' })
        : null;
  const compact = variant !== 'button';
  if (variant === 'inline') {
    const line = where ? `${label} · ${where}` : label;
    return (
      <View accessibilityRole="text" accessibilityLabel={line} style={[styles.inline, style]}>
        <Check size={11} color="#C2410C" strokeWidth={2.4} />
        <Text style={styles.inlineText} numberOfLines={1}>
          {line}
        </Text>
      </View>
    );
  }
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[
        variant === 'chip' ? styles.chip : styles.button,
        variant === 'button' && where ? styles.buttonStack : null,
        style,
      ]}>
      <View style={styles.row}>
        <Check size={compact ? 12 : 14} color="#C2410C" strokeWidth={2.4} />
        <Text style={variant === 'button' ? styles.buttonText : styles.text} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {variant === 'button' && where ? (
        <Text style={styles.where} numberOfLines={2}>
          {where}
        </Text>
      ) : null}
    </View>
  );
}

function formatSentAt(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** Keeps the inquiry-sent line and adds the destination email, time, and resend. */
export function InquirySentDetails({ listingId }: { listingId: string }) {
  const { t } = useTranslation();
  const record = useInquiryRecord(listingId);
  const [busy, setBusy] = useState(false);
  const email = record?.sentToEmail?.trim() || '';
  const when = formatSentAt(record?.sentAt);
  const appOnly = !email && (record?.sentVia === 'APP' || record?.sentVia === 'BOTH');

  async function sendAgain() {
    if (busy) return;
    setBusy(true);
    try {
      const created = await enquiryApi.sendAgain(listingId);
      const address = created.requesterEmail?.trim() || email;
      const sentAt =
        created.emailDeliveredAt || created.contactEmailSentAt || created.requestedAt || new Date().toISOString();
      markInquired(listingId, 'EMAIL', { sentToEmail: address || null, sentAt });
      showEnquiryToast({
        title: t('spaces.findPlace.enquire.sentToastTitle', { defaultValue: 'Enquiry sent!' }),
        body: address
          ? t('spaces.findPlace.enquire.sentToastBody', {
              email: address,
              defaultValue: 'Check your email inbox, we have sent owner contact details to {{email}}.',
            })
          : t('spaces.findPlace.enquire.sentToastBodyNoEmail', {
              defaultValue: 'Check your email inbox. We have sent the owner contact details.',
            }),
      });
    } catch (err) {
      showEnquiryToast({
        tone: 'error',
        title: t('spaces.findPlace.enquire.submitError'),
        body: enquiryErrorMessage(
          err,
          t('spaces.findPlace.enquire.submitError'),
          t('spaces.findPlace.enquire.listingUnavailable'),
        ),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.details}>
      <View style={styles.status}>
        <View style={styles.statusIcon}>
          <Check size={12} color="#fff" strokeWidth={2.6} />
        </View>
        <Text style={styles.statusText}>
          {t('spaces.findPlace.inquiryAlreadySent', { defaultValue: 'Inquiry already sent' })}
        </Text>
      </View>
      {email ? (
        <>
          <View style={styles.divider} />
          <View style={styles.emailMeta}>
            <Mail size={14} color="#5F7368" />
            <Text style={styles.metaText} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </>
      ) : appOnly ? (
        <>
          <View style={styles.divider} />
          <View style={styles.fixedMeta}>
            <Smartphone size={14} color="#5F7368" />
            <Text style={styles.metaText} numberOfLines={1}>
              {t('spaces.findPlace.inquirySentInApp', { defaultValue: 'Sent in the ACOMI app' })}
            </Text>
          </View>
        </>
      ) : null}
      {when ? (
        <>
          <View style={styles.divider} />
          <View style={styles.fixedMeta}>
            <Calendar size={14} color="#5F7368" />
            <Text style={styles.fixedMetaText}>{when}</Text>
          </View>
        </>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void sendAgain()}
        style={[styles.again, busy ? styles.againBusy : null]}>
        {busy ? <ActivityIndicator size="small" color="#0F6B4C" /> : null}
        <Text style={styles.againText}>
          {t('spaces.findPlace.sendInquiryAgain', { defaultValue: 'Resend inquiry' })}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    maxWidth: '100%',
  },
  inlineText: {
    flexShrink: 1,
    color: '#C2410C',
    fontSize: 11,
    fontWeight: '700',
  },
  where: {
    color: '#9A3412',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FDBA74',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  buttonStack: {
    flexDirection: 'column',
    gap: 2,
  },
  text: {
    color: '#C2410C',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonText: {
    color: '#C2410C',
    fontSize: 15,
    fontWeight: '700',
  },
  details: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E7F6EE',
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
  },
  statusIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0F6B4C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#0F6B4C',
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: '#B7DCC8',
    flexShrink: 0,
  },
  emailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  fixedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  metaText: {
    color: '#1F3D32',
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 16,
    flexShrink: 1,
  },
  fixedMetaText: {
    color: '#1F3D32',
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 16,
  },
  again: {
    marginLeft: 'auto',
    alignSelf: 'center',
    flexShrink: 0,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0F6B4C',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  againBusy: {
    opacity: 0.6,
  },
  againText: {
    color: '#0F6B4C',
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 16,
  },
});
