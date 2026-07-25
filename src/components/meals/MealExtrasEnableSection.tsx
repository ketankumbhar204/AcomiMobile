import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { FoodItemResponse, UUID } from '../../api/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import {
  getEffectivePriceDraft,
  hasComboPrice,
  parsePriceInput,
  validatePriceInput,
} from '../../utils/comboPrice';
import {
  comboPriceDraftErrorMessage,
  type ComboPriceDraftError,
} from '../../utils/comboSelectionPricing';
import type { MenuSelectionItemPackage } from '../../utils/dailyMenuDraft';
import { persistItemPriceDraft } from '../../utils/itemSelectionPricing';
import {
  buildMealExtraSuggestionBuckets,
  toExtraPackage,
} from '../../utils/mealExtrasSuggestions';

type MealExtrasEnableSectionProps = {
  spaceId: UUID;
  catalogItems: FoodItemResponse[];
  /** Combo constituent IDs — shown under “In your meal”. */
  selectedMealItemIds: Set<string>;
  /** Broader IDs (incl. individual mains) for related-extra categories only. */
  categorySeedItemIds?: Set<string>;
  enabledExtras: MenuSelectionItemPackage[];
  onChange: (extras: MenuSelectionItemPackage[]) => void;
  onCatalogItemUpdated?: (item: FoodItemResponse) => void;
  /** Open Menu Library → Extras to configure more add-ons. */
  onConfigureMoreExtras?: () => void;
  /** Brief highlight after “Continue to Extras”. */
  highlighted?: boolean;
  /** Fired when the owner interacts with extras controls. */
  onInteract?: () => void;
  disabled?: boolean;
};

/**
 * Mess Menu Planning: context-aware extras with inline price edit
 * (same default-price API as Configure extras / meal pricing).
 */
