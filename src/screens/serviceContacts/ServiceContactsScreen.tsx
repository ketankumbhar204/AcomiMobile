import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Plus, UserRound } from 'lucide-react-native';
import {
  serviceContactsApi,
  type ServiceContact,
  type ServiceContactCategoryOption,
  type ServiceContactSort,
} from '../../api/serviceContactsApi';
import { ApiError } from '../../api/types';
import { Button, EmptyState, ListFilterChips, ListSearchBar } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, radius, spacing, typography } from '../../theme';
import { canManageServiceContacts } from '../../utils/serviceContactAccess';
import { displayPhone, mailtoHref, telHref, whatsappHref } from '../../utils/serviceContactLinks';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ServiceContacts'>;

export function ServiceContactsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const userId = useAuthStore(state => state.userId);
  const spaces = useSpaceStore(state => state.mySpaces);
  const canManage = canManageServiceContacts(spaces);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [sort, setSort] = useState<ServiceContactSort>('updated');
  const [categories, setCategories] = useState<ServiceContactCategoryOption[]>([]);
  const [items, setItems] = useState<ServiceContact[]>([]);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(true);
  const [total, setTotal] = useState(0);
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
            spaceId: spaceId || undefined,
            sort,
            page: nextPage,
            size: 20,
          }),
        ]);
        setCategories(categoryRows);
        setItems(current => (replace ? result.content : [...current, ...result.content]));
        setPage(result.page);
        setLast(result.last);
        setTotal(result.totalElements);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('serviceContacts.loadError'));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [category, debounced, sort, spaceId, t, userId],
  );

  useFocusEffect(
    useCallback(() => {
      void load(0, true);
    }, [load]),
  );

  const categoryChips = useMemo(
    () => [
      { id: '', label: t('serviceContacts.categoryAll') },
      ...categories.map(item => ({ id: item.code, label: item.label })),
    ],
    [categories, t],
  );
  const spaceChips = useMemo(
    () => [
      { id: '', label: t('serviceContacts.spaceAll') },
      ...spaces
        .filter(space => ['OWNER', 'MANAGER', 'STAFF'].includes(space.membershipRole))
        .map(space => ({ id: space.spaceId, label: space.spaceName })),
    ],
    [spaces, t],
  );

  async function openUrl(url: string | null) {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        return;
      }
      await Linking.openURL(url);
    } catch {
      setError(t('serviceContacts.openFailed'));
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
        }}
        onEndReached={() => {
          if (!loading && !loadingMore && !last && !error) {
            void load(page + 1, false);
          }
        }}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.subtitle}>{t('serviceContacts.subtitle')}</Text>
            <ListSearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={t('serviceContacts.searchPlaceholder')}
            />
            <ListFilterChips options={categoryChips} value={category} onChange={setCategory} />
            {spaceChips.length > 1 ? (
              <ListFilterChips options={spaceChips} value={spaceId} onChange={setSpaceId} />
            ) : null}
            <ListFilterChips
              options={[
                { id: 'updated', label: t('serviceContacts.sortUpdated') },
                { id: 'name', label: t('serviceContacts.sortName') },
                { id: 'category', label: t('serviceContacts.sortCategory') },
              ]}
              value={sort}
              onChange={value => setSort(value as ServiceContactSort)}
            />
            <Text style={styles.count}>{t('serviceContacts.count', { count: total })}</Text>
            {canManage ? (
              <Button
                label={t('serviceContacts.add')}
                icon={Plus}
                onPress={() => navigation.navigate('ServiceContactForm', {})}
              />
            ) : null}
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
              title={debounced || category || spaceId ? t('serviceContacts.noResultsTitle') : t('serviceContacts.emptyTitle')}
              description={
                debounced || category || spaceId
                  ? t('serviceContacts.noResultsDescription')
                  : t('serviceContacts.emptyDescription')
              }
            />
          )
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primaryDark} /> : null}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('ServiceContactDetails', { contactId: item.id })}
            style={styles.card}>
            <Text style={styles.name}>{item.businessName}</Text>
            <Text style={styles.meta}>{item.categoryLabel}</Text>
            {item.contactPersonName ? (
              <View style={styles.row}>
                <UserRound size={15} color={colors.primaryDark} />
                <Text style={styles.rowText}>{item.contactPersonName}</Text>
              </View>
            ) : null}
            {displayPhone(item.primaryPhone) ? (
              <View style={styles.row}>
                <Phone size={15} color={colors.primaryDark} />
                <Text style={styles.rowText}>{displayPhone(item.primaryPhone)}</Text>
              </View>
            ) : null}
            {item.email ? (
              <View style={styles.row}>
                <Mail size={15} color={colors.primaryDark} />
                <Text style={styles.rowText}>{item.email}</Text>
              </View>
            ) : null}
            {item.spaces.length > 0 ? (
              <Text style={styles.meta}>{item.spaces.map(space => space.name).join(', ')}</Text>
            ) : null}
            <View style={styles.actions}>
              {telHref(item.primaryPhone) ? (
                <Button
                  label={t('serviceContacts.call')}
                  variant="secondary"
                  onPress={() => void openUrl(telHref(item.primaryPhone))}
                />
              ) : null}
              {whatsappHref(item.whatsappPhone || item.primaryPhone) ? (
                <Button
                  label={t('serviceContacts.whatsapp')}
                  variant="secondary"
                  onPress={() => void openUrl(whatsappHref(item.whatsappPhone || item.primaryPhone))}
                />
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { gap: spacing.md, marginBottom: spacing.md },
  subtitle: { ...typography.body, color: colors.textSecondary },
  count: { ...typography.caption, color: colors.textSecondary },
  loader: { marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  name: { ...typography.h3, color: colors.textPrimary },
  meta: { ...typography.body, color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
});
