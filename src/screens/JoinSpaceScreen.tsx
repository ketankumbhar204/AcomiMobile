import React, { useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Building2, MailPlus, UsersRound } from 'lucide-react-native';
import { AuthHero } from '../components/auth';
import { DashboardActionRow } from '../components/dashboard/shared/DashboardActionRow';
import { EmptyState } from '../components/ui';
import { ProfileHeaderButton } from '../components/ui/ProfileHeaderButton';
import { Screen } from '../components/ui/Screen';
import { StickyFormActions } from '../components/progressive';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { colors, shadows, spacing } from '../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'JoinSpace'>;

export function JoinSpaceScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const refreshStartupNavigation = useSpaceStore(state => state.refreshStartupNavigation);
  const [refreshing, setRefreshing] = useState(false);

  const headerRight = useCallback(() => <ProfileHeaderButton />, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('onboarding.join.title'),
      headerLeft: undefined,
      headerBackVisible: navigation.canGoBack(),
      headerRight,
    });
  }, [headerRight, navigation, t, i18n.language]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshStartupNavigation();
    } finally {
      setRefreshing(false);
    }
  }, [refreshStartupNavigation]);

  return (
    <View style={styles.flex}>
      <Screen scrollable contentStyle={styles.content}>
        <AuthHero
          icon={UsersRound}
          eyebrow={t('onboarding.join.eyebrow')}
          heading={t('onboarding.join.heading')}
          subheading={t('onboarding.join.body')}
          accent="#1D4ED8"
          soft="#EFF6FF"
          border="#BFDBFE"
        />

        <View style={styles.infoCard}>
          <EmptyState
            Icon={MailPlus}
            title={t('onboarding.join.emptyTitle')}
            description={t('onboarding.join.emptyDescription')}
          />
        </View>

        <DashboardActionRow
          icon={Building2}
          title={t('onboarding.join.manageInstead')}
          subtitle={t('onboarding.choice.manageSubtitle')}
          onPress={() => navigation.navigate('OnboardingChoice')}
          disabled={refreshing}
        />
      </Screen>

      <StickyFormActions
        primary={{
          label: refreshing ? t('onboarding.join.refreshing') : t('onboarding.join.refresh'),
          onPress: () => void handleRefresh(),
          loading: refreshing,
          disabled: refreshing,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.section,
    gap: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
});
