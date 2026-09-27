import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CalendarDays, CircleDollarSign, UserRound, WalletCards } from 'lucide-react-native';
import { PaymentServiceUnavailableError, paymentsApi } from '../../api/paymentsApi';
import { ApiError } from '../../api/types';
import type {
  CreateSpacePaymentRequest,
  MemberResponse,
  PaymentCategory,
  SpacePaymentResponse,
  UniversalPaymentStatus,
  UniversalPaymentType,
} from '../../api/types';
import { OccupancyMemberPickerModal } from '../../components/occupancy/OccupancyMemberPickerModal';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { MenuDatePickerModal } from '../../components/meals/MenuDatePickerModal';
import { StickyFormActions } from '../../components/progressive';
import {
  Button,
  EmptyState,
  FormInput,
  HeaderBackButton,
  ListFilterChips,
  Screen,
} from '../../components/ui';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { canManagePayments } from '../../utils/dashboardFinancial';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';
import { isoDateToMonthKey, todayIsoDate } from '../../utils/mealDates';
import { formatPaymentAmount } from '../../utils/paymentHistory';
import { invalidatePaymentsMonthCaches } from '../../utils/paymentsMonthCache';

type Nav = NativeStackNavigationProp<MainStackParamList, 'CreatePayment'>;
type Route = NativeStackScreenProps<MainStackParamList, 'CreatePayment'>['route'];

type ManualKind =
  | 'DEPOSIT'
  | 'MAINTENANCE'
  | 'ELECTRICITY'
  | 'WATER'
  | 'UTILITY'
  | 'EXTRA'
  | 'OTHER';

const MANUAL_KINDS: ManualKind[] = [
  'DEPOSIT',
  'MAINTENANCE',
  'ELECTRICITY',
  'WATER',
  'UTILITY',
  'EXTRA',
  'OTHER',
];

function kindToTypeCategory(
  kind: ManualKind,
): { paymentType: UniversalPaymentType; paymentCategory: PaymentCategory } {
  switch (kind) {
    case 'DEPOSIT':
      return { paymentType: 'DEPOSIT', paymentCategory: 'SECURITY' };
    case 'MAINTENANCE':
      return { paymentType: 'MAINTENANCE', paymentCategory: 'EXTRA' };
    case 'ELECTRICITY':
      return { paymentType: 'OTHER', paymentCategory: 'ELECTRICITY' };
    case 'WATER':
      return { paymentType: 'OTHER', paymentCategory: 'WATER' };
    case 'UTILITY':
      return { paymentType: 'OTHER', paymentCategory: 'INTERNET' };
    case 'EXTRA':
      return { paymentType: 'OTHER', paymentCategory: 'EXTRA' };
    default:
      return { paymentType: 'OTHER', paymentCategory: 'OTHER' };
  }
}

function parsePositiveAmount(value: string): number | null {
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) {
    return null;
  }
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return Math.round(amount * 100) / 100;
}

function isDepositConflict(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    (error.body?.errorCode === 'DEPOSIT_ALREADY_EXISTS' ||
      `${error.body?.error ?? ''} ${error.message}`.includes('DEPOSIT_ALREADY_EXISTS') ||
      `${error.message}`.toLowerCase().includes('security deposit already exists'))
  );
}

