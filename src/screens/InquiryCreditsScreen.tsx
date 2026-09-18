import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
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
import { colors, radius, shadows, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'InquiryCredits'>;

const MOBILE_PURCHASE_DISABLED = Platform.OS === 'android' || Platform.OS === 'ios';

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
            {t('inquiryCredits.unavailableOnAndroid', {
              defaultValue: 'Unavailable on Android',
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function InquiryCreditsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const [wallet, setWallet] = useState<InquiryCreditsWallet | null>(null);
  const [config, setConfig] = useState<InquiryCreditsPaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const packages = (config?.packages ?? []).filter(p => p.enabled);

  return (
    <Screen scrollable contentStyle={styles.content}>
      <View style={styles.mobileFreeBanner}>
        <View style={styles.mobileFreeIcon}>
          <Smartphone size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.mobileFreeTitle}>
            {t('inquiryCredits.mobileFreeTitle', {
              defaultValue: 'Mobile enquiries are free',
            })}
          </Text>
          <Text style={styles.mobileFreeBody}>
            {t('inquiryCredits.mobileFreeBody', {
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
        {t('inquiryCredits.howItWorksBodyMobile', {
          defaultValue:
            'Get unlimited enquiries on ACOMI Android. Credits are used for web enquiries after the daily free allowance. The mobile app does not require credits for enquiries.',
        })}
      </Text>

      {paymentEnabled && packages.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>
            {t('inquiryCredits.buyCreditsTitleWeb', {
              defaultValue: 'Credits for web enquiries',
            })}
          </Text>
          <Text style={styles.sectionBody}>
            {t('inquiryCredits.purchaseDisabledHint', {
              defaultValue:
                'Purchase unavailable on Android. Mobile enquiries are unlimited and free.',
            })}
          </Text>

          <View style={styles.packageList}>
            {MOBILE_PURCHASE_DISABLED
              ? packages.map(pkg => <PackageRowDisabled key={pkg.id} pkg={pkg} />)
              : null}
          </View>
        </>
      ) : paymentEnabled && packages.length === 0 ? (
        <View style={styles.noPkgWrap}>
          <ShoppingBag size={32} color={colors.muted} />
          <Text style={styles.noPkgText}>
            {t('inquiryCredits.noPackages', {
              defaultValue: 'No credit packages are available right now.',
            })}
          </Text>
        </View>
      ) : null}
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
    color: colors.muted,
    fontWeight: '600',
    marginBottom: 2,
  },
  walletBalance: {
    ...typography.h2,
    color: colors.textPrimary,
    lineHeight: 34,
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
    fontWeight: '700',
    color: colors.textSecondary,
  },
  noPkgWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  noPkgText: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
  },
});
