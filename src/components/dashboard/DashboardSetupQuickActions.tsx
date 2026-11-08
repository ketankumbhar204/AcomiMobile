import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Sparkles, Wrench } from 'lucide-react-native';
import { colors, pastels, radius, shadows, spacing, typography } from '../../theme';
import { DashboardSectionTitle } from './DashboardSectionTitle';

type DashboardSetupQuickActionsProps = {
  onStartSetup?: () => void;
  onAddBuilding?: () => void;
};

function MiniActionCard({
  title,
  subtitle,
  accent,
  well,
  icon: Icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  accent: string;
  well: string;
  icon: typeof Sparkles;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
      accessibilityRole="button"
      accessibilityLabel={title}>
      <View style={[styles.iconWrap, { backgroundColor: well }]}>
        <Icon size={18} color={accent} strokeWidth={2.2} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      {onPress ? <ChevronRight size={16} color={colors.muted} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

/** Horizontal Start Setup + Add Building pair matching the owner dashboard reference. */
export const DashboardSetupQuickActions = memo(function DashboardSetupQuickActions({
  onStartSetup,
  onAddBuilding,
}: DashboardSetupQuickActionsProps) {
  const { t } = useTranslation();
  if (!onStartSetup && !onAddBuilding) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <DashboardSectionTitle
        title={t('dashboard.quickActions.title', { defaultValue: 'Quick Actions' })}
      />
      <View style={styles.row}>
        {onStartSetup ? (
          <MiniActionCard
            icon={Sparkles}
            accent={pastels.purple.fg}
            well={pastels.purple.bg}
            title={t('accommodation.home.quickSetup', { defaultValue: 'Start Setup' })}
            subtitle={t('accommodation.home.quickSetupHint', {
              defaultValue: 'Guided building structure setup',
            })}
            onPress={onStartSetup}
          />
        ) : null}
        {onAddBuilding ? (
          <MiniActionCard
            icon={Wrench}
            accent={pastels.blue.fg}
            well={pastels.blue.bg}
            title={t('accommodation.home.addBuildingManually', {
              defaultValue: 'Add Building',
            })}
            subtitle={t('accommodation.home.addBuildingHint', {
              defaultValue: 'Create a building step by step',
            })}
            onPress={onAddBuilding}
          />
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 72,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 13,
    lineHeight: 16,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
});
