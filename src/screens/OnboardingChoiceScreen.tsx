import React, { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ModuleActionCard } from '../components/ui';
import { ProfileHeaderButton } from '../components/ui/ProfileHeaderButton';
import { Screen } from '../components/ui/Screen';
import type { MainStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'OnboardingChoice'>;

export function OnboardingChoiceScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('onboarding.choice.title'),
      headerBackVisible: false,
      headerRight: () => <ProfileHeaderButton />,
    });
  }, [navigation, t, i18n.language]);

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.eyebrow}>{t('onboarding.choice.eyebrow')}</Text>
      <Text style={styles.heading}>{t('onboarding.choice.heading')}</Text>
      <Text style={styles.subheading}>{t('onboarding.choice.subheading')}</Text>

      <View style={styles.cards}>
        <ModuleActionCard
          icon="🏢"
          title={t('onboarding.choice.manageTitle')}
          subtitle={t('onboarding.choice.manageSubtitle')}
          onPress={() => navigation.navigate('CreateSpace')}
        />
        <ModuleActionCard
          icon="👤"
          title={t('onboarding.choice.memberTitle')}
          subtitle={t('onboarding.choice.memberSubtitle')}
          onPress={() => navigation.navigate('JoinSpace')}
        />
      </View>
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
    marginBottom: spacing.sm,
  },
  subheading: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.xxl,
  },
  cards: {
    gap: spacing.md,
  },
});
