import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Building2, MailPlus, Search, Sparkles, TriangleAlert } from 'lucide-react-native';
import { formatSpaceType } from '../api';
import { memberApi } from '../api/memberApi';
import type { MyInvitationResponse } from '../api/types';
import { InvitationCard } from '../components/auth';
import { Button, EmptyState, SkeletonCard } from '../components/ui';
import { OnboardingBrandHeader } from '../components/ui/OnboardingBrandHeader';
import { Screen } from '../components/ui/Screen';
import { useAcceptInvitationFlow } from '../hooks/useAcceptInvitationFlow';
import type { MainStackParamList, MemberTabParamList } from '../navigation/types';
import { useToastStore } from '../store/toastStore';
import { colors, shadows, spacing, typography } from '../theme';
import { setAccountIntent } from '../utils/accountIntent';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MemberTabParamList, 'Home'>,
  NativeStackNavigationProp<MainStackParamList>
>;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Unified member home: Find a place CTA + pending invitations.
 */
export function MemberHomeScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const showToast = useToastStore(state => state.showToast);
  const { acceptInvitation, isSubmitting, error, clearError } = useAcceptInvitationFlow();

  const [loadingInvites, setLoadingInvites] = useState(true);
  const [invitations, setInvitations] = useState<MyInvitationResponse[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const headerTitle = useCallback(() => <OnboardingBrandHeader />, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle,
      headerTitleAlign: 'left',
      headerBackVisible: false,
      headerRight: undefined,
    });
  }, [headerTitle, navigation, t, i18n.language]);

  useEffect(() => {
    void setAccountIntent('member');
  }, []);

  const loadInvitations = useCallback(async () => {
    clearError();
    try {
      setInvitations(await memberApi.getMyInvitations());
    } catch {
      setInvitations([]);
    } finally {
      setLoadingInvites(false);
    }
  }, [clearError]);

  useFocusEffect(
    useCallback(() => {
      void loadInvitations();
    }, [loadInvitations]),
  );

  const handleAccept = useCallback(
    async (invitation: MyInvitationResponse) => {
      setAcceptingId(invitation.invitationId);
      const membership = await acceptInvitation(invitation.invitationId);
      setAcceptingId(null);
      if (membership) {
        showToast(
          t('membership.incoming.success', { spaceName: membership.spaceName }),
        );
      }
    },
    [acceptInvitation, showToast, t],
  );

  const busy = isSubmitting || acceptingId != null;

  return (
    <Screen
      scrollable
      contentStyle={styles.content}
      refreshing={loadingInvites && invitations.length > 0}
      onRefresh={() => void loadInvitations()}>
      <View style={styles.hero}>
        <View style={styles.eyebrowRow}>
          <Sparkles size={16} color={colors.primaryDark} strokeWidth={2.2} />
          <Text style={styles.eyebrow}>{t('onboarding.memberHome.eyebrow')}</Text>
        </View>
        <Text style={styles.heading}>{t('onboarding.memberHome.heading')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.memberHome.subtitle')}</Text>
      </View>

      <Button
        label={t('onboarding.memberHome.findCta')}
        icon={Search}
        onPress={() => navigation.navigate('FindAPlace')}
        style={styles.primaryButton}
      />

      <View style={styles.inviteSection}>
        <Text style={styles.inviteEyebrow}>{t('onboarding.memberHome.inviteSection')}</Text>

        {error ? (
          <View style={styles.errorBanner}>
            <TriangleAlert size={16} color="#B91C1C" strokeWidth={2.2} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loadingInvites && invitations.length === 0 ? (
          <SkeletonCard />
        ) : invitations.length === 0 ? (
          <View style={styles.emptyCard}>
            <EmptyState
              Icon={MailPlus}
              title={t('onboarding.memberHome.emptyTitle')}
              description={t('onboarding.memberHome.emptyDescription')}
            />
          </View>
        ) : (
          <View style={styles.list}>
            {invitations.map(invitation => {
              const accepting = acceptingId === invitation.invitationId;
              return (
                <InvitationCard
                  key={invitation.invitationId}
                  spaceName={invitation.spaceName}
                  spaceTypeLabel={formatSpaceType(invitation.spaceType)}
                  roleLabel={t(`spaces.roles.${invitation.role}`)}
                  invitedBy={t('membership.incoming.invitedBy', {
                    name: invitation.invitedBy,
                  })}
                  expiresLabel={t('membership.incoming.expires', {
                    date: formatDate(invitation.expiresAt),
                  })}
                  acceptLabel={
                    accepting
                      ? t('membership.incoming.accepting')
                      : t('onboarding.join.accept')
                  }
                  accepting={accepting}
                  disabled={busy}
                  onAccept={() => void handleAccept(invitation)}
                />
              );
            })}
          </View>
        )}
      </View>

      <Button
        label={t('onboarding.memberHome.ownerSwitch')}
        icon={Building2}
        variant="ghost"
        onPress={() => {
          void setAccountIntent('owner');
          navigation.navigate('OnboardingChoice');
        }}
        style={styles.ownerSwitch}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.section,
    gap: spacing.md,
  },
  hero: {
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.primaryDark,
  },
  heading: {
    ...typography.h2,
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  primaryButton: {
    alignSelf: 'stretch',
  },
  inviteSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  inviteEyebrow: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.primaryDark,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  list: {
    gap: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: spacing.md,
  },
  errorText: {
    ...typography.body,
    flex: 1,
    color: '#DC2626',
  },
  ownerSwitch: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
});
