import React, { useCallback, useLayoutEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { GlobalAttentionItem, GlobalAttentionSpace } from '../../api/types';
import { GlobalAttentionSpaceCard } from '../../components/spaces/GlobalAttentionSpaceCard';
import { EmptyState, HeaderBackButton, SkeletonCard } from '../../components/ui';
import { useGlobalDashboard } from '../../hooks/useGlobalDashboard';
import type { MainStackParamList } from '../../navigation/types';
import { openSpaceToPendingActions } from '../../navigation/navigationRef';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, spacing } from '../../theme';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';
import { navigateFromNotificationType } from '../../utils/notificationDeepLinks';
import { canManageNotifications } from '../../utils/spaceOperator';
import { findMySpaceEntry, resolveSpacePermissions } from '../../utils/spacePermissions';

type Nav = NativeStackNavigationProp<MainStackParamList, 'GlobalAttentionList'>;

export function GlobalAttentionListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const switchSpace = useSpaceStore(state => state.switchSpace);
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const { data, loading } = useGlobalDashboard(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('spaces.globalDashboard.attentionListTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t]);

  const switchIntoSpace = useCallback(
    async (spaceId: string) => {
      const success = await switchSpace(spaceId);
      if (success) {
        invalidateAccommodationQueries();
      }
      return success;
    },
    [switchSpace],
  );

  const onPressHeader = useCallback(
    async (space: GlobalAttentionSpace) => {
      const success = await switchIntoSpace(space.spaceId);
      if (success) {
        openSpaceToPendingActions(space.spaceId);
      }
    },
    [switchIntoSpace],
  );

  const onPressItem = useCallback(
    async (space: GlobalAttentionSpace, item: GlobalAttentionItem) => {
      const success = await switchIntoSpace(space.spaceId);
      if (!success) {
        return;
      }

      const entry = findMySpaceEntry(mySpaces, space.spaceId);
      const permissions = resolveSpacePermissions(entry);
      const isOperator = canManageNotifications(permissions);

      navigateFromNotificationType(
        space.spaceId,
        {
          notificationType: item.actionType,
          entityId: item.sampleEntityId,
          actionRoute: item.actionRoute,
          message: item.message,
          title: item.title,
        },
        isOperator,
      );
    },
    [mySpaces, switchIntoSpace],
  );

  const spaces = data?.attentionRequired ?? [];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {loading && spaces.length === 0 ? <SkeletonCard /> : null}
      {!loading && spaces.length === 0 ? (
        <EmptyState
          title={t('spaces.globalDashboard.attentionEmptyTitle')}
          description={t('spaces.globalDashboard.attentionEmptyBody')}
        />
      ) : (
        spaces.map(space => (
          <GlobalAttentionSpaceCard
            key={space.spaceId}
            space={space}
            onPressHeader={() => void onPressHeader(space)}
            onPressItem={item => void onPressItem(space, item)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
});
