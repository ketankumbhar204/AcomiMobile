import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ChevronDown, CircleDollarSign, Search, UserRound, WalletCards, X } from 'lucide-react-native';
import { PaymentServiceUnavailableError, paymentsApi } from '../../api/paymentsApi';
import { ApiError } from '../../api/types';
import type {
  CreateSpacePaymentRequest,
  MemberResponse,
  SpacePaymentResponse,
  UniversalPaymentStatus,
} from '../../api/types';
import { OccupancyMemberPickerModal } from '../../components/occupancy/OccupancyMemberPickerModal';
import { MealFormHero } from '../../components/meals/MealFormHero';
import { MenuDatePickerModal } from '../../components/meals/MenuDatePickerModal';
import { StickyFormActions } from '../../components/progressive';
import { ChargeTypePickerModal } from '../../components/payments/ChargeTypePickerModal';
import {
  Button,
  EmptyState,
  FormInput,
  HeaderBackButton,
  Screen,
} from '../../components/ui';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { canManagePayments } from '../../utils/dashboardFinancial';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';
import {
  buildManualCharge,
  findCatalogChargeType,
  isChargeablePaymentMember,
  parsePositiveAmount,
} from '../../utils/chargeCatalog';
import { getChargeTypeIcon } from '../../utils/chargeTypeIcons';
import { rememberChargeType } from '../../utils/recentChargeTypes';
import { isoDateToMonthKey, todayIsoDate } from '../../utils/mealDates';
import { formatPaymentAmount } from '../../utils/paymentHistory';
import { invalidatePaymentsMonthCaches } from '../../utils/paymentsMonthCache';
import {
  paymentDetailContentGutter,
  paymentDetailScreenPadding,
} from './paymentDetailLayout';

