import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberResponse } from '../../../../api/types';
import { ContactNumberLine } from '../../../../components/member/ContactAndStayMeta';
import { colors, spacing, typography } from '../../../../theme';

type WizardContextBannerProps = {
  member?: MemberResponse | null;
  accommodationPath?: string;
};

export function WizardContextBanner({
  member,
  accommodationPath,
}: WizardContextBannerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.banner}>
      {member ? (
        <View style={styles.row}>
          <Text style={styles.label}>{t('occupancyWizard.context.member')}</Text>
          <View style={styles.memberValue}>
            <Text style={styles.value} numberOfLines={1}>
              {member.fullName}
            </Text>
            {member.mobileNumber ? (
              <ContactNumberLine
                value={member.mobileNumber}
                name={member.fullName}
                textStyle={styles.mobile}
                showIcon={false}
              />
            ) : null}
          </View>
        </View>
      ) : null}
      {accommodationPath ? (
        <View style={styles.row}>
          <Text style={styles.label}>{t('occupancyWizard.context.accommodation')}</Text>
          <Text style={styles.value} numberOfLines={3}>
            {accommodationPath}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    backgroundColor: `${colors.primary}0D`,
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  memberValue: {
    gap: 2,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  mobile: {
    ...typography.caption,
    color: colors.primaryDark,
  },
});
