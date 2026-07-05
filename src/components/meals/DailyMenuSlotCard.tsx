import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealComboResponse, MealType, UUID } from '../../api/types';
import { Card } from '../ui/Card';
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
  menuPlanningStatusFilterLabelKey,
  MENU_PLANNING_STATUS_COLORS,
  MENU_PLANNING_STATUS_SYMBOLS,
} from '../../utils/menuPlanningStatusVisual';
import { slotPlanningStatus } from '../../utils/menuPlanningFilter';
import {
  resolveMenuOptionCurrency,
  resolveMenuOptionPrice,
} from '../../utils/comboPrice';
import { ComboItemsPopup } from './ComboItemsPopup';
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
  onClosePoll?: () => void;
  pollStatus?: 'OPEN' | 'CLOSED' | null;
  pollResponseCount?: number;
  pollActionLoading?: boolean;
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
  onClosePoll,
  pollStatus,
  pollResponseCount = 0,
  pollActionLoading = false,
  onViewHeadcount,
  readOnly = false,
}: DailyMenuSlotCardProps) {
  const { t } = useTranslation();
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
  const options = menu?.options?.filter(option => option.isAvailable) ?? [];
  const hasPlan = options.length > 0;
  const canShare = hasPlan && onShare;

  const slotStatus = slotPlanningStatus(menu);
  const statusColor = MENU_PLANNING_STATUS_COLORS[slotStatus];
  const statusSymbol = MENU_PLANNING_STATUS_SYMBOLS[slotStatus];
  const statusLabel = t(menuPlanningStatusFilterLabelKey(slotStatus));

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

  const shareLabel =
    published && pollStatus === 'OPEN'
      ? t('meals.planning.shareSlotAgain')
      : t('meals.planning.shareSlot');

  const respondedLabel = t('meals.poll.respondedCount', { count: pollResponseCount });

  return (
    <>
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.slotTitle}>{t(mealTypeLabelKey(mealType))}</Text>
        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <Text style={[styles.statusSymbol, { color: statusColor }]}>{statusSymbol}</Text>
          <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {!hasPlan ? (
        <Text style={styles.empty}>{t('meals.menu.noItemsYet')}</Text>
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

      {(canShareAction || (published && pollStatus)) ? <View style={styles.divider} /> : null}

      {published && pollStatus === 'OPEN' ? (
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

      {published && pollStatus === 'CLOSED' ? (
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
        </View>
      ) : null}

      {published && pollStatus === 'OPEN' && onClosePoll && !readOnly ? (
        <Pressable
          style={[styles.pollCloseButton, pollActionLoading && styles.buttonDisabled]}
          onPress={onClosePoll}
          disabled={pollActionLoading}>
          <Text style={styles.pollCloseButtonText}>
            {pollActionLoading ? t('meals.poll.submitting') : t('meals.poll.closePoll')}
          </Text>
        </Pressable>
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
  },
  pollCloseButton: {
    marginTop: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  pollCloseButtonText: { ...typography.bodyStrong, color: colors.muted, fontSize: 14 },
});
