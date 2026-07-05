import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Screen } from '../../components/ui';
import { useLogout } from '../../hooks/useLogout';
import { useProfileCompletionGate } from '../../hooks/useProfileCompletionGate';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ProfileCompletionGate'>;

export function ProfileCompletionGateScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const logout = useLogout();
  const { completionPercentage } = useProfileCompletionGate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('profileCompletion.gate.title'),
      headerBackVisible: false,
      headerLeft: () => null,
    });
  }, [navigation, t]);

  return (
    <Screen contentStyle={styles.content}>
      <EmptyState
        icon="👤"
        title={t('profileCompletion.gate.heading')}
        description={t('profileCompletion.gate.description')}
      />

      {completionPercentage > 0 && completionPercentage < 100 ? (
        <Text style={styles.progress}>
          {t('profileCompletion.gate.progress', { percent: completionPercentage })}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={t('profileCompletion.gate.completeProfile')}
          onPress={() => navigation.navigate('CompleteProfile')}
        />
        <Button
          label={t('settings.profile.logout')}
          variant="ghost"
          loading={isLoggingOut}
          onPress={async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } finally {
              setIsLoggingOut(false);
            }
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  progress: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
