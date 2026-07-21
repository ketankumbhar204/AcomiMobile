import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealComboResponse, MealType, UUID } from '../../api/types';
import { Card } from '../ui/Card';
import { useMealPricingPolicy } from '../../hooks/useMealPricingPolicy';
import { colors, radius, spacing, typography } from '../../theme';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import {
  getMenuOptionItemNames,
  resolveMenuOptionItemNames,
} from '../../utils/plannedComboDisplay';
import {
  countPlannedEntries,
  getPlannedEntryKind,
  moreChoicesI18nKey,
  showLessI18nKey,
} from '../../utils/plannedMenuSummary';
import {
  resolveMenuOptionCurrency,
  resolveMenuOptionPrice,
} from '../../utils/comboPrice';
import { ComboItemsPopup } from './ComboItemsPopup';
import { MealStatusBadge } from './MealStatusBadge';
import { PlannedComboPreviewRow } from './PlannedComboPreviewRow';

const MAX_VISIBLE = 2;
const EMPTY_COMBO_MAP = new Map<string, MealComboResponse>();

type DailyMenuSlotCardProps = {
  menu?: DailyMenuResponse | null;
  mealType: MealType;
  spaceId?: UUID;
  comboById?: Map<string, MealComboResponse>;
  onSelectMenu?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onCopyYesterday?: () => void;
  copyYesterdayLoading?: boolean;
  onClosePoll?: () => void;
  onEditPollCloseAt?: () => void;
  pollStatus?: 'OPEN' | 'CLOSED' | null;
  pollResponseCount?: number;
  pollActionLoading?: boolean;
  pollCloseAtLabel?: string | null;
  pollClosedAtLabel?: string | null;
  pollCloseSource?: 'MANUAL' | 'AUTOMATIC' | null;
  onViewHeadcount?: () => void;
  readOnly?: boolean;
};

