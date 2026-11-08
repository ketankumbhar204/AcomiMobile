import React from 'react';
import { StyleSheet } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { OverflowMenuProvider } from '../../../components/ui/HeaderOverflowMenu';
import { HeaderOverflowMenu } from '../../../components/ui/HeaderOverflowMenu';
import { MenuLibraryScreen } from '../MenuLibraryScreen';

const mockNavigate = jest.fn();
const mockNavigateMain = jest.fn();
const mockGetItem = jest.fn(async () => null as string | null);

const mockCatalogState: { loading: boolean; variant: 'full' | 'empty' } = {
  loading: false,
  variant: 'full',
};

const mockPricingState = { requiresMealPrices: false };

type Item = {
  itemId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  scope: 'GLOBAL' | 'SPACE';
  isCustom: boolean;
  isActive: boolean;
  foodType: 'VEG' | 'NON_VEG' | 'EGG';
  defaultPrice?: number | null;
  currencyCode?: string | null;
  isExtra?: boolean;
};

type Category = {
  categoryId: string;
  name: string;
  sortOrder: number;
  scope: 'GLOBAL' | 'SPACE';
  isActive: boolean;
};

type Combo = {
  comboId: string;
  name: string;
  description?: string;
  isActive: boolean;
  price?: number | null;
  currencyCode?: string;
  foodType?: 'VEG' | 'NON_VEG' | 'EGG';
  enabledForSpace?: boolean;
  items?: Array<{ itemId: string; name: string; quantity?: number }>;
};

const LONG_ITEM =
  'Very long homemade garlic butter naan with extra ghee and sesame for Sunday lunch service';
const LONG_COMBO =
  'Sunday special family chicken thali with rice dal salad and extra chapati for the whole mess';

const categories: Category[] = [
  { categoryId: 'breads', name: 'Breads', sortOrder: 1, scope: 'GLOBAL', isActive: true },
  { categoryId: 'rice', name: 'Rice', sortOrder: 2, scope: 'GLOBAL', isActive: true },
  { categoryId: 'curries', name: 'Curries', sortOrder: 3, scope: 'GLOBAL', isActive: true },
  { categoryId: 'breakfast', name: 'Breakfast', sortOrder: 4, scope: 'SPACE', isActive: true },
];

const items: Item[] = [
  {
    itemId: 'chapati',
    categoryId: 'breads',
    categoryName: 'Breads',
    name: 'Chapati',
    scope: 'SPACE',
    isCustom: true,
    isActive: true,
    foodType: 'VEG',
    defaultPrice: 10,
    currencyCode: 'INR',
    isExtra: true,
  },
  {
    itemId: 'naan',
    categoryId: 'breads',
    categoryName: 'Breads',
    name: LONG_ITEM,
    scope: 'SPACE',
    isCustom: true,
    isActive: true,
    foodType: 'VEG',
  },
  {
    itemId: 'plain-rice',
    categoryId: 'rice',
    categoryName: 'Rice',
    name: 'Plain Rice',
    scope: 'GLOBAL',
    isCustom: false,
    isActive: true,
    foodType: 'VEG',
  },
  {
    itemId: 'chicken',
    categoryId: 'curries',
    categoryName: 'Curries',
    name: 'Chicken Curry',
    scope: 'GLOBAL',
    isCustom: false,
    isActive: true,
    foodType: 'NON_VEG',
  },
];

const combos: Combo[] = [
  {
    comboId: 'thali',
    name: 'Chicken Thali',
    description: 'Daily lunch',
    isActive: true,
    price: 120,
    currencyCode: 'INR',
    foodType: 'NON_VEG',
    items: [
      { itemId: 'chapati', name: 'Chapati', quantity: 2 },
      { itemId: 'chicken', name: 'Chicken Curry' },
      { itemId: 'plain-rice', name: 'Plain Rice' },
    ],
  },
  {
    comboId: 'hidden',
    name: 'Egg Thali',
    isActive: true,
    foodType: 'EGG',
    enabledForSpace: false,
    items: [{ itemId: 'chapati', name: 'Chapati' }],
  },
  {
    comboId: 'long-combo',
    name: LONG_COMBO,
    isActive: true,
    foodType: 'VEG',
    items: [{ itemId: 'plain-rice', name: 'Plain Rice' }],
  },
];

