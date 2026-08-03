import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  BadgeCheck,
  CircleCheckBig,
  UserRound,
} from 'lucide-react-native';
import { AuthHero } from '../../components/auth';
import { Button, Screen } from '../../components/ui';
import { useLogout } from '../../hooks/useLogout';
import { useProfileCompletionGate } from '../../hooks/useProfileCompletionGate';
import type { MainStackParamList } from '../../navigation/types';
import { colors, shadows, spacing, typography } from '../../theme';

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

  const clamped = Math.max(0, Math.min(100, completionPercentage));

  return (
    <Screen contentStyle={styles.content}>
      <AuthHero
        icon={UserRound}
        eyebrow={t('profileCompletion.gate.title')}
        heading={t('profileCompletion.gate.heading')}
        subheading={t('profileCompletion.gate.description')}
      />

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <CircleCheckBig size={18} color={colors.primaryDark} strokeWidth={2.2} />
          <Text style={styles.progressTitle}>
            {t('profileCompletion.gate.progress', { percent: clamped })}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${clamped}%` }]} />
        </View>
        <View style={styles.benefitRow}>
          <BadgeCheck size={14} color={colors.primaryDark} strokeWidth={2.2} />
          <Text style={styles.benefitText}>
            {t('profileCompletion.gate.benefit1', {
              defaultValue: 'Unlock PG services, meals, and payments',
            })}
          </Text>
        </View>
        <View style={styles.benefitRow}>
          <BadgeCheck size={14} color={colors.primaryDark} strokeWidth={2.2} />
          <Text style={styles.benefitText}>
            {t('profileCompletion.gate.benefit2', {
              defaultValue: 'Help managers allocate beds and resolve issues faster',
            })}
          </Text>
        </View>
      </View>

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
    padding: spacing.lg,
    gap: spacing.md,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTitle: {
    ...typography.bodyStrong,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitText: {
    ...typography.caption,
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
