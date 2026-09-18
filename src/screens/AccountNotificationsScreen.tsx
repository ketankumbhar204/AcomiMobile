import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { enquiryApi } from '../api/enquiryApi';
import type { UserNotification } from '../api/types';
import { EmptyState } from '../components/ui';
import type { MainStackParamList } from '../navigation/types';
import { refreshAccountEnquiryUnread } from '../store/accountEnquiryUnreadStore';
import { colors, spacing, typography } from '../theme';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Nav = NativeStackNavigationProp<MainStackParamList, 'AccountNotifications'>;

export function AccountNotificationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [rows, setRows] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        try {
          const page = await enquiryApi.listNotifications({ size: 50 });
          if (!cancelled) setRows(page.notifications);
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

  async function openItem(item: UserNotification) {
    if (!item.read) {
      try {
        await enquiryApi.markNotificationRead(item.notificationId);
        setRows(current =>
          current.map(row =>
            row.notificationId === item.notificationId ? { ...row, read: true } : row,
          ),
        );
      } catch {
        // Navigation still proceeds.
      }
    }
    const enquiryId = item.enquiryId && UUID_RE.test(item.enquiryId) ? item.enquiryId : undefined;
    void refreshAccountEnquiryUnread();
    navigation.navigate('MemberTabs', {
      screen: 'Enquiries',
      params: enquiryId ? { enquiryId } : undefined,
    });
  }

  return (
    <View style={styles.root}>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => item.notificationId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title={t('notifications.title')}
              description={t('spaces.enquiries.notificationsEmpty', {
                defaultValue: 'No enquiry notifications yet.',
              })}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, !item.read && styles.unread]}
              onPress={() => void openItem(item)}>
              <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
              {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
              <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
            </Pressable>
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
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    gap: 4,
  },
  unread: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  titleUnread: { fontWeight: '800' },
  message: { ...typography.caption, color: colors.textSecondary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
});
