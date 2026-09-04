import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlaskConical } from 'lucide-react-native';
import { Card } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';

type AdminTestLeadToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** When true, renders without outer Card (for use inside AdminFormSection). */
  embedded?: boolean;
};

export function AdminTestLeadToggle({ value, onValueChange, embedded }: AdminTestLeadToggleProps) {
  const { t } = useTranslation();
  const content = (
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <FlaskConical size={18} color={colors.primaryDark} strokeWidth={2.2} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{t('admin.testLead.title')}</Text>
          <Text style={styles.description}>{t('admin.testLead.description')}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>
  );

  if (embedded) {
    return content;
  }

  return <Card style={styles.card}>{content}</Card>;
}

const styles = StyleSheet.create({
  card: { marginBottom: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.mintSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: {
    ...typography.label,
    marginBottom: 2,
  },
  description: {
    ...typography.caption,
  },
});
