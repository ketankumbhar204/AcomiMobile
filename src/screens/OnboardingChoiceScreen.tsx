import React, { useCallback, useLayoutEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Building2, Sparkles, UsersRound } from 'lucide-react-native';
import {
  AuthHero,
  OnboardingChoiceCard,
  OnboardingTrustBanner,
} from '../components/auth';
import { OnboardingBrandHeader } from '../components/ui/OnboardingBrandHeader';
import { ProfileHeaderButton } from '../components/ui/ProfileHeaderButton';
import { Screen } from '../components/ui/Screen';
import type { MainStackParamList } from '../navigation/types';
import { spacing } from '../theme';

const heroBuilding = require('../assets/onboarding/hero-building.png');

type Nav = NativeStackNavigationProp<MainStackParamList, 'OnboardingChoice'>;

export function OnboardingChoiceScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();

  const headerTitle = useCallback(() => <OnboardingBrandHeader />, []);
  const headerRight = useCallback(() => <ProfileHeaderButton />, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle,
      headerTitleAlign: 'left',
      headerBackVisible: false,
      headerLeft: () => null,
      headerRight,
    });
  }, [headerRight, headerTitle, navigation, t, i18n.language]);

  return (
    <Screen scrollable contentStyle={styles.content}>
      <AuthHero
        icon={Sparkles}
        eyebrow={t('onboarding.choice.eyebrow')}
        heading={t('onboarding.choice.headingLead')}
        headingHighlight={t('onboarding.choice.headingHighlight')}
        illustration={heroBuilding}
      />

      <OnboardingChoiceCard
        icon={Building2}
        title={t('onboarding.choice.manageTitle')}
        description={t('onboarding.choice.manageSubtitle')}
        benefits={[
          t('onboarding.choice.manageBenefit1'),
          t('onboarding.choice.manageBenefit2'),
          t('onboarding.choice.manageBenefit3'),
        ]}
        illustration="owner"
        onPress={() => navigation.navigate('CreateSpace')}
      />

      <OnboardingChoiceCard
        icon={UsersRound}
        title={t('onboarding.choice.memberTitle')}
        description={t('onboarding.choice.memberSubtitle')}
        benefits={[
          t('onboarding.choice.joinBenefit1'),
          t('onboarding.choice.joinBenefit2'),
          t('onboarding.choice.joinBenefit3'),
        ]}
        accent="#1D4ED8"
        soft="#EFF6FF"
        illustration="member"
        onPress={() => navigation.navigate('JoinSpace')}
      />

      <OnboardingTrustBanner
        title={t('onboarding.choice.trustTitle')}
        body={t('onboarding.choice.trustBody')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
});
