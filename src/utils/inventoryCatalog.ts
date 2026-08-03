import type { LucideIcon } from 'lucide-react-native';
import {
  Apple,
  BedDouble,
  Droplets,
  Fan,
  KeyRound,
  Milk,
  Package,
  Refrigerator,
  Shirt,
  Sofa,
  Sparkles,
  UtensilsCrossed,
  WashingMachine,
  Wheat,
} from 'lucide-react-native';
import type { SpaceType } from '../api/types';
import type {
  InventoryProfileKind,
  InventoryUnit,
} from '../api/inventoryTypes';
import { colors } from '../theme';

/** Default item template â€” mirrored by backend InventoryProfiles (config only). */
export type InventorySeedItem = {
  name: string;
  categoryCode: string;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  location: string;
  purchasePrice: number;
};

export type InventorySeedCategory = {
  code: string;
  name: string;
  iconKey: string;
};

export type InventoryProfileTheme = {
  /** Hero / KPI accent */
  accent: string;
  soft: string;
  border: string;
};

/**
 * Inventory configuration profile â€” not a data store.
 * Backend InventorySeedService persists defaults from the matching server catalog.
 * Screens should consume capability flags instead of `spaceType === â€¦` checks.
 */
export type InventoryProfile = {
  kind: InventoryProfileKind;
  /** Human-readable profile name (English fallback). */
  name: string;
  moduleTitleKey: string;
  moduleTitleDefault: string;
  heroSubheadingDefault: string;
  /** Lucide icon for heroes / empty states. */
  icon: LucideIcon;
  theme: InventoryProfileTheme;
  /** Preferred units shown in the item form (order matters; first = default). */
  defaultUnits: InventoryUnit[];
  /** Default categories (config mirror of backend seeder). */
  defaultCategories: InventorySeedCategory[];
  /** Alias â€” same as defaultCategories. */
  categories: InventorySeedCategory[];
  /** Default items (config mirror of backend seeder â€” mobile does not seed). */
  seedItems: InventorySeedItem[];
  exampleLocations: string[];
  /** Default supplier display name when supportsSupplier. */
  defaultSupplierName: string;
  /** Food / consumables â€” expiry dates matter. */
  supportsExpiry: boolean;
  /** Purchases and vendor contacts. */
  supportsSupplier: boolean;
  /** Durable goods â€” warranty tracking. */
  supportsWarranty: boolean;
  /** Link items to rooms / beds / members (future). */
  supportsAssetAssignment: boolean;
};

/** @deprecated Prefer InventoryProfile */
export type InventoryCatalogProfile = InventoryProfile;

const FOOD_THEME: InventoryProfileTheme = {
  accent: colors.primaryDark,
  soft: colors.successTint,
  border: `${colors.primary}33`,
};

const ASSET_THEME: InventoryProfileTheme = {
  accent: '#0F766E',
  soft: '#F0FDFA',
  border: '#99F6E433',
};

const FURNITURE_THEME: InventoryProfileTheme = {
  accent: '#1D4ED8',
  soft: '#EFF6FF',
  border: '#BFDBFE',
};

const FOOD_CATEGORIES: InventorySeedCategory[] = [
  { code: 'GRAINS', name: 'Grains', iconKey: 'Wheat' },
  { code: 'DAIRY', name: 'Dairy', iconKey: 'Milk' },
  { code: 'VEGETABLES', name: 'Vegetables', iconKey: 'Apple' },
  { code: 'OIL', name: 'Oil', iconKey: 'Droplets' },
  { code: 'SPICES', name: 'Spices', iconKey: 'Package' },
];

const ASSET_CATEGORIES: InventorySeedCategory[] = [
  { code: 'FURNITURE', name: 'Furniture', iconKey: 'Sofa' },
  { code: 'BEDDING', name: 'Bedding', iconKey: 'BedDouble' },
  { code: 'CLEANING', name: 'Cleaning', iconKey: 'Sparkles' },
  { code: 'ELECTRICAL', name: 'Electrical', iconKey: 'Fan' },
];

const FURNITURE_CATEGORIES: InventorySeedCategory[] = [
  { code: 'FURNITURE', name: 'Furniture', iconKey: 'Sofa' },
  { code: 'APPLIANCES', name: 'Appliances', iconKey: 'Refrigerator' },
  { code: 'LAUNDRY', name: 'Laundry', iconKey: 'WashingMachine' },
  { code: 'SOFT', name: 'Soft Furnishings', iconKey: 'Shirt' },
  { code: 'KEYS', name: 'Keys', iconKey: 'KeyRound' },
];

