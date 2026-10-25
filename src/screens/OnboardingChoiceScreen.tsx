import React, { useCallback, useLayoutEffect } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import { useSpaceStore } from '../store/spaceStore';
import { colors, spacing } from '../theme';
import { setAccountIntent } from '../utils/accountIntent';
import { resolveRoleOnboardingAccess } from '../utils/roleOnboardingAccess';

const heroBuilding = require('../assets/onboarding/hero-building.png');

type Nav = NativeStackNavigationProp<MainStackParamList, 'OnboardingChoice'>;

export function OnboardingChoiceScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const selectedSpaceId = useSpaceStore(state => state.selectedSpaceId);
  const hasSpaceBootstrapped = useSpaceStore(state => state.hasSpaceBootstrapped);
  const access = resolveRoleOnboardingAccess(
    mySpaces.map(space => space.spaceId),
    selectedSpaceId,
  );
  const redirectSpaceId = access.status === 'space' ? access.spaceId : null;
  const redirectToPicker = access.status === 'picker';
  const showChoice = hasSpaceBootstrapped && access.status === 'allowed';

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

  useFocusEffect(
    useCallback(() => {
      if (!hasSpaceBootstrapped || showChoice) {
        return undefined;
      }

      const leave = () => {
        if (redirectSpaceId) {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'SpaceTabs',
                params: {
                  spaceId: redirectSpaceId,
                  screen: 'Dashboard',
                  params: { spaceId: redirectSpaceId },
                },
              },
            ],
          });
          return;
        }
        if (redirectToPicker) {
          navigation.reset({ index: 0, routes: [{ name: 'MySpaces' }] });
        }
      };

      leave();
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        leave();
        return true;
      });
      return () => subscription.remove();
    }, [
      hasSpaceBootstrapped,
      navigation,
      redirectSpaceId,
      redirectToPicker,
      showChoice,
    ]),
  );

  if (!showChoice) {
    return (
      <Screen>
        <View style={styles.pending}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

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
        onPress={() => {
          void setAccountIntent('owner');
          navigation.navigate('CreateSpace');
        }}
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
        onPress={() => {
          void setAccountIntent('member');
          navigation.replace('MemberTabs', { screen: 'Home' });
        }}
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
  pending: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
