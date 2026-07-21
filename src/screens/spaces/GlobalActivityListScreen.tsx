import React, { useLayoutEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { GlobalActivityItem } from '../../api/types';
import { EmptyState, HeaderBackButton, SkeletonCard } from '../../components/ui';
import { useGlobalDashboard } from '../../hooks/useGlobalDashboard';
import type { MainStackParamList } from '../../navigation/types';
import { resetToDashboard } from '../../navigation/navigationRef';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComplaintDateTime } from '../../utils/complaintStatus';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';

type Nav = NativeStackNavigationProp<MainStackParamList, 'GlobalActivityList'>;

export function GlobalActivityListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const switchSpace = useSpaceStore(state => state.switchSpace);
  const { data, loading } = useGlobalDashboard(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('spaces.globalDashboard.activityListTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t]);

  const onPressItem = async (item: GlobalActivityItem) => {
    const success = await switchSpace(item.spaceId);
    if (success) {
      invalidateAccommodationQueries();
      resetToDashboard(item.spaceId);
    }
  };

  const items = data?.recentActivity ?? [];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {loading && items.length === 0 ? <SkeletonCard /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState
          title={t('spaces.globalDashboard.activityEmptyTitle')}
          description={t('spaces.globalDashboard.activityEmptyBody')}
        />
      ) : (
        items.map(item => (
          <Pressable
            key={item.notificationId}
            onPress={() => onPressItem(item)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.spaceName}
              {item.createdAt ? ` · ${formatComplaintDateTime(item.createdAt)}` : ''}
            </Text>
            {item.message ? (
              <Text style={styles.message} numberOfLines={2}>
                {item.message}
              </Text>
            ) : null}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  pressed: { opacity: 0.8 },
  title: { ...typography.body, fontWeight: '700' },
  meta: { ...typography.caption },
  message: { ...typography.caption, color: colors.textSecondary },
});
