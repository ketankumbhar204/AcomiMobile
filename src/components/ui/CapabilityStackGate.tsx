import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { UUID } from '../../api/types';
import { useSpaceProgressiveAccess } from '../../hooks/useSpaceProgressiveAccess';
import {
  getBlockingCapability,
  type CapabilityId,
} from '../../spaceLifecycle';
import { colors, spacing } from '../../theme';
import { LockedCapabilityFromAccess } from './LockedCapabilityScreen';
import { PermissionDeniedScreen } from './PermissionDeniedScreen';
import { Screen } from './Screen';

export type CapabilityStackGateProps = {
  spaceId: UUID;
  capabilityId: CapabilityId;
  /** i18n key or already-translated feature title shown on the lock screen. */
  featureTitle: string;
  children: React.ReactNode;
};

/**
 * Stack / deep-link guard for Progressive Guided Access.
 * Uses getBlockingCapability — do not re-evaluate capability rules in screens.
 * Non-operators (capabilities null) pass through so tenant meal poll routes stay open.
 */
export function CapabilityStackGate({
  spaceId,
  capabilityId,
  featureTitle,
  children,
}: CapabilityStackGateProps) {
  const { capabilities, loading, spaceType } = useSpaceProgressiveAccess(spaceId);

  if (loading) {
    return (
      <Screen contentStyle={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const blocking = getBlockingCapability(capabilities, capabilityId);
  if (!blocking) {
    return <>{children}</>;
  }

  if (blocking.mode === 'HIDDEN') {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  return (
    <LockedCapabilityFromAccess
      access={blocking}
      featureTitle={featureTitle}
      spaceId={spaceId}
      spaceType={spaceType}
    />
  );
}

/** Convenience wrapper that translates a navigation title key. */
export function CapabilityStackGateI18n({
  spaceId,
  capabilityId,
  titleKey,
  titleDefault,
  children,
}: Omit<CapabilityStackGateProps, 'featureTitle'> & {
  titleKey: string;
  titleDefault?: string;
}) {
  const { t } = useTranslation();
  return (
    <CapabilityStackGate
      spaceId={spaceId}
      capabilityId={capabilityId}
      featureTitle={t(titleKey, titleDefault ? { defaultValue: titleDefault } : undefined)}
    >
      {children}
    </CapabilityStackGate>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
});
