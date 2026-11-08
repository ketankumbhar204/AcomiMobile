import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  CalendarRange,
  Check,
  Infinity as InfinityIcon,
  Info,
} from 'lucide-react-native';
import { DateField, FormInput } from '../../../components/ui';
import { colors, radius, spacing, typography } from '../../../theme';
import { formatContractAmount } from '../../../utils/occupancyContract';
import { shortStayNightCount, type StayChoice } from '../../../utils/shortStay';

export type ShortStayChoiceSection = 'type' | 'details' | 'contract' | 'full';

type ShortStayChoiceProps = {
  choice: StayChoice;
  /** @deprecated Short Stay uses dailyRent; kept for call-site compatibility during transition. */
  agreedTotal: string;
  expectedExitDate: string;
  /** YYYY-MM-DD check-in / move-in used for night count (D-03). */
  checkInDate?: string;
  showCheckout: boolean;
  /** Which sections to render. Defaults to full (legacy combined layout). */
  section?: ShortStayChoiceSection;
  /** Catalog monthly rent — used only for Monthly stay info banner (not Short/Until I Leave pricing). */
  catalogRent?: number | null;
  expectedExitError?: string | null;
  agreedTotalError?: string | null;
  /** Daily rent (₹/night) for Short Stay — primary pricing input. */
  dailyRent?: string;
  dailyRentError?: string | null;
  onChoiceChange: (choice: StayChoice) => void;
  onAgreedTotalChange: (value: string) => void;
  onDailyRentChange?: (value: string) => void;
  onExpectedExitDateChange: (value: string) => void;
  onInfoPress?: (topic: 'monthly' | 'short' | 'open_ended' | 'short_contract') => void;
};

const CHOICES: StayChoice[] = ['MONTHLY', 'SHORT', 'OPEN_ENDED'];

function choiceLabelKey(value: StayChoice): string {
  if (value === 'SHORT') {
    return 'occupancy.section.shortStayChoice';
  }
  if (value === 'OPEN_ENDED') {
    return 'occupancy.section.openEndedStayChoice';
  }
  return 'occupancy.section.monthlyStayChoice';
}

function choiceDefaultLabel(value: StayChoice): string {
  if (value === 'SHORT') {
    return 'Daily';
  }
  if (value === 'OPEN_ENDED') {
    return 'No Fixed Move-Out Date';
  }
  return 'Monthly';
}

function choiceHintKey(value: StayChoice): string {
  if (value === 'SHORT') {
    return 'occupancy.section.shortStayChoiceHint';
  }
  if (value === 'OPEN_ENDED') {
    return 'occupancy.section.openEndedStayChoiceHint';
  }
  return 'occupancy.section.monthlyStayChoiceHint';
}

function choiceDefaultHint(value: StayChoice): string {
  if (value === 'SHORT') {
    return 'Pay a daily rent for a fixed number of days (e.g., a few days or weeks).';
  }
  if (value === 'OPEN_ENDED') {
    return 'No fixed move-out date. Pay daily rent until the resident vacates.';
  }
  return 'Fixed monthly rent.';
}

function ChoiceIcon({ value, selected }: { value: StayChoice; selected: boolean }) {
  const color = selected ? colors.primaryDark : colors.textSecondary;
  const bg =
    value === 'SHORT'
      ? selected
        ? '#DBEAFE'
        : '#EFF6FF'
      : value === 'OPEN_ENDED'
        ? selected
          ? '#EDE9FE'
          : '#F5F3FF'
        : selected
          ? colors.successTint
          : `${colors.primary}14`;
  return (
    <View style={[styles.choiceIcon, { backgroundColor: bg }]}>
      {value === 'SHORT' ? (
        <CalendarRange size={18} color={color} strokeWidth={2.2} />
      ) : value === 'OPEN_ENDED' ? (
        <InfinityIcon size={18} color={color} strokeWidth={2.2} />
      ) : (
        <CalendarDays size={18} color={color} strokeWidth={2.2} />
      )}
    </View>
  );
}

