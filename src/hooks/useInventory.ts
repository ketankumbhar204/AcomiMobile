import { useCallback, useEffect, useState } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import type {
  InventoryCategory,
  InventoryDashboardSummary,
  InventoryItem,
  InventorySupplier,
  InventoryTransaction,
} from '../api/inventoryTypes';
import type { SpaceType, UUID } from '../api/types';

export function useInventoryDashboard(spaceId: UUID, spaceType: SpaceType, enabled = true) {
  const [data, setData] = useState<InventoryDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await inventoryApi.getDashboard(spaceId, spaceType);
      setData(next);
    } catch {
      setError('Could not load inventory');
    } finally {
      setLoading(false);
    }
  }, [enabled, spaceId, spaceType]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useInventoryItems(spaceId: UUID, spaceType: SpaceType, enabled = true) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [nextItems, nextCategories, nextSuppliers] = await Promise.all([
        inventoryApi.listItems(spaceId, spaceType),
        inventoryApi.listCategories(spaceId, spaceType),
        inventoryApi.listSuppliers(spaceId, spaceType),
      ]);
      setItems(nextItems);
      setCategories(nextCategories);
      setSuppliers(nextSuppliers);
    } catch {
      setError('Could not load items');
    } finally {
      setLoading(false);
    }
  }, [enabled, spaceId, spaceType]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, categories, suppliers, loading, error, reload };
}

export function useInventoryTransactions(
  spaceId: UUID,
  spaceType: SpaceType,
  itemId?: UUID,
  enabled = true,
) {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await inventoryApi.listTransactions(spaceId, spaceType, itemId);
      setTransactions(next);
    } catch {
      setError('Could not load activity');
    } finally {
      setLoading(false);
    }
  }, [enabled, itemId, spaceId, spaceType]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { transactions, loading, error, reload };
}
