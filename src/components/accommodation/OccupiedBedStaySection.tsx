import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  BedSingle,
  Grid2x2,
  Calculator,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  History,
  IndianRupee,
  MapPin,
  Phone,
  RefreshCw,
  UserRound,
  Wallet,
  WalletCards,
} from 'lucide-react-native';
import { memberApi } from '../../api/memberApi';
import { formatMemberContactNumber } from '../../utils/indianMobile';
import { Button } from '../ui';
import { ReferenceCode } from '../ui/ReferenceCode';
import { useOccupiedBedStay, useOccupiedUnitStay } from '../../hooks/useOccupiedBedStay';
import type { MainStackParamList } from '../../navigation/types';
import { colors, pastels, radius, spacing, typography } from '../../theme';
import { getOccupancyExitDate } from '../../utils/occupancyRules';
import { formatPaymentAmount } from '../../utils/paymentHistory';
import { formatBillingPeriod } from '../../utils/paymentProofPolicy';
import {
  bedCardBalanceFace,
  type OccupantPaymentSummary,
  type StayPaymentStatus,
} from '../../utils/occupantPaymentSummary';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type OccupiedBedStaySectionProps = {
  spaceId: string;
  bedId?: string;
  unitId?: string;
  bedNumber: string;
  locationLine?: string;
  entity?: 'bed' | 'unit';
};

type DetailRowProps = {
  icon: React.ReactNode;
  label: string;
  value?: string;
  valueColor?: string;
  accessory?: React.ReactNode;
};

function DetailRow({ icon, label, value, valueColor, accessory }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabel}>
        {icon}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.detailValue}>
        {accessory ?? (
          <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
        )}
      </View>
    </View>
  );
}

function money(amount: number | null | undefined): string {
  return amount == null ? '—' : formatPaymentAmount(amount);
}

function formatStayDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function paymentBadgeColors(status: StayPaymentStatus): { bg: string; fg: string; border: string } {
  switch (status) {
    case 'PAID':
      return { bg: pastels.green.bg, fg: pastels.green.fg, border: pastels.green.border };
    case 'PARTIALLY_PAID':
      return { bg: pastels.orange.bg, fg: pastels.orange.fg, border: pastels.orange.border };
    case 'PENDING':
      return { bg: '#FEF2F2', fg: '#B91C1C', border: '#FECACA' };
    case 'UNDER_REVIEW':
      return { bg: pastels.blue.bg, fg: pastels.blue.fg, border: pastels.blue.border };
    default:
      return { bg: '#F8FAFC', fg: colors.textSecondary, border: colors.border };
  }
}

function paymentStatusLabel(
  status: StayPaymentStatus,
  t: (key: string, options?: { defaultValue?: string }) => string,
): string {
  switch (status) {
    case 'PAID':
      return t('accommodation.stayPayment.paidBadge', { defaultValue: 'Paid' });
    case 'PARTIALLY_PAID':
      return t('accommodation.stayPayment.partial', { defaultValue: 'Partially paid' });
    case 'PENDING':
      return t('accommodation.stayPayment.pending', { defaultValue: 'Pending payment' });
    case 'UNDER_REVIEW':
      return t('accommodation.stayPayment.underReview', { defaultValue: 'Under review' });
    case 'NO_RECORD':
      return t('accommodation.stayPayment.noRecord', { defaultValue: 'No payment record' });
    default:
      return t('accommodation.stayPayment.unavailable', {
        defaultValue: 'Payment status unavailable',
      });
  }
}

function StatusBadge({
  label,
  bg,
  fg,
  border,
  dot = false,
}: {
  label: string;
  bg: string;
  fg: string;
  border: string;
  dot?: boolean;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      {dot ? <View style={[styles.badgeDot, { backgroundColor: fg }]} /> : null}
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function SectionCard({
  title,
  icon,
  iconBg,
  borderColor,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  borderColor?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <View style={[styles.card, borderColor ? { borderColor } : null]}>
      <Pressable
        onPress={() => setOpen(current => !current)}
        style={styles.sectionHead}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}>
        <View style={[styles.sectionIcon, { backgroundColor: iconBg }]}>{icon}</View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {open ? (
          <ChevronUp size={16} color={colors.textSecondary} strokeWidth={2.2} />
        ) : (
          <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2.2} />
        )}
      </Pressable>
      {open ? children : null}
    </View>
  );
}

