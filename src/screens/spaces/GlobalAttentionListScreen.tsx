import React, { useCallback, useLayoutEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { GlobalAttentionSpace } from '../../api/types';
import { EmptyState, HeaderBackButton, SkeletonCard } from '../../components/ui';
import { useGlobalDashboard } from '../../hooks/useGlobalDashboard';
import type { MainStackParamList } from '../../navigation/types';
import { openSpaceToPendingActions } from '../../navigation/navigationRef';
import { useSpaceStore } from '../../store/spaceStore';
import { colors, radius, spacing, typography } from '../../theme';
import { invalidateAccommodationQueries } from '../../utils/accommodationQueryCache';

type Nav = NativeStackNavigationProp<MainStackParamList, 'GlobalAttentionList'>;

export function GlobalAttentionListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const switchSpace = useSpaceStore(state => state.switchSpace);
  const { data, loading, reload } = useGlobalDashboard(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('spaces.globalDashboard.attentionListTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t]);

  useFocusEffect(
    useCallback(() => {
      void reload(false);
    }, [reload]),
  );

  const onPressSpace = async (space: GlobalAttentionSpace) => {
    const success = await switchSpace(space.spaceId);
    if (success) {
      invalidateAccommodationQueries();
      openSpaceToPendingActions(space.spaceId);
    }
  };

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
          <Pressable
            key={space.spaceId}
            onPress={() => onPressSpace(space)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <Text style={styles.spaceName}>{space.spaceName}</Text>
            <Text style={styles.count}>
              {t('spaces.globalDashboard.pendingActions', { count: space.count })}
            </Text>
            {space.items.map(item => (
              <Text key={`${space.spaceId}-${item.actionType}`} style={styles.item}>
                • {item.count > 1 ? `${item.count} ` : ''}
                {item.title}
              </Text>
            ))}
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
  spaceName: { ...typography.h3 },
  count: { ...typography.caption, color: '#C2410C', fontWeight: '600' },
  item: { ...typography.caption },
});