export function CreatePaymentScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, month: routeMonth } = route.params;
  const showToast = useToastStore(state => state.showToast);
  const permissions = useSpacePermissions(spaceId);
  const canManage = canManagePayments(permissions.membershipRole);

  const [member, setMember] = useState<MemberResponse | null>(null);
  const [memberPickerVisible, setMemberPickerVisible] = useState(false);
  const [kind, setKind] = useState<ManualKind>('ELECTRICITY');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(todayIsoDate());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [depositConfirmVisible, setDepositConfirmVisible] = useState(false);
  const [existingDeposit, setExistingDeposit] = useState<SpacePaymentResponse | null>(null);
  const submitLock = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('paymentCollection.create.title'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [i18n.language, navigation, t]);

  const month = useMemo(() => isoDateToMonthKey(dueDate) || routeMonth, [dueDate, routeMonth]);

  const kindOptions = useMemo(
    () =>
      MANUAL_KINDS.map(id => ({
        id,
        label: t(`paymentCollection.create.kinds.${id}`),
      })),
    [t],
  );

  const loadExistingDeposit = useCallback(async (): Promise<SpacePaymentResponse | null> => {
    if (!member) {
      return null;
    }
    try {
      const response = await paymentsApi.listPayments(spaceId, {
        memberId: member.memberId,
        month,
        paymentType: 'DEPOSIT',
        paymentCategory: 'SECURITY',
        sync: false,
      });
      return response.payments?.[0] ?? null;
    } catch {
      return null;
    }
  }, [member, month, spaceId]);

  const submitPayment = useCallback(
    async (confirmDuplicateDeposit: boolean) => {
      if (submitLock.current) {
        return;
      }
      Keyboard.dismiss();
      if (!member) {
        setFormError(t('paymentCollection.create.errors.memberRequired'));
        return;
      }
      const parsedAmount = parsePositiveAmount(amount);
      if (parsedAmount == null) {
        setFormError(t('paymentCollection.create.errors.amountRequired'));
        return;
      }
      if (!dueDate) {
        setFormError(t('paymentCollection.create.errors.dueDateRequired'));
        return;
      }

      const { paymentType, paymentCategory } = kindToTypeCategory(kind);
      const body: CreateSpacePaymentRequest = {
        memberId: member.memberId,
        paymentType,
        paymentCategory,
        amount: parsedAmount,
        month,
        dueDate,
        remarks: note.trim() || undefined,
        confirmDuplicateDeposit,
      };

      submitLock.current = true;
      setSubmitting(true);
      setFormError(null);
      try {
        const created = await paymentsApi.createPayment(spaceId, body);
        invalidateDashboardQueries();
        invalidatePaymentsMonthCaches(spaceId, created.month || month);
        showToast(t('paymentCollection.create.success'));
        navigation.goBack();
      } catch (error) {
        if (error instanceof PaymentServiceUnavailableError) {
          setFormError(t('paymentCollection.serviceUnavailable.title'));
        } else if (!confirmDuplicateDeposit && kind === 'DEPOSIT' && isDepositConflict(error)) {
          const existing = await loadExistingDeposit();
          setExistingDeposit(existing);
          setDepositConfirmVisible(true);
        } else {
          const message =
            error instanceof ApiError
              ? error.message
              : t('paymentCollection.create.errors.createFailed');
          setFormError(message);
        }
      } finally {
        submitLock.current = false;
        setSubmitting(false);
      }
    },
    [
      amount,
      dueDate,
      kind,
      loadExistingDeposit,
      member,
      month,
      navigation,
      note,
      showToast,
      spaceId,
      t,
    ],
  );

  const handleSubmit = useCallback(async () => {
    if (kind === 'DEPOSIT' && member && !depositConfirmVisible) {
      const existing = await loadExistingDeposit();
      if (existing) {
        setExistingDeposit(existing);
        setDepositConfirmVisible(true);
        return;
      }
    }
    await submitPayment(false);
  }, [depositConfirmVisible, kind, loadExistingDeposit, member, submitPayment]);

  const depositDetail = useMemo(() => {
    if (!existingDeposit) {
      return '';
    }
    const statusLabel = t(`paymentCollection.status.${existingDeposit.paymentStatus as UniversalPaymentStatus}`, {
      defaultValue: existingDeposit.paymentStatus,
    });
    return t('paymentCollection.create.duplicateDeposit.detail', {
      amount: formatPaymentAmount(existingDeposit.amount, existingDeposit.currencyCode),
      month: existingDeposit.month,
      status: statusLabel,
    });
  }, [existingDeposit, t]);

  if (!canManage) {
    return (
      <Screen>
        <EmptyState
          Icon={WalletCards}
          title={t('payments.accessDenied.title')}
          description={t('payments.accessDenied.description')}
        />
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} contentStyle={styles.screen}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <MealFormHero
          icon={WalletCards}
          eyebrow={t('paymentCollection.create.eyebrow')}
          heading={t('paymentCollection.create.heading')}
          subheading={t('paymentCollection.create.subheading')}
          compact
        />

        <Text style={styles.label}>{t('paymentCollection.create.member')}</Text>
        <Pressable
          onPress={() => setMemberPickerVisible(true)}
          style={({ pressed }) => [styles.memberRow, pressed && styles.memberRowPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('paymentCollection.create.selectMember')}>
          <View style={styles.memberAvatar}>
            <UserRound size={18} color={colors.primaryDark} strokeWidth={2.2} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.memberName} numberOfLines={1}>
              {member?.fullName || t('paymentCollection.create.selectMember')}
            </Text>
            {member?.mobileNumber ? (
              <Text style={styles.memberMeta}>{member.mobileNumber}</Text>
            ) : null}
          </View>
        </Pressable>

        <Text style={styles.label}>{t('paymentCollection.create.type')}</Text>
        <ListFilterChips options={kindOptions} value={kind} onChange={setKind} />

        <FormInput
          label={t('paymentCollection.create.amount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          prefix="₹"
          leadingIcon={CircleDollarSign}
        />

        <Text style={styles.label}>{t('paymentCollection.create.dueDate')}</Text>
        <Pressable
          onPress={() => setDatePickerVisible(true)}
          style={({ pressed }) => [styles.dateRow, pressed && styles.memberRowPressed]}
          accessibilityRole="button">
          <CalendarDays size={18} color={colors.primaryDark} strokeWidth={2.2} />
          <Text style={styles.dateValue}>{dueDate}</Text>
        </Pressable>

        <FormInput
          label={t('paymentCollection.create.note')}
          value={note}
          onChangeText={setNote}
          multiline
        />

        {formError ? <Text style={styles.error}>{formError}</Text> : null}
      </ScrollView>

      <StickyFormActions>
        <Button
          label={t('paymentCollection.create.submit')}
          onPress={() => void handleSubmit()}
          loading={submitting}
          disabled={submitting}
        />
      </StickyFormActions>

      <OccupancyMemberPickerModal
        visible={memberPickerVisible}
        spaceId={spaceId}
        title={t('paymentCollection.create.selectMember')}
        onClose={() => setMemberPickerVisible(false)}
        onSelect={selected => {
          setMember(selected);
          setMemberPickerVisible(false);
        }}
      />

      <MenuDatePickerModal
        visible={datePickerVisible}
        value={dueDate}
        allowPastDates
        onClose={() => setDatePickerVisible(false)}
        onConfirm={isoDate => {
          setDueDate(isoDate);
          setDatePickerVisible(false);
        }}
      />

      {depositConfirmVisible ? (
        <View style={styles.confirmOverlay} pointerEvents="box-none">
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>
              {t('paymentCollection.create.duplicateDeposit.title')}
            </Text>
            <Text style={styles.confirmBody}>
              {t('paymentCollection.create.duplicateDeposit.body', { detail: depositDetail })}
            </Text>
            <View style={styles.confirmActions}>
              <Button
                label={t('common.cancel')}
                variant="secondary"
                onPress={() => setDepositConfirmVisible(false)}
                style={styles.confirmBtn}
              />
              <Button
                label={t('paymentCollection.create.duplicateDeposit.confirm')}
                onPress={() => {
                  setDepositConfirmVisible(false);
                  void submitPayment(true);
                }}
                loading={submitting}
                style={styles.confirmBtn}
              />
            </View>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.section,
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  memberRowPressed: { opacity: 0.85 },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: { ...typography.bodyStrong },
  memberMeta: { ...typography.caption, color: colors.textSecondary },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  dateValue: { ...typography.bodyStrong },
  error: { ...typography.body, color: '#DC2626' },
  confirmOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  confirmCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  confirmTitle: { ...typography.h3 },
  confirmBody: { ...typography.body, color: colors.textSecondary },
  confirmActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  confirmBtn: { flex: 1 },
});
