import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MailPlus, TriangleAlert } from 'lucide-react-native';
import { formatSpaceType } from '../api';
import { memberApi } from '../api/memberApi';
import type { MyInvitationResponse } from '../api/types';
import { AuthHero, InvitationCard } from '../components/auth';
import { EmptyState, SkeletonCard } from '../components/ui';
import { ProfileHeaderButton } from '../components/ui/ProfileHeaderButton';
import { useAcceptInvitationFlow } from '../hooks/useAcceptInvitationFlow';
import { resetToOnboardingChoice, resetToMySpaces } from '../navigation/navigationRef';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { useToastStore } from '../store/toastStore';
import { colors, spacing, typography } from '../theme';

type AcceptInvitationsNav = NativeStackNavigationProp<
  MainStackParamList,
  'AcceptInvitations'
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

function formatRoleLabel(
  role: MyInvitationResponse['role'],
  t: (key: string) => string,
): string {
  return t(`spaces.roles.${role}`);
}

export function AcceptInvitationsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<AcceptInvitationsNav>();
  const showToast = useToastStore(state => state.showToast);
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const { acceptInvitation, isSubmitting, error, clearError } = useAcceptInvitationFlow();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invitations, setInvitations] = useState<MyInvitationResponse[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const headerRight = useCallback(() => <ProfileHeaderButton />, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('onboarding.join.title'),
      headerRight,
      headerBackVisible: navigation.canGoBack(),
    });
  }, [headerRight, navigation, t, i18n.language]);

  const load = useCallback(async () => {
    clearError();
    try {
      setInvitations(await memberApi.getMyInvitations());
    } catch {
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refreshStartupNavigation = useSpaceStore(state => state.refreshStartupNavigation);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await refreshStartupNavigation();
      if (result.route === 'AcceptInvitations') {
        await load();
      }
    } finally {
      setRefreshing(false);
    }
  }, [load, refreshStartupNavigation]);

  const handleSkip = useCallback(() => {
    if (mySpaces.length > 0) {
      resetToMySpaces();
      return;
    }
    resetToOnboardingChoice();
  }, [mySpaces.length]);

  const handleAccept = useCallback(
    async (invitation: MyInvitationResponse) => {
      setAcceptingId(invitation.invitationId);
      const membership = await acceptInvitation(invitation.invitationId);
      setAcceptingId(null);
      if (membership) {
        showToast(
          t('membership.incoming.success', { spaceName: membership.spaceName }),
        );
        setInvitations(prev =>
          prev.filter(row => row.invitationId !== invitation.invitationId),
        );
      }
    },
    [acceptInvitation, showToast, t],
  );

  const showLoading = loading && !refreshing && invitations.length === 0;
  const busy = isSubmitting || acceptingId != null;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }>
        <AuthHero
          icon={MailPlus}
          eyebrow={t('onboarding.join.eyebrow')}
          heading={t('onboarding.join.pendingHeading')}
          subheading={t('onboarding.join.pendingSubheading')}
        />

        {error ? (
          <View style={styles.errorBanner}>
            <TriangleAlert size={16} color="#B91C1C" strokeWidth={2.2} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {showLoading ? (
          <View style={styles.skeletonBlock}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : invitations.length === 0 ? (
          <EmptyState
            Icon={MailPlus}
            title={t('onboarding.join.emptyTitle')}
            description={t('onboarding.join.emptyDescription')}
          />
        ) : (
          <View style={styles.list}>
            {invitations.map(invitation => {
              const accepting = acceptingId === invitation.invitationId;
              return (
                <InvitationCard
                  key={invitation.invitationId}
                  spaceName={invitation.spaceName}
                  spaceTypeLabel={formatSpaceType(invitation.spaceType)}
                  roleLabel={formatRoleLabel(invitation.role, t)}
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

        <Pressable
          style={({ pressed }) => [styles.skipButton, pressed && styles.skipPressed]}
          onPress={handleSkip}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.join.notNow')}>
          <Text style={styles.skipText}>{t('onboarding.join.notNow')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.section,
    gap: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: spacing.md,
  },
  errorText: {
    ...typography.body,
    flex: 1,
    color: '#DC2626',
  },
  skeletonBlock: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  skipButton: {
    marginTop: spacing.sm,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  skipPressed: {
    opacity: 0.8,
  },
  skipText: {
    ...typography.bodyStrong,
    color: colors.muted,
  },
});