export function MealExtrasEnableSection({
  spaceId,
  catalogItems,
  selectedMealItemIds,
  categorySeedItemIds,
  enabledExtras,
  onChange,
  onCatalogItemUpdated,
  onConfigureMoreExtras,
  highlighted = false,
  onInteract,
  disabled = false,
}: MealExtrasEnableSectionProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseQuery, setBrowseQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addingAll, setAddingAll] = useState(false);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [priceErrors, setPriceErrors] = useState<Record<string, ComboPriceDraftError>>({});
  const [missingDraftPrices, setMissingDraftPrices] = useState<Record<string, string>>({});
  const draftPricesRef = useRef(draftPrices);
  const enabledExtrasRef = useRef(enabledExtras);
  const priceSaveInFlight = useRef(new Set<string>());

  draftPricesRef.current = draftPrices;
  enabledExtrasRef.current = enabledExtras;

  useEffect(() => {
    setDraftPrices(prev => {
      const next = { ...prev };
      for (const item of catalogItems) {
        if (!item.isActive) {
          continue;
        }
        if (hasComboPrice(item.defaultPrice) && next[item.itemId] == null) {
          next[item.itemId] = String(item.defaultPrice);
        }
      }
      return next;
    });
  }, [catalogItems]);

  const enabledIdSet = useMemo(
    () => new Set(enabledExtras.map(extra => extra.itemId)),
    [enabledExtras],
  );

  const buckets = useMemo(
    () =>
      buildMealExtraSuggestionBuckets(
        catalogItems,
        selectedMealItemIds,
        categorySeedItemIds ?? selectedMealItemIds,
      ),
    [catalogItems, categorySeedItemIds, selectedMealItemIds],
  );

  const browseList = useMemo(() => {
    const query = browseQuery.trim().toLowerCase();
    const allLibrary = [...buckets.relevant, ...buckets.related, ...buckets.other];
    const unique = new Map(allLibrary.map(item => [item.itemId, item]));
    const list = Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
    if (!query) {
      return list;
    }
    return list.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        (item.categoryName ?? '').toLowerCase().includes(query),
    );
  }, [browseQuery, buckets.other, buckets.related, buckets.relevant]);

  const syncEnabledExtraPrice = useCallback(
    (updated: FoodItemResponse) => {
      onCatalogItemUpdated?.(updated);
      const current = enabledExtrasRef.current;
      if (!current.some(extra => extra.itemId === updated.itemId)) {
        return;
      }
      onChange(
        current.map(extra =>
          extra.itemId === updated.itemId ? { ...extra, ...toExtraPackage(updated) } : extra,
        ),
      );
    },
    [onCatalogItemUpdated, onChange],
  );

  const onPriceChange = useCallback((itemId: string, text: string) => {
    const sanitized = text.replace(/[^\d.]/g, '');
    const parts = sanitized.split('.');
    const normalized =
      parts.length <= 2 ? sanitized : `${parts[0]}.${parts.slice(1).join('')}`;
    setDraftPrices(prev => ({ ...prev, [itemId]: normalized }));
    setPriceErrors(prev => {
      if (!prev[itemId]) {
        return prev;
      }
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  const persistPrice = useCallback(
    async (item: FoodItemResponse, draftValue: string) => {
      const normalized = draftValue.trim();
      setDraftPrices(prev => ({ ...prev, [item.itemId]: normalized }));

      if (!normalized) {
        setPriceErrors(prev => {
          const next = { ...prev };
          delete next[item.itemId];
          return next;
        });
        return null;
      }

      const validation = validatePriceInput(normalized);
      if (validation === 'invalid' || validation === 'nonPositive') {
        setPriceErrors(prev => ({ ...prev, [item.itemId]: validation }));
        return null;
      }

      const parsed = parsePriceInput(normalized);
      if (
        parsed != null &&
        hasComboPrice(item.defaultPrice) &&
        Number(item.defaultPrice) === parsed
      ) {
        return item;
      }

      if (priceSaveInFlight.current.has(item.itemId)) {
        return null;
      }
      priceSaveInFlight.current.add(item.itemId);
      setBusyId(item.itemId);
      try {
        const { item: updated, error } = await persistItemPriceDraft(
          spaceId,
          item,
          { ...draftPricesRef.current, [item.itemId]: normalized },
          { requirePrices: false },
        );
        if (error) {
          setPriceErrors(prev => ({ ...prev, [item.itemId]: error }));
          if (error === 'invalid') {
            showToast(t('meals.errors.saveFailed'));
          }
          return null;
        }
        setDraftPrices(prev => ({
          ...prev,
          [item.itemId]: hasComboPrice(updated.defaultPrice)
            ? String(updated.defaultPrice)
            : normalized,
        }));
        setPriceErrors(prev => {
          const next = { ...prev };
          delete next[item.itemId];
          return next;
        });
        syncEnabledExtraPrice(updated);
        return updated;
      } finally {
        priceSaveInFlight.current.delete(item.itemId);
        setBusyId(null);
      }
    },
    [showToast, spaceId, syncEnabledExtraPrice, t],
  );

  const setExtraEnabled = useCallback(
    async (item: FoodItemResponse, enabled: boolean) => {
      if (disabled) {
        return;
      }
      onInteract?.();
      if (!enabled) {
        onChange(enabledExtras.filter(extra => extra.itemId !== item.itemId));
        return;
      }
      if (enabledIdSet.has(item.itemId)) {
        return;
      }
      let nextItem = item;
      const draft = getEffectivePriceDraft(
        item.itemId,
        draftPricesRef.current,
        item.defaultPrice ?? null,
      );
      if (draft.trim() && !hasComboPrice(item.defaultPrice)) {
        const saved = await persistPrice(item, draft);
        if (saved) {
          nextItem = saved;
        }
      }
      onChange([...enabledExtrasRef.current, toExtraPackage(nextItem)]);
    },
    [disabled, enabledExtras, enabledIdSet, onChange, onInteract, persistPrice],
  );

  const missingPriceDraft = useCallback(
    (item: FoodItemResponse) => {
      const drafted = missingDraftPrices[item.itemId];
      if (drafted != null) {
        return drafted;
      }
      return hasComboPrice(item.defaultPrice) ? String(item.defaultPrice) : '';
    },
    [missingDraftPrices],
  );

  const addMissingAsLibraryExtra = useCallback(
    async (item: FoodItemResponse) => {
      if (disabled || busyId) {
        return;
      }
      onInteract?.();
      const priceDraft = missingPriceDraft(item).trim();
      if (priceDraft) {
        const validation = validatePriceInput(priceDraft);
        if (validation === 'invalid' || validation === 'nonPositive') {
          setPriceErrors(prev => ({ ...prev, [item.itemId]: validation }));
          return;
        }
      }

      setBusyId(item.itemId);
      try {
        let updated = await mealsApi.updateFoodItemExtra(spaceId, item.itemId, {
          isExtra: true,
        });
        if (priceDraft) {
          const priced = await persistItemPriceDraft(
            spaceId,
            updated,
            { [updated.itemId]: priceDraft },
            { requirePrices: false },
          );
          if (priced.error) {
            setPriceErrors(prev => ({ ...prev, [item.itemId]: priced.error! }));
            onCatalogItemUpdated?.(updated);
            showToast(t('meals.planning.extraAddedNeedsPrice', { name: updated.name }));
            return;
          }
          updated = priced.item;
          setDraftPrices(prev => ({
            ...prev,
            [updated.itemId]: hasComboPrice(updated.defaultPrice)
              ? String(updated.defaultPrice)
              : priceDraft,
          }));
        }
        onCatalogItemUpdated?.(updated);
        setMissingDraftPrices(prev => {
          const next = { ...prev };
          delete next[item.itemId];
          return next;
        });
        onChange(
          enabledIdSet.has(updated.itemId)
            ? enabledExtras
            : [...enabledExtras, toExtraPackage(updated)],
        );
        showToast(t('meals.planning.extraAddedToLibrary', { name: updated.name }));
      } catch {
        showToast(t('meals.errors.actionFailed'));
      } finally {
        setBusyId(null);
      }
    },
    [
      busyId,
      disabled,
      enabledExtras,
      enabledIdSet,
      missingPriceDraft,
      onCatalogItemUpdated,
      onChange,
      showToast,
      spaceId,
      t,
      onInteract,
    ],
  );

  const addAllMissing = useCallback(async () => {
    if (disabled || addingAll || buckets.missing.length === 0) {
      return;
    }
    onInteract?.();
    setAddingAll(true);
    try {
      const nextExtras = [...enabledExtras];
      const enabled = new Set(enabledIdSet);
      for (const item of buckets.missing) {
        let updated = await mealsApi.updateFoodItemExtra(spaceId, item.itemId, {
          isExtra: true,
        });
        const priceDraft = missingPriceDraft(item).trim();
        if (priceDraft && validatePriceInput(priceDraft) == null) {
          const priced = await persistItemPriceDraft(
            spaceId,
            updated,
            { [updated.itemId]: priceDraft },
            { requirePrices: false },
          );
          if (!priced.error) {
            updated = priced.item;
          }
        }
        onCatalogItemUpdated?.(updated);
        if (!enabled.has(updated.itemId)) {
          nextExtras.push(toExtraPackage(updated));
          enabled.add(updated.itemId);
        }
      }
      onChange(nextExtras);
      setMissingDraftPrices({});
      showToast(
        t('meals.planning.extrasAddedToLibraryCount', { count: buckets.missing.length }),
      );
    } catch {
      showToast(t('meals.errors.actionFailed'));
    } finally {
      setAddingAll(false);
    }
  }, [
    addingAll,
    buckets.missing,
    disabled,
    enabledExtras,
    enabledIdSet,
    missingPriceDraft,
    onCatalogItemUpdated,
    onChange,
    showToast,
    spaceId,
    t,
    onInteract,
  ]);

  const libraryExtraCount =
    buckets.relevant.length + buckets.related.length + buckets.other.length;
  const hasComboConstituents = selectedMealItemIds.size > 0;
  const hasMealSelection =
    hasComboConstituents || (categorySeedItemIds?.size ?? 0) > 0;

  /** Combo contents for this meal — one list whether or not already marked as extras. */
  const fromSelectionItems = useMemo(() => {
    return [...buckets.relevant, ...buckets.missing].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [buckets.missing, buckets.relevant]);

  const renderPriceInput = (item: FoodItemResponse) => {
    const priceDraft = getEffectivePriceDraft(
      item.itemId,
      draftPrices,
      item.defaultPrice ?? null,
    );
    const errorKey = priceErrors[item.itemId];
    const busy = busyId === item.itemId;
    return (
      <View style={styles.inlinePriceBlock}>
        <View style={[styles.inlinePriceRow, errorKey ? styles.priceInputRowError : null]}>
          <Text style={styles.inlineCurrency}>₹</Text>
          <TextInput
            style={styles.inlinePriceInput}
            value={priceDraft}
            onChangeText={text => onPriceChange(item.itemId, text)}
            onEndEditing={event => void persistPrice(item, event.nativeEvent.text)}
            keyboardType="decimal-pad"
            placeholder={t('meals.pricing.pricePlaceholder')}
            placeholderTextColor={colors.muted}
            editable={!disabled && !busy}
            selectTextOnFocus
            accessibilityLabel={`${item.name} ${t('meals.pricing.enterPrice')}`}
          />
        </View>
        {errorKey ? (
          <Text style={styles.inlinePriceError} numberOfLines={1}>
            {comboPriceDraftErrorMessage(errorKey, t)}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderExtraRow = (item: FoodItemResponse) => {
    const selected = enabledIdSet.has(item.itemId);
    const busy = busyId === item.itemId;
    return (
      <View key={item.itemId} style={[styles.row, selected && styles.rowSelected]}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {renderPriceInput(item)}
        {busy ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Switch
            value={selected}
            disabled={disabled}
            onValueChange={value => void setExtraEnabled(item, value)}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.white}
            accessibilityLabel={item.name}
          />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.wrap, highlighted ? styles.wrapHighlighted : null]}>
      <Text style={styles.title}>{t('meals.planning.extrasSectionTitle')}</Text>

      {!hasMealSelection ? (
        <Text style={styles.hint}>{t('meals.planning.extrasSelectMealFirst')}</Text>
      ) : null}

      {hasMealSelection &&
      fromSelectionItems.length === 0 &&
      libraryExtraCount === 0 ? (
        <View style={styles.emptyExtrasBlock}>
          <Text style={styles.hint}>{t('meals.planning.progressive.emptyExtrasTitle')}</Text>
          <Text style={styles.emptyExtrasBody}>
            {t('meals.planning.progressive.emptyExtrasBody')}
          </Text>
        </View>
      ) : null}

      {hasComboConstituents && fromSelectionItems.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.sectionTitleInHeader]}>
              {t('meals.planning.extrasMissingTitle', {
                count: fromSelectionItems.length,
              })}
            </Text>
            {buckets.missing.length > 1 ? (
              <Pressable
                onPress={() => void addAllMissing()}
                disabled={disabled || addingAll}
                hitSlop={8}>
                <Text style={styles.link}>
                  {addingAll
                    ? t('common.saving')
                    : t('meals.planning.extrasAddAllMissing')}
                </Text>
              </Pressable>
            ) : null}
          </View>
          {fromSelectionItems.map(item => {
            if (item.isExtra === true) {
              return renderExtraRow(item);
            }
            const busy = busyId === item.itemId;
            const errorKey = priceErrors[item.itemId];
            const priceDraft = missingPriceDraft(item);
            return (
              <View key={item.itemId} style={styles.row}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.inlinePriceBlock}>
                  <View
                    style={[
                      styles.inlinePriceRow,
                      errorKey ? styles.priceInputRowError : null,
                    ]}>
                    <Text style={styles.inlineCurrency}>₹</Text>
                    <TextInput
                      style={styles.inlinePriceInput}
                      value={priceDraft}
                      onChangeText={text => {
                        const sanitized = text.replace(/[^\d.]/g, '');
                        setMissingDraftPrices(prev => ({
                          ...prev,
                          [item.itemId]: sanitized,
                        }));
                        setPriceErrors(prev => {
                          if (!prev[item.itemId]) {
                            return prev;
                          }
                          const next = { ...prev };
                          delete next[item.itemId];
                          return next;
                        });
                      }}
                      keyboardType="decimal-pad"
                      placeholder={t('meals.pricing.pricePlaceholder')}
                      placeholderTextColor={colors.muted}
                      editable={!disabled && !busy && !addingAll}
                      selectTextOnFocus
                      accessibilityLabel={`${item.name} ${t('meals.pricing.enterPrice')}`}
                    />
                  </View>
                  {errorKey ? (
                    <Text style={styles.inlinePriceError} numberOfLines={1}>
                      {comboPriceDraftErrorMessage(errorKey, t)}
                    </Text>
                  ) : null}
                </View>
                {busy || addingAll ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Switch
                    value={false}
                    disabled={disabled}
                    onValueChange={value => {
                      if (value) {
                        void addMissingAsLibraryExtra(item);
                      }
                    }}
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor={colors.white}
                    accessibilityLabel={t('meals.planning.extrasAddMissing')}
                  />
                )}
              </View>
            );
          })}
        </View>
      ) : null}

      {hasMealSelection && buckets.related.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('meals.planning.extrasRelatedTitle', { count: buckets.related.length })}
          </Text>
          {buckets.related.map(item => renderExtraRow(item))}
        </View>
      ) : null}

      {hasMealSelection &&
      fromSelectionItems.length === 0 &&
      buckets.related.length === 0 &&
      libraryExtraCount > 0 ? (
        <Text style={styles.hint}>{t('meals.planning.extrasNoSuggestions')}</Text>
      ) : null}

      {libraryExtraCount > 0 ? (
        <View style={styles.browseBlock}>
          <Pressable
            style={styles.browseToggle}
            onPress={() => setBrowseOpen(prev => !prev)}
            accessibilityRole="button">
            <Text style={styles.browseToggleText}>
              {browseOpen
                ? t('meals.planning.extrasBrowseHide', { count: libraryExtraCount })
                : t('meals.planning.extrasBrowseShow', { count: libraryExtraCount })}
            </Text>
            <Text style={styles.chevron}>{browseOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {browseOpen ? (
            <View style={styles.browseBody}>
              <TextInput
                style={styles.search}
                value={browseQuery}
                onChangeText={setBrowseQuery}
                placeholder={t('meals.planning.extrasBrowseSearch')}
                placeholderTextColor={colors.muted}
                autoCorrect={false}
              />
              {browseList.length === 0 ? (
                <Text style={styles.hint}>{t('meals.planning.extrasBrowseEmpty')}</Text>
              ) : (
                browseList.map(item => renderExtraRow(item))
              )}
            </View>
          ) : null}
        </View>
      ) : null}

      {onConfigureMoreExtras ? (
        <View style={styles.configureMoreBlock}>
          <Pressable
            onPress={() => {
              onInteract?.();
              onConfigureMoreExtras();
            }}
            disabled={disabled}
            accessibilityRole="button"
            hitSlop={8}>
            <Text style={styles.configureMoreLink}>
              {t('meals.planning.extrasConfigureMoreLink')}
            </Text>
          </Pressable>
          <Text style={styles.configureMoreHint}>
            {t('meals.planning.extrasConfigureMoreHint')}
          </Text>
        </View>
      ) : null}

      {enabledExtras.length > 0 ? (
        <Text style={styles.footerMeta}>
          {t('meals.planning.extrasEnabledCount', { count: enabledExtras.length })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  wrapHighlighted: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  title: { ...typography.bodyStrong, marginBottom: spacing.xxs },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  emptyExtrasBlock: { marginBottom: spacing.sm },
  emptyExtrasBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  section: { marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: spacing.sm,
  },
  sectionTitleInHeader: {
    marginBottom: 0,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  name: { ...typography.bodyStrong, flex: 1, minWidth: 0 },
  inlinePriceBlock: {
    flexShrink: 0,
    alignItems: 'flex-end',
    maxWidth: 110,
  },
  inlinePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.white,
  },
  priceInputRowError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  inlineCurrency: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  inlinePriceInput: {
    width: 56,
    ...typography.bodyStrong,
    fontSize: 14,
    paddingVertical: 4,
    color: colors.textPrimary,
  },
  inlinePriceError: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: 2,
    textAlign: 'right',
  },
  link: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  browseBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  browseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  browseToggleText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    flex: 1,
  },
  chevron: { ...typography.caption, color: colors.muted },
  browseBody: { marginTop: spacing.sm },
  configureMoreBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.xxs,
  },
  configureMoreLink: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  configureMoreHint: {
    ...typography.caption,
    color: colors.muted,
  },
  search: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  footerMeta: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
