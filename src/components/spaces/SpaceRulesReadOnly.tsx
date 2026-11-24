import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, FileText } from 'lucide-react-native';
import type { RuleAssignment } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';

type SpaceRulesReadOnlyProps = {
  rules: RuleAssignment[];
  /** When true, hide the whole block if there are no rules. */
  hideWhenEmpty?: boolean;
  accent?: string;
  compact?: boolean;
};

export function SpaceRulesReadOnly({
  rules,
  hideWhenEmpty = true,
  accent = colors.primary,
  compact = false,
}: SpaceRulesReadOnlyProps) {
  const { t } = useTranslation();
  const selected = rules.filter(rule => rule.label?.trim());

  if (selected.length === 0) {
    if (hideWhenEmpty) {
      return null;
    }
    return (
      <View style={[styles.card, compact && styles.cardCompact]}>
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: `${accent}14` }]}>
            <FileText size={15} color={accent} strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>
            {t('spaces.rules.title', { defaultValue: 'Rules & Guidelines' })}
          </Text>
        </View>
        <Text style={styles.empty}>
          {t('spaces.rules.empty', {
            defaultValue: 'No rules configured for this space yet.',
          })}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: `${accent}14` }]}>
          <FileText size={15} color={accent} strokeWidth={2.2} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>
            {t('spaces.rules.title', { defaultValue: 'Rules & Guidelines' })}
          </Text>
          {!compact ? (
            <Text style={styles.helper}>
              {t('spaces.rules.readOnlyHelper', {
                defaultValue: 'Guidelines for residents in this space.',
              })}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.list}>
        {selected.map((rule, index) => (
          <View
            key={`${rule.code}-${rule.label}-${index}`}
            style={[styles.row, index < selected.length - 1 && styles.rowBorder]}>
            <CheckCircle2 size={16} color={accent} strokeWidth={2.2} />
            <Text style={styles.ruleText}>{rule.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardCompact: {
    padding: spacing.sm + 2,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  helper: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  ruleText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
});