export function DailyMenuSlotCard({
  menu,
  mealType,
  spaceId,
  comboById,
  onSelectMenu,
  onEdit,
  onShare,
  onCopyYesterday,
  copyYesterdayLoading = false,
  onClosePoll,
  onEditPollCloseAt,
  pollStatus,
  pollResponseCount = 0,
  pollActionLoading = false,
  pollCloseAtLabel,
  pollClosedAtLabel,
  pollCloseSource,
  onViewHeadcount,
  readOnly = false,
}: DailyMenuSlotCardProps) {
  const { t } = useTranslation();
  const mealPricing = useMealPricingPolicy(spaceId);
  const library = comboById ?? EMPTY_COMBO_MAP;
  const [expanded, setExpanded] = useState(false);
  const [comboPreviewOpen, setComboPreviewOpen] = useState(false);
  const [comboPreviewLoading, setComboPreviewLoading] = useState(false);
  const [comboPreviewName, setComboPreviewName] = useState('');
  const [comboPreviewItems, setComboPreviewItems] = useState<string[]>([]);
  const [comboPreviewPrice, setComboPreviewPrice] = useState<number | null | undefined>();
  const [comboPreviewCurrency, setComboPreviewCurrency] = useState<string | null | undefined>();
  const [comboPreviewSingleItem, setComboPreviewSingleItem] = useState(false);
  const published = menu?.status === 'PUBLISHED';
  const modified = menu?.status === 'MODIFIED';
  const options = menu?.options?.filter(option => option.isAvailable) ?? [];
  const hasPlan = options.length > 0;
  const canShare = hasPlan && onShare;

  const hiddenCount = options.length - MAX_VISIBLE;

  const plannedCounts = useMemo(() => countPlannedEntries(options), [options]);

  const optionItemNames = useMemo(
    () =>
      options.map(option => ({
        option,
        itemNames: getMenuOptionItemNames(option, library),
        price: resolveMenuOptionPrice(option, library),
        currencyCode: resolveMenuOptionCurrency(option, library),
      })),
    [library, options],
  );

  const visibleOptionRows = expanded
    ? optionItemNames
    : optionItemNames.slice(0, MAX_VISIBLE);

  const openOptionPreview = (
    option: (typeof optionItemNames)[number]['option'],
    itemNames: string[],
    price?: number | null,
    currencyCode?: string | null,
  ) => {
    if (getPlannedEntryKind(option) !== 'combo') {
      return;
    }

    setComboPreviewName(option.label);
    setComboPreviewItems(itemNames);
    setComboPreviewPrice(price);
    setComboPreviewCurrency(currencyCode);
    setComboPreviewSingleItem(false);
    setComboPreviewOpen(true);

    if (itemNames.length > 0 || !spaceId) {
      return;
    }

    setComboPreviewLoading(true);
    void resolveMenuOptionItemNames(spaceId, option, library)
      .then(names => {
        setComboPreviewItems(names);
      })
      .finally(() => {
        setComboPreviewLoading(false);
      });
  };

  const menuCtaLabel = hasPlan
    ? t('meals.menu.editMenu')
    : t('meals.menu.selectMenu');
  const menuCtaAction = readOnly ? undefined : hasPlan ? onEdit : onSelectMenu;
  const canShareAction = !readOnly && canShare;

  const shareLabel = modified
    ? t('meals.planning.shareChanges')
    : published && pollStatus === 'OPEN'
      ? t('meals.planning.shareSlotAgain')
      : t('meals.planning.shareSlot');

  const respondedLabel = t('meals.poll.respondedCount', { count: pollResponseCount });

  return (
    <>
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.slotTitle}>{t(mealTypeLabelKey(mealType))}</Text>
        <MealStatusBadge menu={menu} />
      </View>

      {!hasPlan ? (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyTitle}>
            {t('meals.menu.emptyTitle', { meal: t(mealTypeLabelKey(mealType)) })}
          </Text>
          <Text style={styles.emptyHint}>{t('meals.menu.emptyHint')}</Text>
          {!readOnly && onCopyYesterday ? (
            <Pressable
              style={[styles.copyYesterdayButton, copyYesterdayLoading && styles.buttonDisabled]}
              onPress={onCopyYesterday}
              disabled={copyYesterdayLoading}>
              <Text style={styles.copyYesterdayText}>
                {copyYesterdayLoading
                  ? t('common.loading', { defaultValue: 'Loading…' })
                  : t('meals.planning.copyYesterday')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.choicesBlock}>
          <View style={styles.choicesHeader}>
            <Text style={styles.choicesLabel}>{t('meals.menu.plannedMenuLabel')}</Text>
            <Text style={styles.choicesCount}>
              {plannedCounts.combos > 0 && plannedCounts.items > 0
                ? t('meals.menu.plannedMenuBreakdown', {
                    combos: plannedCounts.combos,
                    items: plannedCounts.items,
                  })
                : `(${options.length})`}
            </Text>
          </View>
          {visibleOptionRows.map(({ option, itemNames, price, currencyCode }, index) => (
            <PlannedComboPreviewRow
              key={option.optionId ?? `${option.label}-${index}`}
              option={option}
              itemNames={itemNames}
              price={price}
              currencyCode={currencyCode}
              showPrice={mealPricing.showMealPrices}
              onPress={
                getPlannedEntryKind(option) === 'combo'
                  ? () => openOptionPreview(option, itemNames, price, currencyCode)
                  : undefined
              }
            />
          ))}
          {!expanded && hiddenCount > 0 ? (
            <Pressable onPress={() => setExpanded(true)}>
              <Text style={styles.moreChoices}>
                {t(moreChoicesI18nKey(plannedCounts), { count: hiddenCount })}
              </Text>
            </Pressable>
          ) : null}
          {expanded && hiddenCount > 0 ? (
            <Pressable onPress={() => setExpanded(false)}>
              <Text style={styles.moreChoices}>{t(showLessI18nKey(plannedCounts))}</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {menuCtaAction ? (
        <Pressable
          style={[styles.menuCtaButton, hasPlan && styles.menuCtaButtonSecondary]}
          onPress={menuCtaAction}>
          <Text style={[styles.menuCtaText, hasPlan && styles.menuCtaTextSecondary]}>
            {menuCtaLabel}
          </Text>
        </Pressable>
      ) : null}

      {(canShareAction || modified || (published && pollStatus)) ? (
        <View style={styles.divider} />
      ) : null}

      {modified ? (
        <View style={styles.shareFooter}>
          <Text style={styles.priorPollHint}>
            {pollStatus
              ? t('meals.planning.priorPollResponsesHint', { count: pollResponseCount })
              : t('meals.planning.shareNeedsReshareHint')}
          </Text>
          {canShareAction ? (
            <Pressable style={styles.shareLink} onPress={onShare}>
              <Text style={styles.shareLinkText}>{shareLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : published && pollStatus === 'OPEN' ? (
        <View style={styles.shareFooter}>
          <View style={styles.pollStatusRow}>
            <Text style={styles.pollStatusMuted}>{t('meals.poll.pollOpenPrefix')}</Text>
            {onViewHeadcount ? (
              <Pressable onPress={onViewHeadcount} hitSlop={8} style={styles.pollStatusLinkWrap}>
                <Text style={styles.pollStatusLink}>
                  {respondedLabel}
                  <Text style={styles.pollStatusChevron}> ›</Text>
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.pollStatusOpen}>{respondedLabel}</Text>
            )}
          </View>
          {canShareAction ? (
            <Pressable style={styles.shareLink} onPress={onShare}>
              <Text style={styles.shareLinkText}>{shareLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : canShareAction ? (
        <Pressable style={styles.shareLinkCentered} onPress={onShare}>
          <Text style={styles.shareLinkText}>{shareLabel}</Text>
        </Pressable>
      ) : null}

      {published && !modified && pollStatus === 'CLOSED' ? (
        <View style={styles.closedPollFooter}>
          <View style={styles.pollStatusRow}>
            <Text style={styles.pollStatusMuted}>{t('meals.poll.pollClosedPrefix')}</Text>
            {onViewHeadcount ? (
              <Pressable onPress={onViewHeadcount} hitSlop={8} style={styles.pollStatusLinkWrap}>
                <Text style={styles.pollStatusLink}>
                  {respondedLabel}
                  <Text style={styles.pollStatusChevron}> ›</Text>
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.pollStatusClosed}>{respondedLabel}</Text>
            )}
          </View>
          {pollCloseSource === 'MANUAL' ? (
            <Text style={styles.closeAtMeta}>{t('meals.poll.closedManually')}</Text>
          ) : pollClosedAtLabel ? (
            <Text style={styles.closeAtMeta}>
              {t('meals.poll.closedAt', { when: pollClosedAtLabel })}
            </Text>
          ) : null}
        </View>
      ) : null}

      {published && pollStatus === 'OPEN' && onClosePoll && !readOnly ? (
        <View style={styles.closePollRow}>
          <Pressable
            style={[styles.pollCloseButton, styles.pollCloseButtonFlex, pollActionLoading && styles.buttonDisabled]}
            onPress={onClosePoll}
            disabled={pollActionLoading}>
            <Text style={styles.pollCloseButtonText}>
              {pollActionLoading ? t('meals.poll.submitting') : t('meals.poll.closePoll')}
            </Text>
          </Pressable>
          {pollCloseAtLabel ? (
            <Pressable
              style={styles.closeAtChip}
              onPress={onEditPollCloseAt}
              disabled={!onEditPollCloseAt || pollActionLoading}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={t('meals.poll.editCloseAtA11y', { when: pollCloseAtLabel })}>
              <Text style={styles.closeAtChipText} numberOfLines={2}>
                {t('meals.poll.closesAt', { when: pollCloseAtLabel })}
                {onEditPollCloseAt ? ' ✏️' : ''}
              </Text>
            </Pressable>
          ) : onEditPollCloseAt ? (
            <Pressable style={styles.closeAtChip} onPress={onEditPollCloseAt} hitSlop={6}>
              <Text style={styles.closeAtChipText}>{t('meals.poll.setCloseAt')} ✏️</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Card>

    <ComboItemsPopup
      visible={comboPreviewOpen}
      comboName={comboPreviewName}
      items={comboPreviewItems}
      price={comboPreviewPrice}
      currencyCode={comboPreviewCurrency}
      loading={comboPreviewLoading}
      singleItem={comboPreviewSingleItem}
      onClose={() => setComboPreviewOpen(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  slotTitle: { ...typography.bodyStrong },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusSymbol: {
    ...typography.caption,
    fontWeight: '800',
    fontSize: 12,
  },
  statusLabel: { ...typography.caption, fontWeight: '700' },
  emptyBlock: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
  copyYesterdayButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  copyYesterdayText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  empty: { ...typography.body, color: colors.muted, marginBottom: spacing.sm },
  choicesBlock: { marginBottom: spacing.sm },
  choicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  choicesLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  choicesCount: { ...typography.caption, color: colors.muted },
  moreChoices: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  menuCtaButton: {
    marginTop: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  menuCtaButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  menuCtaText: { ...typography.bodyStrong, color: colors.white, fontSize: 14 },
  menuCtaTextSecondary: { color: colors.primaryDark },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  buttonDisabled: { opacity: 0.6 },
  priorPollHint: {
    ...typography.caption,
    color: '#C2410C',
    flex: 1,
    fontWeight: '600',
  },
  shareFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  shareLink: { paddingVertical: spacing.xs },
  shareLinkCentered: { alignItems: 'center', paddingVertical: spacing.xs },
  shareLinkText: { ...typography.bodyStrong, color: colors.primaryDark, fontSize: 14 },
  pollStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    gap: spacing.xxs,
  },
  pollStatusMuted: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  pollStatusOpen: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  pollStatusLinkWrap: { paddingVertical: spacing.xxs },
  pollStatusLink: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  pollStatusChevron: {
    textDecorationLine: 'none',
    fontWeight: '600',
  },
  pollStatusClosed: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  closedPollFooter: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  closePollRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pollCloseButton: {
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  pollCloseButtonFlex: {
    flexShrink: 0,
    minWidth: 112,
  },
  pollCloseButtonText: { ...typography.bodyStrong, color: colors.muted, fontSize: 14 },
  closeAtChip: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  closeAtChipText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  closeAtMeta: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
});
