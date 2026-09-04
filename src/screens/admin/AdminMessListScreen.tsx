import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { adminApi } from '../../api/adminApi';
import type { MessRegistrationListItem, RegistrationSource } from '../../api/types';
import { AdminLeadCard, adminList } from '../../components/admin';
import { useConfirmDialog } from '../../components/ui';
import type { AdminStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { formatRegistrationSource } from '../../utils/adminLabels';
import { colors, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminMessList'>;
type Route = NativeStackScreenProps<AdminStackParamList, 'AdminMessList'>['route'];

function filterLabel(
  t: TFunction,
  tab: 'leads' | 'active',
  source?: RegistrationSource,
): string | null {
  if (tab === 'active') return t('admin.filters.activeSpaces');
  if (source === 'PUBLIC_WEBSITE') return t('admin.filters.websiteRegistrations');
  if (source === 'ADMIN') return t('admin.filters.addedByAdmin');
  return null;
}

export function AdminMessListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { showConfirm } = useConfirmDialog();
  const showToast = useToastStore(state => state.showToast);
  const initialTab = route.params?.tab ?? 'leads';
  const sourceFilter = route.params?.source;

  const [items, setItems] = useState<MessRegistrationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'leads' | 'active'>(initialTab);

  useFocusEffect(
    useCallback(() => {
      setTab(route.params?.tab ?? 'leads');
    }, [route.params?.tab]),
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const activeTab = route.params?.tab ?? 'leads';
      const source = route.params?.source;
      async function load() {
        setLoading(true);
        try {
          if (activeTab === 'leads') {
            const page = await adminApi.listMessRegistrations({
              leadsOnly: source ? undefined : true,
              source,
              size: 50,
            });
            if (!cancelled) setItems(page.content);
          } else {
            const spaces = await adminApi.listActiveSpaces('MESS');
            if (!cancelled) {
              setItems(
                spaces.map(s => ({
                  id: s.id,
                  reference: s.id,
                  messName: s.name,
                  ownerName: s.ownerName,
                  mobileNumber: s.ownerMobile,
                  city: '',
                  state: '',
                  pincode: '',
                  status: 'CONVERTED',
                  source: 'ADMIN',
                  testLead: false,
                  createdAt: s.createdAt,
                })),
              );
            }
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      void load();
      return () => {
        cancelled = true;
      };
    }, [route.params?.source, route.params?.tab]),
  );

  const activeFilterLabel = filterLabel(t, tab, sourceFilter);

  function handleDelete(item: MessRegistrationListItem) {
    showConfirm({
      title: t('admin.mess.deleteTitle'),
      message: t('admin.mess.deleteMessage', { name: item.messName }),
      confirmLabel: t('admin.common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        try {
          await adminApi.deleteMessRegistration(item.id);
          setItems(prev => prev.filter(row => row.id !== item.id));
          showToast(t('admin.mess.deleted'));
        } catch {
          showToast(t('admin.mess.deleteFailed'));
        }
      },
    });
  }

  return (
    <View style={styles.root}>
      <View style={adminList.tabs}>
        {(['leads', 'active'] as const).map(key => (
          <Pressable
            key={key}
            style={[adminList.tab, tab === key && adminList.tabActive]}
            onPress={() => {
              setTab(key);
              navigation.setParams({ tab: key, source: key === 'active' ? undefined : sourceFilter });
            }}>
            <Text style={[adminList.tabText, tab === key && adminList.tabTextActive]}>
              {key === 'leads' ? t('admin.filters.leads') : t('admin.filters.active')}
            </Text>
          </Pressable>
        ))}
        <Pressable style={adminList.addBtn} onPress={() => navigation.navigate('AdminAddMess')}>
          <Text style={adminList.addBtnText}>{t('admin.filters.add')}</Text>
        </Pressable>
      </View>
      {activeFilterLabel && tab === 'leads' ? (
        <Text style={adminList.filterBadge}>{activeFilterLabel}</Text>
      ) : null}
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AdminLeadCard
              title={item.messName}
              subtitle={`${item.ownerName} · ${item.mobileNumber}`}
              meta={`${item.city || t('admin.labels.emDash')} · ${item.pincode || t('admin.labels.emDash')}`}
              sourceLabel={tab === 'leads' ? formatRegistrationSource(item.source) : undefined}
              testLead={tab === 'leads' ? item.testLead : undefined}
              showDelete={tab === 'leads'}
              onPress={
                tab === 'leads'
                  ? () => navigation.navigate('AdminMessDetail', { id: item.id })
                  : undefined
              }
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t('admin.list.empty')}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  empty: {
    textAlign: 'center',
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
});
