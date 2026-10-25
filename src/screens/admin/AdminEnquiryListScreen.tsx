import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { adminEnquiryApi } from '../../api/enquiryApi';
import type { AdminSpaceEnquiryListItem } from '../../api/types';
import { AdminLeadCard } from '../../components/admin';
import type { AdminStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminEnquiryList'>;

const PAGE_SIZE = 20;

export function AdminEnquiryListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [rows, setRows] = useState<AdminSpaceEnquiryListItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        setPage(0);
        try {
          const result = await adminEnquiryApi.list({ page: 0, size: PAGE_SIZE });
          if (!cancelled) {
            setRows(result.content);
            setHasMore(!result.last && result.content.length > 0);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      void load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  async function loadMore() {
    if (loading || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await adminEnquiryApi.list({ page: nextPage, size: PAGE_SIZE });
      setRows(prev => [...prev, ...result.content]);
      setPage(nextPage);
      setHasMore(!result.last && result.content.length > 0);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }

  return (
    <View style={styles.root}>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => item.enquiryId}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            void loadMore();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null
          }
          ListEmptyComponent={<Text style={styles.empty}>{t('admin.enquiries.empty')}</Text>}
          renderItem={({ item }) => (
            <AdminLeadCard
              title={item.spaceName}
              subtitle={`${item.requesterName} · ${
                item.requesterType === 'OWNER'
                  ? t('admin.labels.owner')
                  : t('admin.labels.member')
              }`}
              meta={`${new Date(item.requestedAt).toLocaleDateString(undefined, {
                day: '2-digit',
                month: 'short',
              })} · ${t(`admin.enquiries.status.${item.status}`)}`}
              actionLabel={
                item.status === 'PENDING'
                  ? t('admin.enquiries.review', { defaultValue: 'Review' })
                  : t('admin.enquiries.view', { defaultValue: 'View' })
              }
              onPress={() =>
                navigation.navigate('AdminEnquiryDetail', { id: item.enquiryId })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  footer: { marginVertical: spacing.md },
  empty: {
    textAlign: 'center',
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
});