export function ShortStayChoice({
  choice,
  agreedTotal: _agreedTotal,
  expectedExitDate,
  checkInDate,
  showCheckout,
  section = 'full',
  catalogRent = null,
  expectedExitError = null,
  agreedTotalError = null,
  dailyRent = '',
  dailyRentError = null,
  onChoiceChange,
  onAgreedTotalChange: _onAgreedTotalChange,
  onDailyRentChange,
  onExpectedExitDateChange,
  onInfoPress,
}: ShortStayChoiceProps) {
  const { t } = useTranslation();
  const showType = section === 'type' || section === 'full';
  const showDetails = section === 'details' || section === 'full';
  const showContract = section === 'contract' || section === 'full';

  const nights = useMemo(() => {
    if (choice !== 'SHORT' || !checkInDate || !expectedExitDate) {
      return null;
    }
    return shortStayNightCount(checkInDate, expectedExitDate);
  }, [checkInDate, choice, expectedExitDate]);

  const dailyAmount = Number(String(dailyRent).replace(/,/g, ''));
  const stayRent =
    nights != null && Number.isFinite(dailyAmount) && dailyAmount > 0
      ? dailyAmount * nights
      : null;

  return (
    <View style={styles.wrap}>
      {showType ? (
        <View style={styles.cardList}>
          {CHOICES.map(value => {
            const selected = choice === value;
            return (
              <Pressable
                key={value}
                onPress={() => onChoiceChange(value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.choiceCard, selected && styles.choiceCardSelected]}>
                <ChoiceIcon value={value} selected={selected} />
                <View style={styles.choiceCardBody}>
                  <Text style={[styles.choiceTitle, selected && styles.choiceTitleSelected]}>
                    {t(choiceLabelKey(value), { defaultValue: choiceDefaultLabel(value) })}
                  </Text>
                  <Text style={[styles.choiceHint, selected && styles.choiceHintSelected]}>
                    {t(choiceHintKey(value), { defaultValue: choiceDefaultHint(value) })}
                  </Text>
                </View>
                <View style={[styles.checkWrap, selected && styles.checkWrapSelected]}>
                  {selected ? <Check size={14} color={colors.white} strokeWidth={3} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {showDetails && choice === 'SHORT' ? (
        <View style={styles.typeBanner}>
          <CalendarRange size={16} color="#6D28D9" strokeWidth={2.2} />
          <Text style={styles.typeBannerText}>
            {t('occupancy.section.shortStayBanner', {
              defaultValue: 'Daily | Pay daily rent for a fixed number of days.',
            })}
          </Text>
          <Pressable
            hitSlop={8}
            onPress={() => onInfoPress?.('short')}
            accessibilityRole="button"
            accessibilityLabel={t('common.moreInfo', { defaultValue: 'More info' })}>
            <Info size={16} color={colors.textSecondary} strokeWidth={2.2} />
          </Pressable>
        </View>
      ) : null}

      {showDetails && choice === 'OPEN_ENDED' ? (
        <View style={styles.typeBanner}>
          <InfinityIcon size={16} color="#6D28D9" strokeWidth={2.2} />
          <Text style={styles.typeBannerText}>
            {t('occupancy.section.openEndedStayBanner', {
              defaultValue: 'No Fixed Move-Out Date | No fixed planned checkout date.',
            })}
          </Text>
          <Pressable
            hitSlop={8}
            onPress={() => onInfoPress?.('open_ended')}
            accessibilityRole="button"
            accessibilityLabel={t('common.moreInfo', { defaultValue: 'More info' })}>
            <Info size={16} color={colors.textSecondary} strokeWidth={2.2} />
          </Pressable>
        </View>
      ) : null}

      {showDetails && choice === 'MONTHLY' && catalogRent != null && Number.isFinite(catalogRent) ? (
        <View style={styles.typeBanner}>
          <CalendarDays size={16} color={colors.primaryDark} strokeWidth={2.2} />
          <Text style={styles.typeBannerText}>
            {t('occupancy.section.monthlyStayHintWithRent', {
              amount: formatContractAmount(catalogRent),
              defaultValue: 'Monthly rent ({{amount}}) starts from the move-in date.',
            })}
          </Text>
          <Pressable
            hitSlop={8}
            onPress={() => onInfoPress?.('monthly')}
            accessibilityRole="button"
            accessibilityLabel={t('common.moreInfo', { defaultValue: 'More info' })}>
            <Info size={16} color={colors.textSecondary} strokeWidth={2.2} />
          </Pressable>
        </View>
      ) : null}

      {showDetails && choice === 'MONTHLY' && showCheckout ? (
        <DateField
          label={t('occupancy.section.expectedMoveOut', { defaultValue: 'Expected move-out' })}
          value={expectedExitDate}
          onChange={onExpectedExitDateChange}
          allowPastDates
          optional
          error={expectedExitError ?? undefined}
        />
      ) : null}

      {showDetails && choice === 'SHORT' ? (
        <>
          {showCheckout ? (
            <DateField
              label={t('occupancy.section.expectedMoveOut', { defaultValue: 'Checkout date' })}
              value={expectedExitDate}
              onChange={onExpectedExitDateChange}
              allowPastDates
              error={expectedExitError ?? undefined}
            />
          ) : null}
          {nights != null ? (
            <View style={styles.durationBar}>
              <Text style={styles.durationLabel}>
                {t('occupancy.section.stayDuration', { defaultValue: 'Stay duration' })}
              </Text>
              <Text style={styles.durationValue}>
                {t('occupancy.section.stayDurationNightsCount', {
                  count: nights,
                  defaultValue: '{{count}} nights',
                })}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      {showContract && choice === 'SHORT' ? (
        <View style={styles.contractBlock}>
          <View style={styles.typeBanner}>
            <CalendarRange size={16} color="#6D28D9" strokeWidth={2.2} />
            <Text style={styles.typeBannerText}>
              {nights != null
                ? t('occupancy.section.shortStayContractBanner', {
                    count: nights,
                    defaultValue: 'Daily · {{count}} nights',
                  })
                : t('occupancy.section.shortStayChoice', { defaultValue: 'Daily' })}
            </Text>
            <Pressable
              hitSlop={8}
              onPress={() => onInfoPress?.('short_contract')}
              accessibilityRole="button"
              accessibilityLabel={t('common.moreInfo', { defaultValue: 'More info' })}>
              <Info size={16} color={colors.textSecondary} strokeWidth={2.2} />
            </Pressable>
          </View>

          <FormInput
            label={t('occupancy.contract.dailyRent', { defaultValue: 'Daily rent (per night)' })}
            value={dailyRent}
            onChangeText={value => {
              onDailyRentChange?.(value);
            }}
            keyboardType="decimal-pad"
            error={dailyRentError ?? agreedTotalError}
            placeholder={t('occupancy.contract.dailyRentPlaceholder', {
              defaultValue: 'Enter rent per night, e.g. 500',
            })}
          />

          {stayRent != null && nights != null ? (
            <View style={styles.stayRentCard}>
              <Text style={styles.stayRentTitle}>
                {t('occupancy.contract.stayRent', { defaultValue: 'Stay Rent' })}
              </Text>
              <Text style={styles.stayRentCalc}>
                {t('occupancy.contract.stayRentCalc', {
                  daily: formatContractAmount(dailyAmount),
                  count: nights,
                  defaultValue: '{{daily}} × {{count}} nights',
                })}
              </Text>
              <Text style={styles.stayRentTotal}>{formatContractAmount(stayRent)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.md },
  cardList: { gap: spacing.sm },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 72,
  },
  choiceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  choiceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCardBody: { flex: 1, gap: 2, minWidth: 0 },
  choiceTitle: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.textPrimary,
  },
  choiceTitleSelected: {
    color: colors.primaryDark,
  },
  choiceHint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  choiceHintSelected: {
    color: colors.textSecondary,
  },
  checkWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrapSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F5F3FF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  typeBannerText: {
    ...typography.caption,
    flex: 1,
    color: colors.textPrimary,
    lineHeight: 17,
    fontWeight: '600',
  },
  durationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${colors.primary}12`,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: `${colors.primary}28`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  durationLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  durationValue: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 14,
  },
  contractBlock: { gap: spacing.sm },
  stayRentCard: {
    backgroundColor: `${colors.primary}12`,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: `${colors.primary}28`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 2,
  },
  stayRentTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  stayRentCalc: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stayRentTotal: {
    ...typography.h3,
    fontSize: 22,
    color: colors.primaryDark,
    marginTop: 2,
  },
});
