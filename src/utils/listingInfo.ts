export type ListingInfoSource = {
  hasContact?: boolean;
  address?: string | null;
  addressLine?: string | null;
  mapUrl?: string | null;
  startingPrice?: number | string | null;
  monthlyPrice?: number | string | null;
  mealPrice?: number | string | null;
  amenityCodes?: string[];
  foodIncludedInRent?: boolean;
  mealsServed?: string[];
  menu?: string | null;
  mealTiming?: string | null;
  foodType?: string | null;
  subscription?: string | null;
};

export type ListingInfoFlags = {
  contact: boolean;
  address: boolean;
  map: boolean;
  rent: boolean;
  amenities: boolean;
  food: boolean;
};

export type MealInfoFlags = ListingInfoFlags & {
  menu: boolean;
  mealTiming: boolean;
  foodType: boolean;
  subscription: boolean;
};

function hasText(value?: string | null): boolean {
  return Boolean(value?.trim());
}

function positivePrice(value?: number | string | null): boolean {
  if (value == null || value === '') {
    return false;
  }
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) && amount > 0;
}

export function listingAddress(listing: ListingInfoSource): string {
  return listing.addressLine?.trim() || listing.address?.trim() || '';
}

export function listingInfoFlags(listing: ListingInfoSource): ListingInfoFlags {
  const amenityCodes = listing.amenityCodes ?? [];
  const foodFromAmenity = amenityCodes.includes('FOOD_INCLUDED');
  const amenityOnly = amenityCodes.filter(code => code !== 'FOOD_INCLUDED');
  return {
    contact: listing.hasContact === true,
    address: hasText(listingAddress(listing)),
    map: hasText(listing.mapUrl),
    rent:
      positivePrice(listing.startingPrice) ||
      positivePrice(listing.monthlyPrice) ||
      positivePrice(listing.mealPrice),
    amenities: amenityOnly.length > 0,
    food: listing.foodIncludedInRent === true || foodFromAmenity,
  };
}

export function listingMealInfoFlags(listing: ListingInfoSource): MealInfoFlags {
  return {
    ...listingInfoFlags(listing),
    menu: (listing.mealsServed?.length ?? 0) > 0 || hasText(listing.menu),
    mealTiming: hasText(listing.mealTiming),
    foodType: hasText(listing.foodType),
    subscription: hasText(listing.subscription),
  };
}

export const CARD_INFO_KEYS = ['contact', 'address', 'map'] as const;
export const EXTRA_INFO_KEYS = ['rent', 'amenities', 'food'] as const;
export const MEAL_EXTRA_INFO_KEYS = ['rent', 'menu', 'mealTiming', 'foodType', 'subscription'] as const;
