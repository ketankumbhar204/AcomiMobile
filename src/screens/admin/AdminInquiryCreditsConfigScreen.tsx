import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { inquiryCreditsAdminApi } from '../../api/inquiryCreditsAdminApi';
import type { InquiryCreditPackage, InquiryCreditsPaymentConfig } from '../../api/inquiryCreditsApi';
import { ApiError } from '../../api/types';
import { HeaderBackButton } from '../../components/ui';
import type { AdminStackParamList } from '../../navigation/types';
import { uploadLocalFile } from '../../services/fileUploadService';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { pickOptimizedImage } from '../../utils/pickOptimizedImage';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminInquiryCreditsConfig'>;

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

function PackageEditor({
  title,
  hint,
  packages,
  onChange,
}: {
  title: string;
  hint: string;
  packages: InquiryCreditPackage[];
  onChange: (id: string, patch: Partial<InquiryCreditPackage>) => void;
}) {
  const { t } = useTranslation();
  return (
    <Section title={title} hint={hint}>
      {packages.length === 0 ? (
        <Text style={styles.sectionHint}>
          {t('admin.credits.noPackageSeeded', {
            defaultValue: 'No package seeded for this channel yet.',
          })}
        </Text>
      ) : (
        packages.map(pkg => (
          <View key={pkg.id} style={styles.pkgCard}>
            <Text style={styles.label}>{t('admin.credits.packageName', { defaultValue: 'Name' })}</Text>
            <TextInput
              style={styles.input}
              value={pkg.name}
              onChangeText={value => onChange(pkg.id, { name: value })}
            />
            <View style={styles.pkgRow}>
              <View style={styles.pkgField}>
                <Text style={styles.label}>
                  {t('admin.credits.packageCredits', { defaultValue: 'Credits' })}
                </Text>
                <TextInput
                  style={styles.input}
                  value={String(pkg.credits)}
                  keyboardType="number-pad"
                  onChangeText={value =>
                    onChange(pkg.id, { credits: Math.max(1, Number(value) || 1) })
                  }
                />
              </View>
              <View style={styles.pkgField}>
                <Text style={styles.label}>
                  {t('admin.credits.packagePrice', { defaultValue: 'Price (₹)' })}
                </Text>
                <TextInput
                  style={styles.input}
                  value={String(pkg.priceAmount)}
                  keyboardType="decimal-pad"
                  onChangeText={value =>
                    onChange(pkg.id, { priceAmount: Math.max(0, Number(value) || 0) })
                  }
                />
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelInline}>
                {t('admin.credits.packageEnabled', { defaultValue: 'Enabled' })}
              </Text>
              <Switch
                value={pkg.enabled}
                onValueChange={value => onChange(pkg.id, { enabled: value })}
              />
            </View>
          </View>
        ))
      )}
    </Section>
  );
}

export function AdminInquiryCreditsConfigScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const showToast = useToastStore(state => state.showToast);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<InquiryCreditsPaymentConfig | null>(null);
  const [packages, setPackages] = useState<InquiryCreditPackage[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instructions, setInstructions] = useState('');
  const [webFree, setWebFree] = useState('5');
  const [androidMode, setAndroidMode] = useState<'FREE' | 'CREDITS'>('FREE');
  const [androidFree, setAndroidFree] = useState('5');
  const [hourly, setHourly] = useState('20');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrFileId, setQrFileId] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('admin.credits.configTitle', { defaultValue: 'Inquiry credits — payment config' }),
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextConfig, nextPackages] = await Promise.all([
        inquiryCreditsAdminApi.getPaymentConfig(),
        inquiryCreditsAdminApi.listPackages().catch(() => [] as InquiryCreditPackage[]),
      ]);
      setConfig(nextConfig);
      setPackages(nextPackages.length ? nextPackages : nextConfig.packages ?? []);
      setEnabled(nextConfig.enabled);
      setUpiId(nextConfig.upiId ?? '');
      setWhatsapp(nextConfig.whatsappNumber ?? '');
      setInstructions(nextConfig.instructions ?? '');
      setWebFree(String(nextConfig.webFreeDailyLimit ?? 5));
      setAndroidMode(nextConfig.androidBillingMode === 'CREDITS' ? 'CREDITS' : 'FREE');
      setAndroidFree(String(nextConfig.androidFreeDailyLimit ?? 5));
      setHourly(String(nextConfig.androidHourlyRateLimit ?? 20));
      setQrUrl(nextConfig.qrUrl ?? null);
      setQrFileId(nextConfig.qrFileId ?? null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t('common.errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const emailPackages = useMemo(
    () => packages.filter(pkg => (pkg.clientChannel ?? 'WEB') === 'WEB'),
    [packages],
  );
  const mobilePackages = useMemo(
    () => packages.filter(pkg => pkg.clientChannel === 'ANDROID'),
    [packages],
  );

  function updatePackage(id: string, patch: Partial<InquiryCreditPackage>) {
    setPackages(current => current.map(row => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function save() {
    setSaving(true);
    try {
      await inquiryCreditsAdminApi.updatePaymentConfig({
        enabled,
        upiId: upiId.trim() || null,
        whatsappNumber: whatsapp.trim() || null,
        instructions: instructions.trim() || null,
        qrFileId,
        webFreeDailyLimit: Number(webFree) || 0,
        androidBillingMode: androidMode,
        androidFreeDailyLimit: Number(androidFree) || 0,
        androidHourlyRateLimit: Math.max(1, Number(hourly) || 20),
      });
      await Promise.all(
        packages.map(pkg =>
          inquiryCreditsAdminApi.updatePackage(pkg.id, {
            name: pkg.name,
            credits: Number(pkg.credits),
            priceAmount: Number(pkg.priceAmount),
            enabled: pkg.enabled,
          }),
        ),
      );
      showToast(t('admin.credits.saved', { defaultValue: 'Payment configuration saved.' }));
      await load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t('common.errors.generic'));
    } finally {
      setSaving(false);
    }
  }

  async function pickQr() {
    try {
      const picked = await pickOptimizedImage('INQUIRY_PAYMENT_QR');
      if (!picked) return;
      const fileId = await uploadLocalFile(
        { uri: picked.uri, mime: picked.mime, size: picked.size, name: picked.name },
        { purpose: 'INQUIRY_PAYMENT_QR' },
      );
      setQrFileId(fileId);
      setQrUrl(picked.previewUri);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t('common.errors.generic'));
    }
  }

  if (loading && !config) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.pageHint}>
        {t('admin.credits.configSubtitle', {
          defaultValue:
            'Configure payment details and separate credit packages for email/web vs mobile app enquiries.',
        })}
      </Text>
      <Pressable
        onPress={() => navigation.navigate('AdminInquiryCreditRequests')}
        style={styles.linkRow}
        accessibilityRole="button">
        <Text style={styles.linkText}>
          {t('admin.nav.creditPayments', { defaultValue: 'Credit payments' })}
        </Text>
      </Pressable>

      <Section
        title={t('admin.credits.enablePurchases', { defaultValue: 'Enable credit purchases' })}
        hint={t('admin.credits.enableHint', {
          defaultValue:
            'On: free daily limit then ₹9 / 30 UPI + WhatsApp screenshot flow. Off: no daily limit and no paywall on web or mobile.',
        })}>
        <View style={styles.row}>
          <Text style={styles.labelInline}>
            {enabled
              ? t('admin.credits.enabledOn', { defaultValue: 'Purchases on' })
              : t('admin.credits.enabledOff', { defaultValue: 'Purchases off' })}
          </Text>
          <Switch value={enabled} onValueChange={setEnabled} />
        </View>
      </Section>

      <Section title={t('admin.credits.paymentDetails', { defaultValue: 'Payment details' })}>
        <Text style={styles.label}>{t('admin.credits.upi', { defaultValue: 'UPI ID' })}</Text>
        <TextInput
          style={styles.input}
          value={upiId}
          onChangeText={setUpiId}
          autoCapitalize="none"
          placeholder="yourupi@bank"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.label}>
          {t('admin.credits.whatsapp', { defaultValue: 'WhatsApp number for payment screenshots' })}
        </Text>
        <TextInput
          style={styles.input}
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
          placeholder="9198XXXXXXXX"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.fieldHint}>
          {t('admin.credits.whatsappHint', {
            defaultValue:
              'Seekers pay on UPI, then send the screenshot here. Use country code. Approve under Credit payments.',
          })}
        </Text>
        <Text style={styles.label}>
          {t('admin.credits.instructions', { defaultValue: 'Instructions (shown to seekers)' })}
        </Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={instructions}
          onChangeText={setInstructions}
          multiline
        />
      </Section>

      <Section title={t('admin.credits.qr', { defaultValue: 'Payment QR code' })}>
        {qrUrl ? <Image source={{ uri: qrUrl }} style={styles.qr} /> : null}
        <View style={styles.qrActions}>
          <Pressable onPress={() => void pickQr()} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>
              {qrUrl
                ? t('admin.credits.replaceQr', { defaultValue: 'Replace QR' })
                : t('admin.credits.uploadQr', { defaultValue: 'Upload QR' })}
            </Text>
          </Pressable>
          {qrFileId ? (
            <Pressable
              onPress={() => {
                setQrFileId(null);
                setQrUrl(null);
              }}
              style={styles.dangerBtn}>
              <Text style={styles.dangerText}>
                {t('admin.credits.removeQr', { defaultValue: 'Remove' })}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.fieldHint}>
          {t('admin.credits.qrHint', { defaultValue: 'PNG or JPG, max 5 MB.' })}
        </Text>
      </Section>

      <Section
        title={t('admin.credits.webAccess', { defaultValue: 'Email / web enquiry access' })}
        hint={t('admin.credits.webAccessHint', {
          defaultValue:
            'Seekers on web get this many free enquiries per day, then use paid credits from the email package below.',
        })}>
        <Text style={styles.label}>
          {t('admin.credits.webFree', { defaultValue: 'Free email enquiries per day' })}
        </Text>
        <TextInput
          style={styles.input}
          value={webFree}
          onChangeText={setWebFree}
          keyboardType="number-pad"
        />
      </Section>

      <PackageEditor
        title={t('admin.credits.webPackages', { defaultValue: 'Credit package — email / web' })}
        hint={t('admin.credits.webPackagesHint', {
          defaultValue:
            'Used when seekers enquire from the website (email delivery). Wallet credits are shared.',
        })}
        packages={emailPackages}
        onChange={updatePackage}
      />

      <Section
        title={t('admin.credits.androidAccess', { defaultValue: 'Mobile app enquiry access' })}
        hint={t('admin.credits.androidAccessHint', {
          defaultValue:
            'Controls whether in-app enquiries stay free or consume credits after a daily free allowance.',
        })}>
        <Text style={styles.label}>
          {t('admin.credits.androidMode', { defaultValue: 'Billing mode' })}
        </Text>
        <View style={styles.filters}>
          {(['FREE', 'CREDITS'] as const).map(mode => (
            <Pressable
              key={mode}
              onPress={() => setAndroidMode(mode)}
              style={[styles.chip, androidMode === mode && styles.chipOn]}>
              <Text style={[styles.chipText, androidMode === mode && styles.chipTextOn]}>
                {mode === 'FREE'
                  ? t('admin.credits.modeFree', { defaultValue: 'Free (rate limit only)' })
                  : t('admin.credits.modeCredits', {
                      defaultValue: 'Credits (after free quota)',
                    })}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>
          {t('admin.credits.androidFree', { defaultValue: 'Free mobile enquiries per day' })}
        </Text>
        <TextInput
          style={[styles.input, androidMode === 'FREE' && styles.inputDisabled]}
          value={androidFree}
          onChangeText={setAndroidFree}
          keyboardType="number-pad"
          editable={androidMode === 'CREDITS'}
        />
        {androidMode === 'FREE' ? (
          <Text style={styles.fieldHint}>
            {t('admin.credits.androidFreeHint', {
              defaultValue: 'Only used when billing mode is Credits',
            })}
          </Text>
        ) : null}
        <Text style={styles.label}>
          {t('admin.credits.hourly', { defaultValue: 'Hourly rate limit' })}
        </Text>
        <TextInput
          style={styles.input}
          value={hourly}
          onChangeText={setHourly}
          keyboardType="number-pad"
        />
      </Section>

      <PackageEditor
        title={t('admin.credits.mobilePackages', { defaultValue: 'Credit package — mobile app' })}
        hint={t('admin.credits.mobilePackagesHint', {
          defaultValue:
            'Shown on Android when billing mode is Credits and purchases are enabled.',
        })}
        packages={mobilePackages}
        onChange={updatePackage}
      />

      <Pressable disabled={saving} onPress={() => void save()} style={styles.save}>
        <Text style={styles.saveText}>
          {saving
            ? t('common.saving', { defaultValue: 'Saving…' })
            : t('common.save', { defaultValue: 'Save' })}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.section, gap: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageHint: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  linkRow: { alignSelf: 'flex-start', marginTop: -spacing.xs },
  linkText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  sectionHint: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  labelInline: { ...typography.caption, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  fieldHint: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
    marginTop: 4,
  },
  inputDisabled: { backgroundColor: colors.surfaceSecondary, color: colors.muted },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  qr: {
    width: 160,
    height: 160,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceSecondary,
    alignSelf: 'flex-start',
  },
  qrActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  secondaryText: { ...typography.caption, fontWeight: '700', color: colors.tealDark },
  dangerBtn: {
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
  },
  dangerText: { ...typography.caption, fontWeight: '700', color: colors.danger },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.mintSubtle, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  chipTextOn: { color: colors.tealDark },
  pkgCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.sm,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  pkgRow: { flexDirection: 'row', gap: spacing.sm },
  pkgField: { flex: 1 },
  save: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.input,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { ...typography.bodyStrong, color: colors.white },
});
