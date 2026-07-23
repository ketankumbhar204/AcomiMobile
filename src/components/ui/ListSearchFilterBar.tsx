import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Funnel, Search } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';

type ListSearchFilterBarProps = {
  searchValue: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  onFilterPress: () => void;
  activeFilterCount?: number;
  filterAccessibilityLabel?: string;
  showFilterButton?: boolean;
  showSearch?: boolean;
};

export function ListSearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  onFilterPress,
  activeFilterCount = 0,
  filterAccessibilityLabel,
  showFilterButton = true,
  showSearch = true,
}: ListSearchFilterBarProps) {
  const { t } = useTranslation();
  const hasFilters = activeFilterCount > 0;

  return (
    <View style={[styles.row, !showSearch && styles.rowFilterOnly]}>
      {showSearch ? (
        <View style={styles.searchWrap}>
          <Search size={16} color={colors.muted} strokeWidth={2.2} />
          <TextInput
            style={styles.searchInput}
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder ?? t('list.search.placeholder')}
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            clearButtonMode="while-editing"
            accessibilityLabel={searchPlaceholder ?? t('list.search.placeholder')}
          />
        </View>
      ) : null}
      {showFilterButton ? (
        <Pressable
          onPress={onFilterPress}
          hitSlop={8}
          style={({ pressed }) => [
            styles.filterButton,
            hasFilters && styles.filterButtonActive,
            pressed && styles.filterButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            filterAccessibilityLabel ??
            (hasFilters
              ? t('list.filterDrawer.activeCount', { count: activeFilterCount })
              : t('list.filterDrawer.open'))
          }>
          <Funnel
            size={14}
            color={hasFilters ? colors.primaryDark : colors.muted}
            strokeWidth={2.3}
          />
          <Text style={[styles.filterLabel, hasFilters && styles.filterLabelActive]}>
            {t('list.filterDrawer.button')}
          </Text>
          {hasFilters ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowFilterOnly: {
    justifyContent: 'flex-end',
  },
  searchWrap: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  filterButtonPressed: {
    opacity: 0.85,
  },
  filterLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.muted,
  },
  filterLabelActive: {
    color: colors.primaryDark,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
});
