import React, { useCallback, useState } from 'react';
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

export function AdminEnquiryListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [rows, setRows] = useState<AdminSpaceEnquiryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        try {
          const page = await adminEnquiryApi.list({ size: 50 });
          if (!cancelled) setRows(page.content);
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

  return (
    <View style={styles.root}>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => item.enquiryId}
          contentContainerStyle={styles.list}
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
  empty: {
    textAlign: 'center',
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
});
