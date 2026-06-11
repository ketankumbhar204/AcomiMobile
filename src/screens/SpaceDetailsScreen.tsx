import React, { useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { formatSpaceType } from '../api';
import type { Space } from '../api/types';
import { Button, Card, HeaderBackButton, Screen, SkeletonCard } from '../components/ui';
import { useDeactivateSpace } from '../hooks/useDeactivateSpace';
import { useAuthenticatedUserId } from '../hooks/useAuth';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { colors, spacing, typography } from '../theme';
import { isSpaceOwner } from '../utils/spaceOwnership';

type SpaceDetailsNav = NativeStackNavigationProp<
  MainStackParamList,
  'SpaceDetails'
>;
type SpaceDetailsRoute = NativeStackScreenProps<
  MainStackParamList,
  'SpaceDetails'
>['route'];

function formatDate(value?: string): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function SpaceDetailsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<SpaceDetailsNav>();
  const route = useRoute<SpaceDetailsRoute>();
  const { spaceId } = route.params;
  const currentUserId = useAuthenticatedUserId();
  const { confirmDeactivate, isLoading } = useDeactivateSpace();

  const loadSpaceDetails = useSpaceStore(state => state.loadSpaceDetails);
  const storeSpace = useSpaceStore(state => state.selectedSpace);
  const error = useSpaceStore(state => state.error);

  const [space, setSpace] = useState<Space | null>(
    storeSpace?.id === spaceId ? storeSpace : null,
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.spaceDetails'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      console.log('[SpaceDetails] screen focused', { spaceId });

      let isActive = true;

      loadSpaceDetails(spaceId).then(loaded => {
        if (isActive && loaded) {
          setSpace(loaded);
        }
      });

      return () => {
        isActive = false;
      };
    }, [loadSpaceDetails, spaceId]),
  );

  const owner = isSpaceOwner(space, currentUserId);

  if (!space && !error) {
    return (
      <Screen contentStyle={styles.content}>
        <SkeletonCard />
        <View style={styles.skeletonGap} />
        <SkeletonCard />
      </Screen>
    );
  }

  if (!space) {
    return (
      <Screen contentStyle={styles.content}>
        <Text style={styles.errorText}>
          {error ?? t('spaces.errors.notFound')}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.eyebrow}>{t('spaces.details.eyebrow')}</Text>
      <Text style={styles.heading}>{space.name}</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Card style={styles.card}>
        <DetailRow label={t('spaces.details.name')} value={space.name} />
        <DetailRow
          label={t('spaces.details.type')}
          value={formatSpaceType(space.type)}
        />
        <DetailRow
          label={t('spaces.details.address')}
          value={space.address ?? t('spaces.details.notProvided')}
        />
        <DetailRow
          label={t('spaces.details.contact')}
          value={space.contactNumber ?? t('spaces.details.notProvided')}
        />
        <DetailRow
          label={t('spaces.details.createdAt')}
          value={formatDate(space.createdAt)}
        />
      </Card>

      {owner ? (
        <>
          <Button
            label={t('spaces.details.edit')}
            onPress={() => navigation.navigate('EditSpace', { spaceId })}
          />
          <Button
            label={t('spaces.details.deactivate')}
            variant="ghost"
            onPress={() => confirmDeactivate(spaceId, space.name)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.deactivateButton}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.section,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.sm,
  },
  heading: {
    ...typography.h1,
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  detailRow: {
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  detailValue: {
    ...typography.bodyStrong,
  },
  deactivateButton: {
    borderColor: '#FECACA',
    marginTop: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: '#DC2626',
    marginBottom: spacing.lg,
  },
  skeletonGap: {
    height: spacing.md,
  },
});
