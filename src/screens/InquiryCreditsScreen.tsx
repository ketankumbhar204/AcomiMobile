import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CreditCard, ShoppingBag, Smartphone, Wallet } from 'lucide-react-native';
import {
  inquiryCreditsApi,
  type InquiryCreditPackage,
  type InquiryCreditsPaymentConfig,
  type InquiryCreditsWallet,
} from '../api/inquiryCreditsApi';
import { ApiError } from '../api/types';
import { Button, EmptyState, HeaderBackButton, Screen } from '../components/ui';
import type { MainStackParamList } from '../navigation/types';
import { useToastStore } from '../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'InquiryCredits'>;

function formatAmount(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount}`;
  }
}

function WalletCard({ wallet }: { wallet: InquiryCreditsWallet }) {
  const { t } = useTranslation();
  return (
    <View style={styles.walletCard}>
      <View style={styles.walletIconWrap}>
        <Wallet size={28} color={colors.primary} />
      </View>
      <View style={styles.walletInfo}>
        <Text style={styles.walletLabel}>
          {t('inquiryCredits.availableLabel', { defaultValue: 'Available Credits' })}
        </Text>
        <Text style={styles.walletBalance}>{wallet.availableCredits}</Text>
        <Text style={styles.walletMeta}>
          {t('inquiryCredits.usedOf', {
            used: wallet.lifetimeUsed,
            total: wallet.lifetimeGranted,
            defaultValue: '{{used}} used of {{total}} granted',
          })}
        </Text>
      </View>
    </View>
  );
}

function PackageRowDisabled({ pkg }: { pkg: InquiryCreditPackage }) {
  const { t } = useTranslation();
  return (
    <View
      style={[styles.packageRow, styles.packageRowDisabled]}
      accessibilityState={{ disabled: true }}>
      <View style={styles.packageInfo}>
        <Text style={[styles.packageLabel, styles.disabledText]}>{pkg.name}</Text>
        <Text style={[styles.packageCredits, styles.disabledText]}>
          {t('inquiryCredits.creditsCount', {
            count: pkg.credits,
            defaultValue: '{{count}} credits',
          })}
        </Text>
      </View>
      <View style={styles.packageRight}>
        <Text style={[styles.packageAmount, styles.disabledText]}>
          {formatAmount(Number(pkg.priceAmount), pkg.currency)}
        </Text>
        <View style={styles.disabledPill}>
          <Text style={styles.disabledPillText}>
            {t('inquiryCredits.unavailableWhileFree', {
              defaultValue: 'Not needed (mobile is free)',
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}

function PackageRowBuy({
  pkg,
  onBuy,
}: {
  pkg: InquiryCreditPackage;
  onBuy: (pkg: InquiryCreditPackage) => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      style={({ pressed }) => [styles.packageRow, pressed && { opacity: 0.85 }]}
      onPress={() => onBuy(pkg)}>
      <View style={styles.packageInfo}>
        <Text style={styles.packageLabel}>{pkg.name}</Text>
        <Text style={styles.packageCredits}>
          {t('inquiryCredits.creditsCount', {
            count: pkg.credits,
            defaultValue: '{{count}} credits',
          })}
        </Text>
      </View>
      <View style={styles.packageRight}>
        <Text style={styles.packageAmount}>
          {formatAmount(Number(pkg.priceAmount), pkg.currency)}
        </Text>
        <Text style={styles.buyHint}>
          {t('inquiryCredits.buy', { defaultValue: 'Buy' })}
        </Text>
      </View>
    </Pressable>
  );
}

export function InquiryCreditsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const showToast = useToastStore(state => state.showToast);

  const [wallet, setWallet] = useState<InquiryCreditsWallet | null>(null);
  const [config, setConfig] = useState<InquiryCreditsPaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyTarget, setBuyTarget] = useState<InquiryCreditPackage | null>(null);
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('inquiryCredits.title', { defaultValue: 'Inquiry Credits' }),
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletData, configData] = await Promise.all([
        inquiryCreditsApi.getWallet(),
        inquiryCreditsApi.getPaymentConfig(),
      ]);
      setWallet(walletData);
      setConfig(configData);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : t('common.errors.generic', {
              defaultValue: 'Something went wrong. Please try again.',
            }),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  async function handleSubmitPurchase() {
    if (!buyTarget) return;
    setSubmitting(true);
    try {
      await inquiryCreditsApi.submitPurchase({
        packageId: buyTarget.id,
        utr: utr.trim() || undefined,
      });
      showToast(
        t('inquiryCredits.purchaseSubmitted', {
          defaultValue: 'Purchase request submitted. Credits appear after admin approval.',
        }),
      );
      setBuyTarget(null);
      setUtr('');
      await loadData();
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : t('inquiryCredits.purchaseFailed', {
              defaultValue: 'Could not submit purchase request.',
            }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Screen contentStyle={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  if (error || !wallet) {
    return (
      <Screen contentStyle={styles.centered}>
        <EmptyState
          Icon={CreditCard}
          title={t('inquiryCredits.loadErrorTitle', {
            defaultValue: 'Could not load credits',
          })}
          description={
            error ??
            t('common.errors.generic', { defaultValue: 'Something went wrong.' })
          }
        />
        <Button
          label={t('common.retry', { defaultValue: 'Retry' })}
          onPress={() => void loadData()}
          style={{ marginTop: spacing.md }}
        />
      </Screen>
    );
  }

  const paymentEnabled = config?.enabled ?? false;
  const creditsMode = config?.androidBillingMode === 'CREDITS';
  const purchaseAllowed = paymentEnabled && creditsMode;
  const packages = (config?.packages ?? []).filter(p => p.enabled);

  return (
    <Screen scrollable contentStyle={styles.content}>
      <View style={styles.mobileFreeBanner}>
        <View style={styles.mobileFreeIcon}>
          <Smartphone size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.mobileFreeTitle}>
            {creditsMode
              ? t('inquiryCredits.mobileCreditsTitle', {
                  defaultValue: 'Mobile enquiries use credits',
                })
              : t('inquiryCredits.mobileFreeTitle', {
                  defaultValue: 'Mobile enquiries are free',
                })}
          </Text>
          <Text style={styles.mobileFreeBody}>
            {creditsMode
              ? t('inquiryCredits.mobileCreditsBody', {
                  free: config?.androidFreeDailyLimit ?? 0,
                  defaultValue:
                    'You get {{free}} free mobile enquiries per day, then paid credits apply.',
                })
              : t('inquiryCredits.mobileFreeBody', {
                  defaultValue: 'Unlimited enquiries are available in the ACOMI Android app.',
                })}
          </Text>
        </View>
      </View>

      <WalletCard wallet={wallet} />

      <Text style={styles.sectionTitle}>
        {t('inquiryCredits.howItWorksTitle', { defaultValue: 'How it works' })}
      </Text>
      <Text style={styles.sectionBody}>
        {creditsMode
          ? t('inquiryCredits.howItWorksBodyMobileCredits', {
              defaultValue:
                'After your daily free mobile enquiries, each new enquiry uses 1 credit. Buy a mobile credit package below after paying via UPI.',
            })
          : t('inquiryCredits.howItWorksBodyMobile', {
              defaultValue:
                'Get unlimited enquiries on ACOMI Android. Credits are used for email/web enquiries after the daily free allowance.',
            })}
      </Text>

      {packages.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>
            {purchaseAllowed
              ? t('inquiryCredits.buyCreditsTitleMobile', {
                  defaultValue: 'Buy mobile inquiry credits',
                })
              : t('inquiryCredits.buyCreditsTitleWeb', {
                  defaultValue: 'Mobile credit packages',
                })}
          </Text>
          {!purchaseAllowed ? (
            <Text style={styles.sectionBody}>
              {t('inquiryCredits.purchaseDisabledHint', {
                defaultValue:
                  'Purchases are not required while mobile enquiries are free.',
              })}
            </Text>
          ) : null}

          <View style={styles.packageList}>
            {purchaseAllowed
              ? packages.map(pkg => (
                  <PackageRowBuy key={pkg.id} pkg={pkg} onBuy={setBuyTarget} />
                ))
              : packages.map(pkg => <PackageRowDisabled key={pkg.id} pkg={pkg} />)}
          </View>
        </>
      ) : paymentEnabled ? (
        <View style={styles.noPkgWrap}>
          <ShoppingBag size={32} color={colors.muted} />
          <Text style={styles.noPkgText}>
            {t('inquiryCredits.noPackages', {
              defaultValue: 'No credit packages are available right now.',
            })}
          </Text>
        </View>
      ) : null}

      <Modal
        visible={buyTarget != null}
        transparent
        animationType="fade"
        onRequestClose={() => !submitting && setBuyTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {buyTarget
                ? `${buyTarget.name} · ${formatAmount(
                    Number(buyTarget.priceAmount),
                    buyTarget.currency,
                  )}`
                : ''}
            </Text>
            <Text style={styles.modalHint}>
              {config?.instructions ||
                t('inquiryCredits.payThenUtr', {
                  defaultValue: 'Pay via UPI, then enter your UTR / transaction reference.',
                })}
            </Text>
            {config?.upiId ? (
              <Text style={styles.modalMeta}>UPI: {config.upiId}</Text>
            ) : null}
            <TextInput
              style={styles.utrInput}
              value={utr}
              onChangeText={setUtr}
              placeholder={t('inquiryCredits.utrPlaceholder', {
                defaultValue: 'UTR / transaction ID (optional)',
              })}
              placeholderTextColor={colors.muted}
              editable={!submitting}
            />
            <View style={styles.modalActions}>
              <Button
                label={t('common.cancel', { defaultValue: 'Cancel' })}
                variant="secondary"
                disabled={submitting}
                onPress={() => {
                  setBuyTarget(null);
                  setUtr('');
                }}
              />
              <Button
                label={
                  submitting
                    ? t('common.saving', { defaultValue: 'Submitting…' })
                    : t('inquiryCredits.submitPurchase', { defaultValue: 'Submit' })
                }
                disabled={submitting}
                onPress={() => void handleSubmitPurchase()}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.section,
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileFreeBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: colors.mintSubtle,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mobileFreeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileFreeTitle: {
    ...typography.bodyStrong,
    color: colors.tealDark,
    marginBottom: 4,
  },
  mobileFreeBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.mintSubtle,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  walletIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  walletBalance: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  walletMeta: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  sectionBody: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  packageList: {
    gap: spacing.sm,
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  packageRowDisabled: {
    opacity: 0.72,
    backgroundColor: '#F8FAFC',
  },
  packageInfo: {
    flex: 1,
    gap: 2,
  },
  packageLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  packageCredits: {
    ...typography.caption,
    color: colors.tealDark,
    fontWeight: '700',
    marginTop: 2,
  },
  packageRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  packageAmount: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 16,
  },
  buyHint: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  disabledText: {
    color: colors.muted,
  },
  disabledPill: {
    backgroundColor: '#E2E8F0',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  disabledPillText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  noPkgWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  noPkgText: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  modalHint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  modalMeta: {
    ...typography.caption,
    color: colors.tealDark,
    fontWeight: '700',
  },
  utrInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
