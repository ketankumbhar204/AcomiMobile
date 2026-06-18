import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui';
import { ProfileHeaderButton } from '../components/ui/ProfileHeaderButton';
import { Screen } from '../components/ui/Screen';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { colors, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'JoinSpace'>;

export function JoinSpaceScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const refreshStartupNavigation = useSpaceStore(state => state.refreshStartupNavigation);
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('onboarding.join.title'),
      headerLeft: undefined,
      headerBackVisible: navigation.canGoBack(),
      headerRight: () => <ProfileHeaderButton />,
    });
  }, [navigation, t, i18n.language]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshStartupNavigation();
    } finally {
      setRefreshing(false);
    }
  }, [refreshStartupNavigation]);

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.eyebrow}>{t('onboarding.join.eyebrow')}</Text>
      <Text style={styles.heading}>{t('onboarding.join.heading')}</Text>
      <Text style={styles.body}>{t('onboarding.join.body')}</Text>

      <Button
        label={refreshing ? t('onboarding.join.refreshing') : t('onboarding.join.refresh')}
        onPress={() => void handleRefresh()}
        loading={refreshing}
        style={styles.refreshButton}
      />

      <Pressable
        style={styles.altLink}
        onPress={() => navigation.navigate('OnboardingChoice')}
        disabled={refreshing}>
        <Text style={styles.altLinkText}>{t('onboarding.join.manageInstead')}</Text>
      </Pressable>
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
    ...typography.h2,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  refreshButton: {
    marginBottom: spacing.lg,
  },
  altLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  altLinkText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
});
