import type { LucideIcon } from 'lucide-react-native';
import {
  Apple,
  ArrowUpDown,
  Briefcase,
  Bug,
  Droplets,
  Fan,
  Flame,
  GlassWater,
  Hammer,
  HeartPulse,
  Milk,
  Paintbrush,
  Shield,
  ShoppingBasket,
  Sparkles,
  Truck,
  Utensils,
  Wheat,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react-native';

export type CategoryVisual = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeColor: string;
  shortLabel: string;
};

const PLUMBING: CategoryVisual = {
  icon: Droplets,
  iconBg: '#E8F1FF',
  iconColor: '#2563EB',
  badgeBg: '#EEF4FF',
  badgeColor: '#2563EB',
  shortLabel: 'Plumbing',
};

const ELECTRICAL: CategoryVisual = {
  icon: Zap,
  iconBg: '#FFF4E6',
  iconColor: '#EA580C',
  badgeBg: '#FFF7ED',
  badgeColor: '#C2410C',
  shortLabel: 'Electrical',
};

const WATER: CategoryVisual = {
  icon: GlassWater,
  iconBg: '#F3E8FF',
  iconColor: '#7C3AED',
  badgeBg: '#F5F3FF',
  badgeColor: '#6D28D9',
  shortLabel: 'Water Supply',
};

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  PLUMBING,
  ELECTRICAL,
  WATER_SUPPLY: WATER,
  GROCERIES_WHOLESALE: {
    icon: ShoppingBasket,
    iconBg: '#ECFDF5',
    iconColor: '#047857',
    badgeBg: '#ECFDF5',
    badgeColor: '#047857',
    shortLabel: 'Groceries',
  },
  MILK_DAIRY: {
    icon: Milk,
    iconBg: '#F0F9FF',
    iconColor: '#0369A1',
    badgeBg: '#F0F9FF',
    badgeColor: '#0369A1',
    shortLabel: 'Milk & dairy',
  },
  FOOD_BAKERY: {
    icon: Wheat,
    iconBg: '#FFFBEB',
    iconColor: '#B45309',
    badgeBg: '#FFFBEB',
    badgeColor: '#B45309',
    shortLabel: 'Bakery',
  },
  VEGETABLES_FRUITS: {
    icon: Apple,
    iconBg: '#F0FDF4',
    iconColor: '#15803D',
    badgeBg: '#F0FDF4',
    badgeColor: '#15803D',
    shortLabel: 'Produce',
  },
  OTHER_FOOD: {
    icon: Utensils,
    iconBg: '#FFF1F2',
    iconColor: '#BE123C',
    badgeBg: '#FFF1F2',
    badgeColor: '#BE123C',
    shortLabel: 'Food',
  },
  CARPENTRY: {
    icon: Hammer,
    iconBg: '#FEF3C7',
    iconColor: '#A16207',
    badgeBg: '#FEF3C7',
    badgeColor: '#A16207',
    shortLabel: 'Carpentry',
  },
  CIVIL_PAINTING: {
    icon: Paintbrush,
    iconBg: '#FDF4FF',
    iconColor: '#A21CAF',
    badgeBg: '#FDF4FF',
    badgeColor: '#A21CAF',
    shortLabel: 'Painting',
  },
  APPLIANCES_HVAC: {
    icon: Fan,
    iconBg: '#ECFEFF',
    iconColor: '#0E7490',
    badgeBg: '#ECFEFF',
    badgeColor: '#0E7490',
    shortLabel: 'Appliances',
  },
  CLEANING: {
    icon: Sparkles,
    iconBg: '#F0FDFA',
    iconColor: '#0F766E',
    badgeBg: '#F0FDFA',
    badgeColor: '#0F766E',
    shortLabel: 'Cleaning',
  },
  PEST_WASTE: {
    icon: Bug,
    iconBg: '#F7FEE7',
    iconColor: '#4D7C0F',
    badgeBg: '#F7FEE7',
    badgeColor: '#4D7C0F',
    shortLabel: 'Pest & waste',
  },
  CARE_MEDICAL: {
    icon: HeartPulse,
    iconBg: '#FEF2F2',
    iconColor: '#B91C1C',
    badgeBg: '#FEF2F2',
    badgeColor: '#B91C1C',
    shortLabel: 'Care',
  },
  GAS_KITCHEN: {
    icon: Flame,
    iconBg: '#FFF7ED',
    iconColor: '#C2410C',
    badgeBg: '#FFF7ED',
    badgeColor: '#C2410C',
    shortLabel: 'Gas',
  },
  INTERNET: {
    icon: Wifi,
    iconBg: '#EFF6FF',
    iconColor: '#1D4ED8',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8',
    shortLabel: 'Internet',
  },
  SECURITY: {
    icon: Shield,
    iconBg: '#F8FAFC',
    iconColor: '#334155',
    badgeBg: '#F1F5F9',
    badgeColor: '#334155',
    shortLabel: 'Security',
  },
  FIRE_SAFETY: {
    icon: Flame,
    iconBg: '#FEF2F2',
    iconColor: '#DC2626',
    badgeBg: '#FEF2F2',
    badgeColor: '#DC2626',
    shortLabel: 'Fire safety',
  },
  LIFT_FACILITY: {
    icon: ArrowUpDown,
    iconBg: '#EEF2FF',
    iconColor: '#4338CA',
    badgeBg: '#EEF2FF',
    badgeColor: '#4338CA',
    shortLabel: 'Lift',
  },
  TRANSPORT: {
    icon: Truck,
    iconBg: '#F0FDF4',
    iconColor: '#166534',
    badgeBg: '#F0FDF4',
    badgeColor: '#166534',
    shortLabel: 'Transport',
  },
  PROFESSIONAL: {
    icon: Briefcase,
    iconBg: '#F5F3FF',
    iconColor: '#5B21B6',
    badgeBg: '#F5F3FF',
    badgeColor: '#5B21B6',
    shortLabel: 'Professional',
  },
  OTHER: {
    icon: Wrench,
    iconBg: '#F1F5F9',
    iconColor: '#475569',
    badgeBg: '#F1F5F9',
    badgeColor: '#475569',
    shortLabel: 'Other',
  },
};

export function categoryVisual(code: string | null | undefined, label?: string | null): CategoryVisual {
  const known = CATEGORY_VISUALS[code ?? ''];
  if (known) {
    return known;
  }
  const shortLabel = label?.trim() || CATEGORY_VISUALS.OTHER.shortLabel;
  return { ...CATEGORY_VISUALS.OTHER, shortLabel };
}
