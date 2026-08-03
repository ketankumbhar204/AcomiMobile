import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react-native';
import { inventoryApi } from '../../api/inventoryApi';
import type { InventoryItem, InventoryTxnType } from '../../api/inventoryTypes';
import { InventoryStatusChip } from '../../components/inventory';
import {
  Button,
  EmptyState,
  FormInput,
  HeaderBackButton,
  PermissionDeniedScreen,
  Screen,
  SkeletonCard,
} from '../../components/ui';
import { useInventoryItems } from '../../hooks/useInventory';
import { useInventoryProfile } from '../../hooks/useInventoryProfile';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatInventoryUnit } from '../../utils/inventoryCatalog';
import {
  availableStock,
  deriveInventoryStockStatus,
} from '../../utils/inventoryVisuals';

type Route = RouteProp<MainStackParamList, 'InventoryItemDetails'>;
type Nav = NativeStackNavigationProp<MainStackParamList, 'InventoryItemDetails'>;

type StockMoveKind = Extract<InventoryTxnType, 'STOCK_IN' | 'STOCK_OUT'>;

/** Minimal item page: current / min / location / supplier + Stock In / Out / Edit. */
export function InventoryItemDetailsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, itemId } = route.params;
  const { spaceType, canView, canManage } = useInventoryProfile(spaceId);
  const showToast = useToastStore(state => state.showToast);
  const { suppliers } = useInventoryItems(spaceId, spaceType, canView);

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moveKind, setMoveKind] = useState<StockMoveKind | null>(null);
  const [moveQty, setMoveQty] = useState('');
  const [moveReason, setMoveReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadItem = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await inventoryApi.getItem(spaceId, spaceType, itemId);
      if (!next) {
        setError(t('inventory.details.notFound', { defaultValue: 'Item not found' }));
      }
      setItem(next);
    } catch {
      setError(t('common.errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [canView, itemId, spaceId, spaceType, t]);

  useFocusEffect(
    useCallback(() => {
      void loadItem();
    }, [loadItem]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: item?.name ?? t('inventory.details.title', { defaultValue: 'Item' }),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [item?.name, navigation, t]);

  const statusLabel = useCallback(
    (status: ReturnType<typeof deriveInventoryStockStatus>) => {
      if (status === 'OUT_OF_STOCK') {
        return t('inventory.status.CRITICAL', { defaultValue: 'Critical' });
      }
      return t(`inventory.status.${status}`, { defaultValue: status });
    },
    [t],
  );

  const supplierName = useMemo(() => {
    if (!item?.supplierId) {
      return null;
    }
    return suppliers.find(s => s.supplierId === item.supplierId)?.name ?? null;
  }, [item, suppliers]);

  const openMove = (kind: StockMoveKind) => {
    setMoveKind(kind);
    setMoveQty('');
    setMoveReason('');
  };

  const closeMove = () => {
    if (submitting) {
      return;
    }
    setMoveKind(null);
  };

  const confirmMove = async () => {
    if (!item || !moveKind) {
      return;
    }
    const qty = Number(moveQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      showToast(t('inventory.form.qtyRequired', { defaultValue: 'Enter a valid quantity' }));
      return;
    }
    setSubmitting(true);
    try {
      const updated = await inventoryApi.stockMove(spaceId, spaceType, itemId, {
        type: moveKind,
        quantity: qty,
        reason: moveReason.trim() || null,
      });
      setItem(updated);
      showToast(t('inventory.details.moveSuccess', { defaultValue: 'Stock updated' }));
      setMoveKind(null);
    } catch {
      showToast(t('common.errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!canView) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  const status = item ? deriveInventoryStockStatus(item) : 'HEALTHY';
  const available = item ? availableStock(item) : 0;
  const unitLabel = item ? formatInventoryUnit(item.unit) : '';

  return (
    <Screen style={styles.screen} contentStyle={styles.content}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={loading && item != null}
            onRefresh={() => {
              void loadItem();
            }}
          />
        }
        showsVerticalScrollIndicator={false}>
        {loading && !item ? (
          <SkeletonCard />
        ) : error || !item ? (
          <EmptyState
            Icon={TriangleAlert}
            title={t('common.errors.generic')}
            description={
              error ?? t('inventory.details.notFound', { defaultValue: 'Item not found' })
            }
          />
        ) : (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <InventoryStatusChip status={status} label={statusLabel(status)} />
            </View>

            <View style={styles.facts}>
              <Fact
                label={t('inventory.details.current', { defaultValue: 'Current' })}
                value={`${available} ${unitLabel}`}
              />
              <Fact
                label={t('inventory.details.minimum', { defaultValue: 'Minimum' })}
                value={`${item.minimumStock} ${unitLabel}`}
              />
              {item.location ? (
                <Fact
                  label={t('inventory.form.location', { defaultValue: 'Location' })}
                  value={item.location}
                />
              ) : null}
              {supplierName ? (
                <Fact
                  label={t('inventory.form.supplier', { defaultValue: 'Supplier' })}
                  value={supplierName}
                />
              ) : null}
            </View>

            {canManage ? (
              <View style={styles.actions}>
                <Button
                  label={t('inventory.actions.stockIn', { defaultValue: 'Stock In' })}
                  onPress={() => openMove('STOCK_IN')}
                />
                <Button
                  label={t('inventory.actions.stockOut', { defaultValue: 'Stock Out' })}
                  variant="secondary"
                  onPress={() => openMove('STOCK_OUT')}
                />
                <Button
                  label={t('inventory.actions.editItem', { defaultValue: 'Edit' })}
                  variant="ghost"
                  onPress={() =>
                    navigation.navigate('InventoryItemForm', {
                      spaceId,
                      mode: 'edit',
                      itemId,
                    })
                  }
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <Modal
        visible={moveKind != null}
        transparent
        animationType="fade"
        onRequestClose={closeMove}>
        <Pressable style={styles.modalBackdrop} onPress={closeMove}>
          <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>
              {moveKind === 'STOCK_IN'
                ? t('inventory.sheet.addStock', { defaultValue: 'Add Stock' })
                : t('inventory.sheet.removeStock', { defaultValue: 'Remove Stock' })}
            </Text>
            <FormInput
              label={t('inventory.form.quantity', { defaultValue: 'Quantity' })}
              value={moveQty}
              onChangeText={setMoveQty}
              keyboardType="decimal-pad"
              placeholder="0"
            />
            <FormInput
              label={t('inventory.form.reasonOptional', {
                defaultValue: 'Reason (optional)',
              })}
              value={moveReason}
              onChangeText={setMoveReason}
              placeholder={t('inventory.form.reasonPlaceholder', {
                defaultValue: 'Optional note',
              })}
            />
            <View style={styles.modalActions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={closeMove}
                disabled={submitting}
                style={styles.modalButton}
              />
              <Button
                label={t('common.save')}
                onPress={() => {
                  void confirmMove();
                }}
                loading={submitting}
                disabled={submitting}
                style={styles.modalButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.factRow}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, paddingTop: spacing.md },
  scroll: { paddingBottom: spacing.xxl, gap: spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemName: {
    ...typography.h2,
    flex: 1,
    fontSize: 24,
    color: colors.textPrimary,
  },
  facts: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  factLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  factValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  actions: {
    gap: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalButton: { flex: 1 },
});
