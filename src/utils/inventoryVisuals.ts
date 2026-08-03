import {
  AlertTriangle,
  Ban,
  CircleCheckBig,
  CircleSlash,
  PackageX,
  PauseCircle,
  type LucideIcon,
} from 'lucide-react-native';
import type { InventoryItem, InventoryStockStatus, InventoryTxnType } from '../api/inventoryTypes';
import { colors } from '../theme';

export function deriveInventoryStockStatus(item: InventoryItem): InventoryStockStatus {
  if (item.statusOverride === 'DISCONTINUED' || item.statusOverride === 'INACTIVE') {
    return item.statusOverride;
  }
  const available = Math.max(0, item.currentStock - item.reservedStock);
  if (available <= 0) {
    return 'OUT_OF_STOCK';
  }
  if (item.minimumStock > 0 && available <= Math.max(1, Math.floor(item.minimumStock * 0.5))) {
    return 'CRITICAL';
  }
  if (item.minimumStock > 0 && available <= item.minimumStock) {
    return 'LOW';
  }
  return 'HEALTHY';
}

export function getInventoryStatusTone(status: InventoryStockStatus): {
  color: string;
  soft: string;
  border: string;
  icon: LucideIcon;
} {
  switch (status) {
    case 'HEALTHY':
      return {
        color: colors.primaryDark,
        soft: colors.successTint,
        border: '#A7F3D0',
        icon: CircleCheckBig,
      };
    case 'LOW':
      return {
        color: '#D97706',
        soft: colors.warningTint,
        border: '#FDE68A',
        icon: AlertTriangle,
      };
    case 'CRITICAL':
      return {
        color: '#DC2626',
        soft: colors.errorTint,
        border: '#FECACA',
        icon: AlertTriangle,
      };
    case 'OUT_OF_STOCK':
      return {
        color: '#7F1D1D',
        soft: '#FEE2E2',
        border: '#FECACA',
        icon: PackageX,
      };
    case 'DISCONTINUED':
      return {
        color: '#64748B',
        soft: '#F1F5F9',
        border: colors.border,
        icon: Ban,
      };
    case 'INACTIVE':
    default:
      return {
        color: '#64748B',
        soft: colors.surfaceSecondary,
        border: colors.border,
        icon: PauseCircle,
      };
  }
}

export function getInventoryTxnAccent(type: InventoryTxnType): string {
  switch (type) {
    case 'STOCK_IN':
    case 'PURCHASE':
      return colors.primaryDark;
    case 'STOCK_OUT':
    case 'CONSUMPTION':
      return '#DC2626';
    case 'TRANSFER':
      return '#2563EB';
    case 'ADJUSTMENT':
    default:
      return '#D97706';
  }
}

export function availableStock(item: InventoryItem): number {
  return Math.max(0, item.currentStock - item.reservedStock);
}

export { CircleSlash };