export function OccupiedBedStaySection({
  spaceId,
  bedId,
  unitId,
  bedNumber,
  locationLine,
  entity = 'bed',
}: OccupiedBedStaySectionProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const bedStay = useOccupiedBedStay(spaceId, bedId, entity === 'bed' && Boolean(bedId));
  const unitStay = useOccupiedUnitStay(spaceId, unitId, entity === 'unit' && Boolean(unitId));
  const stay = entity === 'unit' ? unitStay : bedStay;
  const numberLabel =
    entity === 'unit'
      ? t('accommodation.units.unitNumberLabel', { defaultValue: 'Unit number' })
      : t('accommodation.stayPayment.bedNumber', { defaultValue: 'Bed number' });
  const sectionTitle =
    entity === 'unit'
      ? t('accommodation.stayPayment.unitOccupancySection', {
          defaultValue: 'Unit and occupancy',
        })
      : t('accommodation.stayPayment.occupancySection', { defaultValue: 'Bed and occupancy' });
  const NumberIcon = entity === 'unit' ? Grid2x2 : BedSingle;
  const [mobile, setMobile] = useState<string | null>(null);

  useEffect(() => {
    const memberId = stay.occupancy?.memberId;
    if (!memberId) {
      setMobile(null);
      return;
    }
    let cancelled = false;
    void memberApi
      .getMember(spaceId, memberId)
      .then(member => {
        if (!cancelled) {
          setMobile(formatMemberContactNumber(member.mobileNumber));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMobile(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId, stay.occupancy?.memberId]);

  const moveIn = stay.occupancy?.actualMoveInAt || stay.occupancy?.moveInDate;
  const exitDate = getOccupancyExitDate(stay.occupancy);
  const mutedIcon = colors.textSecondary;
  const linkedOccupant = Boolean(
    stay.occupancy?.memberId && stay.occupancy.memberName?.trim(),
  );

  return (
    <View style={styles.wrap}>
      {stay.occupancy?.memberId ? (
        <Button
          label={t('occupancy.targetOccupant.viewMember', {
            defaultValue: 'View member profile',
          })}
          variant="secondary"
          tint={pastels.green}
          icon={UserRound}
          onPress={() =>
            navigation.navigate('MemberDetails', {
              spaceId,
              memberId: stay.occupancy!.memberId,
            })
          }
        />
      ) : null}

      <SectionCard
        title={sectionTitle}
        icon={<NumberIcon size={14} color={pastels.blue.fg} strokeWidth={2.2} />}
        iconBg={pastels.blue.bg}>
        <DetailRow
          icon={<NumberIcon size={14} color={mutedIcon} strokeWidth={2.2} />}
          label={numberLabel}
          value={bedNumber || '—'}
        />
        <ReferenceCode value={stay.occupancy?.referenceCode} />
        {locationLine ? (
          <DetailRow
            icon={<MapPin size={14} color={mutedIcon} strokeWidth={2.2} />}
            label={t('accommodation.stayPayment.location', { defaultValue: 'Location' })}
            value={locationLine}
          />
        ) : null}
        {moveIn ? (
          <DetailRow
            icon={<CalendarDays size={14} color={mutedIcon} strokeWidth={2.2} />}
            label={t('occupancy.section.moveInDate', { defaultValue: 'Move-in date' })}
            value={formatStayDate(moveIn)}
          />
        ) : null}

        <View style={styles.divider} />
        <View style={styles.occupantBanner}>
          <UserRound size={14} color={pastels.green.fg} strokeWidth={2.2} />
          <Text style={styles.occupantTitle}>
            {t('occupancy.targetOccupant.title', { defaultValue: 'Current occupant' })}
          </Text>
        </View>
        {stay.loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        {stay.error ? (
          <Text style={styles.error}>
            {t('accommodation.stayPayment.loadFailed', {
              defaultValue: 'Could not load tenant or payment details.',
            })}
          </Text>
        ) : null}
        {!stay.loading && !stay.error && !linkedOccupant ? (
          <Text style={styles.empty}>
            {t('accommodation.stayPayment.noTenant', { defaultValue: 'No linked tenant' })}
          </Text>
        ) : null}
        {linkedOccupant && stay.occupancy ? (
          <>
            <DetailRow
              icon={<UserRound size={14} color={mutedIcon} strokeWidth={2.2} />}
              label={t('occupancy.targetOccupant.member', { defaultValue: 'Member' })}
              value={stay.occupancy.memberName}
            />
            {mobile ? (
              <DetailRow
                icon={<Phone size={14} color={mutedIcon} strokeWidth={2.2} />}
                label={t('accommodation.stayPayment.contact', { defaultValue: 'Contact' })}
                value={mobile}
              />
            ) : null}
            <DetailRow
              icon={<BarChart3 size={14} color={mutedIcon} strokeWidth={2.2} />}
              label={t('accommodation.stayPayment.stayStatus', { defaultValue: 'Stay status' })}
              accessory={
                <StatusBadge
                  dot
                  label={t(`occupancy.status.${stay.occupancy.status}`, {
                    defaultValue: stay.occupancy.status,
                  })}
                  bg={stay.occupancy.status === 'ACTIVE' ? pastels.green.bg : '#F8FAFC'}
                  fg={stay.occupancy.status === 'ACTIVE' ? pastels.green.fg : colors.textSecondary}
                  border={stay.occupancy.status === 'ACTIVE' ? pastels.green.border : colors.border}
                />
              }
            />
            {exitDate ? (
              <DetailRow
                icon={<CalendarDays size={14} color={mutedIcon} strokeWidth={2.2} />}
                label={t('occupancy.fields.expectedExit', { defaultValue: 'Expected move-out' })}
                value={formatStayDate(exitDate)}
              />
            ) : null}
          </>
        ) : null}
      </SectionCard>

      <PaymentCard summary={stay.summary} loading={stay.loading} />
    </View>
  );
}

function PaymentCard({
  summary,
  loading,
}: {
  summary: OccupantPaymentSummary | null;
  loading: boolean;
}) {
  const { t } = useTranslation();
  if (!summary) {
    if (loading) {
      return null;
    }
    return (
      <View style={[styles.card, styles.paymentCard]}>
        <Text style={styles.empty}>
          {t('accommodation.stayPayment.unavailable', {
            defaultValue: 'Payment status unavailable',
          })}
        </Text>
      </View>
    );
  }

  const face = bedCardBalanceFace(summary);
  const badge = paymentBadgeColors(summary.status);
  const outstandingDue = face.kind === 'balance';
  const strip =
    face.kind === 'balance'
      ? [
          face.paid != null
            ? t('accommodation.stayPayment.paidAmount', {
                defaultValue: '{{amount}} paid',
                amount: formatPaymentAmount(face.paid),
              })
            : null,
          t('accommodation.stayPayment.remaining', {
            defaultValue: '{{amount}} remaining',
            amount: formatPaymentAmount(face.outstanding),
          }),
        ]
          .filter(Boolean)
          .join(' · ')
      : null;

  const muted = colors.textSecondary;
  return (
    <SectionCard
      title={t('accommodation.stayPayment.summary', { defaultValue: 'Payment summary' })}
      icon={<WalletCards size={14} color={pastels.purple.fg} strokeWidth={2.2} />}
      iconBg={pastels.purple.bg}
      borderColor={pastels.purple.border}>
      <DetailRow
        icon={<CalendarDays size={14} color={muted} strokeWidth={2.2} />}
        label={t('accommodation.stayPayment.period', { defaultValue: 'Period' })}
        value={formatBillingPeriod(summary.month)}
      />
      <DetailRow
        icon={<Wallet size={14} color={muted} strokeWidth={2.2} />}
        label={t('accommodation.stayPayment.status', { defaultValue: 'Payment status' })}
        accessory={
          <StatusBadge
            label={paymentStatusLabel(summary.status, t)}
            bg={badge.bg}
            fg={badge.fg}
            border={badge.border}
          />
        }
      />
      {summary.rent ? (
        <DetailRow
          icon={<IndianRupee size={14} color={muted} strokeWidth={2.2} />}
          label={t('accommodation.stayPayment.rentDue', { defaultValue: 'Rent due' })}
          value={money(summary.rent.outstanding)}
        />
      ) : null}
      {summary.deposit ? (
        <DetailRow
          icon={<IndianRupee size={14} color={muted} strokeWidth={2.2} />}
          label={t('accommodation.stayPayment.depositDue', { defaultValue: 'Deposit due' })}
          value={money(summary.deposit.outstanding)}
        />
      ) : null}
      {summary.totalDue != null ? (
        <DetailRow
          icon={<Calculator size={14} color={muted} strokeWidth={2.2} />}
          label={t('accommodation.stayPayment.totalDue', { defaultValue: 'Total due' })}
          value={money(summary.totalDue)}
        />
      ) : null}
      {summary.amountPaid != null ? (
        <DetailRow
          icon={<Wallet size={14} color={muted} strokeWidth={2.2} />}
          label={t('accommodation.stayPayment.amountPaid', { defaultValue: 'Amount paid' })}
          value={money(summary.amountPaid)}
        />
      ) : null}
      {summary.outstanding != null ? (
        <DetailRow
          icon={<History size={14} color={muted} strokeWidth={2.2} />}
          label={t('accommodation.stayPayment.outstanding', { defaultValue: 'Outstanding' })}
          value={money(summary.outstanding)}
          valueColor={outstandingDue ? '#B91C1C' : colors.textPrimary}
        />
      ) : null}
      {strip ? (
        <View style={styles.strip}>
          <RefreshCw size={14} color="#B91C1C" strokeWidth={2.2} />
          <Text style={styles.stripText}>{strip}</Text>
        </View>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  paymentCard: {
    borderColor: pastels.purple.border,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.bodyStrong,
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 5,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '48%',
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  value: {
    ...typography.body,
    width: '100%',
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
    flexShrink: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  occupantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: pastels.green.bg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginBottom: 2,
  },
  occupantTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: pastels.green.fg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    maxWidth: '100%',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  strip: {
    marginTop: spacing.xs,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stripText: {
    ...typography.caption,
    flex: 1,
    fontWeight: '700',
    color: '#B91C1C',
  },
  loader: { alignSelf: 'flex-start', marginVertical: spacing.xs },
  empty: { ...typography.body, color: colors.textSecondary, paddingVertical: spacing.xs },
  error: { ...typography.caption, color: '#DC2626', paddingVertical: spacing.xs },
});
