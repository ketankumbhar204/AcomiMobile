import React, { useCallback, useLayoutEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Building2, Sparkles, UsersRound } from 'lucide-react-native';
import { AuthHero, OnboardingChoiceCard } from '../components/auth';
import { ProfileHeaderButton } from '../components/ui/ProfileHeaderButton';
import { Screen } from '../components/ui/Screen';
import type { MainStackParamList } from '../navigation/types';
import { spacing } from '../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'OnboardingChoice'>;

export function OnboardingChoiceScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();

  const headerRight = useCallback(() => <ProfileHeaderButton />, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('onboarding.choice.title'),
      headerBackVisible: false,
      headerRight,
    });
  }, [headerRight, navigation, t, i18n.language]);

  return (
    <Screen scrollable contentStyle={styles.content}>
      <AuthHero
        icon={Sparkles}
        eyebrow={t('onboarding.choice.eyebrow')}
        heading={t('onboarding.choice.heading')}
        subheading={t('onboarding.choice.subheading')}
      />

      <OnboardingChoiceCard
        icon={Building2}
        title={t('onboarding.choice.manageTitle')}
        description={t('onboarding.choice.manageSubtitle')}
        benefits={[
          t('onboarding.choice.manageBenefit1', {
            defaultValue: 'Set up your PG, hostel, or mess',
          }),
          t('onboarding.choice.manageBenefit2', {
            defaultValue: 'Invite members and staff',
          }),
          t('onboarding.choice.manageBenefit3', {
            defaultValue: 'Run meals, payments, and occupancy',
          }),
        ]}
        onPress={() => navigation.navigate('CreateSpace')}
      />

      <OnboardingChoiceCard
        icon={UsersRound}
        title={t('onboarding.choice.memberTitle')}
        description={t('onboarding.choice.memberSubtitle')}
        benefits={[
          t('onboarding.choice.joinBenefit1', {
            defaultValue: 'Accept a pending invitation',
          }),
          t('onboarding.choice.joinBenefit2', {
            defaultValue: 'Join as resident or customer',
          }),
          t('onboarding.choice.joinBenefit3', {
            defaultValue: 'Access meals and payments quickly',
          }),
        ]}
        accent="#1D4ED8"
        soft="#EFF6FF"
        onPress={() => navigation.navigate('JoinSpace')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.section,
    gap: spacing.md,
  },
});
