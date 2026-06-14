import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';
import { Button, EmptyState } from './index';
import { Screen } from './Screen';

type PermissionDeniedScreenProps = {
  titleKey?: string;
  bodyKey?: string;
  showBackToDashboard?: boolean;
  spaceId?: string;
};

type MainNav = NativeStackNavigationProp<MainStackParamList>;

export function PermissionDeniedScreen({
  titleKey = 'permissions.noAccess.title',
  bodyKey = 'permissions.noAccess.body',
  showBackToDashboard = true,
  spaceId,
}: PermissionDeniedScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<MainNav>();

  return (
    <Screen contentStyle={styles.content}>
      <EmptyState title={t(titleKey)} description={t(bodyKey)} />
      {showBackToDashboard && spaceId ? (
        <View style={styles.actions}>
          <Button
            label={t('permissions.noAccess.backToDashboard')}
            onPress={() => navigation.navigate('SpaceTabs', { spaceId })}
          />
        </View>
      ) : null}
    </Screen>
  );
}

type RequireAccommodationAccessProps = {
  spaceId: string | null | undefined;
  children: React.ReactNode;
};

export function RequireAccommodationAccess({
  spaceId,
  children,
}: RequireAccommodationAccessProps) {
  const permissions = useSpacePermissions(spaceId);

  if (!permissions.canViewAccommodation) {
    return (
      <PermissionDeniedScreen
        titleKey="permissions.noAccess.accommodationTitle"
        bodyKey="permissions.noAccess.accommodationBody"
        spaceId={spaceId ?? undefined}
      />
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  actions: {
    marginTop: spacing.lg,
  },
});
