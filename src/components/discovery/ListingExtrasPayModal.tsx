import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  inquiryCreditsApi,
  type InquiryCreditPackage,
  type InquiryCreditsPaymentConfig,
} from '../../api/inquiryCreditsApi';
import { Button } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';

type ListingExtrasPayModalProps = {
  open: boolean;
  purpose: 'map' | 'photos';
  onClose: () => void;
  onConfirmed: () => void;
};

function firstPackage(config: InquiryCreditsPaymentConfig | null): InquiryCreditPackage | null {
  if (!config?.enabled) return null;
  return (
    config.packages
      .filter(item => item.enabled)
      .sort((a, b) => a.displayOrder - b.displayOrder)[0] ?? null
  );
}

export function ListingExtrasPayModal({
  open,
  purpose,
  onClose,
  onConfirmed,
}: ListingExtrasPayModalProps) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<InquiryCreditsPaymentConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setUtr('');
      setError(null);
      setPurchaseId(null);
      setRejected(false);
      setSubmitting(false);
      confirmedRef.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    inquiryCreditsApi
      .getPaymentConfig()
      .then(next => {
        if (!cancelled) setConfig(next);
      })
      .catch(() => {
        if (!cancelled) setConfig(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !purchaseId) return undefined;
    let cancelled = false;
    const check = async () => {
      try {
        const rows = await inquiryCreditsApi.listMyPurchases();
        const row = rows.find(item => item.id === purchaseId);
        if (cancelled || !row || confirmedRef.current) return;
        if (row.status === 'APPROVED') {
          confirmedRef.current = true;
          onConfirmed();
          return;
        }
        if (row.status === 'REJECTED') setRejected(true);
      } catch {
        // Keep checking until the payment is confirmed.
      }
    };
    void check();
    const timer = setInterval(() => void check(), 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [onConfirmed, open, purchaseId]);

  const pkg = firstPackage(config);
  const title =
    purpose === 'map'
      ? t('spaces.findPlace.enquire.limitMapTitle', { defaultValue: 'Pay to continue to the map' })
      : t('spaces.findPlace.enquire.limitPhotosTitle', {
          defaultValue: 'Pay to continue requesting photos',
        });
  const body =
    purpose === 'map'
      ? t('spaces.findPlace.enquire.limitMapBody', {
          defaultValue: "Today's free enquiry is used. Complete payment to continue to Google Maps.",
        })
      : t('spaces.findPlace.enquire.limitPhotosBody', {
          defaultValue: "Today's free enquiry is used. Complete payment to continue requesting photos.",
        });

  async function submit() {
    if (!pkg || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const purchase = await inquiryCreditsApi.submitPurchase({
        packageId: pkg.id,
        utr: utr.trim() || undefined,
      });
      setPurchaseId(purchase.id);
    } catch {
      setError(
        t('spaces.findPlace.enquire.limitPaymentSubmitError', {
          defaultValue: 'Could not submit payment request. Please try again.',
        }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={event => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          {purchaseId ? (
            <>
              <Text style={styles.body}>
                {rejected
                  ? t('spaces.findPlace.enquire.limitPayRejectedBody', {
                      defaultValue:
                        'This payment was not confirmed, so the map and photo request stay closed.',
                    })
                  : purpose === 'map'
                    ? t('spaces.findPlace.enquire.limitMapPendingBody', {
                        defaultValue:
                          'The map stays closed until an admin confirms this payment. It will open as soon as the payment is confirmed.',
                      })
                    : t('spaces.findPlace.enquire.limitPhotosPendingBody', {
                        defaultValue:
                          'Photo requests stay closed until an admin confirms this payment. You can continue as soon as the payment is confirmed.',
                      })}
              </Text>
              {rejected ? null : <ActivityIndicator color={colors.primary} />}
            </>
          ) : loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : pkg ? (
            <>
              <Text style={styles.package}>
                {t('spaces.findPlace.enquire.limitPackageTitle', {
                  count: pkg.credits,
                  amount: `₹${Number(pkg.priceAmount)}`,
                  defaultValue: '{{count}} enquiry credits — {{amount}}',
                })}
              </Text>
              <Text style={styles.body}>
                {purpose === 'map'
                  ? t('spaces.findPlace.enquire.limitPackageBodyMap', {
                      count: pkg.credits,
                      defaultValue:
                        'Get {{count}} enquiry credits. After payment is confirmed, continue to the map.',
                    })
                  : t('spaces.findPlace.enquire.limitPackageBodyPhotos', {
                      count: pkg.credits,
                      defaultValue:
                        'Get {{count}} enquiry credits. After payment is confirmed, continue requesting photos.',
                    })}
              </Text>
              {config?.upiId ? <Text style={styles.upi}>UPI: {config.upiId}</Text> : null}
              <TextInput
                value={utr}
                onChangeText={setUtr}
                placeholder={t('spaces.findPlace.enquire.limitUtrPlaceholder', {
                  defaultValue: 'UTR / transaction reference',
                })}
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                autoCapitalize="characters"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button label={t('spaces.findPlace.enquire.limitPaymentSubmit', { defaultValue: "I've paid — notify admin" })} onPress={() => void submit()} loading={submitting} />
            </>
          ) : (
            <Text style={styles.body}>
              {t('spaces.findPlace.enquire.limitPaymentUnavailable', {
                defaultValue: 'Payment details are currently unavailable. Please try again later.',
              })}
            </Text>
          )}
          <View style={styles.gap} />
          <Button
            label={t('spaces.findPlace.enquire.limitNotNow', { defaultValue: 'Not now' })}
            variant="ghost"
            onPress={onClose}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.overlayScrim,
  },
  card: {
    borderRadius: radius.card,
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textSecondary },
  package: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  upi: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  error: { ...typography.caption, color: colors.danger },
  gap: { height: spacing.xs },
});
