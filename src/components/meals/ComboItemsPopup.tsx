import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboNameWithPrice } from '../../utils/comboPrice';

type ComboItemsPopupProps = {
  visible: boolean;
  comboName: string;
  items: string[];
  price?: number | null;
  currencyCode?: string | null;
  loading?: boolean;
  singleItem?: boolean;
  onClose: () => void;
};

export function ComboItemsPopup({
  visible,
  comboName,
  items,
  price,
  currencyCode,
  loading = false,
  singleItem = false,
  onClose,
}: ComboItemsPopupProps) {
  const { t } = useTranslation();

  if (!visible) {
    return null;
  }

  const displayItems =
    items.length > 0 ? items : singleItem && comboName.trim() ? [comboName.trim()] : [];
  const sectionLabel = singleItem
    ? t('meals.planning.itemDetailsLabel')
    : t('meals.combo.includesLabel');
  const emptyMessage = singleItem
    ? t('meals.planning.itemDetailsEmpty')
    : t('meals.library.comboPreviewEmpty');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {formatComboNameWithPrice(comboName, price, currencyCode)}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>{sectionLabel}</Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : displayItems.length === 0 ? (
            <Text style={styles.empty}>{emptyMessage}</Text>
          ) : (
            <View style={styles.itemList}>
              {displayItems.map((name, index) => (
                <View key={`${name}-${index}`} style={styles.itemRow}>
                  <Text style={styles.itemDot}>{singleItem ? '·' : '•'}</Text>
                  <Text style={styles.itemName}>{name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: { ...typography.h3, flex: 1 },
  closeBtn: { ...typography.body, color: colors.muted, fontSize: 18 },
  sectionLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  loader: { marginVertical: spacing.lg },
  empty: { ...typography.body, color: colors.muted },
  itemList: { gap: spacing.xs },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  itemDot: { ...typography.body, color: colors.muted, lineHeight: 22 },
  itemName: { ...typography.body, flex: 1 },
});
