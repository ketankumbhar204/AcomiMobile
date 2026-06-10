import React, { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { formatSpaceType, spaceTypeIconLabel } from '../api';
import type { Space } from '../api/types';
import { EmptyState, FAB, ListCard, Screen, SkeletonCard } from '../components/ui';
import { useMySpaces } from '../hooks/useMySpaces';
import { useAuthenticatedUser } from '../hooks/useAuth';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { colors, spacing, typography } from '../theme';

type MySpacesNavigation = NativeStackNavigationProp<
  MainStackParamList,
  'MySpaces'
>;

export function MySpacesScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<MySpacesNavigation>();
  const setSelectedSpace = useSpaceStore(state => state.setSelectedSpace);
  const user = useAuthenticatedUser();
  const { spaces, isLoading, error, refetch } = useMySpaces();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.mySpaces'),
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={({ pressed }) => [
            styles.profileButton,
            pressed && styles.profileButtonPressed,
          ]}
          hitSlop={8}
          accessibilityLabel={t('spaces.mySpaces.openProfile')}>
          <Text style={styles.profileButtonText}>
            {(user?.fullName ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, t, i18n.language, user?.fullName]);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const openSpace = (space: Space) => {
    setSelectedSpace(space);
    navigation.navigate('SpaceTabs', { spaceId: space.id });
  };

  return (
    <View style={styles.root}>
      <Screen contentStyle={styles.content}>
        <View style={styles.heroAccent} />
        <Text style={styles.eyebrow}>{t('spaces.mySpaces.eyebrow')}</Text>
        <Text style={styles.heading}>{t('spaces.mySpaces.heading')}</Text>
        <Text style={styles.subheading}>{t('spaces.mySpaces.subheading')}</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {isLoading ? (
          <>
            <SkeletonCard />
            <View style={styles.skeletonGap} />
            <SkeletonCard />
          </>
        ) : spaces.length === 0 ? (
          <EmptyState
            title={t('spaces.mySpaces.emptyTitle')}
            description={t('spaces.mySpaces.emptyDescription')}
            icon="🏠"
          />
        ) : (
          <View style={styles.list}>
            {spaces.map(space => (
              <ListCard
                key={space.id}
                title={space.name}
                subtitle={formatSpaceType(space.type)}
                iconLabel={spaceTypeIconLabel(space.type)}
                onPress={() => openSpace(space)}
              />
            ))}
          </View>
        )}
      </Screen>

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
  content: {
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
  skeletonGap: {
    height: spacing.md,
  },
  profileButton: {
    marginRight: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonPressed: {
    backgroundColor: colors.surface,
  },
  profileButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
    includeFontPadding: false,
  },
});
