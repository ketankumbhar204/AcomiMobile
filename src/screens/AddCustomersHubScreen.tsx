import React, { useLayoutEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  ClipboardCheck,
  FolderInput,
  Lightbulb,
  MessageCircle,
  IndianRupee,
  UserPlus,
  Utensils,
} from 'lucide-react-native';
import { BusinessProgressStepper } from '../components/dashboard/shared/BusinessProgressStepper';
import {
  DashboardChoiceCard,
  DashboardOrDivider,
  DashboardReasonCard,
  DashboardTipCard,
} from '../components/dashboard/shared/DashboardGuidedCards';
import {
  buildBusinessProgressSteps,
  businessProgressCurrentIndex,
  milestoneLabelKeyForSpace,
} from '../components/dashboard/shared/businessProgressSteps';
import { HeaderBackButton, Screen } from '../components/ui';
import { useSpaceLifecycle } from '../hooks/useSpaceLifecycle';
import { useSpaceLifecycleSignals } from '../hooks/useSpaceLifecycleSignals';
import { useSpacePermissions } from '../hooks/useSpacePermissions';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { findMySpaceEntry } from '../utils/spacePermissions';

type Nav = NativeStackNavigationProp<MainStackParamList, 'AddCustomersHub'>;
type Route = NativeStackScreenProps<MainStackParamList, 'AddCustomersHub'>['route'];

/**
 * Mess guided hub: add customers or import from other spaces.
 * Add-customers card is the first action; stepper sits under the hero.
 */
export function AddCustomersHubScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId } = route.params;
  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceEntry = findMySpaceEntry(mySpaces, spaceId);
  const spaceType = spaceEntry?.spaceType ?? 'MESS';
  const spaceName = spaceEntry?.spaceName ?? '';
  const permissions = useSpacePermissions(spaceId);

  const { context } = useSpaceLifecycleSignals({
    spaceId,
    spaceType,
    permissions,
    enabled: permissions.canManageMembers === true,
    pendingActionCount: 0,
    hasOperationalSignal: false,
  });
  const { evaluation } = useSpaceLifecycle({
    spaceType,
    context,
    enabled: context != null,
  });

  const steps = useMemo(() => {
    if (!evaluation) {
      return [];
    }
    return buildBusinessProgressSteps(evaluation.statuses, id =>
      t(milestoneLabelKeyForSpace(id, spaceType)),
    );
  }, [evaluation, spaceType, t]);

  const currentStepIndex = useMemo(() => {
    if (!evaluation) {
      return 0;
    }
    return businessProgressCurrentIndex(evaluation.statuses, steps);
  }, [evaluation, steps]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('membership.addCustomersHub.navTitle'),
      headerLeft: () => <HeaderBackButton />,
      headerBackVisible: false,
    });
  }, [navigation, t]);

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.eyebrow}>
        {(spaceName || t('membership.add.eyebrow')).toUpperCase()}
      </Text>
      <Text style={styles.title}>{t('membership.addCustomersHub.title')}</Text>
      <Text style={styles.subtitle}>{t('membership.addCustomersHub.subtitle')}</Text>

      <DashboardChoiceCard
        icon={UserPlus}
        title={t('membership.addCustomersHub.addCardTitle')}
        description={t('membership.addCustomersHub.addCardBody')}
        ctaLabel={t('membership.addCustomersHub.addCardCta')}
        variant="primary"
        onPress={() =>
          navigation.navigate('AddMember', { spaceId, initialMode: 'new' })
        }
      />

      {steps.length > 0 ? (
        <View style={styles.stepperCard}>
          <Text style={styles.stepperTitle}>{t('dashboard.setup.readinessTitleMess')}</Text>
          <BusinessProgressStepper
            steps={steps}
            currentStepIndex={currentStepIndex}
            accessibilityLabel={t('dashboard.setup.readinessTitleMess')}
          />
        </View>
      ) : null}

      <DashboardOrDivider label={t('membership.addCustomersHub.or')} />

      <DashboardChoiceCard
        icon={FolderInput}
        title={t('membership.addCustomersHub.importCardTitle')}
        description={t('membership.addCustomersHub.importCardBody')}
        ctaLabel={t('membership.addCustomersHub.importCardCta')}
        variant="secondary"
        onPress={() => navigation.navigate('ImportExistingPeople', { spaceId })}
      />

      <DashboardTipCard icon={Lightbulb} message={t('membership.addCustomersHub.tip')} />

      <DashboardReasonCard
        title={t('membership.addCustomersHub.whyTitle')}
        rows={[
          {
            icon: MessageCircle,
            title: t('membership.addCustomersHub.whyMenu'),
          },
          {
            icon: Utensils,
            title: t('membership.addCustomersHub.whyConfirm'),
          },
          {
            icon: IndianRupee,
            title: t('membership.addCustomersHub.whyBilling'),
          },
        ]}
      />

      <DashboardReasonCard
        title={t('membership.addCustomersHub.afterTitle')}
        rows={[
          {
            icon: ClipboardCheck,
            title: t('membership.addCustomersHub.afterPlan'),
          },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.section,
    gap: spacing.md,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.primaryDark,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: -spacing.sm,
  },
  stepperCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  stepperTitle: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
  },
});