const FOOD_PROFILE: InventoryProfile = {
  kind: 'FOOD',
  name: 'Food Inventory',
  moduleTitleKey: 'inventory.profiles.food.title',
  moduleTitleDefault: 'Food Inventory',
  heroSubheadingDefault: 'Track kitchen stock, groceries, and consumables for your mess.',
  icon: UtensilsCrossed,
  theme: FOOD_THEME,
  defaultUnits: ['KG', 'LITRE', 'DOZEN', 'PACKET', 'PIECE'],
  defaultCategories: FOOD_CATEGORIES,
  categories: FOOD_CATEGORIES,
  defaultSupplierName: 'Local Kirana',
  supportsExpiry: true,
  supportsSupplier: true,
  supportsWarranty: false,
  supportsAssetAssignment: false,
  exampleLocations: ['Dry store', 'Fridge', 'Kitchen', 'Utility'],
  seedItems: [
    { name: 'Rice', categoryCode: 'GRAINS', unit: 'KG', currentStock: 0, minimumStock: 20, location: 'Dry store', purchasePrice: 55 },
    { name: 'Wheat Flour', categoryCode: 'GRAINS', unit: 'KG', currentStock: 0, minimumStock: 15, location: 'Dry store', purchasePrice: 42 },
    { name: 'Semolina', categoryCode: 'GRAINS', unit: 'KG', currentStock: 0, minimumStock: 5, location: 'Dry store', purchasePrice: 60 },
    { name: 'Milk', categoryCode: 'DAIRY', unit: 'LITRE', currentStock: 0, minimumStock: 10, location: 'Fridge', purchasePrice: 56 },
    { name: 'Curd', categoryCode: 'DAIRY', unit: 'KG', currentStock: 0, minimumStock: 5, location: 'Fridge', purchasePrice: 50 },
    { name: 'Butter', categoryCode: 'DAIRY', unit: 'KG', currentStock: 0, minimumStock: 2, location: 'Fridge', purchasePrice: 520 },
    { name: 'Onion', categoryCode: 'VEGETABLES', unit: 'KG', currentStock: 0, minimumStock: 8, location: 'Kitchen', purchasePrice: 30 },
    { name: 'Tomato', categoryCode: 'VEGETABLES', unit: 'KG', currentStock: 0, minimumStock: 5, location: 'Kitchen', purchasePrice: 40 },
    { name: 'Potato', categoryCode: 'VEGETABLES', unit: 'KG', currentStock: 0, minimumStock: 10, location: 'Kitchen', purchasePrice: 25 },
    { name: 'Sunflower Oil', categoryCode: 'OIL', unit: 'LITRE', currentStock: 0, minimumStock: 8, location: 'Kitchen', purchasePrice: 160 },
    { name: 'Salt', categoryCode: 'SPICES', unit: 'KG', currentStock: 0, minimumStock: 2, location: 'Kitchen', purchasePrice: 20 },
    { name: 'Turmeric', categoryCode: 'SPICES', unit: 'KG', currentStock: 0, minimumStock: 0.5, location: 'Kitchen', purchasePrice: 280 },
    { name: 'Chili Powder', categoryCode: 'SPICES', unit: 'KG', currentStock: 0, minimumStock: 0.5, location: 'Kitchen', purchasePrice: 320 },
  ],
};

const ASSET_PROFILE: InventoryProfile = {
  kind: 'ASSET',
  name: 'Asset Inventory',
  moduleTitleKey: 'inventory.profiles.asset.title',
  moduleTitleDefault: 'Asset Inventory',
  heroSubheadingDefault: 'Track house assets, linens, and maintenance supplies.',
  icon: Package,
  theme: ASSET_THEME,
  defaultUnits: ['PIECE', 'SET', 'PACKET', 'METRE'],
  defaultCategories: ASSET_CATEGORIES,
  categories: ASSET_CATEGORIES,
  defaultSupplierName: 'General Supplies',
  supportsExpiry: false,
  supportsSupplier: true,
  supportsWarranty: true,
  supportsAssetAssignment: true,
  exampleLocations: ['Linen cupboard', 'Store room', 'Office', 'Utility'],
  seedItems: [
    { name: 'Chair', categoryCode: 'FURNITURE', unit: 'PIECE', currentStock: 0, minimumStock: 4, location: 'Store room', purchasePrice: 900 },
    { name: 'Table', categoryCode: 'FURNITURE', unit: 'PIECE', currentStock: 0, minimumStock: 2, location: 'Store room', purchasePrice: 2500 },
    { name: 'Cot', categoryCode: 'FURNITURE', unit: 'PIECE', currentStock: 0, minimumStock: 3, location: 'Store room', purchasePrice: 4500 },
    { name: 'Mattress', categoryCode: 'BEDDING', unit: 'PIECE', currentStock: 0, minimumStock: 3, location: 'Linen cupboard', purchasePrice: 3500 },
    { name: 'Pillow', categoryCode: 'BEDDING', unit: 'PIECE', currentStock: 0, minimumStock: 10, location: 'Linen cupboard', purchasePrice: 250 },
    { name: 'Bedsheet', categoryCode: 'BEDDING', unit: 'PIECE', currentStock: 0, minimumStock: 12, location: 'Linen cupboard', purchasePrice: 350 },
    { name: 'Mop', categoryCode: 'CLEANING', unit: 'PIECE', currentStock: 0, minimumStock: 2, location: 'Utility', purchasePrice: 220 },
    { name: 'Bucket', categoryCode: 'CLEANING', unit: 'PIECE', currentStock: 0, minimumStock: 4, location: 'Utility', purchasePrice: 180 },
    { name: 'Cleaning Liquid', categoryCode: 'CLEANING', unit: 'LITRE', currentStock: 0, minimumStock: 3, location: 'Utility', purchasePrice: 90 },
    { name: 'Fan', categoryCode: 'ELECTRICAL', unit: 'PIECE', currentStock: 0, minimumStock: 1, location: 'Store room', purchasePrice: 2200 },
    { name: 'Tube Light', categoryCode: 'ELECTRICAL', unit: 'PIECE', currentStock: 0, minimumStock: 5, location: 'Store room', purchasePrice: 180 },
  ],
};

