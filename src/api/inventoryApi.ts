import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './client';
import { unwrapApiResponse, unwrapVoidResponse } from './apiRequest';
import type { ApiResponse, SpaceType, UUID } from './types';
import type {
  CreateInventoryCategoryRequest,
  CreateInventoryItemRequest,
  CreateInventorySupplierRequest,
  InventoryCategory,
  InventoryDashboardSummary,
  InventoryItem,
  InventorySpaceStore,
  InventoryStockMoveRequest,
  InventorySupplier,
  InventoryTransaction,
  UpdateInventoryItemRequest,
} from './inventoryTypes';

const LOG_TAG = '[CountIn Inventory API]';
const cacheKey = (spaceId: UUID) => `@countin/inventory/cache/v2/${spaceId}`;

type InventoryCacheBundle = {
  spaceId: UUID;
  categories: InventoryCategory[];
  items: InventoryItem[];
  suppliers: InventorySupplier[];
  transactions: InventoryTransaction[];
  dashboard: InventoryDashboardSummary | null;
  updatedAt: string;
};

const memory = new Map<string, InventoryCacheBundle>();

function nowIso(): string {
  return new Date().toISOString();
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toIsoString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return nowIso();
}

function normalizeCategory(raw: InventoryCategory): InventoryCategory {
  return {
    ...raw,
    isSystem: raw.isSystem ?? false,
    createdAt: toIsoString(raw.createdAt),
    updatedAt: toIsoString(raw.updatedAt),
  };
}

function normalizeItem(raw: InventoryItem): InventoryItem {
  return {
    ...raw,
    currentStock: toNumber(raw.currentStock),
    reservedStock: toNumber(raw.reservedStock),
    minimumStock: toNumber(raw.minimumStock),
    purchasePrice:
      raw.purchasePrice == null ? null : toNumber(raw.purchasePrice),
    averagePrice: raw.averagePrice == null ? null : toNumber(raw.averagePrice),
    createdAt: toIsoString(raw.createdAt),
    updatedAt: toIsoString(raw.updatedAt),
    expiresAt: raw.expiresAt ? toIsoString(raw.expiresAt) : null,
    warrantyUntil: raw.warrantyUntil ? toIsoString(raw.warrantyUntil) : null,
  };
}

function normalizeSupplier(raw: InventorySupplier): InventorySupplier {
  return {
    ...raw,
    createdAt: toIsoString(raw.createdAt),
    updatedAt: toIsoString(raw.updatedAt),
  };
}

function normalizeTransaction(raw: InventoryTransaction): InventoryTransaction {
  return {
    ...raw,
    quantity: toNumber(raw.quantity),
    amount: raw.amount == null ? null : toNumber(raw.amount),
    createdAt: toIsoString(raw.createdAt),
  };
}

function normalizeDashboard(raw: InventoryDashboardSummary): InventoryDashboardSummary {
  return {
    ...raw,
    totalItems: toNumber(raw.totalItems),
    inventoryValue: toNumber(raw.inventoryValue),
    lowStockCount: toNumber(raw.lowStockCount),
    outOfStockCount: toNumber(raw.outOfStockCount),
    supplierCount: toNumber(raw.supplierCount),
    recentPurchases: (raw.recentPurchases ?? []).map(normalizeTransaction),
    recentConsumption: (raw.recentConsumption ?? []).map(normalizeTransaction),
    criticalItems: (raw.criticalItems ?? []).map(normalizeItem),
  };
}

