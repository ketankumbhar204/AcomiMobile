import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DocumentVerificationStatus } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';

const VERIFICATION_COLORS: Record<DocumentVerificationStatus, string> = {
  PENDING: '#f59e0b',
  VERIFIED: '#22c55e',
  REJECTED: '#ef4444',
};

type VerificationStatusBadgeProps = {
  status: DocumentVerificationStatus;
};

export function VerificationStatusBadge({ status }: VerificationStatusBadgeProps) {
  const { t } = useTranslation();
  const color = VERIFICATION_COLORS[status];

  return (
    <View style={[styles.badge, { borderColor: `${color}44`, backgroundColor: `${color}14` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>
        {t(`membership.documents.verification.${status}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