function mockCatalog() {
  if (mockCatalogState.variant === 'empty') {
    return { categories: [] as Category[], items: [] as Item[], combos: [] as Combo[] };
  }
  return { categories, items, combos };
}

jest.mock('react-native-localize', () => ({
  getLocales: () => [{ languageCode: 'en', countryCode: 'IN' }],
  getCountry: () => 'IN',
  findBestLanguageTag: () => ({ languageTag: 'en', isRTL: false }),
}));

jest.mock('react-i18next', () => {
  const en = require('../../../i18n/locales/en.json') as Record<string, unknown>;
  const translate = (key: string, options?: Record<string, unknown>) => {
    const value = key.split('.').reduce<unknown>((node, part) => {
      if (node && typeof node === 'object' && part in (node as object)) {
        return (node as Record<string, unknown>)[part];
      }
      return undefined;
    }, en);
    const template =
      typeof value === 'string'
        ? value
        : typeof options?.defaultValue === 'string'
          ? options.defaultValue
          : key;
    return template.replace(/\{\{(\w+)\}\}/g, (_, token: string) =>
      options && options[token] != null ? String(options[token]) : '',
    );
  };
  return {
    useTranslation: () => ({ t: translate }),
  };
});

jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  setItem: jest.fn(async () => undefined),
}));

jest.mock('../../../navigation/navigationRef', () => ({
  navigationRef: {
    addListener: () => () => undefined,
    isReady: () => false,
  },
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
      setOptions: jest.fn(),
    }),
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => {
        const cleanup = effect();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [effect]);
    },
  };
});

jest.mock('../../../hooks/useSpacePermissions', () => ({
  useSpacePermissions: () => ({
    canViewMeals: true,
    canManageMeals: true,
    membershipRole: 'OWNER',
  }),
}));

jest.mock('../../../hooks/useMealPricingPolicy', () => ({
  useMealPricingPolicy: () => ({
    requiresMealPrices: mockPricingState.requiresMealPrices,
  }),
}));

jest.mock('../../../hooks/useMainStackNavigation', () => ({
  useMainStackNavigation: () => ({ navigate: mockNavigateMain }),
}));

jest.mock('../../../store/toastStore', () => ({
  useToastStore: (selector: (state: { showToast: () => void }) => unknown) =>
    selector({ showToast: jest.fn() }),
}));

jest.mock('../../../utils/dashboardQueryCache', () => ({
  invalidateDashboardQueries: jest.fn(),
}));

jest.mock('../../../api/mealsApi', () => ({
  mealsApi: {
    createFoodCategory: jest.fn(),
    createFoodItem: jest.fn(),
    updateFoodItem: jest.fn(),
    updateFoodItemExtra: jest.fn(),
    deactivateFoodItem: jest.fn(),
    deactivateFoodCategory: jest.fn(),
    deactivateMealCombo: jest.fn(),
    setMealComboEnabled: jest.fn(),
  },
}));

jest.mock('../../../components/ui', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    EmptyState: ({ title, description }: { title?: string; description?: string }) =>
      React.createElement(Text, null, title, description),
    PermissionDeniedScreen: () => React.createElement(Text, null, 'denied'),
  };
});

jest.mock('../../../components/files/EntityPhoto', () => ({
  EntityPhoto: ({ fallback }: { fallback?: React.ReactNode }) => fallback ?? null,
}));

