import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { enquiryApi } from '../api/enquiryApi';
import { ApiError, type SpaceEnquiryResponse, type UserResponse } from '../api/types';
import { CalendarDays, CheckCircle2, Clock, Mail, MailCheck } from 'lucide-react-native';
import { Button, FormInput } from './ui';
import { useAuthStore } from '../store/authStore';
import { colors, radius, shadows, spacing, typography } from '../theme';

type EnquireDialogProps = {
  open: boolean;
  spaceId: string;
  spaceName: string;
  ownedByCurrentUser: boolean;
  onClose: () => void;
};

type Step = 'request' | 'sent' | 'own' | 'already';

function savedEnquiryEmails(user: UserResponse | null | undefined): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const value of user?.enquiryEmails ?? []) {
    const email = value?.trim().toLowerCase();
    if (email && !seen.has(email)) {
      seen.add(email);
      emails.push(email);
    }
  }
  const profile = user?.email?.trim().toLowerCase();
  if (profile && !seen.has(profile)) {
    emails.push(profile);
  }
  return emails;
}

export function EnquireDialog({
  open,
  spaceId,
  spaceName,
  ownedByCurrentUser,
  onClose,
}: EnquireDialogProps) {
  const { t, i18n } = useTranslation();
  const user = useAuthStore(state => state.user);
  const refreshUser = useAuthStore(state => state.refreshUser);
  const savedEmails = useMemo(() => savedEnquiryEmails(user), [user]);
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState(savedEmails[0] ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SpaceEnquiryResponse | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
      submittingRef.current = false;
      setSubmitted(null);
      return;
    }
    setError(null);
    setSubmitting(false);
    submittingRef.current = false;
    setEmail(savedEmails[0] ?? '');
    setStep(ownedByCurrentUser ? 'own' : 'request');
  }, [open, ownedByCurrentUser, spaceId, user?.id]);

  useEffect(() => {
    if (!open || submitting || step === 'sent' || step === 'own' || step === 'already') {
      return;
    }
    if (email.trim()) {
      return;
    }
    if (savedEmails[0]) {
      setEmail(savedEmails[0]);
    }
  }, [email, open, savedEmails, step, submitting]);

  async function submit() {
    if (submittingRef.current) {
      return;
    }
    const enquiryEmail = email.trim();
    if (!enquiryEmail) {
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const created = await enquiryApi.create(spaceId, { email: enquiryEmail });
      setSubmitted(created);
      setStep(created.reusedExisting ? 'already' : 'sent');
      void refreshUser();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t('spaces.findPlace.enquire.submitError'),
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function close() {
    if (submittingRef.current) {
      return;
    }
    onClose();
  }

  const alreadyShared = step === 'already' && submitted?.status === 'SHARED';
  const alreadyPending = step === 'already' && !alreadyShared;
  const sharedOn = submitted?.sharedAt
    ? new Date(submitted.sharedAt).toLocaleString(i18n.language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;
  const title =
    alreadyShared
      ? t('spaces.findPlace.enquire.alreadySharedTitle')
      : alreadyPending
        ? t('spaces.findPlace.enquire.alreadyPendingTitle')
        : step === 'own'
          ? t('spaces.findPlace.enquire.ownTitle')
          : step === 'sent'
            ? t('spaces.findPlace.enquire.sentTitle')
            : t('spaces.findPlace.enquire.requestTitle');
  const selectedSaved = savedEmails.find(value => value === email.trim().toLowerCase()) ?? null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
      presentationStyle="overFullScreen">
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropTap}
          onPress={close}
          disabled={submitting}
          accessibilityRole="button"
        />
        <View style={styles.card}>
          {submitting ? (
            <View
              style={styles.busyOverlay}
              pointerEvents="auto"
              accessibilityRole="progressbar"
              accessibilityState={{ busy: true }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.busyTitle}>{t('spaces.findPlace.enquire.submitting')}</Text>
              <Text style={styles.busyHint}>{t('spaces.findPlace.enquire.submittingHint')}</Text>
            </View>
          ) : null}
          <View style={styles.cardInner}>
          {step === 'request' ? <Text style={styles.title}>{title}</Text> : null}
          {step === 'own' || step === 'sent' || step === 'already' ? (
            <View style={styles.result}>
              <View
                style={[
                  styles.resultIcon,
                  alreadyShared || step === 'sent' ? styles.resultIconSuccess : alreadyPending ? styles.resultIconPending : styles.resultIconNeutral,
                ]}>
                {alreadyShared ? (
                  <MailCheck size={28} color={colors.primary} />
                ) : alreadyPending ? (
                  <Clock size={28} color="#D97706" />
                ) : step === 'sent' ? (
                  <CheckCircle2 size={28} color={colors.primary} />
                ) : (
                  <Mail size={28} color={colors.teal} />
                )}
              </View>
              <Text style={[styles.title, styles.resultTitle]}>{title}</Text>
              {step === 'own' ? (
                <Text style={styles.message}>{t('spaces.findPlace.enquire.ownBody')}</Text>
              ) : null}
              {step === 'sent' ? (
                <Text style={styles.message}>{t('spaces.findPlace.enquire.sentBody')}</Text>
              ) : null}
              {alreadyShared ? (
                <Text style={styles.message}>{t('spaces.findPlace.enquire.alreadySharedBody')}</Text>
              ) : null}
              {alreadyPending ? (
                <Text style={styles.message}>{t('spaces.findPlace.enquire.alreadyPendingBody')}</Text>
              ) : null}
              {spaceName ? <Text style={styles.placeChip}>{spaceName}</Text> : null}
              {alreadyShared ? (
                <View style={styles.highlight}>
                  {sharedOn ? (
                    <View style={styles.highlightRow}>
                      <CalendarDays size={16} color={colors.primary} />
                      <View style={styles.highlightCopy}>
                        <Text style={styles.highlightLabel}>{t('spaces.findPlace.enquire.emailSentOn')}</Text>
                        <Text style={styles.highlightValue}>{sharedOn}</Text>
                      </View>
                    </View>
                  ) : null}
                  {submitted?.requesterEmail ? (
                    <View style={[styles.highlightRow, sharedOn ? styles.highlightRowSpaced : null]}>
                      <Mail size={16} color={colors.primary} />
                      <View style={styles.highlightCopy}>
                        <Text style={styles.highlightLabel}>{t('spaces.findPlace.enquire.sentTo')}</Text>
                        <Text style={styles.highlightValue}>{submitted.requesterEmail}</Text>
                      </View>
                    </View>
                  ) : null}
                  <Text style={styles.highlightHint}>
                    {t('spaces.findPlace.enquire.alreadyNoNewEmail')} {t('spaces.findPlace.enquire.checkInboxHint')}
                  </Text>
                </View>
              ) : null}
              {alreadyPending ? (
                <Text style={styles.pendingHint}>{t('spaces.findPlace.enquire.alreadyPendingHint')}</Text>
              ) : null}
            </View>
          ) : null}
          {step === 'request' ? (
            <>
              <Text style={styles.spaceName}>{spaceName}</Text>
              <Text style={styles.message}>{t('spaces.findPlace.enquire.requestBody')}</Text>
              {savedEmails.length > 0 ? (
                <>
                  <Text style={styles.savedLabel}>{t('spaces.findPlace.enquire.savedEmails')}</Text>
                  <ScrollView
                    horizontal
                    scrollEnabled={!submitting}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}>
                    {savedEmails.map(saved => {
                      const active = saved === selectedSaved;
                      return (
                        <Pressable
                          key={saved}
                          disabled={submitting}
                          onPress={() => setEmail(saved)}
                          style={[styles.chip, active && styles.chipActive]}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active, disabled: submitting }}>
                          <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{saved}</Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      disabled={submitting}
                      onPress={() => setEmail('')}
                      style={[styles.chip, selectedSaved == null && styles.chipActive]}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: submitting }}>
                      <Text style={[styles.chipLabel, selectedSaved == null && styles.chipLabelActive]}>
                        {t('spaces.findPlace.enquire.useDifferentEmail')}
                      </Text>
                    </Pressable>
                  </ScrollView>
                </>
              ) : null}
              <FormInput
                label={t('spaces.findPlace.enquire.emailLabel')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!submitting}
              />
            </>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            {step === 'own' || step === 'sent' || step === 'already' ? (
              <Button
                label={
                  step === 'own'
                    ? t('common.close')
                    : t('spaces.findPlace.enquire.done')
                }
                onPress={close}
                disabled={submitting}
                style={styles.actionButton}
              />
            ) : (
              <>
                <Button
                  label={t('common.cancel')}
                  variant="ghost"
                  onPress={close}
                  disabled={submitting}
                  style={styles.actionButton}
                />
                <Button
                  label={t('spaces.findPlace.enquire.send')}
                  onPress={() => void submit()}
                  loading={submitting}
                  disabled={!email.trim() || submitting}
                  style={styles.actionButton}
                />
              </>
            )}
          </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  backdropTap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    width: '100%',
    maxWidth: 420,
    zIndex: 1,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardInner: {
    padding: spacing.lg,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  busyTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  busyHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  spaceName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  savedLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.tealDark,
    fontWeight: '700',
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  result: {
    alignItems: 'center',
  },
  resultTitle: {
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  resultIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconSuccess: {
    backgroundColor: colors.mintSubtle,
  },
  resultIconPending: {
    backgroundColor: '#FFF8E8',
  },
  resultIconNeutral: {
    backgroundColor: colors.surfaceSecondary,
  },
  placeChip: {
    ...typography.bodyStrong,
    width: '100%',
    textAlign: 'center',
    backgroundColor: colors.surfaceSecondary,
    color: colors.textPrimary,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  highlight: {
    width: '100%',
    backgroundColor: colors.mintSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  highlightRowSpaced: {
    marginTop: spacing.md,
  },
  highlightCopy: {
    flex: 1,
  },
  highlightLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  highlightValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: 2,
  },
  highlightHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  pendingHint: {
    ...typography.caption,
    width: '100%',
    color: '#92400E',
    backgroundColor: '#FFF8E8',
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
});
