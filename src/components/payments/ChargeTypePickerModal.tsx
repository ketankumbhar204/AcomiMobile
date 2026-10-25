import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Search } from 'lucide-react-native';
import {
  chargeTypeMatchesQuery,
  listCatalogChargeTypes,
  type CatalogChargeType,
} from '../../utils/chargeCatalog';
import { CHARGE_CATEGORY_BADGE, getChargeTypeIcon } from '../../utils/chargeTypeIcons';
import { readRecentChargeTypeIds } from '../../utils/recentChargeTypes';
import { colors, radius, spacing, typography } from '../../theme';

type ChargeTypePickerModalProps = {
  visible: boolean;
  spaceId: string;
  selectedId: string;
  onClose: () => void;
  onSelect: (type: CatalogChargeType) => void;
};

export function ChargeTypePickerModal({
  visible,
  spaceId,
  selectedId,
  onClose,
  onSelect,
}: ChargeTypePickerModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const allTypes = useMemo(() => listCatalogChargeTypes(), []);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      return;
    }
    readRecentChargeTypeIds(spaceId).then(setRecentIds).catch(() => setRecentIds([]));
  }, [spaceId, visible]);

  const labelOf = (id: string) => t(`paymentCollection.chargeCatalog.types.${id}`);
  const categoryOf = (id: string) => t(`paymentCollection.chargeCatalog.categories.${id}`);
  const matches = (type: CatalogChargeType) => chargeTypeMatchesQuery(labelOf(type.id), query);
  const recent = recentIds
    .map(id => allTypes.find(type => type.id === id))
    .filter((type): type is CatalogChargeType => Boolean(type))
    .filter(matches);
  const all = allTypes.filter(matches);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
              <Text style={styles.cancel}>{t('common.cancel')}</Text>
            </Pressable>
            <Text style={styles.title}>{t('paymentCollection.addRecord.type')}</Text>
          </View>
          <View style={styles.searchWrap}>
            <Search size={16} color={colors.muted} strokeWidth={2.2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('paymentCollection.addRecord.searchChargeType')}
              placeholderTextColor={colors.muted}
              autoFocus
              autoCorrect={false}
              style={styles.searchInput}
              accessibilityLabel={t('paymentCollection.addRecord.searchChargeType')}
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            keyboardDismissMode="on-drag">
            {recent.length === 0 && all.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>{t('paymentCollection.addRecord.noChargeTypes')}</Text>
                <Text style={styles.emptyBody}>{t('paymentCollection.addRecord.tryAnotherSearch')}</Text>
              </View>
            ) : (
              <>
                {recent.length > 0 ? (
                  <TypeSection
                    title={t('paymentCollection.addRecord.recent')}
                    types={recent}
                    selectedId={selectedId}
                    labelOf={labelOf}
                    categoryOf={categoryOf}
                    onSelect={onSelect}
                  />
                ) : null}
                <TypeSection
                  title={t('paymentCollection.addRecord.allChargeTypes')}
                  types={all}
                  selectedId={selectedId}
                  labelOf={labelOf}
                  categoryOf={categoryOf}
                  onSelect={onSelect}
                />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TypeSection({
  title,
  types,
  selectedId,
  labelOf,
  categoryOf,
  onSelect,
}: {
  title: string;
  types: CatalogChargeType[];
  selectedId: string;
  labelOf: (id: string) => string;
  categoryOf: (id: string) => string;
  onSelect: (type: CatalogChargeType) => void;
}) {
  if (types.length === 0) {
    return null;
  }
  return (
    <View>
      <Text style={styles.section}>{title}</Text>
      {types.map(type => {
        const icon = getChargeTypeIcon(type.id);
        const badge = CHARGE_CATEGORY_BADGE[type.category];
        const selected = type.id === selectedId;
        return (
          <Pressable
            key={`${title}-${type.id}`}
            onPress={() => onSelect(type)}
            style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityState={{ selected }}>
            <View style={[styles.iconWrap, { backgroundColor: badge.bg }]}>
              {React.createElement(icon, { size: 16, color: badge.color, strokeWidth: 2.2 })}
            </View>
            <Text style={styles.rowLabel} numberOfLines={2}>
              {labelOf(type.id)}
            </Text>
            {selected ? <Check size={18} color={colors.primaryDark} strokeWidth={2.4} /> : null}
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.color }]} numberOfLines={1}>
                {categoryOf(type.category)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.white,
  },
  cancel: { ...typography.bodyStrong, color: colors.primaryDark },
  title: { ...typography.h3 },
  searchWrap: {
    margin: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  list: { paddingBottom: spacing.xxl },
  section: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  rowSelected: { backgroundColor: colors.selected },
  rowPressed: { opacity: 0.9 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
  },
  badge: {
    flexShrink: 0,
    maxWidth: '46%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { padding: spacing.xl, gap: spacing.xs },
  emptyTitle: { ...typography.bodyStrong },
  emptyBody: { ...typography.caption, color: colors.textSecondary },
});