async function readCache(spaceId: UUID): Promise<InventoryCacheBundle | null> {
  const cached = memory.get(spaceId);
  if (cached) {
    return cached;
  }
  try {
    const raw = await AsyncStorage.getItem(cacheKey(spaceId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as InventoryCacheBundle;
    memory.set(spaceId, parsed);
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(bundle: InventoryCacheBundle): Promise<void> {
  const next = { ...bundle, updatedAt: nowIso() };
  memory.set(bundle.spaceId, next);
  try {
    await AsyncStorage.setItem(cacheKey(bundle.spaceId), JSON.stringify(next));
  } catch {
    // Cache write failures must not break inventory UX.
  }
}

async function patchCache(
  spaceId: UUID,
  patch: Partial<Omit<InventoryCacheBundle, 'spaceId'>>,
): Promise<void> {
  const prev = (await readCache(spaceId)) ?? {
    spaceId,
    categories: [],
    items: [],
    suppliers: [],
    transactions: [],
    dashboard: null,
    updatedAt: nowIso(),
  };
  await writeCache({ ...prev, ...patch, spaceId });
}

/**
 * REST inventory client. Backend seeds defaults on space create / first GET.
 * AsyncStorage is an offline cache only — never the source of truth.
 */
export const inventoryApi = {
  getStore: async (spaceId: UUID, _spaceType: SpaceType): Promise<InventorySpaceStore> => {
    const [categories, items, suppliers, transactions] = await Promise.all([
      inventoryApi.listCategories(spaceId, _spaceType),
      inventoryApi.listItems(spaceId, _spaceType),
      inventoryApi.listSuppliers(spaceId, _spaceType),
      inventoryApi.listTransactions(spaceId, _spaceType),
    ]);
    return {
      spaceId,
      spaceType: _spaceType,
      seeded: categories.length > 0 || items.length > 0,
      categories,
      suppliers,
      items,
      transactions,
      updatedAt: nowIso(),
    };
  },

  getDashboard: async (
    spaceId: UUID,
    _spaceType: SpaceType,
  ): Promise<InventoryDashboardSummary> => {
    try {
      console.log(`${LOG_TAG} GET /spaces/${spaceId}/inventory/dashboard`);
      const raw = await unwrapApiResponse(
        apiClient.get<ApiResponse<InventoryDashboardSummary>>(
          `/spaces/${spaceId}/inventory/dashboard`,
        ),
      );
      const dashboard = normalizeDashboard(raw);
      await patchCache(spaceId, { dashboard });
      return dashboard;
    } catch (error) {
      const cached = await readCache(spaceId);
      if (cached?.dashboard) {
        return cached.dashboard;
      }
      throw error;
    }
  },

  listItems: async (spaceId: UUID, _spaceType: SpaceType): Promise<InventoryItem[]> => {
    try {
      console.log(`${LOG_TAG} GET /spaces/${spaceId}/inventory/items`);
      const raw = await unwrapApiResponse(
        apiClient.get<ApiResponse<InventoryItem[]>>(`/spaces/${spaceId}/inventory/items`),
      );
      const items = raw.map(normalizeItem).sort((a, b) => a.name.localeCompare(b.name));
      await patchCache(spaceId, { items });
      return items;
    } catch (error) {
      const cached = await readCache(spaceId);
      if (cached?.items?.length) {
        return cached.items;
      }
      throw error;
    }
  },

  getItem: async (
    spaceId: UUID,
    _spaceType: SpaceType,
    itemId: UUID,
  ): Promise<InventoryItem | null> => {
    try {
      console.log(`${LOG_TAG} GET /spaces/${spaceId}/inventory/items/${itemId}`);
      const raw = await unwrapApiResponse(
        apiClient.get<ApiResponse<InventoryItem>>(
          `/spaces/${spaceId}/inventory/items/${itemId}`,
        ),
      );
      return normalizeItem(raw);
    } catch (error) {
      const cached = await readCache(spaceId);
      const hit = cached?.items.find(item => item.itemId === itemId) ?? null;
      if (hit) {
        return hit;
      }
      throw error;
    }
  },

  createItem: async (
    spaceId: UUID,
    _spaceType: SpaceType,
    input: CreateInventoryItemRequest,
  ): Promise<InventoryItem> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/inventory/items`, input);
    const raw = await unwrapApiResponse(
      apiClient.post<ApiResponse<InventoryItem>>(`/spaces/${spaceId}/inventory/items`, input),
    );
    const item = normalizeItem(raw);
    const cached = await readCache(spaceId);
    await patchCache(spaceId, {
      items: [...(cached?.items ?? []).filter(i => i.itemId !== item.itemId), item],
      dashboard: null,
    });
    return item;
  },

  updateItem: async (
    spaceId: UUID,
    _spaceType: SpaceType,
    itemId: UUID,
    input: UpdateInventoryItemRequest,
  ): Promise<InventoryItem> => {
    console.log(`${LOG_TAG} PUT /spaces/${spaceId}/inventory/items/${itemId}`, input);
    const raw = await unwrapApiResponse(
      apiClient.put<ApiResponse<InventoryItem>>(
        `/spaces/${spaceId}/inventory/items/${itemId}`,
        input,
      ),
    );
    const item = normalizeItem(raw);
    const cached = await readCache(spaceId);
    await patchCache(spaceId, {
      items: (cached?.items ?? []).map(i => (i.itemId === itemId ? item : i)),
      dashboard: null,
    });
    return item;
  },

  deleteItem: async (
    spaceId: UUID,
    _spaceType: SpaceType,
    itemId: UUID,
  ): Promise<void> => {
    console.log(`${LOG_TAG} DELETE /spaces/${spaceId}/inventory/items/${itemId}`);
    await unwrapVoidResponse(
      apiClient.delete(`/spaces/${spaceId}/inventory/items/${itemId}`),
    );
    const cached = await readCache(spaceId);
    await patchCache(spaceId, {
      items: (cached?.items ?? []).filter(i => i.itemId !== itemId),
      dashboard: null,
    });
  },

  stockMove: async (
    spaceId: UUID,
    _spaceType: SpaceType,
    itemId: UUID,
    input: InventoryStockMoveRequest,
  ): Promise<InventoryItem> => {
    console.log(
      `${LOG_TAG} POST /spaces/${spaceId}/inventory/items/${itemId}/stock-moves`,
      input,
    );
    const raw = await unwrapApiResponse(
      apiClient.post<ApiResponse<InventoryItem>>(
        `/spaces/${spaceId}/inventory/items/${itemId}/stock-moves`,
        input,
      ),
    );
    const item = normalizeItem(raw);
    const cached = await readCache(spaceId);
    await patchCache(spaceId, {
      items: (cached?.items ?? []).map(i => (i.itemId === itemId ? item : i)),
      dashboard: null,
      transactions: [],
    });
    return item;
  },

  listTransactions: async (
    spaceId: UUID,
    _spaceType: SpaceType,
    itemId?: UUID,
  ): Promise<InventoryTransaction[]> => {
    const q = itemId ? `?itemId=${itemId}` : '';
    try {
      console.log(`${LOG_TAG} GET /spaces/${spaceId}/inventory/transactions${q}`);
      const raw = await unwrapApiResponse(
        apiClient.get<ApiResponse<InventoryTransaction[]>>(
          `/spaces/${spaceId}/inventory/transactions${q}`,
        ),
      );
      const transactions = raw
        .map(normalizeTransaction)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      if (!itemId) {
        await patchCache(spaceId, { transactions });
      }
      return transactions;
    } catch (error) {
      const cached = await readCache(spaceId);
      if (cached?.transactions) {
        return itemId
          ? cached.transactions.filter(t => t.itemId === itemId)
          : cached.transactions;
      }
      throw error;
    }
  },

  listCategories: async (
    spaceId: UUID,
    _spaceType: SpaceType,
  ): Promise<InventoryCategory[]> => {
    try {
      console.log(`${LOG_TAG} GET /spaces/${spaceId}/inventory/categories`);
      const raw = await unwrapApiResponse(
        apiClient.get<ApiResponse<InventoryCategory[]>>(
          `/spaces/${spaceId}/inventory/categories`,
        ),
      );
      const categories = raw
        .map(normalizeCategory)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      await patchCache(spaceId, { categories });
      return categories;
    } catch (error) {
      const cached = await readCache(spaceId);
      if (cached?.categories?.length) {
        return cached.categories;
      }
      throw error;
    }
  },

  createCategory: async (
    spaceId: UUID,
    _spaceType: SpaceType,
    input: CreateInventoryCategoryRequest,
  ): Promise<InventoryCategory> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/inventory/categories`, input);
    const raw = await unwrapApiResponse(
      apiClient.post<ApiResponse<InventoryCategory>>(
        `/spaces/${spaceId}/inventory/categories`,
        input,
      ),
    );
    const category = normalizeCategory(raw);
    const cached = await readCache(spaceId);
    await patchCache(spaceId, {
      categories: [...(cached?.categories ?? []), category],
    });
    return category;
  },

  deleteCategory: async (
    spaceId: UUID,
    _spaceType: SpaceType,
    categoryId: UUID,
  ): Promise<void> => {
    console.log(`${LOG_TAG} DELETE /spaces/${spaceId}/inventory/categories/${categoryId}`);
    await unwrapVoidResponse(
      apiClient.delete(`/spaces/${spaceId}/inventory/categories/${categoryId}`),
    );
    const cached = await readCache(spaceId);
    await patchCache(spaceId, {
      categories: (cached?.categories ?? []).filter(c => c.categoryId !== categoryId),
    });
  },

  listSuppliers: async (
    spaceId: UUID,
    _spaceType: SpaceType,
  ): Promise<InventorySupplier[]> => {
    try {
      console.log(`${LOG_TAG} GET /spaces/${spaceId}/inventory/suppliers`);
      const raw = await unwrapApiResponse(
        apiClient.get<ApiResponse<InventorySupplier[]>>(
          `/spaces/${spaceId}/inventory/suppliers`,
        ),
      );
      const suppliers = raw
        .map(normalizeSupplier)
        .sort((a, b) => a.name.localeCompare(b.name));
      await patchCache(spaceId, { suppliers });
      return suppliers;
    } catch (error) {
      const cached = await readCache(spaceId);
      if (cached?.suppliers) {
        return cached.suppliers;
      }
      throw error;
    }
  },

  createSupplier: async (
    spaceId: UUID,
    _spaceType: SpaceType,
    input: CreateInventorySupplierRequest,
  ): Promise<InventorySupplier> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/inventory/suppliers`, input);
    const raw = await unwrapApiResponse(
      apiClient.post<ApiResponse<InventorySupplier>>(
        `/spaces/${spaceId}/inventory/suppliers`,
        input,
      ),
    );
    const supplier = normalizeSupplier(raw);
    const cached = await readCache(spaceId);
    await patchCache(spaceId, {
      suppliers: [...(cached?.suppliers ?? []), supplier],
    });
    return supplier;
  },

  /** Clears offline cache only — does not affect backend data. */
  clearSpaceCache: async (spaceId: UUID): Promise<void> => {
    memory.delete(spaceId);
    await AsyncStorage.removeItem(cacheKey(spaceId));
    await AsyncStorage.removeItem(`@countin/inventory/v1/${spaceId}`);
  },
};
