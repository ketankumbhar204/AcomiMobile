import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { enquiryApi } from '../api/enquiryApi';
import { ApiError, type SpaceEnquiryResponse, type UserResponse } from '../api/types';
import { CheckCircle2, Clock } from 'lucide-react-native';
import { Button } from './ui';
import type { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { colors, radius, shadows, spacing, typography } from '../theme';

type EnquireDialogProps = {
  open: boolean;
  spaceId: string;
  spaceName: string;
  ownedByCurrentUser: boolean;
  onClose: () => void;
};

type Step = 'submitting' | 'sent' | 'ready' | 'own' | 'already' | 'error';

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
}: EnquireDialogProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const user = useAuthStore(state => state.user);
  const refreshUser = useAuthStore(state => state.refreshUser);
  const defaultEmail = useMemo(() => accountEmail(user), [user]);
  const [step, setStep] = useState<Step>('submitting');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SpaceEnquiryResponse | null>(null);
  const submittingRef = useRef(false);
  const autoKeyRef = useRef<string | null>(null);

  async function submit(options?: { emailOverride?: string }) {
    if (submittingRef.current) return;
    const enquiryEmail = (options?.emailOverride ?? defaultEmail).trim();
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setStep('submitting');
    try {
      // Email is optional on ANDROID — owner contact is delivered in-app.
      const created = await enquiryApi.create(
        spaceId,
        enquiryEmail ? { email: enquiryEmail } : {},
      );
      setSubmitted(created);
      if (created.reusedExisting) {
        setStep('already');
      } else if (created.status === 'SHARED') {
        setStep('ready');
      } else {
        setStep('sent');
      }
      void refreshUser();
    } catch (err) {
      if (err instanceof ApiError && err.body?.errorCode === 'SELF_ENQUIRY_NOT_ALLOWED') {
        setStep('own');
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : t('spaces.findPlace.enquire.submitError'),
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
      setError(null);
      setSubmitting(false);
      submittingRef.current = false;
      setSubmitted(null);
      autoKeyRef.current = null;
      return;
    }
    if (ownedByCurrentUser) {
      setStep('own');
      return;
    }
    const key = `${spaceId}:${user?.id ?? ''}`;
    if (autoKeyRef.current === key) return;
    autoKeyRef.current = key;
    void submit({ emailOverride: defaultEmail });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ownedByCurrentUser, spaceId, user?.id]);

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
          {step === 'submitting' || submitting ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.title}>{t('spaces.findPlace.enquire.submittingShort')}</Text>
            </View>
          ) : step === 'own' ? (
            <View style={styles.center}>
              <Text style={styles.title}>{t('spaces.findPlace.enquire.ownTitle')}</Text>
              <Text style={styles.body}>{t('spaces.findPlace.enquire.ownBody')}</Text>
              <Button label={t('common.close')} onPress={close} style={styles.cta} />
            </View>
          ) : step === 'error' ? (
            <View style={styles.center}>
              <Text style={styles.title}>{t('spaces.findPlace.enquire.submitError')}</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                label={t('common.retry')}
                onPress={() => {
                  autoKeyRef.current = null;
                  void submit({ emailOverride: defaultEmail });
                }}
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
                <Text style={styles.benefit}>✓ {t('spaces.findPlace.enquire.benefitUnlimited')}</Text>
                <Text style={styles.benefit}>✓ {t('spaces.findPlace.enquire.benefitInApp')}</Text>
                <Text style={styles.benefit}>✓ {t('spaces.findPlace.enquire.benefitNotify')}</Text>
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
  benefit: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  cta: { marginTop: spacing.sm, alignSelf: 'stretch' },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs, textAlign: 'center' },
});