type Nav = NativeStackNavigationProp<MainStackParamList, 'CreatePayment'>;
type Route = NativeStackScreenProps<MainStackParamList, 'CreatePayment'>['route'];

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
  const {
    spaceId,
    month: routeMonth,
    memberId: routeMemberId,
    memberName: routeMemberName,
    memberMobile: routeMemberMobile,
  } = route.params;
  const memberLocked = Boolean(routeMemberId);
  const showToast = useToastStore(state => state.showToast);
  const permissions = useSpacePermissions(spaceId);
  const canManage = canManagePayments(permissions.membershipRole);

  const [member, setMember] = useState<MemberResponse | null>(
    routeMemberId
      ? ({
          memberId: routeMemberId,
          fullName: routeMemberName?.trim() || routeMemberId,
          mobileNumber: routeMemberMobile ?? '',
        } as MemberResponse)
      : null,
  );
  const [memberPickerVisible, setMemberPickerVisible] = useState(false);
  const [typeId, setTypeId] = useState('');
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [description, setDescription] = useState('');
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
      title: t(
        memberLocked
          ? 'paymentCollection.addRecord.title'
          : 'paymentCollection.addRecord.createTitle',
      ),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [i18n.language, memberLocked, navigation, t]);

  const month = useMemo(() => isoDateToMonthKey(dueDate) || routeMonth, [dueDate, routeMonth]);

  const selectedType = typeId ? findCatalogChargeType(typeId) : undefined;
  const category = selectedType?.category ?? '';
  const selectedTypeIcon = selectedType ? getChargeTypeIcon(selectedType.id) : Search;

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
        setFormError(t('paymentCollection.addRecord.errors.member'));
        return;
      }
      const parsedAmount = parsePositiveAmount(amount);
      if (parsedAmount == null) {
        setFormError(t('paymentCollection.addRecord.errors.amount'));
        return;
      }
      if (!selectedType?.category) {
        setFormError(
          t(
            selectedType
              ? 'paymentCollection.addRecord.errors.category'
              : 'paymentCollection.addRecord.errors.type',
          ),
        );
        return;
      }
      const draft = buildManualCharge({
        category,
        typeId: selectedType.id,
        typeLabel: t(`paymentCollection.chargeCatalog.types.${selectedType.id}`),
        customLabel,
        description,
      });
      if (!draft) {
        setFormError(
          selectedType.custom
            ? t('paymentCollection.addRecord.errors.customType')
            : t('paymentCollection.addRecord.errors.type'),
        );
        return;
      }

      const body: CreateSpacePaymentRequest = {
        memberId: member.memberId,
        paymentType: draft.paymentType,
        paymentCategory: draft.paymentCategory,
        amount: parsedAmount,
        month,
        dueDate,
        title: draft.title,
        description: draft.description,
        remarks: note.trim() || undefined,
        confirmDuplicateDeposit,
      };

      submitLock.current = true;
      setSubmitting(true);
      setFormError(null);
      try {
        const created = await paymentsApi.createPayment(spaceId, body);
        rememberChargeType(spaceId, selectedType.id).catch(() => undefined);
        invalidateDashboardQueries();
        invalidatePaymentsMonthCaches(spaceId, created.month || month);
        showToast(t('paymentCollection.addRecord.success'));
        navigation.goBack();
      } catch (error) {
        if (error instanceof PaymentServiceUnavailableError) {
          setFormError(t('paymentCollection.serviceUnavailable.title'));
        } else if (
          !confirmDuplicateDeposit &&
          draft.paymentType === 'DEPOSIT' &&
          draft.paymentCategory === 'SECURITY' &&
          isDepositConflict(error)
        ) {
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
      customLabel,
      description,
      dueDate,
      loadExistingDeposit,
      member,
      month,
      navigation,
      note,
      category,
      selectedType,
      showToast,
      spaceId,
      t,
    ],
  );

  const handleSubmit = useCallback(async () => {
    if (
      selectedType?.paymentType === 'DEPOSIT' &&
      selectedType.paymentCategory === 'SECURITY' &&
      member &&
      !depositConfirmVisible
    ) {
      const existing = await loadExistingDeposit();
      if (existing) {
        setExistingDeposit(existing);
        setDepositConfirmVisible(true);
        return;
      }
    }
    await submitPayment(false);
  }, [depositConfirmVisible, loadExistingDeposit, member, selectedType, submitPayment]);

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
          heading={t(
            memberLocked
              ? 'paymentCollection.addRecord.title'
              : 'paymentCollection.addRecord.createTitle',
          )}
          subheading={t('paymentCollection.create.subheading')}
          compact
        />

        <Text style={styles.label}>{t('paymentCollection.addRecord.member')}</Text>
        <Pressable
          onPress={() => {
            if (!memberLocked) {
              setMemberPickerVisible(true);
            }
          }}
          disabled={memberLocked}
          style={({ pressed }) => [styles.memberRow, pressed && !memberLocked && styles.memberRowPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('paymentCollection.create.selectMember')}>
          <View style={styles.memberAvatar}>
            <UserRound size={18} color={colors.primaryDark} strokeWidth={2.2} />
          </View>
          <View style={styles.flex}>
            <Text
              style={[styles.memberName, !member && styles.typePlaceholder]}
              numberOfLines={1}>
              {member?.fullName || t('paymentCollection.addRecord.searchPlaceholder')}
            </Text>
            {member?.mobileNumber ? (
              <Text style={styles.memberMeta}>{member.mobileNumber}</Text>
            ) : null}
          </View>
          {memberLocked ? null : (
            <ChevronDown size={18} color={colors.muted} strokeWidth={2.2} />
          )}
        </Pressable>

        <Text style={styles.label}>{t('paymentCollection.addRecord.type')}</Text>
        <View style={styles.typeRow}>
          <Pressable
            onPress={() => setTypePickerVisible(true)}
            style={({ pressed }) => [styles.typeMain, pressed && styles.memberRowPressed]}
            accessibilityRole="button"
            accessibilityLabel={t('paymentCollection.addRecord.searchChargeType')}>
            {React.createElement(selectedTypeIcon, {
              size: 18,
              color: colors.primaryDark,
              strokeWidth: 2.2,
            })}
            <Text
              style={[styles.typeValue, !selectedType && styles.typePlaceholder]}
              numberOfLines={1}>
              {selectedType
                ? t(`paymentCollection.chargeCatalog.types.${selectedType.id}`)
                : t('paymentCollection.addRecord.searchChargeType')}
            </Text>
          </Pressable>
          {selectedType ? (
            <Pressable
              onPress={() => {
                setTypeId('');
                setCustomLabel('');
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('paymentCollection.addRecord.clearChargeType')}>
              <X size={16} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          ) : (
            <ChevronDown size={18} color={colors.muted} strokeWidth={2.2} />
          )}
        </View>

        <Text style={styles.label}>{t('paymentCollection.addRecord.categoryDerived')}</Text>
        <View style={styles.categoryRow}>
          <Text style={[styles.typeValue, !category && styles.typePlaceholder]} numberOfLines={1}>
            {category
              ? t(`paymentCollection.chargeCatalog.categories.${category}`)
              : t('paymentCollection.addRecord.categoryDerived')}
          </Text>
          {category ? (
            <Text style={styles.autoSelected}>{t('paymentCollection.addRecord.autoSelected')}</Text>
          ) : null}
        </View>

        {selectedType?.custom ? (
          <FormInput
            label={t('paymentCollection.addRecord.customType')}
            value={customLabel}
            onChangeText={setCustomLabel}
          />
        ) : null}

        <FormInput
          label={t('paymentCollection.addRecord.amount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          prefix="₹"
          leadingIcon={CircleDollarSign}
        />

        <Text style={styles.label}>{t('paymentCollection.addRecord.dueDate')}</Text>
        <Pressable
          onPress={() => setDatePickerVisible(true)}
          style={({ pressed }) => [styles.dateRow, pressed && styles.memberRowPressed]}
          accessibilityRole="button">
          <CalendarDays size={18} color={colors.primaryDark} strokeWidth={2.2} />
          <Text style={styles.dateValue}>{dueDate}</Text>
        </Pressable>

        <FormInput
          label={t('paymentCollection.addRecord.description')}
          value={description}
          onChangeText={setDescription}
        />

        <FormInput
          label={t('paymentCollection.addRecord.notes')}
          value={note}
          onChangeText={setNote}
          multiline
        />

        {formError ? <Text style={styles.error}>{formError}</Text> : null}
      </ScrollView>

      <StickyFormActions>
        <Button
          label={t('paymentCollection.addRecord.cancel')}
          variant="secondary"
          onPress={() => navigation.goBack()}
          disabled={submitting}
          style={styles.actionBtn}
        />
        <Button
          label={t(
            memberLocked
              ? 'paymentCollection.addRecord.submit'
              : 'paymentCollection.addRecord.createSubmit',
          )}
          onPress={() => void handleSubmit()}
          loading={submitting}
          disabled={submitting}
          style={styles.actionBtn}
        />
      </StickyFormActions>

      <ChargeTypePickerModal
        visible={typePickerVisible}
        spaceId={spaceId}
        selectedId={typeId}
        onClose={() => setTypePickerVisible(false)}
        onSelect={type => {
          setTypeId(type.id);
          setCustomLabel('');
          setTypePickerVisible(false);
        }}
      />

      <OccupancyMemberPickerModal
        visible={memberPickerVisible}
        spaceId={spaceId}
        title={t('paymentCollection.addRecord.member')}
        searchPlaceholder={t('paymentCollection.addRecord.searchPlaceholder')}
        includeMember={isChargeablePaymentMember}
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
  screen: {
    flex: 1,
    padding: paymentDetailScreenPadding,
  },
  flex: { flex: 1 },
  content: {
    paddingTop: spacing.md,
    paddingHorizontal: paymentDetailContentGutter,
    paddingBottom: 140,
    gap: spacing.md,
  },
  actionBtn: {
    width: '100%',
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
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  typeMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
  },
  typeValue: { ...typography.bodyStrong, flex: 1 },
  typePlaceholder: { color: colors.muted, fontWeight: '500' },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    backgroundColor: '#F8FAFC',
  },
  autoSelected: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
    textAlign: 'right',
  },
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
