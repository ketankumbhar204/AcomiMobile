import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { formatSpaceType, spaceTypeIconLabel } from '../api';
import type { MembershipRole, MySpaceResponse } from '../api/types';
import {
  Badge,
  EmptyState,
  FAB,
  FormInput,
  ListCard,
  ProfileHeaderButton,
  SkeletonCard,
} from '../components/ui';
import { resetToDashboard } from '../navigation/navigationRef';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { colors, spacing, typography } from '../theme';

type MySpacesNavigation = NativeStackNavigationProp<
  MainStackParamList,
  'MySpaces'
>;

const SEARCH_DEBOUNCE_MS = 300;

function formatRoleLabel(
  role: MembershipRole,
  t: (key: string) => string,
): string {
  return t(`spaces.roles.${role}`);
}

export function MySpacesScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<MySpacesNavigation>();
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const loading = useSpaceStore(state => state.loading);
  const searching = useSpaceStore(state => state.searching);
  const error = useSpaceStore(state => state.error);
  const loadMySpaces = useSpaceStore(state => state.loadMySpaces);
  const searchSpaces = useSpaceStore(state => state.searchSpaces);
  const searchQuery = useSpaceStore(state => state.searchQuery);
  const setSearchQuery = useSpaceStore(state => state.setSearchQuery);
  const switchSpace = useSpaceStore(state => state.switchSpace);
  const refresh = useSpaceStore(state => state.refresh);

  const [search, setSearch] = useState(searchQuery);
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.mySpaces'),
      headerRight: () => <ProfileHeaderButton />,
    });
  }, [navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      console.log('[MySpaces] screen focused');
      if (searchQuery.trim()) {
        searchSpaces(searchQuery);
      } else {
        loadMySpaces();
      }
    }, [loadMySpaces, searchQuery, searchSpaces]),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
      searchSpaces(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search, searchSpaces, setSearchQuery]);

  const onRefresh = useCallback(async () => {
    console.log('[MySpaces] pull to refresh');
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const openSpace = async (space: MySpaceResponse) => {
    console.log('[MySpaces] open space → dashboard', space.spaceId);
    const success = await switchSpace(space.spaceId);
    if (success) {
      resetToDashboard(space.spaceId);
    }
  };

  const buildSubtitle = (space: MySpaceResponse) => {
    const typeLabel = formatSpaceType(space.spaceType);
    const roleLabel = formatRoleLabel(space.membershipRole, t);
    return `${typeLabel} · ${roleLabel}`;
  };

  const isSearching = search.trim().length > 0;
  const showLoading = (loading || searching) && mySpaces.length === 0;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        <View style={styles.heroAccent} />
        <Text style={styles.eyebrow}>{t('spaces.mySpaces.eyebrow')}</Text>
        <Text style={styles.heading}>{t('spaces.mySpaces.heading')}</Text>
        <Text style={styles.subheading}>{t('spaces.mySpaces.subheading')}</Text>

        <FormInput
          label={t('spaces.mySpaces.searchLabel')}
          placeholder={t('spaces.mySpaces.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {showLoading ? (
          <>
            <SkeletonCard />
            <View style={styles.skeletonGap} />
            <SkeletonCard />
          </>
        ) : mySpaces.length === 0 ? (
          <EmptyState
            title={
              isSearching
                ? t('spaces.mySpaces.searchEmptyTitle')
                : t('spaces.mySpaces.emptyTitle')
            }
            description={
              isSearching
                ? t('spaces.mySpaces.searchEmptyDescription')
                : t('spaces.mySpaces.emptyDescription')
            }
            icon="🏠"
          />
        ) : (
          <View style={styles.list}>
            {mySpaces.map(space => (
              <View key={space.spaceId} style={styles.listItem}>
                {space.isDefault ? (
                  <View style={styles.defaultBadge}>
                    <Badge label={t('spaces.mySpaces.defaultBadge')} />
                  </View>
                ) : null}
                <ListCard
                  title={space.spaceName}
                  subtitle={buildSubtitle(space)}
                  iconLabel={spaceTypeIconLabel(space.spaceType)}
                  onPress={() => openSpace(space)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <FAB
        onPress={() => navigation.navigate('CreateSpace')}
        accessibilityLabel={t('spaces.mySpaces.createFab')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xxl,
    paddingBottom: 96,
  },
  heroAccent: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${colors.primary}1A`,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.sm,
  },
  heading: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subheading: {
    ...typography.body,
    marginBottom: spacing.xxl,
  },
  errorText: {
    ...typography.body,
    color: colors.primaryDark,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  listItem: {
    gap: spacing.xs,
  },
  defaultBadge: {
    marginBottom: spacing.xs,
  },
  skeletonGap: {
    height: spacing.md,
  },
});
