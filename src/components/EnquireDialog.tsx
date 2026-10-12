import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { enquiryApi } from '../api/enquiryApi';
import { ApiError, type OwnerContactResponse, type SpaceEnquiryResponse, type UserResponse } from '../api/types';
import {
  inquiryCreditsApi,
  inquiryMethodAvailability,
  needsInquiryPayment,
  type InquiryQuota,
} from '../api/inquiryCreditsApi';
import {
  enquiryErrorMessage,
  isInquiryCreditsRequiredError,
} from '../utils/enquiryErrors';
import { Check, CheckCircle2, ChevronRight, Clock, Eye, Lock, Mail, Smartphone, Zap } from 'lucide-react-native';
import { Button } from './ui';
import type { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { markInquired } from '../state/inquiredListings';
import { colors, radius, shadows, spacing, typography } from '../theme';

type EnquireDialogProps = {
  open: boolean;
  spaceId: string;
  spaceName: string;
  ownedByCurrentUser: boolean;
  onClose: () => void;
  onViewedHere?: (contact: OwnerContactResponse) => void;
};

type Step = 'choose' | 'email' | 'submitting' | 'viewed' | 'sent' | 'ready' | 'own' | 'already' | 'error' | 'credits';

function accountEmail(user: UserResponse | null | undefined): string {
  return (
    user?.email?.trim() ||
    user?.enquiryEmails?.find(e => e?.trim())?.trim() ||
    ''
  );
}

export function EnquireDialog({
  open,
  spaceId,
  spaceName,
  ownedByCurrentUser,
  onClose,
  onViewedHere,
}: EnquireDialogProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const user = useAuthStore(state => state.user);
  const refreshUser = useAuthStore(state => state.refreshUser);
  const defaultEmail = useMemo(() => accountEmail(user), [user]);
  const [step, setStep] = useState<Step>('choose');
  const [quota, setQuota] = useState<InquiryQuota | null>(null);
  const [pendingIntent, setPendingIntent] = useState<'app' | 'email' | 'view' | null>(null);
  const [revealed, setRevealed] = useState<OwnerContactResponse | null>(null);
  const [email, setEmail] = useState(defaultEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SpaceEnquiryResponse | null>(null);
  const submittingRef = useRef(false);
  const autoKeyRef = useRef<string | null>(null);
  const openedRef = useRef<string | null>(null);

  async function submit(options?: {
    emailOverride?: string;
    deliveryChannel?: 'APP' | 'EMAIL' | 'VIEW_HERE';
  }) {
    if (submittingRef.current) return;
    const enquiryEmail = (options?.emailOverride ?? '').trim();
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setStep('submitting');
    try {
      const created = await enquiryApi.create(spaceId, {
        ...(enquiryEmail ? { email: enquiryEmail } : {}),
        ...(options?.deliveryChannel ? { deliveryChannel: options.deliveryChannel } : {}),
      });
      if (options?.deliveryChannel === 'VIEW_HERE') {
        markInquired(created.spaceId || spaceId, null, {
          contactViewed: true,
          sentAt: created.deliveredAt || created.requestedAt,
        });
        setRevealed(created.ownerContact ?? { available: false });
        onViewedHere?.(created.ownerContact ?? { available: false });
        if (onViewedHere) {
          onClose();
          return;
        }
        setStep('viewed');
        return;
      }
      setSubmitted(created);
      const inApp = created.clientChannel === 'ANDROID';
      const emailed = Boolean(created.contactEmailSent) || !inApp;
      markInquired(created.spaceId || spaceId, inApp && emailed ? 'BOTH' : inApp ? 'APP' : 'EMAIL', {
        sentToEmail: emailed ? created.requesterEmail : null,
        sentAt: created.emailDeliveredAt || created.contactEmailSentAt || created.requestedAt,
      });
      if (created.reusedExisting) {
        setStep('already');
      } else if (created.status === 'SHARED') {
        setStep('ready');
      } else {
        setStep('sent');
      }
      void refreshUser();
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.body?.errorCode === 'VIEW_HERE_LIMIT_REACHED' ||
          err.body?.errorCode === 'VIEW_HERE_DISABLED')
      ) {
        inquiryCreditsApi.getQuota().then(setQuota).catch(() => undefined);
        setStep('choose');
      } else if (err instanceof ApiError && err.body?.errorCode === 'SELF_ENQUIRY_NOT_ALLOWED') {
        setStep('own');
      } else if (isInquiryCreditsRequiredError(err)) {
        setError(
          enquiryErrorMessage(
            err,
            t('spaces.findPlace.enquire.creditsRequiredBody', {
              defaultValue:
                'Free enquiries are used. Buy credits or wait until tomorrow.',
            }),
            t('spaces.findPlace.enquire.listingUnavailable'),
          ),
        );
        setStep('credits');
      } else {
        setError(
          enquiryErrorMessage(
            err,
            t('spaces.findPlace.enquire.submitError'),
            t('spaces.findPlace.enquire.listingUnavailable'),
          ),
        );
        setStep('error');
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!open) {
      openedRef.current = null;
      setError(null);
      setSubmitting(false);
      submittingRef.current = false;
      setSubmitted(null);
      setRevealed(null);
      setQuota(null);
      setPendingIntent(null);
      autoKeyRef.current = null;
      return;
    }
    const key = `${spaceId}:${ownedByCurrentUser ? 'own' : 'choose'}`;
    if (openedRef.current === key) return;
    openedRef.current = key;
    if (ownedByCurrentUser) {
      setStep('own');
      return;
    }
    setStep('choose');
    setEmail(defaultEmail);
    inquiryCreditsApi.getQuota().then(setQuota).catch(() => setQuota(null));
  }, [open, ownedByCurrentUser, spaceId, defaultEmail]);

  function close() {
    if (submittingRef.current) return;
    onClose();
  }

  function viewEnquiries() {
    close();
    navigation.navigate('MyEnquiries', {
      enquiryId: submitted?.enquiryId,
    });
  }

  const detailsReady = step === 'ready' || submitted?.status === 'SHARED';

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
      presentationStyle="overFullScreen">
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={close} disabled={submitting} />
        <View style={styles.card}>
          {step === 'choose' ? (
            <ChooseMethods
              quota={quota}
              disabled={submitting}
              onApp={() => {
                setPendingIntent('app');
                void submit({ deliveryChannel: 'APP' });
              }}
              onViewHere={() => {
                setPendingIntent('view');
                void submit({ deliveryChannel: 'VIEW_HERE' });
              }}
              onEmail={() => {
                setPendingIntent('email');
                if (needsInquiryPayment(quota)) {
                  setStep('credits');
                  return;
                }
                setStep('email');
              }}
              onClose={close}
            />
          ) : step === 'email' ? (
            <View>
              <Text style={styles.title}>
                {t('spaces.findPlace.enquire.emailCtaReady', { defaultValue: 'Get on email' })}
              </Text>
              <Text style={styles.body}>
                {t('spaces.findPlace.enquire.emailCardHint', {
                  defaultValue: 'We’ll send the owner’s contact details to your registered email.',
                })}
              </Text>
              <TextInput
                value={email || defaultEmail}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                style={styles.emailInput}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                label={t('spaces.findPlace.enquire.sendDetails', { defaultValue: 'Send details' })}
                onPress={() => void submit({ emailOverride: email || defaultEmail, deliveryChannel: 'EMAIL' })}
                style={styles.cta}
              />
              <Button label={t('common.back', { defaultValue: 'Back' })} variant="ghost" onPress={() => setStep('choose')} style={styles.cta} />
            </View>
          ) : step === 'viewed' ? (
            <View style={styles.center}>
              <Text style={styles.title}>
                {t('spaces.findPlace.enquire.contactRevealed', { defaultValue: 'Contact details revealed' })}
              </Text>
              {[revealed?.mobileNumber, revealed?.alternateMobileNumber, revealed?.email]
                .filter((value): value is string => Boolean(value?.trim()))
                .map(value => (
                  <Text key={value} style={styles.chip}>{value}</Text>
                ))}
              <Button label={t('spaces.findPlace.enquire.done', { defaultValue: 'Done' })} onPress={close} style={styles.cta} />
            </View>
          ) : step === 'submitting' || submitting ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.title}>
                {pendingIntent === 'view'
                  ? t('spaces.findPlace.enquire.viewingShort', { defaultValue: 'Opening contact details...' })
                  : t('spaces.findPlace.enquire.submittingShort')}
              </Text>
              <Text style={styles.body}>
                {pendingIntent === 'view'
                  ? t('spaces.findPlace.enquire.viewingBody', {
                      defaultValue: 'Please wait while we load the owner’s contact details.',
                    })
                  : pendingIntent === 'email'
                    ? t('spaces.findPlace.enquire.sendingEmailBody', {
                        defaultValue: 'Please wait while we send owner contact details to your email.',
                      })
                    : t('spaces.findPlace.enquire.sendingAppBody', {
                        defaultValue: 'Please wait while we send your enquiry to ACOMI.',
                      })}
              </Text>
            </View>
          ) : step === 'own' ? (
            <View style={styles.center}>
              <Text style={styles.title}>{t('spaces.findPlace.enquire.ownTitle')}</Text>
              <Text style={styles.body}>{t('spaces.findPlace.enquire.ownBody')}</Text>
              <Button label={t('common.close')} onPress={close} style={styles.cta} />
            </View>
          ) : step === 'credits' ? (
            <View style={styles.center}>
              <Text style={styles.title}>
                {t('spaces.findPlace.enquire.creditsRequiredTitle', {
                  defaultValue: 'Your free enquiries are used',
                })}
              </Text>
              {error ? <Text style={styles.body}>{error}</Text> : null}
              <Button
                label={t('inquiryCredits.buyCta', {
                  defaultValue: 'Buy inquiry credits',
                })}
                onPress={() => {
                  close();
                  navigation.navigate('InquiryCredits');
                }}
                style={styles.cta}
              />
              <Button label={t('common.close')} variant="ghost" onPress={close} style={styles.cta} />
            </View>
          ) : step === 'error' ? (
            <View style={styles.center}>
              <Text style={styles.title}>{t('spaces.findPlace.enquire.submitError')}</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                label={t('common.retry')}
                variant="ghost"
                onPress={() => setStep('choose')}
                style={styles.cta}
              />
              <Button label={t('common.close')} variant="ghost" onPress={close} style={styles.cta} />
            </View>
          ) : (
            <View style={styles.center}>
              <View
                style={[
                  styles.icon,
                  detailsReady ? styles.iconReady : styles.iconPending,
                ]}>
                {detailsReady ? (
                  <CheckCircle2 size={28} color={colors.primary} />
                ) : (
                  <Clock size={28} color="#0284C7" />
                )}
              </View>
              <Text style={styles.title}>
                {step === 'already'
                  ? t('spaces.findPlace.enquire.alreadyTitleShort')
                  : detailsReady
                    ? t('spaces.findPlace.enquire.readyTitleShort')
                    : t('spaces.findPlace.enquire.sentTitleShort')}
              </Text>
              <Text style={styles.body}>
                {step === 'already'
                  ? detailsReady
                    ? t('spaces.findPlace.enquire.alreadyReadyBodyShort')
                    : t('spaces.findPlace.enquire.alreadyPendingBodyShort')
                  : detailsReady
                    ? t('spaces.findPlace.enquire.readyBodyShort')
                    : t('spaces.findPlace.enquire.sentBodyShort')}
              </Text>
              {spaceName ? <Text style={styles.chip}>{spaceName}</Text> : null}
              <View style={styles.benefits}>
                <View style={styles.benefitRow}>
                  <Check size={14} color={colors.primaryDark} strokeWidth={2.4} />
                  <Text style={styles.benefit}>{t('spaces.findPlace.enquire.benefitUnlimited')}</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Check size={14} color={colors.primaryDark} strokeWidth={2.4} />
                  <Text style={styles.benefit}>{t('spaces.findPlace.enquire.benefitInApp')}</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Check size={14} color={colors.primaryDark} strokeWidth={2.4} />
                  <Text style={styles.benefit}>{t('spaces.findPlace.enquire.benefitNotify')}</Text>
                </View>
              </View>
              <Button
                label={
                  detailsReady
                    ? t('spaces.findPlace.enquire.viewEnquiry')
                    : t('spaces.findPlace.enquire.viewMyEnquiries')
                }
                onPress={viewEnquiries}
                style={styles.cta}
              />
              <Button label={t('spaces.findPlace.enquire.done')} variant="ghost" onPress={close} style={styles.cta} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ChooseMethods({
  quota,
  disabled,
  onApp,
  onViewHere,
  onEmail,
  onClose,
}: {
  quota: InquiryQuota | null;
  disabled: boolean;
  onApp: () => void;
  onViewHere: () => void;
  onEmail: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const {
    dailyLimit,
    remainingKnown,
    remainingToday,
    paidLeft,
    emailExhausted,
    viewHereLimit,
    viewHereRemaining,
    showViewHere,
    showViewHereExhausted,
  } = inquiryMethodAvailability(quota);

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>
        {t('spaces.findPlace.enquire.chooseTitle', { defaultValue: 'Get owner contact details' })}
      </Text>
      <Text style={styles.body}>
        {t('spaces.findPlace.enquire.chooseBody', {
          defaultValue: 'Choose one way to get the owner’s contact details.',
        })}
      </Text>
      <Pressable disabled={disabled} onPress={onApp} style={styles.appCard}>
        <View style={styles.optionRow}>
          <Smartphone size={18} color={colors.primaryDark} />
          <View style={styles.optionBody}>
            <Text style={styles.recommended}>
              {t('spaces.findPlace.enquire.recommended', { defaultValue: 'Recommended' })}
            </Text>
            <Text style={styles.optionTitle}>
              {t('spaces.findPlace.enquire.sendOnApp', { defaultValue: 'Send on ACOMI App' })}
            </Text>
            <Text style={styles.optionStrong}>
              {t('spaces.findPlace.enquire.unlimitedTitle', { defaultValue: 'Unlimited enquiries' })}
            </Text>
            <Text style={styles.optionAccent}>
              {t('spaces.findPlace.enquire.freeAndroid', { defaultValue: 'Free on Android!' })}
            </Text>
            <View style={styles.optionRow}>
              <Zap size={12} color={colors.primaryDark} />
              <Text style={styles.optionHint}>
                {t('spaces.findPlace.enquire.benefitFast', { defaultValue: 'Fast & easy' })}
              </Text>
              <Lock size={12} color={colors.primaryDark} />
              <Text style={styles.optionHint}>
                {t('spaces.findPlace.enquire.benefitSecure', { defaultValue: 'Secure' })}
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color={colors.primaryDark} />
        </View>
      </Pressable>
      <Text style={styles.or}>{t('spaces.findPlace.enquire.optionOr', { defaultValue: 'OR' })}</Text>
      {showViewHere ? (
        <Pressable disabled={disabled} onPress={onViewHere} style={styles.viewCard}>
          <View style={styles.optionRow}>
            <Eye size={18} color="#0369A1" />
            <View style={styles.optionBody}>
              <Text style={styles.optionStrong}>
                {t('spaces.findPlace.enquire.viewHereTitle', { defaultValue: 'View contact details here' })}
              </Text>
              <Text style={styles.optionHint}>
                {t('spaces.findPlace.enquire.viewHereRemaining', {
                  remaining: viewHereRemaining,
                  limit: viewHereLimit,
                  defaultValue: '{{remaining}} instant views remaining today (out of {{limit}})',
                })}
              </Text>
            </View>
            <ChevronRight size={16} color="#0369A1" />
          </View>
        </Pressable>
      ) : null}
      {showViewHereExhausted ? (
        <Text style={styles.optionHint}>
          {t('spaces.findPlace.enquire.viewHereExhausted', {
            defaultValue: 'You have used all instant contact views for today. You can still enquire by app or email.',
          })}
        </Text>
      ) : null}
      {showViewHere || showViewHereExhausted ? (
        <Text style={styles.or}>{t('spaces.findPlace.enquire.optionOr', { defaultValue: 'OR' })}</Text>
      ) : null}
      <Pressable disabled={disabled} onPress={onEmail} style={styles.emailCard}>
        <View style={styles.optionRow}>
          <Mail size={18} color="#B45309" />
          <View style={styles.optionBody}>
            <Text style={styles.optionStrong}>
              {t('spaces.findPlace.enquire.emailCtaReady', { defaultValue: 'Get on email' })}
            </Text>
            {remainingKnown ? (
              <Text style={styles.optionHint}>
                {t('spaces.findPlace.enquire.emailRemaining', {
                  remaining: remainingToday,
                  limit: dailyLimit,
                  defaultValue: '{{remaining}} enquiries remaining out of {{limit}}',
                })}
              </Text>
            ) : (
              <Text style={styles.optionHint}>
                {t('spaces.findPlace.enquire.emailCardHint', {
                  defaultValue: 'We’ll send the owner’s contact details to your registered email.',
                })}
              </Text>
            )}
            {emailExhausted ? (
              <Text style={styles.optionHint}>
                {t('spaces.findPlace.enquire.emailExhaustedHint', {
                  count: paidLeft,
                  defaultValue: 'Email limit reached. Buy inquiry credits to continue.',
                })}
              </Text>
            ) : null}
          </View>
          <ChevronRight size={16} color="#B45309" />
        </View>
      </Pressable>
      <Button label={t('spaces.findPlace.enquire.done', { defaultValue: 'Done' })} variant="ghost" onPress={onClose} style={styles.cta} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  backdropTap: { ...StyleSheet.absoluteFill },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.md,
  },
  center: { alignItems: 'center' },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconReady: { backgroundColor: colors.mintSubtle },
  iconPending: { backgroundColor: '#E0F2FE' },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  chip: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.button,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  benefits: { alignSelf: 'stretch', marginTop: spacing.md, gap: 6 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  benefit: { ...typography.caption, color: colors.textSecondary, fontWeight: '600', flex: 1 },
  cta: { marginTop: spacing.sm, alignSelf: 'stretch' },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs, textAlign: 'center' },
  appCard: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15,107,76,0.3)',
    backgroundColor: '#E7F6EE',
    borderRadius: 16,
    padding: spacing.md,
    minHeight: 48,
  },
  viewCard: {
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#F3F8FF',
    borderRadius: 16,
    padding: spacing.md,
    minHeight: 48,
  },
  emailCard: {
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.45)',
    backgroundColor: '#FFF4EC',
    borderRadius: 16,
    padding: spacing.md,
    minHeight: 48,
  },
  optionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  optionBody: { flex: 1, gap: 2 },
  optionTitle: { ...typography.caption, fontWeight: '700' },
  optionStrong: { ...typography.bodyStrong },
  optionAccent: { ...typography.bodyStrong, color: colors.primaryDark },
  optionHint: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  recommended: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    backgroundColor: colors.primaryDark,
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    textTransform: 'uppercase',
  },
  or: {
    ...typography.caption,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.textSecondary,
    marginVertical: spacing.sm,
  },
  emailInput: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    ...typography.body,
    color: colors.textPrimary,
  },
});
