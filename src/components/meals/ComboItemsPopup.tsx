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
  onClose: () => void;
};

export function ComboItemsPopup({
  visible,
  comboName,
  items,
  price,
  currencyCode,
  loading = false,
  onClose,
}: ComboItemsPopupProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {formatComboNameWithPrice(comboName, price, currencyCode)}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>{t('meals.planning.comboItemsLabel')}</Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : items.length === 0 ? (
            <Text style={styles.empty}>{t('meals.library.comboPreviewEmpty')}</Text>
          ) : (
            <View style={styles.itemList}>
              {items.map((name, index) => (
                <View key={`${name}-${index}`} style={styles.itemRow}>
                  <Text style={styles.itemDot}>·</Text>
                  <Text style={styles.itemName}>{name}</Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>
      </Pressable>
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
