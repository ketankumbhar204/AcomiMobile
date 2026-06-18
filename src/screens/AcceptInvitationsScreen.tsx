import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { formatSpaceType } from '../api';
import { memberApi } from '../api/memberApi';
import type { MyInvitationResponse } from '../api/types';
import { Badge, Button, EmptyState, ListCard } from '../components/ui';
import { ProfileHeaderButton } from '../components/ui/ProfileHeaderButton';
import { useAcceptInvitationFlow } from '../hooks/useAcceptInvitationFlow';
import { resetToOnboardingChoice, resetToMySpaces } from '../navigation/navigationRef';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { useToastStore } from '../store/toastStore';
import { colors, radius, spacing, typography } from '../theme';

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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('onboarding.join.title'),
      headerRight: () => <ProfileHeaderButton />,
      headerBackVisible: navigation.canGoBack(),
    });
  }, [navigation, t, i18n.language]);

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
        <Text style={styles.eyebrow}>{t('onboarding.join.eyebrow')}</Text>
        <Text style={styles.heading}>{t('onboarding.join.pendingHeading')}</Text>
        <Text style={styles.subheading}>{t('onboarding.join.pendingSubheading')}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {showLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : invitations.length === 0 ? (
          <EmptyState
            title={t('onboarding.join.emptyTitle')}
            description={t('onboarding.join.emptyDescription')}
            icon="✉️"
          />
        ) : (
          <View style={styles.list}>
            {invitations.map(invitation => {
              const accepting = acceptingId === invitation.invitationId;
              return (
                <View key={invitation.invitationId} style={styles.card}>
                  <ListCard
                    title={invitation.spaceName}
                    subtitle={`${formatSpaceType(invitation.spaceType)} · ${formatRoleLabel(invitation.role, t)}`}
                    iconLabel={invitation.spaceName.charAt(0).toUpperCase()}
                    style={styles.listCard}
                  />
                  <View style={styles.metaBlock}>
                    <Badge label={formatRoleLabel(invitation.role, t)} />
                    <Text style={styles.meta}>
                      {t('membership.incoming.invitedBy', { name: invitation.invitedBy })}
                    </Text>
                    <Text style={styles.meta}>
                      {t('membership.incoming.expires', {
                        date: formatDate(invitation.expiresAt),
                      })}
                    </Text>
                  </View>
                  <Button
                    label={
                      accepting
                        ? t('membership.incoming.accepting')
                        : t('onboarding.join.accept')
                    }
                    onPress={() => void handleAccept(invitation)}
                    disabled={busy}
                    style={styles.acceptButton}
                  />
                </View>
              );
            })}
          </View>
        )}

        <Pressable style={styles.skipButton} onPress={handleSkip} disabled={busy}>
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
    padding: spacing.xl,
    paddingBottom: spacing.section,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  heading: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  subheading: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  error: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.md,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  listCard: {
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 0,
  },
  metaBlock: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
  },
  acceptButton: {
    marginTop: spacing.xs,
  },
  skipButton: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipText: {
    ...typography.bodyStrong,
    color: colors.muted,
  },
});
