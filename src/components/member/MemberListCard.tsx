import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BedSingle, CalendarDays, ChevronRight, Smartphone } from 'lucide-react-native';
import { DashboardAvatar } from '../dashboard/shared/DashboardPersonCard';
import { ContactNumberLine } from './ContactAndStayMeta';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import type { MemberListStayDateInfo } from '../../utils/memberListStayDates';
import { formatStayTrail } from '../../utils/stayTrail';

type MemberListCardProps = {
  title: string;
  iconLabel: string;
  onPress: () => void;
  roleChip?: React.ReactNode;
  contactLabel?: string;
  /** Raw mobile for dial/SMS/WhatsApp; falls back to contactLabel. */
  contactValue?: string | null;
  stayLabel?: string | null;
  /** Planned/actual move-in and expected move-out for Reserved / Moved In. */
  stayDates?: MemberListStayDateInfo | null;
  statusChip?: React.ReactNode;
  /** Compact stay-type chip shown under the occupancy status on the right. */
  stayTypeChip?: React.ReactNode;
  statusLabel?: string;
  statusColor?: string;
  acomiLabel?: string;
  acomiActive?: boolean;
  footerLine?: string;
  paymentLine?: { text: string; tone: 'due' | 'clear' | 'review' };
  onPaymentPress?: () => void;
  foodLine?: {
    label: string;
    manageControl?: React.ReactNode;
  };
};

function locationDisplay(label: string | null | undefined): string | null {
  const trail = formatStayTrail(label);
  if (!trail) {
    return null;
  }
  return trail
    .split(/\s*(?:→|[•·|])\s*/)
    .map(part => part.trim())
    .filter(Boolean)
    .join(' · ');
}

function duesPanelTint(tone: 'due' | 'clear' | 'review' | undefined): string {
  switch (tone) {
    case 'due':
      return '#FFF7ED';
    case 'review':
      return '#EFF6FF';
    case 'clear':
      return '#ECFDF5';
    default:
      return '#F8FAFC';
  }
}

