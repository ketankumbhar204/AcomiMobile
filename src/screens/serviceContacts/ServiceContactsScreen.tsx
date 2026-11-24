import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react-native';
import {
  serviceContactsApi,
  type ServiceContact,
  type ServiceContactCategoryOption,
  type ServiceContactSort,
} from '../../api/serviceContactsApi';
import { ApiError } from '../../api/types';
import { useOptionalContactOptions } from '../../components/contact';
import { ServiceProviderCard } from '../../components/serviceContacts/ServiceProviderCard';
import { Button, EmptyState, HeaderBackButton } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { canManageServiceContacts } from '../../utils/serviceContactAccess';
import { categoryVisual } from '../../utils/serviceContactCategoryVisual';
import {
  openContactDialer,
  openContactWhatsApp,
} from '../../utils/contactActions';
import { serviceContactNumbers, whatsappHref } from '../../utils/serviceContactLinks';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ServiceContacts'>;

export function ServiceContactsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { openContactOptions } = useOptionalContactOptions();
  const showToast = useToastStore(state => state.showToast);
  const userId = useAuthStore(state => state.userId);
  const spaces = useSpaceStore(state => state.mySpaces);
  const canManage = canManageServiceContacts(spaces);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<ServiceContactSort>('updated');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftSort, setDraftSort] = useState<ServiceContactSort>('updated');
  const [filterOpen, setFilterOpen] = useState(false);
  const [categories, setCategories] = useState<ServiceContactCategoryOption[]>([]);
  const [items, setItems] = useState<ServiceContact[]>([]);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setItems([]);
    setPage(0);
    setError(null);
  }, [userId]);

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const [categoryRows, result] = await Promise.all([
          serviceContactsApi.categories(),
          serviceContactsApi.list({
            q: debounced || undefined,
            category: category || undefined,
            sort,
            page: nextPage,
            size: 20,
          }),
        ]);
        setCategories(categoryRows);
        setItems(current => (replace ? result.content : [...current, ...result.content]));
        setPage(result.page);
        setLast(result.last);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('serviceContacts.loadError'));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [category, debounced, sort, t, userId],
  );

  useFocusEffect(
    useCallback(() => {
      void load(0, true);
    }, [load]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'left',
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
      headerTitle: () => (
        <View style={styles.navTitle}>
          <Text style={styles.navHeading} numberOfLines={1}>
            {t('serviceContacts.title')}
          </Text>
          <Text style={styles.navSubtitle} numberOfLines={1}>
            {t('serviceContacts.subtitle')}
          </Text>
        </View>
      ),
      headerRight: () =>
        canManage ? (
          <Pressable
            onPress={() => navigation.navigate('ServiceContactForm', {})}
            style={styles.addBtn}
            accessibilityRole="button"
            accessibilityLabel={t('serviceContacts.add')}
            hitSlop={8}>
            <Plus size={20} color={colors.teal} strokeWidth={2.4} />
          </Pressable>
        ) : null,
    });
  }, [canManage, navigation, t]);

  const filtersActive = Boolean(category) || sort !== 'updated';

  function openSheet(contact: ServiceContact, phone: string) {
    openContactOptions({
      phoneNumber: phone,
      displayName: contact.contactPersonName || contact.businessName,
      organizationName: contact.businessName,
      presentation: 'service',
    });
  }

  function missingNumber() {
    showToast(t('contact.invalid', { defaultValue: 'Phone number is not available' }));
  }

  async function callContact(contact: ServiceContact) {
    const numbers = serviceContactNumbers(contact);
    if (numbers.length === 0) {
      missingNumber();
      return;
    }
    if (numbers.length > 1) {
      openSheet(contact, numbers[0]);
      return;
    }
    const result = await openContactDialer(numbers[0]);
    if (result !== 'opened') {
      showToast(t('serviceContacts.openFailed'));
    }
  }

  async function whatsappContact(contact: ServiceContact) {
    const numbers = serviceContactNumbers(contact);
    const preferred = contact.whatsappPhone || numbers[0];
    if (!preferred || !whatsappHref(preferred)) {
      missingNumber();
      return;
    }
    if (numbers.length > 1) {
      openSheet(contact, preferred);
      return;
    }
    const result = await openContactWhatsApp(preferred);
    if (result !== 'opened') {
      showToast(t('serviceContacts.openFailed'));
    }
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          void load(0, true);
          void loadShared();
        }}
        onEndReached={() => {
          if (!loading && !loadingMore && !last && !error) {
            void load(page + 1, false);
          }
        }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.searchRow}>
              <View style={styles.searchWrap}>
                <Search size={16} color={colors.muted} strokeWidth={2.2} />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('serviceContacts.searchPlaceholder')}
                  placeholderTextColor={colors.muted}
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel={t('serviceContacts.searchPlaceholder')}
                />
              </View>
              <Pressable
                onPress={() => {
                  setDraftCategory(category);
                  setDraftSort(sort);
                  setFilterOpen(true);
                }}
                style={[styles.filterBtn, filtersActive && styles.filterBtnActive]}
                accessibilityRole="button"
                accessibilityLabel={t('serviceContacts.filter', { defaultValue: 'Filter' })}>
                <SlidersHorizontal
                  size={18}
                  color={filtersActive ? colors.white : colors.textPrimary}
                  strokeWidth={2.2}
                />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}>
              <CategoryChip
                label={t('serviceContacts.categoryAll')}
                selected={category === ''}
                onPress={() => setCategory('')}
              />
              {categories.map(item => {
                const visual = categoryVisual(item.code, item.label);
                const ChipIcon = visual.icon;
                const selected = category === item.code;
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => setCategory(item.code)}
                    style={[styles.chip, selected && styles.chipSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}>
                    <ChipIcon
                      size={14}
                      color={selected ? colors.white : visual.iconColor}
                      strokeWidth={2.3}
                    />
                    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                      {visual.shortLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primaryDark} style={styles.loader} />
          ) : error ? (
            <View>
              <EmptyState title={t('serviceContacts.loadError')} description={error} />
              <Button label={t('serviceContacts.retry')} onPress={() => void load(0, true)} />
            </View>
          ) : (
            <EmptyState
              title={
                debounced || category
                  ? t('serviceContacts.noResultsTitle')
                  : t('serviceContacts.emptyTitle')
              }
              description={
                debounced || category
                  ? t('serviceContacts.noResultsDescription')
                  : t('serviceContacts.emptyDescription')
              }
            />
          )
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primaryDark} /> : null}
        renderItem={({ item }) => (
          <ServiceProviderCard
            contact={item}
            onOpen={() => navigation.navigate('ServiceContactDetails', { contactId: item.id })}
            onCall={() => void callContact(item)}
            onWhatsApp={() => void whatsappContact(item)}
            onPhonePress={() => {
              const numbers = serviceContactNumbers(item);
              if (numbers.length === 0) {
                missingNumber();
                return;
              }
              openSheet(item, numbers[0]);
            }}
          />
        )}
      />

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setFilterOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
            onPress={event => event.stopPropagation()}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('serviceContacts.filter', { defaultValue: 'Filter' })}</Text>
              <Pressable onPress={() => setFilterOpen(false)} hitSlop={8} accessibilityRole="button">
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.sheetBody} bounces={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetLabel}>{t('serviceContacts.category')}</Text>
              <View style={styles.wrapChips}>
                <FilterChoice
                  label={t('serviceContacts.categoryAll')}
                  selected={draftCategory === ''}
                  onPress={() => setDraftCategory('')}
                />
                {categories.map(item => (
                  <FilterChoice
                    key={item.code}
                    label={item.label}
                    selected={draftCategory === item.code}
                    onPress={() => setDraftCategory(item.code)}
                  />
                ))}
              </View>
              <Text style={styles.sheetLabel}>{t('serviceContacts.sort', { defaultValue: 'Sort' })}</Text>
              <View style={styles.wrapChips}>
                {(
                  [
                    ['updated', t('serviceContacts.sortUpdated')],
                    ['name', t('serviceContacts.sortName')],
                    ['category', t('serviceContacts.sortCategory')],
                  ] as const
                ).map(([id, label]) => (
                  <FilterChoice
                    key={id}
                    label={label}
                    selected={draftSort === id}
                    onPress={() => setDraftSort(id)}
                  />
                ))}
              </View>
            </ScrollView>
            <View style={styles.sheetActions}>
              <Button
                label={t('serviceContacts.clear', { defaultValue: 'Clear' })}
                variant="secondary"
                onPress={() => {
                  setDraftCategory('');
                  setDraftSort('updated');
                  setCategory('');
                  setSort('updated');
                  setFilterOpen(false);
                }}
                style={styles.sheetButton}
              />
              <Button
                label={t('serviceContacts.apply', { defaultValue: 'Apply' })}
                onPress={() => {
                  setCategory(draftCategory);
                  setSort(draftSort);
                  setFilterOpen(false);
                }}
                style={styles.sheetButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function CategoryChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function FilterChoice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: spacing.md, marginBottom: spacing.md },
  navTitle: { maxWidth: 240 },
  navHeading: {
    ...typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  navSubtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGreen,
    marginRight: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchWrap: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
    minHeight: 44,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chips: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chipLabelSelected: {
    color: colors.white,
  },
  loader: { marginTop: spacing.xl },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '80%',
    ...shadows.raised,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetBody: {
    flexGrow: 0,
  },
  sheetTitle: {
    ...typography.h3,
    flex: 1,
  },
  sheetLabel: {
    ...typography.bodyStrong,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  wrapChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choice: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  choiceLabelSelected: {
    color: colors.white,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  sheetButton: { flex: 1 },
});
