import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Copy, Pencil, Share2, UtensilsCrossed } from 'lucide-react-native';
import type { DailyMenuResponse, MealComboResponse, MealType, UUID } from '../../api/types';
import { Card } from '../ui/Card';
import { HeaderOverflowMenu } from '../ui/HeaderOverflowMenu';
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
  formatComboPrice,
} from '../../utils/comboPrice';
import { ComboItemsPopup } from './ComboItemsPopup';
import { MealTypeVisual } from './MealTypeVisual';

const MAX_VISIBLE = 3;
const EMPTY_COMBO_MAP = new Map<string, MealComboResponse>();

type DailyMenuSlotCardProps = {
  menu?: DailyMenuResponse | null;
  mealType: MealType;
  spaceId?: UUID;
  comboById?: Map<string, MealComboResponse>;
  onSelectMenu?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onCopyMenu?: () => void;
  copyMenuLoading?: boolean;
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
  onCopyMenu,
  copyMenuLoading = false,
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
  const options = useMemo(
    () => menu?.options?.filter(option => option.isAvailable) ?? [],
    [menu?.options],
  );
  const hasPlan = options.length > 0;
  const canShare = hasPlan && onShare;
  const cardStatus =
    !hasPlan
      ? 'empty'
      : published
        ? 'shared'
        : modified
          ? 'updated'
          : 'planned';
  const cardStatusLabel =
    cardStatus === 'empty'
      ? t('meals.planning.selector.notPlanned', { defaultValue: 'Not planned' })
      : cardStatus === 'shared'
        ? t('meals.planning.selector.shared', { defaultValue: 'Shared' })
        : cardStatus === 'updated'
          ? t('meals.planning.selector.updated', { defaultValue: 'Updated' })
          : t('meals.planning.selector.planned', { defaultValue: 'Planned' });

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
    resolveMenuOptionItemNames(spaceId, option, library)
      .then(names => {
        setComboPreviewItems(names);
      })
      .catch(() => undefined)
      .finally(() => {
        setComboPreviewLoading(false);
      });
  };

  const menuCtaLabel = hasPlan
    ? t('meals.menu.editMenu')
    : t('meals.menu.selectMenu');
  const menuCtaAction = readOnly ? undefined : hasPlan ? onEdit : onSelectMenu;
  const canShareAction = !readOnly && canShare;

  const respondedLabel = t('meals.poll.respondedCount', { count: pollResponseCount });

  return (
    <>
    <Card style={styles.card} padded={false}>
      <View style={styles.cardInner}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MealTypeVisual mealType={mealType} size={18} style={styles.headerIcon} />
          <Text style={styles.slotTitle}>{t(mealTypeLabelKey(mealType))}</Text>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.headerStatus,
              cardStatus === 'empty' && styles.headerStatusEmpty,
              cardStatus === 'updated' && styles.headerStatusUpdated,
            ]}>
            <Text
              style={[
                styles.headerStatusText,
                cardStatus === 'empty' && styles.headerStatusTextEmpty,
                cardStatus === 'updated' && styles.headerStatusTextUpdated,
              ]}>
              {cardStatusLabel}
            </Text>
          </View>
          <HeaderOverflowMenu
            accessibilityLabel={t('spaces.menu.open')}
            items={[
              {
                id: 'copy-menu',
                label: t('meals.planning.copyMenu'),
                visible: !readOnly && Boolean(onCopyMenu),
                onPress: () => onCopyMenu?.(),
              },
            ]}
          />
        </View>
      </View>

      {!hasPlan ? (
        <View style={styles.emptyBlock}>
          <View style={styles.emptyRow}>
            <View style={styles.emptyIllustration} accessibilityElementsHidden>
              <ClipboardList size={28} color={colors.primaryDark} strokeWidth={1.8} />
              <View style={styles.emptyIllustrationBadge}>
                <UtensilsCrossed size={14} color={colors.primary} strokeWidth={2.2} />
              </View>
            </View>
            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>
                {t('meals.menu.emptyTitle', { meal: t(mealTypeLabelKey(mealType)) })}
              </Text>
              <Text style={styles.emptyHint}>{t('meals.menu.emptyHint')}</Text>
            </View>
          </View>
          <View style={styles.emptyActions}>
            {!readOnly && onCopyMenu ? (
              <Pressable
                android_ripple={{ color: 'rgba(18, 140, 126, 0.12)' }}
                style={({ pressed }) => [
                  styles.copyMenuButton,
                  styles.emptyActionButton,
                  copyMenuLoading && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
                onPress={onCopyMenu}
                disabled={copyMenuLoading}
                accessibilityRole="button">
                <Copy size={16} color={colors.primaryDark} strokeWidth={2.2} />
                <Text style={styles.copyMenuText}>
                  {copyMenuLoading
                    ? t('common.loading', { defaultValue: 'Loading…' })
                    : t('meals.planning.copyMenu')}
                </Text>
              </Pressable>
            ) : null}
            {menuCtaAction && !hasPlan ? (
              <Pressable
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                style={({ pressed }) => [
                  styles.menuCtaButton,
                  styles.emptyActionButton,
                  styles.emptyPrimaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={menuCtaAction}
                accessibilityRole="button">
                <Text style={styles.menuCtaText}>{menuCtaLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.choicesBlock}>
          <View style={styles.choicesHeader}>
            <Text style={styles.choicesLabel}>{t('meals.menu.plannedMenuLabel')}</Text>
            <Text style={styles.choicesSeparator}>•</Text>
            <Text style={styles.choicesCount}>
              {t('meals.planning.summaryItems', {
                count: plannedCounts.items,
                defaultValue: '{{count}} items',
              })}
            </Text>
            <Text style={styles.choicesSeparator}>•</Text>
            <Text style={styles.choicesCount}>
              {t('meals.planning.summaryCombos', {
                count: plannedCounts.combos,
                defaultValue: '{{count}} combos',
              })}
            </Text>
          </View>
          <View style={styles.menuRows}>
            {visibleOptionRows.map(({ option, itemNames, price, currencyCode }, index) => {
              const isCombo = getPlannedEntryKind(option) === 'combo';
              const priceLabel = mealPricing.showMealPrices
                ? formatComboPrice(price, currencyCode ?? 'INR')
                : null;
              return (
                <Pressable
                  key={option.optionId ?? `${option.label}-${index}`}
                  onPress={
                    isCombo
                      ? () => openOptionPreview(option, itemNames, price, currencyCode)
                      : undefined
                  }
                  disabled={!isCombo}
                  style={({ pressed }) => [
                    styles.menuRow,
                    pressed && styles.menuRowPressed,
                  ]}>
                  <View style={styles.menuBullet} />
                  <Text style={styles.menuItemName} numberOfLines={1}>
                    {option.label}
                  </Text>
                  {isCombo ? (
                    <Text style={styles.comboLabel}>
                      {t('meals.menu.entryKindComboSuffix')}
                    </Text>
                  ) : null}
                  {priceLabel ? <Text style={styles.menuPrice}>{priceLabel}</Text> : null}
                  {isCombo ? <Text style={styles.menuChevron}>›</Text> : null}
                </Pressable>
              );
            })}
          </View>
          {!expanded && hiddenCount > 0 ? (
            <Pressable onPress={() => setExpanded(true)} style={styles.moreRow}>
              <Text style={styles.moreChoices}>
                {t(moreChoicesI18nKey(plannedCounts), { count: hiddenCount })}
              </Text>
            </Pressable>
          ) : null}
          {expanded && hiddenCount > 0 ? (
            <Pressable onPress={() => setExpanded(false)} style={styles.moreRow}>
              <Text style={styles.moreChoices}>{t(showLessI18nKey(plannedCounts))}</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {hasPlan ? (
        <View style={styles.plannedActions}>
          <Pressable
            onPress={!readOnly ? onEdit : undefined}
            disabled={readOnly || !onEdit}
            android_ripple={{ color: 'rgba(18, 140, 126, 0.1)' }}
            style={({ pressed }) => [
              styles.plannedAction,
              (readOnly || !onEdit) && styles.plannedActionDisabled,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button">
            <Pencil size={16} color={colors.primaryDark} strokeWidth={2.2} />
            <Text
              style={styles.plannedActionText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}>
              {t('meals.menu.editMenu')}
            </Text>
          </Pressable>
          <Pressable
            onPress={canShareAction ? onShare : undefined}
            disabled={!canShareAction}
            android_ripple={{ color: 'rgba(18, 140, 126, 0.1)' }}
            style={({ pressed }) => [
              styles.plannedAction,
              !canShareAction && styles.plannedActionDisabled,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button">
            <Share2 size={16} color={colors.primaryDark} strokeWidth={2.2} />
            <Text
              style={styles.plannedActionText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}>
              {t('meals.planning.shareMealAction', { defaultValue: 'Share meal' })}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {(modified || (published && pollStatus)) ? (
        <View style={styles.divider} />
      ) : null}

      {modified ? (
        <View style={styles.shareFooter}>
          <Text style={styles.priorPollHint}>
            {pollStatus
              ? t('meals.planning.priorPollResponsesHint', { count: pollResponseCount })
              : t('meals.planning.shareNeedsReshareHint')}
          </Text>
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
        </View>
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
      </View>
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
  card: {
    marginBottom: 0,
    borderRadius: 18,
    overflow: 'hidden',
  },
  cardInner: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  slotTitle: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  headerStatus: {
    minHeight: 26,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.lightGreen,
  },
  headerStatusEmpty: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  headerStatusUpdated: {
    backgroundColor: '#DBEAFE',
  },
  headerStatusText: {
    ...typography.caption,
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
  headerStatusTextEmpty: {
    color: colors.muted,
  },
  headerStatusTextUpdated: {
    color: '#2563EB',
  },
  emptyBlock: {
    gap: spacing.md,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIllustration: {
    width: 72,
    height: 72,
    borderRadius: radius.card,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emptyIllustrationBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  emptyHint: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
  emptyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyActionButton: {
    flex: 1,
    marginTop: 0,
  },
  emptyPrimaryButton: {
    backgroundColor: colors.primary,
  },
  copyMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  copyMenuText: {
    ...typography.bodyStrong,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  empty: { ...typography.body, color: colors.muted, marginBottom: spacing.sm },
  choicesBlock: { marginBottom: spacing.md },
  choicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  choicesLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  choicesCount: { ...typography.caption, color: colors.muted },
  choicesSeparator: { ...typography.caption, color: colors.muted },
  menuRows: {
    gap: spacing.xs,
  },
  menuRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
  },
  menuRowPressed: {
    backgroundColor: colors.surface,
  },
  menuBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    flexShrink: 0,
  },
  menuItemName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
    flex: 1,
    minWidth: 0,
  },
  comboLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    flexShrink: 0,
  },
  menuPrice: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    fontSize: 13,
    flexShrink: 0,
  },
  menuChevron: {
    ...typography.bodyStrong,
    color: colors.muted,
    fontSize: 18,
    flexShrink: 0,
  },
  moreRow: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  moreChoices: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  menuCtaButton: {
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCtaButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  menuCtaText: {
    ...typography.bodyStrong,
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  menuCtaTextSecondary: { color: colors.primaryDark },
  plannedActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  plannedAction: {
    flex: 1,
    minWidth: 0,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    overflow: 'hidden',
  },
  plannedActionDisabled: {
    opacity: 0.45,
  },
  plannedActionText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
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