jest.mock('../../../hooks/useMenuLibrary', () => {
  const React = require('react');
  return {
    useMenuLibrary: () => {
      const data = mockCatalog();
      const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
      const [selectedComboId, setSelectedComboId] = React.useState<string | null>('thali');
      const activeItems = data.items.filter((item: Item) => item.isActive);
      const extraItems = activeItems.filter((item: Item) => item.isExtra === true);
      const extraCategoryIds = new Set(extraItems.map((item: Item) => item.categoryId));
      const filteredItems = selectedCategoryId
        ? activeItems.filter((item: Item) => item.categoryId === selectedCategoryId)
        : activeItems;
      return {
        loading: mockCatalogState.loading,
        loadFailed: false,
        items: data.items,
        categories: data.categories,
        combos: data.combos,
        activeCategories: data.categories,
        activeCombos: data.combos,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedCategory:
          data.categories.find((category: Category) => category.categoryId === selectedCategoryId) ??
          null,
        selectedComboId,
        setSelectedComboId,
        selectedCombo:
          data.combos.find((combo: Combo) => combo.comboId === selectedComboId) ?? null,
        filteredItems,
        extraItems,
        filteredExtraItems: extraItems,
        extraCategories: data.categories.filter((category: Category) =>
          extraCategoryIds.has(category.categoryId),
        ),
        stats: {
          categoryCount: data.categories.length,
          itemCount: activeItems.length,
          comboCount: data.combos.length,
          extraCount: extraItems.length,
        },
        reload: jest.fn(),
        patchItem: jest.fn(),
      };
    },
  };
});

function treeText(renderer: TestRenderer.ReactTestRenderer): string {
  return JSON.stringify(renderer.toJSON());
}

async function renderLibrary() {
  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <OverflowMenuProvider>
        <MenuLibraryScreen spaceId="space-1" />
      </OverflowMenuProvider>,
    );
    await Promise.resolve();
  });
  return renderer!;
}

function press(renderer: TestRenderer.ReactTestRenderer, testID: string) {
  act(() => {
    renderer.root.findByProps({ testID }).props.onPress();
  });
}

