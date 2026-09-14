import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import type { SpaceType, UUID } from '../../api/types';
import { useNavigateFromSpaceTab } from '../../hooks/useNavigateFromSpaceTab';
import type { SpaceTabParamList } from '../../navigation/types';
import {
  mapSetupNavigationTarget,
  type CapabilityAccess,
  type SetupNavigationTarget,
} from '../../spaceLifecycle';
import { spacing } from '../../theme';
import { todayIsoDate } from '../../utils/mealDates';
import { Button, EmptyState, Screen } from './index';

type TabNav = BottomTabNavigationProp<SpaceTabParamList>;

export type LockedCapabilityScreenProps = {
  title: string;
  description: string;
  ctaLabel?: string | null;
  unlockTarget?: SetupNavigationTarget | null;
  spaceId: UUID;
  spaceType?: SpaceType | null;
  showBackToDashboard?: boolean;
};

/**
 * Progressive access locked/soft full-tab state.
 * Reuses EmptyState + Button + Screen (same structure as PermissionDeniedScreen).
 */
export function LockedCapabilityScreen({
  title,
  description,
  ctaLabel,
  unlockTarget,
  spaceId,
  spaceType,
  showBackToDashboard = true,
}: LockedCapabilityScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<TabNav>();
  const navigateFromTab = useNavigateFromSpaceTab();

  const onUnlock = useCallback(() => {
    if (!unlockTarget) {
      return;
    }
    const dest = mapSetupNavigationTarget(unlockTarget, { spaceType });
    if (dest.kind === 'tab') {
      if (dest.tab === 'Dashboard') {
        navigation.navigate('Dashboard', { spaceId });
        return;
      }
      if (dest.tab === 'Accommodation') {
        navigation.navigate('Accommodation', { spaceId });
        return;
      }
      if (dest.tab === 'Members') {
        navigation.navigate('Members', { spaceId });
        return;
      }
      if (dest.tab === 'Meals') {
        navigation.navigate('Meals', { spaceId });
      }
      return;
    }

    switch (dest.screen) {
      case 'QuickSetupWizard':
        navigateFromTab('QuickSetupWizard', { spaceId });
        break;
      case 'BuildingForm':
        navigateFromTab('BuildingForm', { spaceId, mode: 'create' });
        break;
      case 'AddMember':
        navigateFromTab('AddMember', { spaceId });
        break;
      case 'AddCustomersHub':
        navigateFromTab('AddCustomersHub', { spaceId });
        break;
      case 'MenuLibrary':
        navigateFromTab('MenuLibrary', { spaceId });
        break;
      case 'MenuPlanning':
        navigation.navigate('Meals', { spaceId });
        break;
      case 'MenuSharePreview':
        navigateFromTab('MenuSharePreview', {
          spaceId,
          menuDate: todayIsoDate(),
        });
        break;
      case 'MealDeliveryLocations':
        navigateFromTab('MealDeliveryLocations', { spaceId });
        break;
      default:
        navigation.navigate('Dashboard', { spaceId });
        break;
    }
  }, [navigateFromTab, navigation, spaceId, spaceType, unlockTarget]);

  return (
    <Screen contentStyle={styles.content}>
      <EmptyState title={title} description={description} Icon={Lock} />
      <View style={styles.actions}>
        {ctaLabel && unlockTarget ? (
          <Button label={ctaLabel} onPress={onUnlock} />
        ) : null}
        {showBackToDashboard ? (
          <Button
            label={t('permissions.noAccess.backToDashboard')}
            variant="ghost"
            onPress={() => navigation.navigate('Dashboard', { spaceId })}
            style={ctaLabel && unlockTarget ? styles.secondary : undefined}
          />
        ) : null}
      </View>
    </Screen>
  );
}

export type LockedCapabilityFromAccessProps = {
  access: CapabilityAccess;
  featureTitle: string;
  spaceId: UUID;
  spaceType?: SpaceType | null;
};

export function LockedCapabilityFromAccess({
  access,
  featureTitle,
  spaceId,
  spaceType,
}: LockedCapabilityFromAccessProps) {
  const { t } = useTranslation();
  const description = access.reasonKey
    ? t(access.reasonKey)
    : t('spaceLifecycle.capabilities.genericLocked');
  const ctaLabel = access.ctaLabelKey ? t(access.ctaLabelKey) : null;

  return (
    <LockedCapabilityScreen
      title={featureTitle}
      description={description}
      ctaLabel={ctaLabel}
      unlockTarget={access.unlockTarget}
      spaceId={spaceId}
      spaceType={spaceType}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  secondary: {
    marginTop: spacing.xs,
  },
});
