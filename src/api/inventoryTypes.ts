import type { SpaceType, UUID } from './types';

/** Inventory domain — backend `/spaces/{id}/inventory` is source of truth. */

export type InventoryUnit =
  | 'KG'
  | 'LITRE'
  | 'PIECE'
  | 'PACKET'
  | 'DOZEN'
  | 'METRE'
  | 'SET'
  | 'OTHER';

export type InventoryStockStatus =
  | 'HEALTHY'
  | 'LOW'
  | 'CRITICAL'
  | 'OUT_OF_STOCK'
  | 'DISCONTINUED'
  | 'INACTIVE';

export type InventoryTxnType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'ADJUSTMENT'
  | 'TRANSFER'
  | 'PURCHASE'
  | 'CONSUMPTION';

export type InventoryProfileKind = 'FOOD' | 'ASSET' | 'FURNITURE';

export interface InventoryCategory {
  categoryId: UUID;
  spaceId: UUID;
  name: string;
  code: string;
  iconKey: string;
  sortOrder: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventorySupplier {
  supplierId: UUID;
  spaceId: UUID;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  itemId: UUID;
  spaceId: UUID;
  name: string;
  categoryId: UUID;
  unit: InventoryUnit;
  currentStock: number;
  reservedStock: number;
  minimumStock: number;
  location?: string | null;
  supplierId?: UUID | null;
  purchasePrice?: number | null;
  averagePrice?: number | null;
  barcode?: string | null;
  notes?: string | null;
  statusOverride?: InventoryStockStatus | null;
  imageUri?: string | null;
  /** Food profile — optional expiry (future-ready). */
  expiresAt?: string | null;
  /** Asset/furniture profile — optional warranty end (future-ready). */
  warrantyUntil?: string | null;
  /** Asset assignment target type (future-ready). */
  assignedEntityType?: 'ROOM' | 'BED' | 'MEMBER' | 'UNIT' | null;
  assignedEntityId?: UUID | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  transactionId: UUID;
  spaceId: UUID;
  itemId: UUID;
  itemName: string;
  type: InventoryTxnType;
  quantity: number;
  unit: InventoryUnit;
  reason?: string | null;
  reference?: string | null;
  supplierId?: UUID | null;
  supplierName?: string | null;
  amount?: number | null;
  actorName?: string | null;
  createdAt: string;
}

export interface InventorySpaceStore {
  spaceId: UUID;
  spaceType: SpaceType;
  seeded: boolean;
  categories: InventoryCategory[];
  suppliers: InventorySupplier[];
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  updatedAt: string;
}

export interface InventoryDashboardSummary {
  totalItems: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  supplierCount: number;
  recentPurchases: InventoryTransaction[];
  recentConsumption: InventoryTransaction[];
  criticalItems: InventoryItem[];
}

export interface CreateInventoryItemRequest {
  name: string;
  categoryId: UUID;
  unit: InventoryUnit;
  openingStock: number;
  minimumStock: number;
  location?: string | null;
  supplierId?: UUID | null;
  purchasePrice?: number | null;
  barcode?: string | null;
  notes?: string | null;
}

export interface UpdateInventoryItemRequest {
  name?: string;
  categoryId?: UUID;
  unit?: InventoryUnit;
  minimumStock?: number;
  location?: string | null;
  supplierId?: UUID | null;
  purchasePrice?: number | null;
  averagePrice?: number | null;
  barcode?: string | null;
  notes?: string | null;
  statusOverride?: InventoryStockStatus | null;
}

export interface InventoryStockMoveRequest {
  type: Extract<
    InventoryTxnType,
    'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'PURCHASE' | 'CONSUMPTION'
  >;
  quantity: number;
  reason?: string | null;
  reference?: string | null;
  supplierId?: UUID | null;
  amount?: number | null;
  /** For ADJUSTMENT: set absolute stock instead of delta when provided. */
  setAbsoluteStock?: number | null;
  actorName?: string | null;
}

export interface CreateInventoryCategoryRequest {
  name: string;
  iconKey?: string;
}

export interface CreateInventorySupplierRequest {
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export type InventoryItemListFilter =
  | 'ALL'
  | 'LOW'
  | 'CRITICAL'
  | 'OUT_OF_STOCK'
  | 'HEALTHY';
