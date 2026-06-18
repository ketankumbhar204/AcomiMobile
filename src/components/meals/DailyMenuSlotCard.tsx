import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealComboResponse, MealType } from '../../api/types';
import { Card } from '../ui/Card';
import { colors, radius, spacing, typography } from '../../theme';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import { getMenuOptionItemNames } from '../../utils/plannedComboDisplay';
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
  comboById?: Map<string, MealComboResponse>;
  onSelectMenu?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onClosePoll?: () => void;
  pollStatus?: 'OPEN' | 'CLOSED' | null;
  pollResponseCount?: number;
  pollActionLoading?: boolean;
};

export function DailyMenuSlotCard({
  menu,
  mealType,
  comboById,
  onSelectMenu,
  onEdit,
  onShare,
  onClosePoll,
  pollStatus,
  pollResponseCount = 0,
  pollActionLoading = false,
}: DailyMenuSlotCardProps) {
  const { t } = useTranslation();
  const library = comboById ?? EMPTY_COMBO_MAP;
  const [expanded, setExpanded] = useState(false);
  const [comboPreviewOpen, setComboPreviewOpen] = useState(false);
  const [comboPreviewName, setComboPreviewName] = useState('');
  const [comboPreviewItems, setComboPreviewItems] = useState<string[]>([]);
  const published = menu?.status === 'PUBLISHED';
  const draft = menu?.status === 'DRAFT';
  const options = menu?.options?.filter(option => option.isAvailable) ?? [];
  const hasPlan = options.length > 0;
  const canShare = hasPlan && onShare;

  const statusLabel = published
    ? t('meals.menu.published')
    : draft
      ? t('meals.menu.draft')
      : t('meals.menu.notPlanned');
  const statusStyle = published ? styles.published : draft ? styles.draft : styles.notPlanned;

  const hiddenCount = options.length - MAX_VISIBLE;

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

  const openComboPreview = (comboName: string, itemNames: string[]) => {
    setComboPreviewName(comboName);
    setComboPreviewItems(itemNames);
    setComboPreviewOpen(true);
  };

  const menuCtaLabel = hasPlan
    ? t('meals.menu.editMenu')
    : t('meals.menu.selectMenu');
  const menuCtaAction = hasPlan ? onEdit : onSelectMenu;

  const shareLabel =
    published && pollStatus === 'OPEN'
      ? t('meals.planning.shareSlotAgain')
      : t('meals.planning.shareSlot');

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.slotTitle}>{t(mealTypeLabelKey(mealType))}</Text>
        <Text style={[styles.status, statusStyle]}>{statusLabel}</Text>
      </View>

      {!hasPlan ? (
        <Text style={styles.empty}>{t('meals.menu.noItemsYet')}</Text>
      ) : (
        <View style={styles.choicesBlock}>
          <View style={styles.choicesHeader}>
            <Text style={styles.choicesLabel}>{t('meals.menu.plannedMenuLabel')}</Text>
            <Text style={styles.choicesCount}>({options.length})</Text>
          </View>
          {visibleOptionRows.map(({ option, itemNames, price, currencyCode }, index) => (
            <PlannedComboPreviewRow
              key={option.optionId ?? `${option.label}-${index}`}
              option={option}
              itemNames={itemNames}
              price={price}
              currencyCode={currencyCode}
              onPress={() => openComboPreview(option.label, itemNames)}
            />
          ))}
          {!expanded && hiddenCount > 0 ? (
            <Pressable onPress={() => setExpanded(true)}>
              <Text style={styles.moreChoices}>
                {t('meals.menu.moreCombos', { count: hiddenCount })}
              </Text>
            </Pressable>
          ) : null}
          {expanded && hiddenCount > 0 ? (
            <Pressable onPress={() => setExpanded(false)}>
              <Text style={styles.moreChoices}>{t('meals.menu.showLessCombos')}</Text>
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

      {(canShare || (published && pollStatus)) ? <View style={styles.divider} /> : null}

      {published && pollStatus === 'OPEN' ? (
        <View style={styles.shareFooter}>
          <Text style={styles.pollStatusOpen}>
            {t('meals.poll.pollOpen', { count: pollResponseCount })}
          </Text>
          {canShare ? (
            <Pressable style={styles.shareLink} onPress={onShare}>
              <Text style={styles.shareLinkText}>{shareLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : canShare ? (
        <Pressable style={styles.shareLinkCentered} onPress={onShare}>
          <Text style={styles.shareLinkText}>{shareLabel}</Text>
        </Pressable>
      ) : null}

      {published && pollStatus === 'CLOSED' ? (
        <Text style={styles.pollStatusClosed}>{t('meals.poll.pollClosed')}</Text>
      ) : null}

      {published && pollStatus === 'OPEN' && onClosePoll ? (
        <Pressable
          style={[styles.pollCloseButton, pollActionLoading && styles.buttonDisabled]}
          onPress={onClosePoll}
          disabled={pollActionLoading}>
          <Text style={styles.pollCloseButtonText}>
            {pollActionLoading ? t('meals.poll.submitting') : t('meals.poll.closePoll')}
          </Text>
        </Pressable>
      ) : null}

      <ComboItemsPopup
        visible={comboPreviewOpen}
        comboName={comboPreviewName}
        items={comboPreviewItems}
        onClose={() => setComboPreviewOpen(false)}
      />
    </Card>
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
  status: { ...typography.caption, fontWeight: '600' },
  published: { color: colors.success },
  draft: { color: '#D97706' },
  notPlanned: { color: colors.muted },
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
  pollStatusOpen: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
  pollStatusClosed: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
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