describe('MenuLibraryScreen catalogue', () => {
  jest.setTimeout(20000);

  beforeEach(() => {
    mockNavigate.mockReset();
    mockNavigateMain.mockReset();
    mockGetItem.mockReset();
    mockGetItem.mockResolvedValue(null);
    mockCatalogState.loading = false;
    mockCatalogState.variant = 'full';
    mockPricingState.requiresMealPrices = false;
  });

  it('shows the compact items catalogue with live counts and category filters', async () => {
    const renderer = await renderLibrary();
    const text = treeText(renderer);

    expect(text).toContain('Items (4)');
    expect(text).toContain('Combos (3)');
    expect(text).toContain('All menu items (4)');
    expect(text).toContain('All (4)');
    expect(text).toContain('Breads (2)');
    expect(text).toContain('Breakfast (0)');
    expect(text).toContain('Chapati');
    expect(text).toContain('Plain Rice');
    expect(text).toContain('Chicken Curry');
    expect(text).toContain(LONG_ITEM);
    expect(text).toContain('Your menu library is ready');
    expect(text).toContain('Edit your items and combos anytime.');
    expect(text).toContain('Continue to menu planning');
    expect(text).toContain('Meal Subscription Plan');
    expect(text).not.toContain('Build your catalog');

    const summary = renderer.root.findByProps({ testID: 'library-summary-items' });
    const summaryStyle = StyleSheet.flatten(summary.props.style);
    expect(summaryStyle.flex).toBe(1);
    expect(summaryStyle.minWidth).toBe(0);

    const menus = renderer.root.findAllByType(HeaderOverflowMenu);
    const chapatiMenu = menus.find(menu => menu.props.accessibilityLabel === 'Actions for Chapati');
    expect(chapatiMenu?.props.items.map((item: { id: string }) => item.id)).toEqual([
      'edit',
      'remove',
    ]);

    const riceMenu = menus.find(menu => menu.props.accessibilityLabel === 'Actions for Plain Rice');
    expect(riceMenu?.props.items.map((item: { id: string }) => item.id)).toEqual(['remove']);
  });

  it('filters items by category, keeps that filter when switching tabs, and restores All', async () => {
    const renderer = await renderLibrary();

    press(renderer, 'library-category-rice');
    expect(treeText(renderer)).toContain('Plain Rice');
    expect(treeText(renderer)).not.toContain('Chapati');
    expect(treeText(renderer)).toContain('Rice (1)');

    press(renderer, 'library-tab-combos');
    const combos = treeText(renderer);
    expect(combos).toContain('All combos (3)');
    expect(combos).toContain('Chicken Thali');
    expect(combos).toContain('2 Chapati · Chicken Curry · Plain Rice');
    expect(combos).toContain('Egg Thali');
    expect(combos).toContain('Hidden in this space');
    expect(combos).toContain(LONG_COMBO);
    expect(combos).toContain('Meal Subscription Plan');

    const thaliMenu = renderer.root
      .findAllByType(HeaderOverflowMenu)
      .find(menu => menu.props.accessibilityLabel === 'Actions for Chicken Thali');
    expect(thaliMenu?.props.items.map((item: { id: string }) => item.id)).toEqual([
      'edit',
      'toggle',
      'remove',
    ]);

    press(renderer, 'library-tab-items');
    expect(treeText(renderer)).toContain('Plain Rice');
    expect(treeText(renderer)).not.toContain('Chapati');

    press(renderer, 'library-category-all');
    expect(treeText(renderer)).toContain('Chapati');
    expect(treeText(renderer)).toContain('Chicken Curry');
  });

  it('keeps the selected combo and opens edit on the second tap after a tab change', async () => {
    const renderer = await renderLibrary();
    press(renderer, 'library-tab-combos');
    press(renderer, 'library-combo-hidden');
    expect(mockNavigate).not.toHaveBeenCalled();

    press(renderer, 'library-tab-items');
    press(renderer, 'library-tab-combos');
    press(renderer, 'library-combo-hidden');

    expect(mockNavigate).toHaveBeenCalledWith('MealComboForm', {
      spaceId: 'space-1',
      mode: 'edit',
      comboId: 'hidden',
    });
  });

  it('shows an empty category without dropping the rest of the catalogue', async () => {
    const renderer = await renderLibrary();
    press(renderer, 'library-category-breakfast');
    const text = treeText(renderer);
    expect(text).toContain('Breakfast (0)');
    expect(text).toContain('No items in this category.');
    expect(text).not.toContain('Chapati');

    press(renderer, 'library-category-all');
    expect(treeText(renderer)).toContain('Chapati');
  });

  it('hides the ready notice after it has been dismissed and does not show counts while loading', async () => {
    mockGetItem.mockResolvedValue('1');
    const dismissed = await renderLibrary();
    expect(treeText(dismissed)).not.toContain('Your menu library is ready');
    expect(dismissed.root.findAllByProps({ testID: 'library-ready-tip' })).toHaveLength(0);

    mockCatalogState.loading = true;
    const loading = await renderLibrary();
    expect(loading.root.findAllByProps({ testID: 'library-summary-items' })).toHaveLength(0);
    expect(treeText(loading)).not.toContain('Items (0)');
  });

  it('uses the same item rows on the mess extras tab', async () => {
    mockPricingState.requiresMealPrices = true;
    const renderer = await renderLibrary();
    expect(treeText(renderer)).toContain('Extras (1)');

    press(renderer, 'library-tab-extras');
    const text = treeText(renderer);
    expect(text).toContain('Add or remove extras');
    expect(text).toContain('Chapati');
    expect(text).toContain('Extras (1)');

    const extraMenu = renderer.root
      .findAllByType(HeaderOverflowMenu)
      .find(menu => menu.props.accessibilityLabel === 'Actions for Chapati');
    expect(extraMenu?.props.items.map((item: { label: string }) => item.label)).toContain(
      'Remove extra',
    );

    press(renderer, 'library-tab-items');
    expect(treeText(renderer)).toContain('All menu items (4)');
    expect(treeText(renderer)).toContain('Chapati');
  });

  it('opens category management with add and remove for every category', async () => {
    const renderer = await renderLibrary();
    press(renderer, 'library-manage-categories');
    const text = treeText(renderer);
    expect(text).toContain('Add category');
    expect(text).toContain('Breads');
    expect(text).toContain('Breakfast');
    expect(renderer.root.findByProps({ testID: 'library-remove-category-breakfast' })).toBeTruthy();
    expect(renderer.root.findByProps({ testID: 'library-add-category' })).toBeTruthy();
  });

  it('shows the empty library without the ready notice', async () => {
    mockCatalogState.variant = 'empty';
    const renderer = await renderLibrary();
    const text = treeText(renderer);
    expect(text).toContain('Items (0)');
    expect(text).toContain('Combos (0)');
    expect(text).toContain('Default catalog on space create');
    expect(text).not.toContain('Your menu library is ready');
    expect(text).not.toContain('Build your catalog');
  });
});
