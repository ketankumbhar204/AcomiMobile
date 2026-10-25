import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { Info, Lightbulb, Mail } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { inquiryCreditsAdminApi } from '../../api/inquiryCreditsAdminApi';
import type { InquiryCreditPackage, InquiryCreditsPaymentConfig } from '../../api/inquiryCreditsApi';
import { ApiError } from '../../api/types';
import type { AdminStackParamList } from '../../navigation/types';
import {
  loadPaymentQrImage,
  uploadLocalFile,
  type AuthorizedImageSource,
} from '../../services/fileUploadService';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { pastels } from '../../theme/colors';
import { ZoomableImageModal } from '../../components/files/ZoomableImageModal';
import { pickOptimizedImage } from '../../utils/pickOptimizedImage';
import {
  draftFromPaymentConfig,
  emptyInquiryCreditsConfigDraft,
  paymentConfigUpdateFromDraft,
  type InquiryCreditsConfigDraft,
} from './inquiryCreditsConfigDraft';

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

function Note({ icon, children }: { icon?: React.ReactNode; children: string }) {
  return (
    <View style={styles.note}>
      {icon}
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.toggleCopy}>
        <Text style={styles.labelInline}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
        thumbColor={value ? colors.primary : '#F8FAFC'}
      />
    </View>
  );
}

function LimitField({
  label,
  value,
  onChangeText,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable?: boolean;
}) {
  return (
    <View>
      <Text style={[styles.label, !editable && styles.labelDisabled]}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        editable={editable}
        selectTextOnFocus={editable}
      />
    </View>
  );
}

function PackageEditor({
  title,
  hint,
  footer,
  packages,
  onChange,
}: {
  title: string;
  hint: string;
  footer: string;
  packages: InquiryCreditPackage[];
  onChange: (id: string, patch: Partial<InquiryCreditPackage>) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.packageBox}>
      <Text style={styles.packageTitle}>{title}</Text>
      <Text style={styles.sectionHint}>{hint}</Text>
      {packages.length === 0 ? (
        <Text style={styles.sectionHint}>
          {t('admin.credits.noPackageSeeded', {
            defaultValue: 'No package seeded for this channel yet. Run the latest backend migration.',
          })}
        </Text>
      ) : (
        packages.map(pkg => (
          <View key={pkg.id} style={styles.pkgCard}>
            <Text style={styles.label}>{t('admin.credits.packageName', { defaultValue: 'Package name' })}</Text>
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
                  onChangeText={value => {
                    const digits = value.replace(/[^\d]/g, '');
                    onChange(pkg.id, { credits: digits === '' ? 0 : Number(digits) });
                  }}
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
            <ToggleRow
              label={t('admin.credits.packageEnabled', { defaultValue: 'Enabled' })}
              value={pkg.enabled}
              onValueChange={value => onChange(pkg.id, { enabled: value })}
            />
            <Text style={styles.packageFooter}>{footer}</Text>
          </View>
        ))
      )}
    </View>
  );
}

export function AdminInquiryCreditsConfigScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore(state => state.showToast);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const [config, setConfig] = useState<InquiryCreditsPaymentConfig | null>(null);
  const [packages, setPackages] = useState<InquiryCreditPackage[]>([]);
  const [draft, setDraft] = useState<InquiryCreditsConfigDraft>(emptyInquiryCreditsConfigDraft);
  const [qrSource, setQrSource] = useState<AuthorizedImageSource | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadGen = useRef(0);
  const interactionLock = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('admin.credits.configTitle', { defaultValue: 'Inquiry credits — payment config' }),
    });
  }, [navigation, t]);

  const applyLoaded = useCallback(
    async (nextConfig: InquiryCreditsPaymentConfig, nextPackages: InquiryCreditPackage[]) => {
      setConfig(nextConfig);
      setPackages(nextPackages.length ? nextPackages : nextConfig.packages ?? []);
      setDraft(draftFromPaymentConfig(nextConfig));
      setLoadError(null);
      setQrError(null);
      setQrLoading(Boolean(nextConfig.qrFileId || nextConfig.qrUrl));
      try {
        const source = await loadPaymentQrImage(nextConfig.qrFileId, nextConfig.qrUrl);
        setQrSource(source);
        if ((nextConfig.qrFileId || nextConfig.qrUrl) && !source) {
          setQrError(
            t('admin.credits.qrMissing', { defaultValue: 'No payment QR is saved.' }),
          );
        }
      } catch {
        setQrSource(null);
        if (nextConfig.qrFileId) {
          const message = t('admin.credits.qrLoadFailed', {
            defaultValue: 'Unable to load the payment QR.',
          });
          setQrError(message);
          showToast(message);
        }
      } finally {
        setQrLoading(false);
      }
    },
    [showToast, t],
  );

  const load = useCallback(async () => {
    if (interactionLock.current) return;
    const gen = ++loadGen.current;
    setLoading(true);
    setLoadError(null);
    try {
      const [nextConfig, nextPackages] = await Promise.all([
        inquiryCreditsAdminApi.getPaymentConfig(),
        inquiryCreditsAdminApi.listPackages().catch(() => [] as InquiryCreditPackage[]),
      ]);
      if (gen !== loadGen.current || interactionLock.current) return;
      await applyLoaded(nextConfig, nextPackages);
    } catch (err) {
      if (gen !== loadGen.current) return;
      const message = err instanceof ApiError ? err.message : t('common.errors.generic');
      setLoadError(message);
      showToast(message);
    } finally {
      if (gen === loadGen.current) setLoading(false);
    }
  }, [applyLoaded, showToast, t]);

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

  function patchDraft(patch: Partial<InquiryCreditsConfigDraft>) {
    setDraft(current => ({ ...current, ...patch }));
  }

  function updatePackage(id: string, patch: Partial<InquiryCreditPackage>) {
    setPackages(current => current.map(row => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function save() {
    if (!config || saving || interactionLock.current) return;
    interactionLock.current = true;
    loadGen.current += 1;
    setSaving(true);
    try {
      await inquiryCreditsAdminApi.updatePaymentConfig(paymentConfigUpdateFromDraft(draft));
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
      const [nextConfig, nextPackages] = await Promise.all([
        inquiryCreditsAdminApi.getPaymentConfig(),
        inquiryCreditsAdminApi.listPackages().catch(() => [] as InquiryCreditPackage[]),
      ]);
      await applyLoaded(nextConfig, nextPackages);
      showToast(t('admin.credits.saved', { defaultValue: 'Payment configuration saved.' }));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t('common.errors.generic'));
    } finally {
      interactionLock.current = false;
      setSaving(false);
    }
  }

  async function pickQr() {
    if (qrUploading) return;
    interactionLock.current = true;
    loadGen.current += 1;
    try {
      const picked = await pickOptimizedImage('INQUIRY_PAYMENT_QR');
      if (!picked) return;
      setQrUploading(true);
      const fileId = await uploadLocalFile(
        { uri: picked.uri, mime: picked.mime, size: picked.size, name: picked.name },
        { purpose: 'INQUIRY_PAYMENT_QR' },
      );
      patchDraft({ qrFileId: fileId, qrCleared: false });
      setQrError(null);
      setQrSource({ uri: picked.previewUri });
      try {
        await inquiryCreditsAdminApi.updatePaymentConfig({ qrFileId: fileId });
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : t('common.errors.generic'));
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t('common.errors.generic'));
    } finally {
      interactionLock.current = false;
      setQrUploading(false);
    }
  }

  if (loading && !config) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!config) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadError}>
          {loadError ??
            t('admin.credits.loadFailed', { defaultValue: 'Could not load payment configuration.' })}
        </Text>
        <Pressable onPress={() => void load()} style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>
            {t('admin.credits.retry', { defaultValue: 'Retry' })}
          </Text>
        </Pressable>
      </View>
    );
  }

  const creditsBilling = draft.androidMode === 'CREDITS';

  return (
    <>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.root}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: spacing.section + insets.bottom },
          ]}
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

          <View style={styles.card}>
            <ToggleRow
              label={t('admin.credits.enablePurchases', { defaultValue: 'Enable credit purchases' })}
              hint={t('admin.credits.enableHint', {
                defaultValue:
                  'On: free daily limit then ₹9 / 30 UPI + WhatsApp screenshot flow. Off: no daily limit and no paywall on web or mobile.',
              })}
              value={draft.enabled}
              onValueChange={enabled => patchDraft({ enabled })}
            />
          </View>

          <View style={styles.howCard}>
            <Lightbulb size={18} color="#16A34A" />
            <View style={styles.toggleCopy}>
              <Text style={styles.packageTitle}>
                {t('admin.credits.howItWorksTitle', { defaultValue: 'How it works' })}
              </Text>
              <Text style={styles.sectionHint}>
                {t('admin.credits.howItWorksBody', {
                  defaultValue:
                    'Add UPI, QR, and WhatsApp below. Users can purchase credits after using their free daily limit. Admin approves the request.',
                })}
              </Text>
            </View>
          </View>

          <Section
            title={t('admin.credits.paymentDetails', { defaultValue: 'Payment details' })}
            hint={t('admin.credits.paymentDetailsHint', {
              defaultValue: 'Configure UPI and payment instructions for credit purchases.',
            })}>
            <Text style={styles.label}>{t('admin.credits.upi', { defaultValue: 'UPI ID' })}</Text>
            <TextInput
              style={styles.input}
              value={draft.upiId}
              onChangeText={upiId => patchDraft({ upiId })}
              autoCapitalize="none"
              placeholder="yourupi@bank"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.fieldHint}>
              {t('admin.credits.upiHint', {
                defaultValue: 'Users will see this UPI ID to make payments.',
              })}
            </Text>
            <Text style={styles.label}>
              {t('admin.credits.whatsapp', {
                defaultValue: 'WhatsApp number for payment screenshots',
              })}
            </Text>
            <TextInput
              style={styles.input}
              value={draft.whatsapp}
              onChangeText={whatsapp => patchDraft({ whatsapp })}
              keyboardType="phone-pad"
              placeholder="9198XXXXXXXX"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.fieldHint}>
              {t('admin.credits.whatsappHint', {
                defaultValue:
                  'Users will send the payment screenshot to this number. Include the country code, for example 9198XXXXXXXX.',
              })}
            </Text>
            <Text style={styles.label}>
              {t('admin.credits.instructions', {
                defaultValue: 'Payment instructions (shown to seekers)',
              })}
            </Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={draft.instructions}
              onChangeText={instructions => patchDraft({ instructions })}
              multiline
              placeholder={t('admin.credits.instructionsPlaceholder', {
                defaultValue:
                  'Transfer the amount to the UPI ID above, then enter your UTR below.',
              })}
              placeholderTextColor={colors.muted}
            />
            <View style={styles.counterRow}>
              <Text style={[styles.fieldHint, styles.counterHint]}>
                {t('admin.credits.instructionsHint', {
                  defaultValue: 'These instructions will be visible to users on the payment screen.',
                })}
              </Text>
              <Text style={styles.counter}>{draft.instructions.length}/500</Text>
            </View>

            <Text style={styles.qrTitle}>{t('admin.credits.qr', { defaultValue: 'Payment QR code' })}</Text>
            <View style={styles.qrRow}>
              {qrLoading ? (
                <View style={styles.qrEmpty}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : qrSource ? (
                <Pressable
                  onPress={() => setQrOpen(true)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={t('admin.credits.openQr', { defaultValue: 'Open payment QR' })}>
                  <Image source={qrSource} style={styles.qr} resizeMode="contain" />
                </Pressable>
              ) : (
                <View style={styles.qrEmpty}>
                  <Text style={styles.qrEmptyText}>
                    {t('admin.credits.qrEmptyShort', { defaultValue: 'No QR' })}
                  </Text>
                </View>
              )}
              <View style={styles.qrActions}>
                <Pressable
                  disabled={qrUploading}
                  onPress={() => void pickQr()}
                  style={styles.secondaryBtn}>
                  <Text style={styles.secondaryText}>
                    {qrUploading
                      ? t('admin.credits.uploadingQr', { defaultValue: 'Uploading…' })
                      : qrSource
                        ? t('admin.credits.replaceQr', { defaultValue: 'Replace QR' })
                        : t('admin.credits.uploadQr', { defaultValue: 'Upload QR' })}
                  </Text>
                </Pressable>
                {qrSource ? (
                  <Pressable onPress={() => setQrOpen(true)} style={styles.secondaryBtn}>
                    <Text style={styles.secondaryText}>
                      {t('admin.credits.viewQr', { defaultValue: 'View QR' })}
                    </Text>
                  </Pressable>
                ) : null}
                {draft.qrFileId ? (
                  <Pressable
                    onPress={() => {
                      patchDraft({ qrFileId: null, qrCleared: true });
                      setQrSource(null);
                      setQrOpen(false);
                    }}
                    style={styles.dangerBtn}>
                    <Text style={styles.dangerText}>
                      {t('admin.credits.removeQr', { defaultValue: 'Remove' })}
                    </Text>
                  </Pressable>
                ) : null}
                <Text style={styles.fieldHint}>
                  {qrError
                    ? qrError
                    : draft.qrFileId
                      ? t('admin.credits.qrHint', {
                          defaultValue: 'Supported formats: PNG or JPG. Max size: 5 MB.',
                        })
                      : t('admin.credits.qrEmptyHint', {
                          defaultValue:
                            'No payment QR uploaded yet. Supported formats: PNG or JPG. Max size: 5 MB.',
                        })}
                </Text>
              </View>
            </View>
            <Note icon={<Info size={16} color={colors.info} />}>
              {t('admin.credits.qrShownHint', {
                defaultValue: 'This QR code will be shown to users on the payment screen.',
              })}
            </Note>
          </Section>

          <Section
            title={t('admin.credits.webAccess', { defaultValue: 'Email / Website / Web App' })}
            hint={t('admin.credits.webAccessHint', {
              defaultValue:
                'Instant contact views and email enquiries use separate daily limits. Instant views do not use email enquiry credits.',
            })}>
            <ToggleRow
              label={t('admin.credits.freeContactViewing', { defaultValue: 'Free contact viewing' })}
              hint={t('admin.credits.freeContactViewingHint', {
                defaultValue:
                  'Shows the owner or vendor contact on the listing itself. This is separate from enquiries and from paid credits.',
              })}
              value={draft.webViewHereEnabled}
              onValueChange={webViewHereEnabled => patchDraft({ webViewHereEnabled })}
            />
            <LimitField
              label={t('admin.credits.instantViewsPerDay', {
                defaultValue: 'Free instant contact views per day',
              })}
              value={draft.webViewHere}
              editable={draft.webViewHereEnabled}
              onChangeText={webViewHere => patchDraft({ webViewHere })}
            />
            <Note>
              {t('admin.credits.instantViewsHint', {
                defaultValue:
                  'Instant views shown on the listing. 0 hides the option. Enquiry delivery and credit packages below are unchanged.',
              })}
            </Note>
            <LimitField
              label={t('admin.credits.webFree', { defaultValue: 'Free email enquiries per day' })}
              value={draft.webFree}
              onChangeText={webFree => patchDraft({ webFree })}
            />
            <Note icon={<Mail size={16} color={colors.info} />}>
              {t('admin.credits.webFreeHint', {
                defaultValue:
                  'After the free limit, users need to purchase enquiry credits using the package below.',
              })}
            </Note>
            <PackageEditor
              title={t('admin.credits.webPackages', { defaultValue: 'Credit package — email / web' })}
              hint={t('admin.credits.webPackagesHint', {
                defaultValue:
                  'Used when seekers enquire from the website (email delivery). Wallet credits are shared.',
              })}
              footer={t('admin.credits.webPackageFooter', {
                defaultValue: 'This package will be shown to users on web.',
              })}
              packages={emailPackages}
              onChange={updatePackage}
            />
          </Section>

          <Section
            title={t('admin.credits.androidAccess', { defaultValue: 'Mobile App' })}
            hint={t('admin.credits.androidAccessHint', {
              defaultValue:
                'Instant contact views and mobile enquiries use separate daily limits. Instant views do not use mobile enquiry credits.',
            })}>
            <ToggleRow
              label={t('admin.credits.freeContactViewing', { defaultValue: 'Free contact viewing' })}
              hint={t('admin.credits.freeContactViewingHint', {
                defaultValue:
                  'Shows the owner or vendor contact on the listing itself. This is separate from enquiries and from paid credits.',
              })}
              value={draft.androidViewHereEnabled}
              onValueChange={androidViewHereEnabled => patchDraft({ androidViewHereEnabled })}
            />
            <LimitField
              label={t('admin.credits.instantViewsPerDay', {
                defaultValue: 'Free instant contact views per day',
              })}
              value={draft.androidViewHere}
              editable={draft.androidViewHereEnabled}
              onChangeText={androidViewHere => patchDraft({ androidViewHere })}
            />
            <Note>
              {t('admin.credits.instantViewsHint', {
                defaultValue:
                  'Instant views shown on the listing. 0 hides the option. Enquiry delivery and credit packages below are unchanged.',
              })}
            </Note>
            <Text style={styles.label}>
              {t('admin.credits.androidMode', { defaultValue: 'Billing mode' })}
            </Text>
            <View style={styles.filters}>
              {(['FREE', 'CREDITS'] as const).map(mode => (
                <Pressable
                  key={mode}
                  onPress={() => patchDraft({ androidMode: mode })}
                  style={[styles.chip, draft.androidMode === mode && styles.chipOn]}>
                  <Text style={[styles.chipText, draft.androidMode === mode && styles.chipTextOn]}>
                    {mode === 'FREE'
                      ? t('admin.credits.modeFree', { defaultValue: 'Free (rate limit only)' })
                      : t('admin.credits.modeCredits', {
                          defaultValue: 'Credits (after free quota)',
                        })}
                  </Text>
                </Pressable>
              ))}
            </View>
            <LimitField
              label={t('admin.credits.androidFree', { defaultValue: 'Free mobile enquiries per day' })}
              value={draft.androidFree}
              editable={creditsBilling}
              onChangeText={androidFree => patchDraft({ androidFree })}
            />
            <LimitField
              label={t('admin.credits.hourly', { defaultValue: 'Hourly rate limit' })}
              value={draft.hourly}
              onChangeText={hourly => patchDraft({ hourly })}
            />
            {draft.androidMode === 'FREE' ? (
              <Text style={styles.fieldHint}>
                {t('admin.credits.androidFreeHint', {
                  defaultValue:
                    'The free enquiry count is only used when billing mode is Credits. The hourly rate limit still applies.',
                })}
              </Text>
            ) : null}
            <PackageEditor
              title={t('admin.credits.mobilePackages', {
                defaultValue: 'Credit package — mobile app',
              })}
              hint={t('admin.credits.mobilePackagesHint', {
                defaultValue:
                  'Shown on Android when billing mode is Credits and purchases are enabled. Creating new packages is not supported yet.',
              })}
              footer={t('admin.credits.mobilePackageFooter', {
                defaultValue: 'This package will be shown to users in the mobile app.',
              })}
              packages={mobilePackages}
              onChange={updatePackage}
            />
          </Section>

          <Pressable
            disabled={saving}
            onPress={() => void save()}
            style={[styles.save, saving && styles.saveDisabled]}>
            {saving ? <ActivityIndicator color={colors.white} /> : null}
            <Text style={styles.saveText}>
              {saving
                ? t('common.saving', { defaultValue: 'Saving…' })
                : t('common.save', { defaultValue: 'Save' })}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      <ZoomableImageModal
        visible={qrOpen}
        source={qrSource}
        title={t('admin.credits.qr', { defaultValue: 'Payment QR code' })}
        closeLabel={t('common.close', { defaultValue: 'Close' })}
        loading={qrLoading}
        error={qrError}
        onClose={() => setQrOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  pageHint: { ...typography.caption, color: colors.textSecondary },
  loadError: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  linkRow: { alignSelf: 'flex-start', marginTop: -spacing.xs },
  linkText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  sectionHint: { ...typography.caption, color: colors.textSecondary },
  howCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.lightGreen,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: pastels.mint.border,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  toggleCopy: { flex: 1, gap: 4 },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  labelDisabled: { color: colors.muted },
  labelInline: { ...typography.caption, fontWeight: '700', color: colors.textPrimary },
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
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: colors.muted,
    borderColor: '#E2E8F0',
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  counterRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  counterHint: { flex: 1, marginTop: 0 },
  counter: { ...typography.caption, color: colors.textSecondary },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: pastels.blue.bg,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  noteText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  qrTitle: { ...typography.bodyStrong, color: colors.textPrimary, marginTop: spacing.sm },
  qrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  qr: {
    width: 88,
    height: 88,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrEmpty: {
    width: 88,
    height: 88,
    borderRadius: radius.input,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  qrEmptyText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  qrBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  qrBackdropTap: { ...StyleSheet.absoluteFillObject },
  qrFull: { width: '100%', height: '70%' },
  qrActions: { flex: 1, gap: spacing.sm },
  secondaryBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  secondaryText: { ...typography.caption, fontWeight: '700', color: '#16A34A' },
  dangerBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
  },
  dangerText: { ...typography.caption, fontWeight: '700', color: colors.danger },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.white,
    maxWidth: '100%',
  },
  chipOn: { backgroundColor: colors.mintSubtle, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  chipTextOn: { color: colors.tealDark },
  packageBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: '#D3F0E0',
    gap: spacing.xs,
  },
  packageTitle: { ...typography.bodyStrong, color: colors.textPrimary, fontSize: 14 },
  packageFooter: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  pkgCard: { marginTop: spacing.sm, gap: spacing.xs },
  pkgRow: { flexDirection: 'row', gap: spacing.sm },
  pkgField: { flex: 1 },
  save: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.input,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  saveDisabled: { opacity: 0.7 },
  saveText: { ...typography.bodyStrong, color: colors.white },
});
