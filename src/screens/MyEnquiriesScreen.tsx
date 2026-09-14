import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { enquiryApi } from '../api/enquiryApi';
import type { SpaceEnquiryResponse, SpaceEnquiryStatus } from '../api/types';
import { Card, EmptyState } from '../components/ui';
import type { MainStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'MyEnquiries'>;
type Route = NativeStackScreenProps<MainStackParamList, 'MyEnquiries'>['route'];

function hintKey(status: SpaceEnquiryStatus): string | null {
  if (status === 'SHARED') return 'spaces.enquiries.sharedHint';
  if (status === 'PENDING') return 'spaces.enquiries.pendingHint';
  if (status === 'REJECTED') return 'spaces.enquiries.rejectedHint';
  if (status === 'EXPIRED') return 'spaces.enquiries.expiredHint';
  return null;
}

export function MyEnquiriesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const highlightId = route.params?.enquiryId;
  const [rows, setRows] = useState<SpaceEnquiryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        try {
          const page = await enquiryApi.listMine({ size: 50 });
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

  const ordered = highlightId
    ? [...rows].sort((a, b) => Number(b.enquiryId === highlightId) - Number(a.enquiryId === highlightId))
    : rows;

  return (
    <View style={styles.root}>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={ordered}
          keyExtractor={item => item.enquiryId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title={t('spaces.enquiries.title')}
              description={t('spaces.enquiries.empty')}
            />
          }
          renderItem={({ item }) => {
            const hint = hintKey(item.status);
            const active = item.enquiryId === highlightId;
            return (
              <Card
                style={
                  active
                    ? { marginBottom: spacing.sm, borderColor: colors.primary }
                    : { marginBottom: spacing.sm }
                }>
                <Text style={styles.title}>{item.spaceName}</Text>
                <Text style={styles.meta}>
                  {t('spaces.enquiries.requestedOn', {
                    date: new Date(item.requestedAt).toLocaleDateString(),
                  })}
                </Text>
                <Text style={styles.status}>
                  {t(`spaces.enquiries.status.${item.status}`)}
                </Text>
                {hint ? <Text style={styles.hint}>{t(hint)}</Text> : null}
              </Card>
            );
          }}
          ListFooterComponent={
            <Text
              style={styles.findLink}
              onPress={() => navigation.navigate('FindAPlace')}>
              {t('navigation.findAPlace')}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  status: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  findLink: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