const FURNITURE_PROFILE: InventoryProfile = {
  kind: 'FURNITURE',
  name: 'Furniture & Appliances',
  moduleTitleKey: 'inventory.profiles.furniture.title',
  moduleTitleDefault: 'Furniture & Appliances',
  heroSubheadingDefault: 'Track furniture, appliances, and fixtures for rental units.',
  icon: Sofa,
  theme: FURNITURE_THEME,
  defaultUnits: ['PIECE', 'SET'],
  defaultCategories: FURNITURE_CATEGORIES,
  categories: FURNITURE_CATEGORIES,
  defaultSupplierName: 'Home Appliances Vendor',
  supportsExpiry: false,
  supportsSupplier: true,
  supportsWarranty: true,
  supportsAssetAssignment: true,
  exampleLocations: ['Unit A', 'Store', 'Office', 'Utility'],
  seedItems: [
    { name: 'Sofa Set', categoryCode: 'FURNITURE', unit: 'SET', currentStock: 0, minimumStock: 0, location: 'Unit A â€” Living', purchasePrice: 28000 },
    { name: 'Dining Table', categoryCode: 'FURNITURE', unit: 'SET', currentStock: 0, minimumStock: 0, location: 'Unit A â€” Dining', purchasePrice: 12000 },
    { name: 'Split AC 1.5T', categoryCode: 'APPLIANCES', unit: 'PIECE', currentStock: 0, minimumStock: 0, location: 'Unit A â€” Bedroom', purchasePrice: 38000 },
    { name: 'Refrigerator 190L', categoryCode: 'APPLIANCES', unit: 'PIECE', currentStock: 0, minimumStock: 0, location: 'Unit A â€” Kitchen', purchasePrice: 18000 },
    { name: 'Microwave', categoryCode: 'APPLIANCES', unit: 'PIECE', currentStock: 0, minimumStock: 1, location: 'Store', purchasePrice: 7500 },
    { name: 'Washing Machine', categoryCode: 'LAUNDRY', unit: 'PIECE', currentStock: 0, minimumStock: 0, location: 'Unit A â€” Utility', purchasePrice: 22000 },
    { name: 'Curtains (Living)', categoryCode: 'SOFT', unit: 'SET', currentStock: 0, minimumStock: 1, location: 'Unit A', purchasePrice: 2400 },
    { name: 'Unit Keys', categoryCode: 'KEYS', unit: 'SET', currentStock: 0, minimumStock: 2, location: 'Office', purchasePrice: 120 },
  ],
};

/**
 * Resolve inventory behavior for a space type.
 * Only place that maps SpaceType â†’ profile â€” keep UI free of space-type switches.
 */
export function getInventoryProfile(spaceType: SpaceType): InventoryProfile {
  switch (spaceType) {
    case 'MESS':
      return FOOD_PROFILE;
    case 'RENTAL':
      return FURNITURE_PROFILE;
    case 'PG':
    case 'HOSTEL':
    case 'CO_LIVING':
    default:
      return ASSET_PROFILE;
  }
}

/** @deprecated Prefer getInventoryProfile */
export function getInventoryCatalogProfile(spaceType: SpaceType): InventoryProfile {
  return getInventoryProfile(spaceType);
}

const ICON_MAP: Record<string, LucideIcon> = {
  Wheat,
  Package,
  Apple,
  Milk,
  Droplets,
  Shirt,
  Sofa,
  Fan,
  Sparkles,
  KeyRound,
  BedDouble,
  Refrigerator,
  WashingMachine,
};

export function getInventoryCategoryIcon(iconKey: string): LucideIcon {
  return ICON_MAP[iconKey] ?? Package;
}

export function formatInventoryUnit(unit: InventoryUnit): string {
  switch (unit) {
    case 'KG':
      return 'kg';
    case 'LITRE':
      return 'L';
    case 'PIECE':
      return 'pcs';
    case 'PACKET':
      return 'pkt';
    case 'DOZEN':
      return 'dz';
    case 'METRE':
      return 'm';
    case 'SET':
      return 'set';
    default:
      return unit.toLowerCase();
  }
}