function StayDateColumn({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.dateCol}>
      <View style={styles.dateLabelRow}>
        <CalendarDays size={12} color={colors.textSecondary} strokeWidth={2.2} />
        <Text style={styles.dateLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={styles.dateValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function MemberListCard({
  title,
  iconLabel,
  onPress,
  roleChip,
  contactLabel,
  contactValue,
  stayLabel,
  stayDates,
  statusChip,
  stayTypeChip,
  statusLabel,
  statusColor = colors.textSecondary,
  acomiLabel,
  acomiActive,
  footerLine,
  paymentLine,
  onPaymentPress,
  foodLine,
}: MemberListCardProps) {
  const { t } = useTranslation();
  const paymentColor =
    paymentLine?.tone === 'due'
      ? '#D97706'
      : paymentLine?.tone === 'review'
        ? '#1D4ED8'
        : colors.primaryDark;
  const locationText = locationDisplay(stayLabel);
  const showMeta = Boolean(statusLabel || acomiLabel || footerLine);
  const showFooter = Boolean(paymentLine || foodLine);
  const metaParts = [
    statusLabel ? 'status' : null,
    acomiLabel ? 'acomi' : null,
    footerLine ? 'date' : null,
  ].filter(Boolean);
  const hasUpperSection = Boolean(locationText || stayDates);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.identityRow}>
        <DashboardAvatar label={iconLabel} />
        <View style={styles.identityText}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {roleChip || contactLabel || contactValue ? (
            <View style={styles.roleContactRow}>
              {roleChip ? <View style={styles.roleWrap}>{roleChip}</View> : null}
              {contactLabel || contactValue ? (
                <ContactNumberLine
                  label={contactLabel}
                  value={contactValue ?? contactLabel}
                  name={title}
                  textStyle={styles.contact}
                  containerStyle={styles.contactInline}
                  showIcon={false}
                />
              ) : null}
            </View>
          ) : null}
        </View>
        <View style={styles.trailing}>
          <View style={styles.trailingChips}>
            {statusChip}
            {stayTypeChip}
          </View>
          <ChevronRight size={16} color={colors.muted} />
        </View>
      </View>

      {locationText ? (
        <View style={styles.locationRow}>
          <BedSingle size={14} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={styles.locationText} numberOfLines={2}>
            {locationText}
          </Text>
        </View>
      ) : null}

      {stayDates ? (
        <View
          style={[
            styles.dateRow,
            stayDates.tone === 'reserved' ? styles.dateRowReserved : styles.dateRowMovedIn,
          ]}>
          <StayDateColumn
            label={t(stayDates.moveInLabelKey, {
              defaultValue:
                stayDates.tone === 'reserved' ? 'Planned move-in' : 'Move-in date',
            })}
            value={stayDates.moveInValue}
          />
          <View style={styles.dateDivider} />
          <StayDateColumn
            label={t(stayDates.moveOutLabelKey, {
              defaultValue: 'Expected move-out',
            })}
            value={stayDates.moveOutValue}
          />
        </View>
      ) : null}

      {showMeta ? (
        <View style={[styles.metaRow, hasUpperSection ? null : styles.metaRowBorder]}>
          {statusLabel ? (
            <View style={styles.metaItem}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.metaText, { color: statusColor }]} numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>
          ) : null}
          {statusLabel && metaParts.length > 1 ? <View style={styles.metaDivider} /> : null}
          {acomiLabel ? (
            <View style={styles.metaItem}>
              <Smartphone
                size={12}
                color={acomiActive ? colors.primary : colors.muted}
                strokeWidth={2.2}
              />
              <Text
                style={[styles.metaText, acomiActive ? styles.acomiOn : styles.metaMuted]}
                numberOfLines={1}>
                {acomiLabel}
              </Text>
            </View>
          ) : null}
          {acomiLabel && footerLine ? <View style={styles.metaDivider} /> : null}
          {footerLine ? (
            <View style={styles.metaItem}>
              <CalendarDays size={12} color={colors.muted} />
              <Text style={[styles.metaText, styles.metaMuted]} numberOfLines={1}>
                {footerLine}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {showFooter ? (
        <View
          style={[
            styles.footerPanel,
            { backgroundColor: duesPanelTint(paymentLine?.tone) },
          ]}>
          {paymentLine ? (
            <Pressable
              accessibilityRole="button"
              onPress={event => {
                event.stopPropagation?.();
                onPaymentPress?.();
              }}
              disabled={!onPaymentPress}
              style={styles.paymentPress}>
              <Text style={[styles.paymentText, { color: paymentColor }]} numberOfLines={1}>
                {paymentLine.text}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.paymentPress} />
          )}
          {foodLine ? (
            <View style={styles.foodRow}>
              <Text style={styles.foodLabel} numberOfLines={1}>
                {foodLine.label}
              </Text>
              {foodLine.manageControl}
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    justifyContent: 'center',
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 18,
  },
  roleContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    marginTop: 1,
  },
  roleWrap: {
    flexShrink: 0,
  },
  contactInline: {
    flex: 1,
    minWidth: 0,
  },
  contact: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
    flexShrink: 1,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2,
    flexShrink: 0,
    paddingTop: 1,
  },
  trailingChips: {
    alignItems: 'flex-end',
    gap: 4,
    maxWidth: 120,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    minWidth: 0,
    lineHeight: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  dateRowReserved: {
    backgroundColor: '#EFF6FF',
  },
  dateRowMovedIn: {
    backgroundColor: '#ECFDF5',
  },
  dateCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  dateValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    paddingLeft: 16,
  },
  dateDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.sm,
    rowGap: 4,
  },
  metaRowBorder: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  metaDivider: {
    width: StyleSheet.hairlineWidth,
    height: 12,
    backgroundColor: colors.border,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  metaText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  metaMuted: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  acomiOn: {
    color: colors.primaryDark,
  },
  footerPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  paymentPress: {
    flexShrink: 1,
    minWidth: 0,
    flex: 1,
  },
  paymentText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    flexShrink: 1,
    maxWidth: '58%',
  },
  foodLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
});
